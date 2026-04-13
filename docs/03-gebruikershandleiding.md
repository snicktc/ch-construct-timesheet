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

## Revisiecontrole

| Veld | Waarde |
|---|---|
| Versie | 1.0.0 |
| Datum | 2026-04-13 |
| Auteur | OpenCode |
| Goedgekeurd door | Chris Van der Snickt |
| Status | Goedgekeurde baseline |
| Wijzigingssamenvatting | Geconsolideerde gebruikershandleiding voor installatie, gebruik, beheer en onderhoud van `timesheet` |

## Wijzigingshistoriek

| Versie | Datum | Wijziging | Auteur |
|---|---|---|---|
| 1.0.0 | 2026-04-13 | Eerste geconsolideerde gebruikershandleiding | OpenCode |

## Colofon / Contact

| Veld | Waarde |
|---|---|
| Contactpersoon | Chris Van der Snickt |
| Bedrijf | PM Nation CommV |
| Ondernemingsnummer | BE0707.878.977 |
| Adres | Burgstraat 8, 9960 Assenede |
| E-mail | chris@vandersnickt.be |

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

## 2. Belangrijk voor je begint

### 2.1 Wat je moet weten over deze app

Deze app werkt vandaag volledig lokaal op je smartphone.

Dat betekent:

- je gegevens staan op dit toestel
- er is geen automatische cloudopslag
- er is geen automatische synchronisatie tussen meerdere toestellen
- als je van smartphone wisselt zonder backup, raak je je gegevens kwijt

### 2.2 Belangrijke waarschuwing

**Belangrijk:** alle gegevens staan momenteel lokaal op je smartphone.

Maak daarom altijd eerst een backup in de app voordat je:

- van smartphone verandert
- je browsergegevens wist
- je smartphone laat resetten
- de app verwijdert en niet zeker weet dat je backup hebt

## 3. Installatie op Android

Deze uitleg is geschreven voor iemand die gewoon een smartphone gebruikt en geen technische kennis heeft.

### 3.1 Wat heb je nodig?

- een Android-smartphone
- internetverbinding
- de browser `Chrome`
- de webadreslink van de app

### 3.2 Open de app in Chrome

1. Zoek op je smartphone de app `Chrome` en open die.
2. Tik bovenaan in de adresbalk.
3. Typ of plak het webadres van `timesheet`.
4. Wacht tot de pagina volledig geladen is.

### 3.3 Installeer de app

1. Tik rechtsboven in Chrome op de **3 puntjes**.
2. Zoek in het menu naar:
   - `App installeren`, of
   - `Toevoegen aan startscherm`
3. Tik daarop.
4. Bevestig met `Installeren` of `Toevoegen`.
5. De app verschijnt daarna op je startscherm of in je applijst.

### 3.4 Open de geïnstalleerde app

1. Sluit Chrome.
2. Zoek op je startscherm het nieuwe app-icoon.
3. Open de app via dat icoon.

### 3.5 Eerste controle na installatie

Controleer meteen dit:

- zie je het welkomstscherm of je bestaande profieldata?
- opent de app zonder browserbalk?
- kun je tussen schermen wisselen?

### 3.6 Als je de knop `Installeren` niet ziet

Probeer dan dit:

1. herlaad de pagina
2. wacht iets langer tot alles geladen is
3. sluit Chrome volledig en open opnieuw
4. controleer of je echt in `Chrome` zit en niet in een ingebouwde browser van bijvoorbeeld Facebook of WhatsApp

### 3.7 Na een update

Na een update kan het nodig zijn om de app volledig te sluiten en opnieuw te openen zodat de nieuwste versie actief wordt.

## 4. Installatie op iPhone 15

Gebruik op iPhone bij voorkeur **Safari** voor het installeren van de app.

### 4.1 Wat heb je nodig?

- een iPhone 15
- internetverbinding
- de browser `Safari`
- de webadreslink van de app

### 4.2 Open de app in Safari

1. Open `Safari`.
2. Tik in de adresbalk.
3. Typ of plak het webadres van `timesheet`.
4. Wacht tot de pagina volledig geladen is.

### 4.3 Voeg de app toe aan je beginscherm

1. Tik onderaan of bovenaan op de **deelknop** in Safari.
2. Kies `Zet op beginscherm`.
3. Controleer de naam van de app.
4. Tik op `Voeg toe`.

### 4.4 Open de app

1. Ga naar je beginscherm.
2. Zoek het nieuwe icoon.
3. Open de app via dat icoon.

### 4.5 Als `Zet op beginscherm` niet zichtbaar is

Probeer dan dit:

1. controleer of je echt in `Safari` zit
2. laad de pagina opnieuw
3. wacht tot de pagina volledig geladen is
4. open het deelmenu opnieuw

### 4.6 Belangrijke opmerking voor iPhone

Op iPhone kunnen sommige PWA-functies verschillen van Android.

Voorbeelden:

- meldingen kunnen beperkter zijn
- achtergrondgedrag kan anders zijn
- installatie verloopt via `Zet op beginscherm` in plaats van via een expliciete `Installeer`-knop

## 5. Eerste profiel aanmaken

Als je de app voor het eerst gebruikt:

1. vul je naam in
2. vul de exportbestemmeling in
3. tik op `Start`

Daarna opent het scherm `Vandaag`.

## 6. Profielen gebruiken

### 6.1 Profiel kiezen

Bovenaan de app zie je de profielchips.

- het actieve profiel is visueel extra gemarkeerd
- tik op een ander profiel om over te schakelen
- als de app ooit meldt dat er profieldata bestaat maar geen actief profiel geladen werd, kies je hier opnieuw een profiel of ga je naar `Meer`

### 6.2 Profiel beheren

Ga naar `Meer` om:

- een profiel toe te voegen
- een profiel te bewerken
- een profiel actief of inactief te zetten
- een profielvolgorde te wijzigen

## 7. Klanten beheren

Ga naar `Klanten` om:

- alle klanten te bekijken
- een nieuwe klant toe te voegen
- een klant te bewerken
- een klant te verwijderen

Bij het verwijderen krijg je altijd een bevestigingsvenster.

## 8. Werkuren registreren

## 8.1 Dag openen

Open `Vandaag` om werkuren voor een bepaalde dag te registreren.

Je kunt:

- de datum veranderen met de pijlen
- links en rechts swipen om van dag te wisselen

## 8.2 Registratie maken

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

## 8.3 Klant kiezen

Het klantveld werkt als volgt:

- de laatst gekozen klant mag voorgeselecteerd staan
- zodra je in het veld tikt, wordt het zoekveld leeggemaakt
- kies een klant uit de lijst
- of maak een nieuwe klant aan

## 8.4 Tijd invullen

Gebruik de tijdchips voor snelle invoer.

Als de gewenste tijd er niet tussen staat:

1. tik op `Ander...`
2. kies een tijd via de tijdkiezer

## 8.5 Pauze en rit-credit

- pauze kies je via snelle chips
- rit-credit staat onder `Meer opties`
- rit-credit aanvaardt elke minuutwaarde vanaf 0
- standaard staat het veld op `0`
- zodra je begint te typen, verdwijnt die `0`
- als je niets invult en het veld verlaat, springt het terug naar `0`

## 8.6 Overlapwaarschuwing

Als een nieuw blok overlapt met een bestaand blok op dezelfde dag:

1. toont de app een waarschuwing
2. je kiest dan:
   - toch opslaan
   - of teruggaan en aanpassen

Deze waarschuwing komt uit de app zelf en niet uit een browserpopup.

## 8.7 Blok bewerken of verwijderen

1. tik op het potloodicoon van een bestaand blok
2. pas het blok aan
3. tik op `Opslaan`

Om te verwijderen:

1. open het blok
2. tik op `Verwijder blok`
3. bevestig de actie

## 9. Zelfde als gisteren

Als een dag nog leeg is, kan de app een groene kaart tonen:

`Zelfde als gisteren?`

Gebruik dit als je dezelfde blokken als de vorige werkdag wilt overnemen.

## 10. Weekoverzicht gebruiken

Ga naar `Week` voor een overzicht van 2 weken.

Daar zie je:

- alle dagen in de periode
- totalen per dag
- subtotaal per week
- samenvatting per klant

### 10.1 Dag openen vanuit week

Tik op een dagkaart om die dag te openen in `Vandaag`.

De app:

- opent de gekozen dag
- markeert duidelijk dat die dag uit het weekoverzicht komt
- laat je meteen blokken toevoegen voor die dag
- houdt die gekozen datum actief zodat je niet onbedoeld terugvalt op vandaag

## 11. PDF exporteren en delen

In `Week` kun je:

- een PDF downloaden
- een PDF delen via het toestel

Bij een volledig ingevulde tweewekenperiode verschijnt een extra exportbanner.

## 12. Notificaties gebruiken

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

## 13. Applicatie beheren

### 13.1 Profielen beheren

Ga naar `Meer` om profielen te beheren.

Daar kun je:

- een profiel toevoegen
- een profiel aanpassen
- een profiel actief of inactief zetten
- de profielvolgorde wijzigen
- een profiel verwijderen als dat mag

### 13.2 Klanten beheren

Ga naar `Klanten` om klanten toe te voegen, aan te passen of te verwijderen.

### 13.3 Notificaties beheren

Ga naar `Meer` om notificaties te beheren en een testmelding te sturen.

### 13.4 Updates van de app

De app wordt bijgewerkt via de website waarop ze gepubliceerd staat.

Als de app na een update vreemd reageert:

1. sluit de app volledig
2. open de app opnieuw
3. indien nodig: verwijder de geïnstalleerde app en installeer opnieuw

## 14. Belangrijk: gegevens en veiligheid

**Belangrijk:** je gegevens staan momenteel lokaal op deze smartphone.

Dat betekent:

- zonder backup ben je die gegevens kwijt bij toestelwissel of browserreset
- gegevens worden niet automatisch gesynchroniseerd naar een andere smartphone
- verwijderen of resetten van data op dit toestel heeft onmiddellijk effect

Maak altijd eerst een backup voordat je iets wist of een ander toestel begint te gebruiken.

## 15. Backup maken

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

Aanbevolen plaatsen om je backup te bewaren:

- iCloud Drive
- Google Drive
- OneDrive
- e-mail naar jezelf
- een computer of USB-opslag

### 15.1 Gegevensbewaring

- alle gegevens blijven lokaal op dit toestel bewaard
- gegevens blijven beschikbaar nadat je de app sluit en opnieuw opent
- gegevens worden niet automatisch gesynchroniseerd naar andere toestellen

## 16. Data importeren

Ga naar `Meer` en kies `Importeer data`.

Belangrijk:

- import vervangt alle huidige gegevens op dit toestel
- de app vraagt altijd bevestiging

Stappen:

1. tik op `Importeer data`
2. kies je backupbestand
3. lees de waarschuwing aandachtig
4. bevestig alleen als je zeker bent

Na succesvolle import wordt de app herladen.

## 17. Alle data wissen

Ga naar `Meer` en kies `Wis alle data`.

Belangrijk:

- deze actie verwijdert alle lokale gegevens van dit toestel
- de app vraagt altijd bevestiging
- na succesvolle reset wordt de app herladen

## 18. Problemen oplossen

### 18.1 De app toont niets of een vreemd scherm

- sluit de app volledig
- open opnieuw
- controleer of je internet had bij de eerste installatie
- installeer de app opnieuw indien nodig

### 18.2 Ik zie de installeerknop niet

Op Android:

- gebruik Chrome
- herlaad de pagina
- open de website niet via Facebook, WhatsApp of een andere ingebouwde browser

Op iPhone 15:

- gebruik Safari
- open het deelmenu opnieuw
- zoek naar `Zet op beginscherm`

### 18.3 Er is profieldata, maar de app vraagt om een profiel te herstellen

- kies een profiel via de profielchips
- of open `Meer` om profielen te beheren
- daarna kun je weer normaal verderwerken

### 18.4 Het lijkt alsof het verkeerde profiel actief is

- kijk naar de duidelijk gemarkeerde actieve profielchip
- tik expliciet op het gewenste profiel

### 18.5 Notificaties werken niet

- controleer toestemming in de browser
- controleer of notificaties in `Meer` ingeschakeld zijn
- test via de knop `Test notificatie`
- houd rekening met beperkingen van webnotificaties: volledig achtergrondgestuurde planning is beperkter dan bij een native app

### 18.6 Data kwijt na browserreset of toestelwissel

- herstel via een eerder gemaakte backup
- zonder backup is lokale data niet te recupereren

## 19. Onderhoud en goede werkwijze

Aanbevolen werkwijze:

- maak regelmatig een backup
- controleer voor export of alle werkdagen ingevuld zijn
- gebruik duidelijke klantnamen en locaties
- gebruik meerdere profielen alleen wanneer dit echt nodig is
- maak altijd eerst een backup voor je browserdata wist of van toestel wisselt

## 20. Samenvatting voor dagelijks gebruik

Voor dagelijks gebruik volstaat meestal dit patroon:

1. open `Vandaag`
2. kies of controleer het juiste profiel
3. registreer je blokken
4. controleer `Week`
5. exporteer wanneer de periode compleet is
6. maak regelmatig een backup
