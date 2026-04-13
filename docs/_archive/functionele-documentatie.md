# Functionele Documentatie

## Doel

`timesheet` is een Progressive Web App voor het registreren van werkuren per werknemerprofiel. De app is bedoeld voor snelle dagelijkse invoer op mobiel, met een 2-wekelijks exportoverzicht in PDF.

## Hoofdconcepten

### Profielen

- Elk profiel stelt een werknemer voor.
- Een profiel bevat:
  - naam
  - exportbestemmeling
  - exportlogo
  - standaard pauze
  - standaard starttijd
  - actief/inactief status
- Alleen actieve profielen verschijnen in de profielwijzer bovenaan de app.
- Het laatst gekozen profiel wordt onthouden.

### Klanten

- Klanten zijn gedeeld over alle profielen.
- Elke klant heeft een standaard locatie.
- Klanten worden hergebruikt bij dagregistraties.
- Bij gebruik van een klant wordt `laatst gebruikt` bijgewerkt.

### Dagregistraties

- Een dag kan uit meerdere blokken bestaan.
- Elk blok bevat:
  - klant
  - locatie
  - starttijd
  - eindtijd
  - pauze
  - rit-credit
  - chauffeurstatus
  - notities
- Het dagtotaal wordt automatisch berekend.

## Schermen

## 1. Vandaag

Dit is het startscherm van de app.

### Wat de gebruiker ziet

- profielwisselaar
- gekozen datum met vorige/volgende dag
- weekvoortgang met bolletjes
- groene kaart “Zelfde als gisteren?” als de dag nog leeg is
- invoerformulier voor nieuwe registratie
- lijst met bestaande blokken
- dagtotaal

### Gedrag

- Bij een lege dag kan de gebruiker alle blokken van de vorige werkdag in één tik kopiëren.
- Bij een lege dag staat ook meteen een leeg invoerformulier klaar.
- Bij bestaande blokken kan de gebruiker extra blokken toevoegen.
- Een bestaand blok kan bewerkt of verwijderd worden.
- De gebruiker kan links/rechts swipen om van dag te wisselen.

### Invoerformulier

- klant zoeken of nieuwe klant aanmaken
- locatie automatisch ingevuld vanuit klant
- start- en eindtijd via snelle chips
- “Ander...” opent een native time input
- pauze via snelle chips
- chauffeur via snelle knoppen
- rit-credit en notities onder “Meer opties”

## 2. Week

Dit scherm toont een overzicht van 2 weken.

### Wat de gebruiker ziet

- periodekop met weeknummers
- 2 blokken van elk 7 dagen
- subtotalen per week
- samenvatting per klant
- totaal over 2 weken
- knoppen voor PDF-export en delen

### Gedrag

- de gebruiker kan per 14 dagen navigeren
- de gebruiker kan links/rechts swipen om van periode te wisselen
- tikken op een dag opent die dag in het scherm “Vandaag”
- als alle 10 werkdagen ingevuld zijn, verschijnt een exportbanner
- de exportbanner laat direct delen of downloaden toe

## 3. Klanten

Dit scherm beheert de gedeelde klantenlijst.

### Mogelijkheden

- lijst van alle klanten bekijken
- klant toevoegen
- klant bewerken
- klant verwijderen met bevestiging

### Invoer

- klantnaam
- standaard locatie

De klanteditor opent als sheet.

## 4. Meer

Dit scherm bevat instellingen en profielbeheer.

### Profielbeheer

- profiel toevoegen
- profiel bewerken
- profiel inactief maken
- profiel verwijderen als er geen registraties gekoppeld zijn
- profielvolgorde wijzigen met omhoog/omlaag knoppen

### Notificaties

- toestemming aanvragen
- testnotificatie sturen
- dagelijkse herinnering aan/uit
- tijd voor dagelijkse herinnering instellen
- vrijdag export-prompt aan/uit

### Data

- volledige backup exporteren
- backup importeren
- alle data wissen met bevestiging

## PDF-export

De app kan een 2-wekelijks overzicht exporteren naar PDF.

### Inhoud van de PDF

- logo van het actieve profiel
- naam van het actieve profiel
- weeknummers en periode
- tabel van week 1
- tabel van week 2
- subtotaal per week
- samenvatting per klant
- totaal 2 weken
- paginanummer

### Bestandsnaam

Voorbeeld:

```text
Werkuren_Milan_Week_26-27.pdf
```

## Notificaties

De app ondersteunt lokale webnotificaties.

### Dagelijkse reminder

- herinnert de gebruiker om zijn werkdag te registreren
- opent de app op “Vandaag”

### Vrijdag export-prompt

- verschijnt wanneer de 2-wekenperiode volledig ingevuld is
- opent de app op “Week” met focus op export

## Gegevensbewaring

- alle appdata wordt lokaal opgeslagen
- gegevens blijven bewaard na sluiten en heropenen van de app
- er is geen online account of backend nodig

## Beperkingen

- notificaties op het web hangen af van browserondersteuning
- volledig achtergrondgestuurde planning is beperkter dan bij native apps
- de app is lokaal-first: synchronisatie tussen toestellen is niet voorzien
