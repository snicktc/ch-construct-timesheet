# Specificatie: timesheet — CH Construct

**Projectnaam:** timesheet
**Lokaal pad:** `D:\OpenCode\projects\ch-construct\timesheet`

## Initialisatie

```bash
mkdir -p D:\OpenCode\projects\ch-construct\timesheet
cd D:\OpenCode\projects\ch-construct\timesheet
npm create vite@latest . -- --template react-ts
npm install dexie jspdf jspdf-autotable
npm install -D vite-plugin-pwa
```

## Project Context

Bouw een **Progressive Web App (PWA)** voor een klein bouwbedrijf (houtskeletbouw, keukens, schrijnwerk). Werknemers moeten dagelijks hun werkuren registreren per klant/werf en op het einde van de 2-wekelijkse periode een overzicht (PDF) bezorgen aan de administratief medewerker. De huidige werkwijze met Excel is foutgevoelig en wordt slecht opgevolgd.

De app moet **standalone op een smartphone of tablet** draaien, **zonder server**, **volledig offline**.

---

## Technische Stack

| Laag | Technologie |
|------|------------|
| Framework | React 18+ met Vite |
| Styling | Tailwind CSS |
| Lokale opslag | IndexedDB via **Dexie.js** |
| PDF-export | **jsPDF + jsPDF-AutoTable** |
| PWA | vite-plugin-pwa (Workbox) |
| Taal | TypeScript |
| Deployment | Statische hosting (Netlify / GitHub Pages / Cloudflare Pages) |

---

## Datamodel (IndexedDB via Dexie)

### Tabel: `employees` (profielen)

> Milan beheert zijn eigen profiel én dat van collega's waarvoor hij verantwoordelijk is. Elk profiel heeft een eigen bestemmeling voor de weekexport.

| Veld | Type | Beschrijving |
|------|------|-------------|
| id | auto-increment | PK |
| name | string | Naam werknemer (bv. "Milan", "Kevin") |
| exportRecipient | string | Bestemmeling voor export (bv. "CH Construct", "VBW") |
| exportLogo | string (base64) | Logo van de bestemmeling als base64-encoded afbeelding. Wordt linksboven op de PDF geplaatst. Opgeslagen in IndexedDB bij het aanmaken/bewerken van het profiel. |
| defaultBreakMinutes | number | Standaard pauze in minuten (default: 45) |
| defaultStartTime | string (HH:mm) | Standaard starttijd (bv. "06:30") |
| sortOrder | number | Volgorde in de profielwisselaar |
| isActive | boolean | Actief profiel (true/false), inactieve profielen worden verborgen |
| createdAt | Date | Aanmaakdatum |

**App-state (in-memory, niet in DB):** `activeEmployeeId` — het huidig geselecteerde profiel. Wordt onthouden via `localStorage` zodat de app opent op het laatst gebruikte profiel.

**Eerste keer openen:** de app start met een welkomstscherm dat vraagt om minstens één profiel aan te maken (naam + bestemmeling). Geen hardcoded profielen.

### Tabel: `clients`

| Veld | Type | Beschrijving |
|------|------|-------------|
| id | auto-increment | PK |
| name | string | Klantnaam (bv. "Terrijn", "Mathys") |
| defaultLocation | string | Standaard locatie/gemeente |
| lastUsedAt | Date | Tijdstip van laatste timeEntry voor deze klant. Wordt bijgewerkt bij elke opslag. Bepaalt de sortering in de dropdown: meest recent bovenaan. |

### Tabel: `locations`

| Veld | Type | Beschrijving |
|------|------|-------------|
| id | auto-increment | PK |
| name | string | Locatienaam (bv. "Bogaarden", "Wachtebeke") |

### Tabel: `timeEntries`

> **Eén-op-veel relatie met datum**: er kunnen meerdere entries (blokken) per dag bestaan wanneer de werknemer naar meerdere klanten/werven gaat.

| Veld | Type | Beschrijving |
|------|------|-------------|
| id | auto-increment | PK |
| employeeId | number | FK naar employees |
| date | string (YYYY-MM-DD) | Werkdatum |
| sortOrder | number | Volgorde binnen de dag (0, 1, 2…) |
| clientId | number | FK naar clients |
| clientName | string | Gedenormaliseerd voor export |
| location | string | Werflocatie |
| startTime | string (HH:mm) | Aanvangsuur |
| endTime | string (HH:mm) | Einduur |
| breakMinutes | number | Pauze in minuten (default: 45 bij eerste blok, 0 bij volgende) |
| travelCreditMinutes | number | Credit enkel rit in minuten (default: 0) |
| isDriver | string | "Ja" / "Nee" / "Ochtend" |
| notes | string | Optioneel vrij veld (max 160 tekens) |

**Compound index**: `[employeeId+date]` voor snelle opvraag van alle blokken op één dag.

**Berekend (niet opgeslagen, berekend in code):**

```
blokMinuten = (endTime - startTime) - breakMinutes - travelCreditMinutes
dagTotaalMinuten = SOM van alle blokMinuten op dezelfde date
```

### Tabel: `weekExports`

| Veld | Type | Beschrijving |
|------|------|-------------|
| id | auto-increment | PK |
| employeeId | number | FK |
| weekStart | string (YYYY-MM-DD) | Maandag van week 1 |
| weekEnd | string (YYYY-MM-DD) | Zondag van week 2 |
| exportedAt | Date | Tijdstip van export |
| format | string | "pdf" |

---

## UX-Ontwerpprincipes — Kritisch

De doelgebruiker is een schrijnwerker/bouwvakker die dit als een vervelende administratieve taak ziet. De UX moet zo ontworpen zijn dat het **minder moeite kost dan niet invullen**. Elk extra veld, elke extra tik is een reden om te stoppen.

### Principe 1: "Zelfde als gisteren" (1-tap herhaling)

Dit is de belangrijkste feature van de hele app.

- Bij het openen toont de app bovenaan een grote, groene kaart met de samenvatting van de **vorige werkdag** (klant, locatie, start, einde, pauze, chauffeur).
- **Eén tik op die kaart = alles wordt gekopieerd naar vandaag en direct opgeslagen.**
- De gebruiker ziet een groene bevestiging en is klaar. Totale interactietijd: < 3 seconden.
- Pas als de gebruiker iets wil wijzigen, scrolt hij naar beneden naar het formulier (dat al pre-filled is met de gekopieerde data).
- Statistiek ter onderbouwing: in de voorbeelddata werkte Milan 8 van de 10 werkdagen bij dezelfde klant met quasi dezelfde uren. Dit patroon is typisch in de bouw.

### Principe 2: Snelkeuze-chips in plaats van time-pickers

- Toon de 4 meest gebruikte starttijden als horizontale chips: `06:00` `06:30` `07:00` `07:30`
- Idem voor eindtijden: de 4 meest voorkomende uit de eigen historiek.
- Native time-picker is enkel beschikbaar via een "Ander"-chip voor uitzonderlijke tijden.
- Pauze: standaard 45 min, tappable om te wijzigen (niet een open invoerveld).
- Chauffeur: twee grote toggle-knoppen (Ja / Nee) in plaats van radio buttons. "Ochtend" als derde optie minder prominent.

### Principe 3: Weekvoortgang altijd zichtbaar

- Bovenaan elk scherm: **5 bolletjes** (ma–vr).
  - Groen gevuld = geregistreerd
  - Oranje/geel = vandaag, nog niet ingevuld
  - Grijs/leeg = nog niet geregistreerd
- Dit geeft een subtiel "streak"-gevoel zonder gamification-overkill.
- Als alle 5 bolletjes groen zijn → toon automatisch de export-prompt.

### Principe 4: Slimme notificaties

- **Dagelijks om 17:00** (configureerbaar): lokale push-notificatie "Werkdag loggen?"
  - Tik op de notificatie → app opent met "Zelfde als gisteren" klaar.
- **Vrijdag om 18:00 van de 2e week**: "2 weken compleet? Exporteer en verstuur."
  - Tik → app opent weekoverzicht met export-knop.
- Notificaties via de **Notification API** + **service worker** (werkt offline).

### Principe 5: Automatische export-suggestie

- Als de vrijdag van de 2e week is geregistreerd EN alle 10 werkdagen gevuld zijn:
  - Genereer automatisch de PDF op de achtergrond.
  - Toon een banner: "Werkweek compleet! Verstuur naar [naam admin]?"
  - Eén tik → Web Share API opent met het bestand.

### Principe 6: Formulier-layout geoptimaliseerd voor snelheid

- Volgorde van velden is **top-down in volgorde van veranderlijkheid**:
  1. Klant (verandert het minst → bovenaan, makkelijk te skippen als hetzelfde)
  2. Locatie (auto-filled vanuit klant)
  3. Starttijd (chips)
  4. Eindtijd (chips)
  5. Pauze (default, zelden gewijzigd)
  6. Chauffeur (toggle)
- Velden die zelden wijzigen (pauze, rit-credit) zijn ingeklapt onder een "Meer"-sectie.
- Rit-credit (bijna altijd 0) is verborgen achter "Meer opties" en verschijnt niet standaard.

---

## Schermen & Navigatie

De app heeft een **bottom tab bar** met 4 tabs:

```
[ Vandaag ]  [ Week ]  [ Klanten ]  [ Meer ]
```

### Profielwisselaar (globaal, bovenaan elk scherm)

Bovenin de donkerblauwe header staat een **segmented control** waarmee Milan wisselt tussen profielen:

```
┌────────────────────────────────────┐
│  [ Milan  CH ]  [ Kevin  VBW ]     │  ← Segmented control
│  Donderdag                         │
│  26 juni 2025              [◀] [▶] │
│  ● ● ● ◐ ○                        │
└────────────────────────────────────┘
```

**Gedrag:**

- Elk profiel toont de naam + een afkorting van de bestemmeling als badge (bv. "CH", "VBW").
- **Bij meer dan 3 profielen**: de segmented control wordt een horizontaal scrollbare rij chips in plaats van vaste knoppen.
- Wisselen van profiel herlaadt alle data: weekvoortgang, "zelfde als gisteren", blokken, weekoverzicht. Alles is per profiel gescheiden.
- Het laatst gebruikte profiel wordt onthouden (via `localStorage`) en geopend bij de volgende start.
- De klanten- en locatielijst is **gedeeld** over alle profielen (dezelfde werven).

---

### Scherm 1: "Vandaag" (Dagelijkse invoer) — Hoofdscherm

Dit is het scherm dat opent bij het starten van de app.

**Layout (geoptimaliseerd voor snelheid, ondersteunt meerdere blokken per dag):**

```
┌─────────────────────────────────┐
│  [HEADER: donkerblauw]          │
│  Donderdag                      │
│  26 juni 2025          [◀] [▶] │
│  ● ● ● ◐ ○  ← weekvoortgang   │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐    │
│  │ ZELFDE ALS GISTEREN?    │    │  ← GROTE groene kaart
│  │ Mathys — Damme          │    │     Toont samenvatting van
│  │ 06:30–17:30  pauze 45m  │    │     ALLE blokken van de
│  │ chauffeur: nee          │    │     vorige werkdag
│  │                         │    │
│  │ ➤ Tik om op te slaan    │    │  ← 1 tap = alle blokken gekopieerd
│  └─────────────────────────┘    │
│                                 │
│  ─── Registraties vandaag ───   │
│                                 │
│  ┌─────────────────────────┐    │
│  │ Mathys — Damme      [✎] │    │  ← Blok 1 (kaart, tappable)
│  │ 06:30–12:00    5u30     │    │
│  │ ✎ sleutel bij buurman   │    │  ← Opmerking: grijs, 13px, max 1 regel + "…"
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │ Peter De Smet — W.  [✎] │    │  ← Blok 2
│  │ 12:45–18:15    5u30     │    │
│  └─────────────────────────┘    │
│                                 │
│  [+ Nog een blok toevoegen ]    │  ← Dashed border, altijd zichtbaar
│                                 │
│  ┌─────────────────────────┐    │
│  │ DAGTOTAAL      11u00    │    │  ← Som van alle blokken
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
│ ◉ Vandaag │ ▦ Week │ ♟ Klanten │ ⚙ Meer │
```

**Invoerformulier (opent bij "+" of bij tikken op [✎]):**

```
┌─────────────────────────────────┐
│  [← Terug]     Blok toevoegen   │
│                                 │
│  Klant     [▼ Mathys        ]   │  ← Pre-filled, autocomplete, meest recent bovenaan
│  Locatie   [  Damme         ]   │  ← Auto-filled vanuit klant
│                                 │
│  Start  [06:00][06:30][07:00]   │  ← Chips
│          [07:30][ Ander... ]    │
│                                 │
│  Einde  [17:30][18:00][18:30]   │
│          [ Ander... ]           │
│                                 │
│  Pauze     [45 min]             │
│  Chauffeur [JA] [NEE]           │
│                                 │
│  ▸ Meer opties                  │  ← Rit-credit, notities (max 160 tekens)
│                                 │
│  [       OPSLAAN        ]       │
│  [    Verwijder blok     ]      │  ← Alleen bij bewerken
│                                 │
└─────────────────────────────────┘
```

**Gedrag:**

- Bij openen: toon huidige dag.
  - **Geen blokken vandaag** → toon "Zelfde als gisteren"-kaart + leeg formulier.
  - **Eén of meer blokken vandaag** → toon de blokken als compacte kaarten + knop "+ Nog een blok toevoegen". "Zelfde als gisteren"-kaart verdwijnt.
- **"Zelfde als gisteren"-kaart**: kopieert **alle blokken** van de vorige werkdag in één tap. Als er meerdere blokken waren, worden ze allemaal gekopieerd.
- **"+ Nog een blok toevoegen"**: opent het invoerformulier als slide-up of nieuwe weergave. Pre-filled met:
  - Klant: leeg (want andere klant)
  - Starttijd: eindtijd van het vorige blok (logische aansluiting)
  - Pauze: 0 min (pauze zat al in het eerste blok)
- **Tikken op [✎]**: opent het invoerformulier met de data van dat blok, in edit-modus.
- **Dagtotaal**: som van alle blokken, live bijgewerkt.
- **Verwijder blok**: verwijdert enkel dat blok, niet de hele dag. Bevestigingsdialoog.
- Datum navigatie: pijltjes of swipe.
- Weekvoortgang-bolletjes: altijd zichtbaar in de header. Groen = minstens 1 blok geregistreerd.
- **Opmerkingen**: als een blok een `notes`-veld heeft, toon het als grijs regeltje (13px, `text-muted`) onder de tijden in de blok-kaart. Afgekapt op 1 regel met "…" als het niet past; volledige tekst zichtbaar bij tikken op [✎]. Ook zichtbaar in het weekoverzicht als subtiele regel onder de dag-rij. In de PDF-export verschijnt de opmerking als cursieve tekst onder de betreffende rij.

---

### Scherm 2: "Week" (Weekoverzicht & Export)

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│  WEEK 26-27: 23 jun – 6 jul 2025    [◀] [▶]              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  WEEK 26                                                 │
│  MA 23  Mathys – Damme              06:30–17:45  09:30   │
│         ✎ sleutel bij buurman                            │
│  DI 24  Mathys – Damme              06:30–18:30  11:15   │
│  WO 25  Mathys – Damme              06:30–12:00          │
│         Peter De Smet – Wachtebeke  12:45–18:15  10:30   │
│  DO 26  Mathys – Damme              06:30–17:30  10:15   │
│  VR 27  Mathys – Damme              06:30–17:15  10:00   │
│  ZA 28  —                                        —       │
│  ZO 29  —                                        —       │
│  ─────────────────────────────────────────────────────── │
│  Week 26 subtotaal:                             51:15    │
│                                                          │
│  WEEK 27                                                 │
│  MA 30  Peter De Smet – Wachtebeke  06:30–17:30  10:15   │
│  DI 01  Peter De Smet – Wachtebeke  05:30–13:30  07:15   │
│  WO 02  Peter De Smet – Wachtebeke  05:30–17:00  10:45   │
│  DO 03  Peter De Smet – Wachtebeke  06:30–18:15  11:00   │
│  VR 04  Peter De Smet – Wachtebeke  06:30–18:15  11:00   │
│  ZA 05  —                                        —       │
│  ZO 06  —                                        —       │
│  ─────────────────────────────────────────────────────── │
│  Week 27 subtotaal:                             50:15    │
│                                                          │
│  ═══════════════════════════════════════════════════════  │
│  SAMENVATTING                                            │
│  ─────────────────────────────────────────────────────── │
│  Per klant:                                              │
│    Mathys              5 dagen              51:15        │
│    Peter De Smet       5 dagen              50:15        │
│  ─────────────────────────────────────────────────────── │
│  TOTAAL 2 WEKEN:       10 dagen            101:30        │
│  ═══════════════════════════════════════════════════════  │
│                                                          │
│  [ EXPORTEER NAAR PDF ]                                  │
│  [ DEEL VIA ... ]                                        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Gedrag:**

- Pijltjes navigeren per 2 weken (14 dagen, ma week 1 – zo week 2).
- Tikken op een dagrij navigeert naar scherm 1 voor die dag.
- Ongeregistreerde werkdagen tonen een subtiele waarschuwing (oranje accent).
- **Export naar PDF:** genereert een PDF met logo, profielnaam en 2-wekelijks overzicht (zie sectie PDF Export hieronder).
- **Deel via:** opent het native Web Share API (`navigator.share()`) met het gegenereerde PDF-bestand, zodat de gebruiker het kan versturen via WhatsApp, e-mail, Google Drive, etc.

---

### Scherm 3: "Klanten" (Klanten- & locatiebeheer)

**Layout:**

```
┌─────────────────────────────────┐
│  KLANTEN                [+ Nieuw]│
├─────────────────────────────────┤
│  Terrijn – Bogaarden        [✎] │
│  Mathys – Damme             [✎] │
│  Peter De Smet – Wachtebeke [✎] │
│  Atelier – Evergem          [✎] │
└─────────────────────────────────┘
```

**Gedrag:**

- Lijst van alle klanten met hun standaard locatie.
- [+ Nieuw]: modal of inline-formulier met velden Klantnaam + Standaard locatie.
- [✎]: bewerk naam/locatie. Mogelijkheid om te verwijderen (met bevestiging).

---

### Scherm 4: "Meer" (Instellingen & Profielbeheer)

```
┌─────────────────────────────────────────┐
│  MEER                                   │
├─────────────────────────────────────────┤
│                                         │
│  PROFIELEN                    [+ Nieuw] │
│  ┌─────────────────────────────────┐    │
│  │ Milan                      [✎] │    │
│  │ Export naar: CH Construct       │    │
│  │ Pauze: 45 min  Start: 06:30    │    │
│  ├─────────────────────────────────┤    │
│  │ Kevin                      [✎] │    │
│  │ Export naar: VBW                │    │
│  │ Pauze: 45 min  Start: 06:30    │    │
│  └─────────────────────────────────┘    │
│                                         │
│  NOTIFICATIES                           │
│  Dagelijkse herinnering  [●━━━ 17:00]   │
│  Vrijdag export-prompt   [aan/uit    ]  │
│                                         │
│  DATA                                   │
│  [ EXPORTEER ALLE DATA (backup) ]       │
│  [ IMPORTEER DATA (herstel) ]           │
│  [ WIS ALLE DATA ]  ← met bevestiging  │
│                                         │
│  Versie 1.0.0                           │
└─────────────────────────────────────────┘
```

**Profiel toevoegen/bewerken (modal):**

```
┌─────────────────────────────────────────┐
│  PROFIEL BEWERKEN              [Sluiten]│
├─────────────────────────────────────────┤
│                                         │
│  Naam            [ Kevin             ]  │
│  Export naar     [ VBW               ]  │  ← Vrij tekstveld, autocomplete op eerder
│                                         │     gebruikte bestemmelingen
│  Logo            [  VBW_logo.png  ✕ ]   │  ← Bestandskiezer of camera, preview
│                  [ Upload logo ]        │     Wordt base64 opgeslagen in DB
│                                         │
│  Standaard pauze [ 45 ] min             │
│  Standaard start [ 06:30 ]              │
│                                         │
│  [ OPSLAAN ]                            │
│  [ Profiel verwijderen ]  ← rood, met   │  ← Niet beschikbaar als er nog
│     bevestiging                         │     timeEntries aan gekoppeld zijn
│                                         │
└─────────────────────────────────────────┘
```

**Gedrag:**

- [+ Nieuw]: opent de profiel-modal met lege velden.
- [✎]: opent de profiel-modal met bestaande data.
- Verwijderen: alleen mogelijk als het profiel geen timeEntries heeft. Anders toon melding "Profiel heeft registraties en kan niet verwijderd worden. Maak het profiel inactief."
- Een profiel inactief maken: het verdwijnt uit de profielwisselaar maar de data blijft bewaard.
- Volgorde van profielen: drag-to-reorder of sorteer op aanmaakdatum.
- **Eerste keer openen**: als er geen profielen bestaan, toont de app een welkomstscherm dat vraagt om minstens één profiel aan te maken.

**Welkomstscherm (eenmalig, bij eerste gebruik):**

```
┌─────────────────────────────────────────┐
│                                         │
│            Welkom bij timesheet          │
│                                         │
│  Maak je eerste profiel aan om te       │
│  starten.                               │
│                                         │
│  Naam            [ Milan             ]  │
│  Export naar     [ CH Construct      ]  │
│                                         │
│  [ START ]                              │
│                                         │
└─────────────────────────────────────────┘
```

---

## PDF Export — Layout & Formaat

De export genereert een **PDF in portrait (A4)** via jsPDF + jsPDF-AutoTable. Geen Excel.

**Export is altijd per actief profiel.** De bestemmeling en het bijhorende logo worden automatisch bepaald op basis van het geselecteerde profiel.

### PDF-layout:

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  [LOGO]              WERKURENREGISTRATIE              │
│  CH Construct        Naam: Milan                     │
│                      Week 26-27                      │
│                      23/06/2025 – 06/07/2025         │
│                                                      │
│  ────────────────────────────────────────────────     │
│                                                      │
│  WEEK 26                                             │
│  ┌────────┬───────────┬──────┬───────┬──────┬──────┐ │
│  │ Datum  │ Klant     │ Loc. │ Start │Einde │Totaal│ │
│  ├────────┼───────────┼──────┼───────┼──────┼──────┤ │
│  │ Za 21  │ Weekend   │      │       │      │      │ │
│  │ Zo 22  │ Weekend   │      │       │      │      │ │
│  │ Ma 23  │ Mathys    │Damme │ 06:30 │17:45 │09:30 │ │
│  │ Di 24  │ Mathys    │Damme │ 06:30 │18:30 │11:15 │ │
│  │ Wo 25  │ Mathys    │Damme │ 06:30 │12:00 │      │ │
│  │        │ P.De Smet │Wacht.│ 12:45 │18:15 │10:30 │ │
│  │ Do 26  │ Mathys    │Damme │ 06:30 │17:30 │10:15 │ │
│  │ Vr 27  │ Mathys    │Damme │ 06:30 │17:15 │10:00 │ │
│  │        │           │      │       │      │      │ │
│  │        │           │      │ Pauze │Chauf.│ Opm. │ │  ← Subkolommen zichtbaar
│  └────────┴───────────┴──────┴───────┴──────┴──────┘ │     per rij indien relevant
│                                                      │
│  WEEK 27                                             │
│  ┌────────┬───────────┬──────┬───────┬──────┬──────┐ │
│  │ ...    │ ...       │ ...  │ ...   │ ...  │ ...  │ │
│  ├────────┴───────────┴──────┴───────┴──────┼──────┤ │
│  │ Subtotaal week 27                        │50:15 │ │
│  └──────────────────────────────────────────┴──────┘ │
│                                                      │
│  ════════════════════════════════════════════════     │
│  SAMENVATTING                                        │
│  ┌──────────────────────────┬────────┬───────────┐   │
│  │ Klant                    │ Dagen  │ Uren      │   │
│  ├──────────────────────────┼────────┼───────────┤   │
│  │ Mathys                   │ 5      │ 51:15     │   │
│  │ Peter De Smet            │ 5      │ 50:15     │   │
│  ├──────────────────────────┼────────┼───────────┤   │
│  │ TOTAAL 2 WEKEN           │ 10     │ 101:30    │   │
│  └──────────────────────────┴────────┴───────────┘   │
│  ════════════════════════════════════════════════     │
│                                                      │
│                                        pagina 1/1    │
└──────────────────────────────────────────────────────┘
```

### PDF-specificaties:

**Header (bovenaan elke pagina):**
- Linksboven: logo van de bestemmeling (uit `exportLogo` van het profiel), max 40mm breed, proportioneel geschaald
- Rechts van het logo of rechtsboven:
  - Titel: "WERKURENREGISTRATIE" (16pt, bold)
  - Naam werknemer (14pt, bold)
  - Weeknummers + datumbereik (12pt, normaal)
- Horizontale lijn onder de header

**Tabel per week:**
- Weektitel: "WEEK 26" (13pt, bold, achtergrondkleur lichtgrijs)
- Kolommen:

| Kolom | Breedte | Inhoud |
|-------|---------|--------|
| Datum | 22mm | "Ma 23" formaat (dagnaam + dagnummer) |
| Ref. klant | 35mm | Klantnaam |
| Locatie | 25mm | Gemeente/werfnaam |
| Start | 16mm | HH:mm |
| Einde | 16mm | HH:mm |
| Pauze | 16mm | HH:mm (alleen tonen als ≠ 00:00) |
| Chauffeur | 16mm | "Ja" / "Nee" / "Ochtend" |
| Dagtotaal | 20mm | HH:mm, bold, rechts uitgelijnd |

- Opmerking: als een blok een opmerking heeft, toon deze als cursieve tekst (10pt, grijs) onder de rij van dat blok, over de volle tabelbreedte
- Weekend-rijen: lichtgrijs achtergrond, tekst "Weekend"
- Meerdere blokken per dag: extra rij zonder datum, dagtotaal alleen op de laatste rij
- Subtotaal per week: vetgedrukte rij onderaan elke weektabel

**Samenvattingstabel (onderaan, na beide weektabellen):**
- Titel: "SAMENVATTING" (13pt, bold)
- Tabel met kolommen: Klant | Dagen | Uren
- Eén rij per unieke klant over de 2-wekelijkse periode, gesorteerd op totaal uren (meeste bovenaan)
- "Dagen" = aantal unieke werkdagen voor die klant (een dag met meerdere blokken bij dezelfde klant telt als 1 dag)
- "Uren" = som van alle blokMinuten voor die klant, geformatteerd als HH:mm
- Onderste rij: "TOTAAL 2 WEKEN" met totaal dagen en totaal uren, vetgedrukt, lichtgrijze achtergrond

**Footer:**
- Paginanummer rechtsonder: "pagina 1/1"

**Stijl:**
- Font: Helvetica (ingebouwd in jsPDF, geen externe fonts nodig)
- Body tekst: 10pt
- Celpadding: 4px
- Tabelranden: lichtgrijs (0.5pt)
- Afwisselende rijkleuren: wit / zeer licht grijs (#F9F9F6) voor leesbaarheid

### Bestandsnaam:

```
Werkuren_{Naam}_Week_{WeekNr1}-{WeekNr2}.pdf
```

Voorbeeld: `Werkuren_Milan_Week_26-27.pdf`

De export bevat altijd **2 opeenvolgende weken** (14 dagen, ma–zo + ma–zo).

### Logo's:

De twee logo's worden bij het aanmaken van de profielen geüpload en als base64 opgeslagen in de `exportLogo`-veld van de `employees`-tabel. De logo's worden meegeleverd als assets in de app:

- `public/logos/logo_CH-Construct.jpg` — voor profielen met bestemmeling "CH Construct"
- `public/logos/logo_VBW.png` — voor profielen met bestemmeling "VBW"

Bij het aanmaken van een nieuw profiel kan de gebruiker een logo uploaden via de bestandskiezer of camera. Het logo wordt geresized naar max 400px breed (client-side) en als base64 opgeslagen.

---

## PWA Configuratie

### manifest.json

```json
{
  "name": "timesheet",
  "short_name": "Werkuren",
  "description": "Werkurenregistratie voor CH Construct",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1e3a5f",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Service Worker (via vite-plugin-pwa)

- Precache alle statische assets.
- Runtime cache strategie: **CacheFirst** voor app-shell, **NetworkFirst** voor niets (er zijn geen API calls).
- De app moet 100% werken zonder internetverbinding na de eerste installatie.

---

## Ontwerp & UX Richtlijnen

### Kleurenpalet (bouwsector-look)

| Token | Hex | Gebruik |
|-------|-----|---------|
| primary | #1e3a5f | Knoppen, header, accenten |
| primary-light | #2d5a8e | Hover-states |
| surface | #f5f5f0 | Achtergrond |
| card | #ffffff | Kaarten/formulier |
| text | #1a1a1a | Body tekst |
| text-muted | #6b7280 | Subtekst, labels |
| success | #16a34a | Toast bevestiging |
| warning | #f59e0b | Ontbrekende registratie |
| danger | #dc2626 | Verwijder-acties |

### Typografie

- Font: **Inter** (via Google Fonts, cached door service worker)
- Body: 16px
- Labels: 14px, text-muted
- Titels: 20px, bold
- Grote cijfers (dagtotaal): 28px, bold, primary

### Componenten

- Grote touch targets: minimaal 48x48px voor alle tappable elementen.
- Formuliervelden: volledige breedte, 48px hoogte, duidelijke labels erboven.
- Knoppen: afgeronde hoeken (8px), volle breedte op mobiel.
- Bottom tab bar: 56px hoog, iconen + korte labels, actieve tab gemarkeerd met primary kleur.
- Toast notificaties: onderaan scherm, auto-dismiss na 3 seconden.

### Responsiviteit

- Mobile-first ontwerp (360px breed als basis).
- Op tablet (768px+): centreer content in max 600px container.
- Geen desktop-layout nodig.

---

## Key User Flows

### Flow 1: Dagelijkse registratie — HAPPY PATH (zelfde klant als gisteren)

1. Ontvang push-notificatie om 17:00: "Werkdag loggen?"
2. Tik op notificatie → app opent op "Vandaag"
3. Groene kaart toont: "Zelfde als gisteren? Mathys — Damme, 06:30–17:30"
4. **Tik op de kaart**
5. Groene toast: "Opgeslagen ✓"
6. Klaar. **Totaal: 1 tik, < 3 seconden.**

### Flow 1b: Dagelijkse registratie — ANDERE KLANT of ANDERE TIJDEN

1. Open app → "Zelfde als gisteren"-kaart verschijnt
2. Negeer de kaart, scroll naar formulier (pre-filled met gisteren)
3. Wijzig klant via dropdown → locatie auto-fills
4. Tik op juiste starttijd-chip (bv. 07:00)
5. Tik op juiste eindtijd-chip (bv. 18:00)
6. Tik "Opslaan"
7. **Totaal: 4 tiks, < 15 seconden.**

### Flow 2: Weekexport & verzending

1. Navigeer naar tab "Week"
2. Controleer of alle werkdagen ingevuld zijn (waarschuwing bij ontbrekende dagen)
3. Tik "Exporteer naar PDF"
4. PDF wordt gegenereerd met logo en profielnaam
5. Tik "Deel via…"
6. Kies WhatsApp / Mail / Drive
7. Bestand wordt verstuurd naar de administratief medewerker

### Flow 3: Nieuwe klant toevoegen

1. In scherm "Vandaag" → tik op klant-dropdown → "Nieuwe klant"
2. Modal opent: vul klantnaam + standaard locatie in
3. Tik "Opslaan"
4. Klant verschijnt in dropdown en is geselecteerd

---

## Projectstructuur (`D:\OpenCode\projects\ch-construct\timesheet`)

```
timesheet/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── public/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── logos/
│       ├── logo_CH-Construct.jpg   # Standaard logo voor profiel "CH Construct"
│       └── logo_VBW.png            # Standaard logo voor profiel "VBW"
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── db/
    │   └── database.ts          # Dexie database definitie & schema
    ├── components/
    │   ├── Layout.tsx            # Shell met bottom tabs
    │   ├── BottomNav.tsx         # Tab bar
    │   ├── ProfileSwitcher.tsx   # Segmented control / scrollbare chips in header
    │   ├── ProfileModal.tsx      # Modal voor profiel toevoegen/bewerken
    │   ├── WelcomeScreen.tsx     # Eenmalig welkomstscherm bij eerste gebruik
    │   ├── RepeatCard.tsx        # "Zelfde als gisteren" kaart
    │   ├── EntryCard.tsx         # Compact blok-kaart (klant, tijden, subtotaal)
    │   ├── EntryForm.tsx         # Invoerformulier voor één blok (nieuw of bewerk)
    │   ├── TimeChips.tsx         # Snelkeuze-chips voor start/eindtijd
    │   ├── WeekDots.tsx          # Weekvoortgang-bolletjes
    │   ├── ClientSelect.tsx      # Dropdown met autocomplete + "nieuw" optie
    │   │                          # Sortering: meest recent gebruikt bovenaan
    │   │                          # (op basis van laatste timeEntry per klant)
    │   ├── DayCard.tsx           # Compacte dag-rij voor weekoverzicht (meerdere blokken)
    │   └── Toast.tsx             # Bevestigingsmelding
    ├── pages/
    │   ├── TodayPage.tsx         # Scherm 1: dagelijkse invoer
    │   ├── WeekPage.tsx          # Scherm 2: weekoverzicht + export
    │   ├── ClientsPage.tsx       # Scherm 3: klantenbeheer
    │   └── SettingsPage.tsx      # Scherm 4: instellingen
    ├── utils/
    │   ├── timeCalc.ts           # Tijdberekeningen (totaal, formattering)
    │   ├── pdfExport.ts           # jsPDF + AutoTable PDF-generatie met logo
    │   ├── notifications.ts     # Push-notificatie scheduling
    │   └── weekHelpers.ts        # Week-start/eind berekeningen, ISO week nummers
    └── hooks/
        ├── useActiveProfile.ts   # Huidig profiel, wisselen, onthouden in localStorage
        ├── useProfiles.ts        # CRUD hook voor employees/profielen
        ├── useTimeEntry.ts       # CRUD hook voor timeEntries (gefilterd op actief profiel)
        └── useClients.ts         # CRUD hook voor clients (gedeeld over profielen)
```

---

## Acceptatiecriteria

1. ✅ App installeert als PWA op Android en iOS (toevoegen aan startscherm).
2. ✅ Werkt volledig offline na eerste bezoek.
3. ✅ **"Zelfde als gisteren" registratie in 1 tik (< 3 seconden).**
4. ✅ Gewijzigde registratie in maximaal 4 tiks (< 15 seconden).
5. ✅ Dagtotaal wordt live berekend en correct weergegeven.
6. ✅ Weekvoortgang (5 bolletjes) is altijd zichtbaar in de header.
7. ✅ Dagelijkse push-notificatie om 17:00 (configureerbaar) herinnert aan registratie.
8. ✅ Weekoverzicht toont alle 7 dagen met totalen.
9. ✅ PDF-export genereert een A4-portrait PDF met logo, profielnaam en correct 2-wekelijks overzicht.
10. ✅ Bestand kan gedeeld worden via native share (WhatsApp, mail, etc.).
11. ✅ Automatische export-suggestie om de 2 weken als de periode compleet is.
12. ✅ Klant-dropdown toont meest recent gebruikte klant bovenaan, met autocomplete.
13. ✅ Snelkeuze-chips voor start- en eindtijden op basis van eigen historiek.
14. ✅ Data blijft bewaard na sluiten en heropenen van de app.
15. ✅ App laadt in minder dan 2 seconden op een gemiddelde smartphone.
16. ✅ Meerdere profielen aanmaken, bewerken en verwijderen via het instellingenscherm.
17. ✅ Profielwisselaar in de header scheidt alle data per profiel.
18. ✅ Elk profiel heeft een eigen bestemmeling die getoond wordt bij export.
19. ✅ Klanten- en locatielijst is gedeeld over alle profielen.
20. ✅ Welkomstscherm bij eerste gebruik vraagt om minstens één profiel aan te maken.

---

## Niet in scope (fase 1)

- Synchronisatie tussen toestellen
- Server-side opslag
- Loonberekening of facturatie
- GPS-tracking
- Foto's van werf toevoegen
