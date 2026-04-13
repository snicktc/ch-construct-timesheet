---
title: "Gebruikershandleiding"
subtitle: "timesheet"
document_type: "Gebruikershandleiding"
company: "CH Construct"
author: "CH Construct"
version: "1.0.0"
date: "2026-04-13"
lang: nl-BE
toc: true
toc-depth: 3
numbersections: true
titlepage: true
logo: "_shared/logo_CH-Construct.png"
header-left: "CH Construct"
header-center: "timesheet"
header-right: "Gebruikershandleiding"
footer-left: "Versie 1.0.0"
footer-right: "Pagina \\thepage"
---

![CH Construct logo]($logo$){ width=55% }

# $title$

## $subtitle$

**Bedrijf:** $company$  
**Documenttype:** $document_type$  
**Versie:** $version$  
**Datum:** $date$

\newpage

## Documentcontrole

| Veld | Waarde |
|---|---|
| Documenttype | Gebruikershandleiding |
| Product | timesheet |
| Versie | 1.0.0 |
| Status | Goedgekeurde baseline |
| Datum | 2026-04-13 |
| Eigenaar | CH Construct |
| Doelgroep | Eindgebruikers en lokale beheerders |

## Wijzigingshistoriek

| Versie | Datum | Wijziging | Auteur |
|---|---|---|---|
| 1.0.0 | 2026-04-13 | Eerste geconsolideerde gebruikershandleiding | OpenCode |

\newpage

## 1. Inleiding

`timesheet` is een app waarmee je werkuren registreert per dag en per profiel. De app werkt lokaal op je toestel en kan gebruikt worden als geïnstalleerde webapp op Android.

Met de app kun je:

- profielen beheren
- klanten beheren
- werkuren invoeren
- dag- en weekoverzichten bekijken
- PDF exports maken
- backups exporteren en terugzetten

## 2. Installatie op Android

### 2.1 Open de app

1. Open Chrome op je Android-smartphone.
2. Ga naar de gepubliceerde URL van de app.
3. Wacht tot de app volledig geladen is.

### 2.2 Installeer de app

1. Tik op de drie puntjes in Chrome.
2. Kies `App installeren` of `Toevoegen aan startscherm`.
3. Bevestig.

### 2.3 Eerste controle

Na installatie:

1. open de app via het icoon
2. controleer of het welkomstscherm verschijnt of je bestaande profieldata zichtbaar is

Na een update kan het nodig zijn om de app volledig te sluiten en opnieuw te openen zodat de nieuwste versie actief wordt.

## 3. Eerste profiel aanmaken

Als je de app voor het eerst gebruikt:

1. vul je naam in
2. vul de exportbestemmeling in
3. tik op `Start`

Daarna opent het scherm `Vandaag`.

## 4. Profielen gebruiken

### 4.1 Profiel kiezen

Bovenaan de app zie je de profielchips.

- het actieve profiel is visueel extra gemarkeerd
- tik op een ander profiel om over te schakelen
- als de app ooit meldt dat er profieldata bestaat maar geen actief profiel geladen werd, kies je hier opnieuw een profiel of ga je naar `Meer`

### 4.2 Profiel beheren

Ga naar `Meer` om:

- een profiel toe te voegen
- een profiel te bewerken
- een profiel actief of inactief te zetten
- een profielvolgorde te wijzigen

## 5. Klanten beheren

Ga naar `Klanten` om:

- alle klanten te bekijken
- een nieuwe klant toe te voegen
- een klant te bewerken
- een klant te verwijderen

Bij het verwijderen krijg je altijd een bevestigingsvenster.

## 6. Werkuren registreren

## 6.1 Dag openen

Open `Vandaag` om werkuren voor een bepaalde dag te registreren.

Je kunt:

- de datum veranderen met de pijlen
- links en rechts swipen om van dag te wisselen

## 6.2 Registratie maken

Vul een blok in met:

- klant
- locatie
- starttijd
- eindtijd
- pauze
- chauffeur
- rit-credit indien nodig
- notities indien nodig

Tik daarna op `Opslaan`.

## 6.3 Klant kiezen

Het klantveld werkt als volgt:

- de laatst gekozen klant mag voorgeselecteerd staan
- zodra je in het veld tikt, wordt het zoekveld leeggemaakt
- kies een klant uit de lijst
- of maak een nieuwe klant aan

## 6.4 Tijd invullen

Gebruik de tijdchips voor snelle invoer.

Als de gewenste tijd er niet tussen staat:

1. tik op `Ander...`
2. kies een tijd via de tijdkiezer

## 6.5 Pauze en rit-credit

- pauze kies je via snelle chips
- rit-credit staat onder `Meer opties`
- rit-credit aanvaardt elke minuutwaarde vanaf 0
- standaard staat het veld op `0`
- zodra je begint te typen, verdwijnt die `0`
- als je niets invult en het veld verlaat, springt het terug naar `0`

## 6.6 Overlapwaarschuwing

Als een nieuw blok overlapt met een bestaand blok op dezelfde dag:

1. toont de app een waarschuwing
2. je kiest dan:
   - toch opslaan
   - of teruggaan en aanpassen

Deze waarschuwing komt uit de app zelf en niet uit een browserpopup.

## 6.7 Blok bewerken of verwijderen

1. tik op het potloodicoon van een bestaand blok
2. pas het blok aan
3. tik op `Opslaan`

Om te verwijderen:

1. open het blok
2. tik op `Verwijder blok`
3. bevestig de actie

## 7. Zelfde als gisteren

Als een dag nog leeg is, kan de app een groene kaart tonen:

`Zelfde als gisteren?`

Gebruik dit als je dezelfde blokken als de vorige werkdag wilt overnemen.

## 8. Weekoverzicht gebruiken

Ga naar `Week` voor een overzicht van 2 weken.

Daar zie je:

- alle dagen in de periode
- totalen per dag
- subtotaal per week
- samenvatting per klant

### 8.1 Dag openen vanuit week

Tik op een dagkaart om die dag te openen in `Vandaag`.

De app:

- opent de gekozen dag
- markeert duidelijk dat die dag uit het weekoverzicht komt
- laat je meteen blokken toevoegen voor die dag
- houdt die gekozen datum actief zodat je niet onbedoeld terugvalt op vandaag

## 9. PDF exporteren en delen

In `Week` kun je:

- een PDF downloaden
- een PDF delen via het toestel

Bij een volledig ingevulde tweewekenperiode verschijnt een extra exportbanner.

## 10. Notificaties gebruiken

Ga naar `Meer` om notificaties te beheren.

Je kunt daar:

- toestemming geven voor meldingen
- een testnotificatie sturen
- een dagelijkse herinnering instellen
- de vrijdag export-prompt aan of uit zetten

Notificaties openen de app in een relevante context, bijvoorbeeld:

- op `Vandaag` voor dagregistratie
- op `Week` wanneer een export klaarstaat

Let op:

- webnotificaties hangen af van browserondersteuning
- volledig achtergrondgestuurde planning blijft beperkter dan bij een native app

## 11. Backup maken

Ga naar `Meer` en kies `Exporteer alle data`.

De app maakt een JSON-backup van:

- profielen
- klanten
- locaties
- registraties
- exporthistoriek
- relevante lokale instellingen

Daardoor blijft ook een deel van de lokale appvoorkeuren behouden bij herstel.

Bewaar dit bestand op een veilige plaats.

## 11.1 Gegevensbewaring

- alle gegevens blijven lokaal op dit toestel bewaard
- gegevens blijven beschikbaar nadat je de app sluit en opnieuw opent
- gegevens worden niet automatisch gesynchroniseerd naar andere toestellen

## 12. Data importeren

Ga naar `Meer` en kies `Importeer data`.

Belangrijk:

- import vervangt alle huidige gegevens op dit toestel
- de app vraagt altijd bevestiging

Na succesvolle import wordt de app herladen.

## 13. Alle data wissen

Ga naar `Meer` en kies `Wis alle data`.

Belangrijk:

- deze actie verwijdert alle lokale gegevens van dit toestel
- de app vraagt altijd bevestiging
- na succesvolle reset wordt de app herladen

## 14. Onderhoud en goede werkwijze

Aanbevolen werkwijze:

- maak regelmatig een backup
- controleer voor export of alle werkdagen ingevuld zijn
- gebruik duidelijke klantnamen en locaties
- gebruik meerdere profielen alleen wanneer dit echt nodig is
- maak altijd eerst een backup voor je browserdata wist of van toestel wisselt

## 15. Problemen oplossen

### De app toont niets of een vreemd scherm

- sluit de app volledig
- open opnieuw
- controleer of je internet had bij de eerste installatie
- installeer de app opnieuw indien nodig

### Er is profieldata, maar de app vraagt om een profiel te herstellen

- kies een profiel via de profielchips
- of open `Meer` om profielen te beheren
- daarna kun je weer normaal verderwerken

### Het lijkt alsof het verkeerde profiel actief is

- kijk naar de duidelijk gemarkeerde actieve profielchip
- tik expliciet op het gewenste profiel

### Notificaties werken niet

- controleer toestemming in de browser
- controleer of notificaties in `Meer` ingeschakeld zijn
- test via de knop `Test notificatie`
- houd rekening met beperkingen van webnotificaties: volledig achtergrondgestuurde planning is beperkter dan bij een native app

### Data kwijt na browserreset of toestelwissel

- herstel via een eerder gemaakte backup
- zonder backup is lokale data niet te recupereren

## 16. Samenvatting voor dagelijks gebruik

Voor dagelijks gebruik volstaat meestal dit patroon:

1. open `Vandaag`
2. kies of controleer het juiste profiel
3. registreer je blokken
4. controleer `Week`
5. exporteer wanneer de periode compleet is
6. maak regelmatig een backup
