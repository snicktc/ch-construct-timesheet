---
title: "Functionele Analyse"
subtitle: "timesheet"
document_type: "Functionele Analyse"
company: "CH Construct"
author: "CH Construct"
version: "1.0.0"
date: "2026-04-13"
lang: nl-BE
toc: true
toc-depth: 3
numbersections: false
titlepage: true
logo: "_shared/logo_CH-Construct.png"
header-left: "CH Construct"
header-center: "timesheet"
header-right: "Functionele Analyse"
footer-left: "Versie 1.0.0"
footer-right: "Pagina \\thepage"
---

## Documentcontrole {.unnumbered}

| Veld | Waarde |
|---|---|
| Documenttype | Functionele Analyse |
| Product | timesheet |
| Versie | 1.0.0 |
| Status | Goedgekeurde baseline |
| Datum | 2026-04-13 |
| Eigenaar | CH Construct |
| Doelgroep | Product owner, business analyst, development team |
| Bronnen | `SPEC.md`, huidige applicatie, bestaande projectdocumentatie |

## Revisiecontrole {.unnumbered}

| Veld | Waarde |
|---|---|
| Versie | 1.0.0 |
| Datum | 2026-04-13 |
| Auteur | OpenCode |
| Goedgekeurd door | Chris Van der Snickt |
| Status | Goedgekeurde baseline |
| Wijzigingssamenvatting | Geconsolideerde functionele analyse van de actuele `timesheet` app en businessregels |

## Wijzigingshistoriek {.unnumbered}

| Versie | Datum | Wijziging | Auteur |
|---|---|---|---|
| 1.0.0 | 2026-04-13 | Eerste geconsolideerde functionele analyse | OpenCode |

## Colofon / Contact {.unnumbered}

| Veld | Waarde |
|---|---|
| Contactpersoon | Chris Van der Snickt |
| Bedrijf | PM Nation CommV |
| Ondernemingsnummer | BE0707.878.977 |
| Adres | Burgstraat 8, 9960 Assenede |
| E-mail | chris@vandersnickt.be |

## Doel en context

`timesheet` is een Progressive Web App voor het registreren van werkuren per werknemerprofiel. De oplossing is ontworpen voor snel mobiel gebruik, met minimale invoerfrictie en een tweewekelijks exportmoment naar PDF.

De oplossing ondersteunt een lokale, toestelgebonden workflow. De app is bedoeld voor situaties waarin een werknemer zelfstandig zijn prestaties registreert zonder afhankelijk te zijn van een online backend.

## Scope

### In scope

- profielbeheer per werknemer
- gedeelde klantenlijst
- dagregistratie met meerdere blokken per dag
- week- en tweewekenoverzicht
- PDF-export en delen
- lokale notificatie-instellingen
- lokale backup, import en reset
- PWA-installatie en offline gebruik

### Buiten scope

- centrale server of cloudsync
- multi-user rechtenbeheer
- payroll integratie
- automatische synchronisatie tussen toestellen
- native mobiele app stores

## Gebruikers en rollen

### Eindgebruiker

De primaire gebruiker is een medewerker die dagelijks werkuren registreert.

Belangrijkste noden:

- snel uren ingeven
- weinig stappen per registratie
- duidelijk overzicht over de gewerkte dagen
- eenvoudige export naar een opdrachtgever of werkgever

### Beheerder op toestel

Dezelfde gebruiker of een verantwoordelijke kan profielen, klanten en toesteldata beheren.

Belangrijkste noden:

- profielen toevoegen of aanpassen
- klanten onderhouden
- backups maken en terugzetten
- data wissen op het toestel

## Kernbegrippen

### Profiel

Een profiel stelt een werknemer voor. Een profiel bevat naam, exportbestemmeling, standaardinstellingen en eventueel een logo.

### Klant

Een klant is een gedeeld bedrijfs- of projectrecord dat bij registraties gekozen kan worden. Een klant heeft een standaard locatie.

### Locatie

Een locatie is de plaats waar een prestatie uitgevoerd wordt. Locaties worden hergebruikt over klanten en registraties.

### Tijdsblok

Een tijdsblok is één registratie op één dag voor één profiel. Een dag kan meerdere blokken bevatten.

### Tweewekenperiode

Het weekscherm groepeert prestaties per periode van 14 kalenderdagen, met nadruk op de 10 werkdagen.

## Businessregels

### Profielen

- alleen actieve profielen verschijnen in de profielwisselaar
- een profiel met registraties kan niet verwijderd worden
- het laatst gekozen actieve profiel wordt onthouden
- het actieve profiel wordt visueel duidelijk gemarkeerd in de profielwisselaar
- als een eerder actief profiel niet meer correct geladen kan worden, biedt de app een herstelstap

### Klanten

- klanten zijn gedeeld over alle profielen
- een klant heeft één standaard locatie
- gebruik van een klant werkt `laatst gebruikt` bij
- het klantveld in de registratieflow mag een vorige selectie tonen, maar maakt het zichtbare zoekveld leeg zodra de gebruiker opnieuw wil zoeken

### Dagregistraties

- een dag mag meerdere blokken bevatten
- het eerste blok van een dag gebruikt standaard de profielpauze
- volgende blokken starten standaard met `0` pauze
- een overlap tussen blokken is toegestaan, maar geeft een waarschuwing
- chauffeur staat standaard op `Ja`
- rit-credit mag elke niet-negatieve minuutwaarde bevatten
- rit-credit toont standaard `0`, maar laat die vooringevulde waarde verdwijnen zodra de gebruiker begint te typen

### Export

- een export betreft een volledige tweewekenperiode
- export gebeurt in PDF-formaat
- export kan lokaal gedownload of gedeeld worden

### Dataopslag

- alle gegevens blijven lokaal op het toestel
- gegevens zijn niet automatisch beschikbaar op andere toestellen
- backup en restore zijn expliciete handelingen van de gebruiker
- backups bevatten naast businessdata ook relevante lokale app-instellingen

## Gebruikersflows

### Eerste start

1. gebruiker opent de app
2. er is nog geen profiel aanwezig
3. de app toont het welkomstscherm
4. gebruiker maakt het eerste profiel aan
5. de app opent de dagelijkse registratieflow

### Nieuwe dag registreren

1. gebruiker opent `Vandaag`
2. gebruiker kiest datum of gebruikt de standaarddag
3. gebruiker kiest klant
4. locatie wordt automatisch ingevuld
5. gebruiker vult tijdsblok in
6. gebruiker slaat op
7. dagtotaal wordt bijgewerkt

### Zelfde als gisteren

1. gebruiker opent een lege dag
2. de app toont de groene kaart `Zelfde als gisteren?`
3. gebruiker bevestigt
4. blokken van de vorige werkdag worden gekopieerd

### Dag openen vanuit weekoverzicht

1. gebruiker opent `Week`
2. gebruiker tikt op een dag
3. app opent `Vandaag` op exact die gekozen dag
4. app markeert zichtbaar dat de dag uit het weekoverzicht komt
5. gebruiker kan meteen een blok toevoegen of bestaande blokken bekijken

### Profiel wisselen

1. gebruiker kiest een ander profiel via de profielswitcher
2. alle data in het scherm wordt herladen voor dat profiel
3. de keuze wordt onthouden

### Backup en herstel

1. gebruiker exporteert een backup
2. de app maakt een JSON-bestand
3. gebruiker bewaart dat bestand extern
4. later kan de gebruiker de backup opnieuw importeren

## Schermanalyse

## Vandaag

### Doel

Het scherm ondersteunt de dagelijkse invoer van werkuren.

### Belangrijkste elementen

- profielwisselaar
- gekozen datum
- dagnavigatie
- weekvoortgang
- repeatkaart
- invoerformulier
- lijst van blokken
- dagtotaal
- duidelijke visuele aanduiding van het actieve profiel

### Wat de gebruiker ziet

- actieve profielkeuze bovenaan
- dagtitel met datum en exportbestemmeling
- pijlen om van dag te wisselen
- weekvoortgang met bolletjes
- groene kaart `Zelfde als gisteren?` bij een lege dag
- registratiekaarten met uren en locaties
- contextlabel wanneer een dag vanuit `Week` werd geopend

### Belangrijkste acties

- blok toevoegen
- uren bewerken
- uren verwijderen
- vorige werkdag kopieren
- datum wisselen
- klant zoeken vanuit een leeg zoekveld ondanks een voorgeselecteerde klant

### Verwacht gedrag

- lege dagen tonen meteen een registratieformulier
- klikken vanuit `Week` houdt de gekozen dag actief
- bewerken en verwijderen gebeuren via een sheet
- overlap tussen blokken leidt tot een bevestigingsdialoog en niet tot een harde blokkering

## Week

### Doel

Het scherm geeft een overzicht van 2 weken en ondersteunt export.

### Belangrijkste elementen

- periodeheader met weeknummers
- dagkaarten per periode
- subtotaal per week
- samenvatting per klant
- exportbanner bij complete periode

### Wat de gebruiker ziet

- twee blokken van elk zeven dagen
- totalen per dag
- staten voor lege werkdagen en weekends
- exportknoppen
- een klikbare dagkaart die direct naar registratie op die dag leidt

### Belangrijkste acties

- periode wisselen
- dag openen vanuit het overzicht
- PDF downloaden
- PDF delen

### Verwacht gedrag

- tikken op een dag opent `Vandaag`
- lege dagen tonen een oproep om te registreren
- complete perioden tonen directe exportactie

## Klanten

### Doel

Beheer van de gedeelde klantenlijst.

### Functies

- klanten bekijken
- klant toevoegen
- klant bewerken
- klant verwijderen na bevestiging

### Wat de gebruiker ziet

- volledige klantenlijst
- laatste gebruiksdatum
- bewerk- en verwijderacties
- sheet voor toevoegen of aanpassen

## Meer

### Doel

Beheer van profielen, notificaties en data-acties.

### Functies

- profielen beheren
- notificaties instellen
- backup maken
- backup importeren
- alle data wissen

### Wat de gebruiker ziet

- lijst met profielen
- profiel editor in sheet
- notificatie-instellingen
- data-acties met bevestiging

## Functionele beschrijving van gegevens

### Profielgegevens

Een profiel beschrijft de standaardwerkwijze van een werknemer en bepaalt waar exports naartoe gericht zijn.

### Klantgegevens

Klanten worden gebruikt als herbruikbare selectiewaarden bij dagregistratie.

### Registratiegegevens

Registraties vormen de kern van de oplossing en bepalen zowel dagtotalen als exports.

## Validaties en uitzonderingen

### Verplichte velden

- profielnaam en exportbestemmeling
- klant
- locatie
- geldige start- en eindtijd

### Tijdsvalidatie

- eindtijd moet later zijn dan starttijd
- overlap met bestaand blok geeft waarschuwing, geen harde blokkering

### Verwijderregels

- klant en profielverwijdering vragen bevestiging
- profielverwijdering wordt geweigerd als registraties bestaan

## Meldingen en bevestigingen

De app gebruikt klantgerichte bevestigingsdialogen voor:

- verwijderen van klant
- verwijderen van profiel
- verwijderen van tijdsblok
- import van data
- wissen van alle data
- overlapwaarschuwing bij tijdsblokken
- de app gebruikt geen browser-native technische meldtekst voor deze bevestigingen

## Functionele exportbeschrijving

De PDF-export van een tweewekenperiode bevat functioneel minimaal:

- logo van het actieve profiel
- naam van het actieve profiel
- weeknummers en periode
- tabel van week 1
- tabel van week 2
- subtotaal per week
- samenvatting per klant
- totaal over 2 weken
- paginanummering

Voorbeeld bestandsnaam:

```text
Werkuren_Milan_Week_26-27.pdf
```

## Export en notificaties

### Export

- export gebeurt per tweewekenperiode
- output is PDF
- delen gebeurt via toestelondersteuning indien beschikbaar

### Notificaties

- dagelijkse herinnering voor registratie
- vrijdagprompt voor export bij complete periode
- de dagelijkse herinnering opent de app op `Vandaag`
- de vrijdagprompt opent de app op `Week` met focus op export

## Gegevensbehoud en beperkingen

- de oplossing is local-first
- de gegevens staan lokaal op het toestel
- gegevens blijven lokaal bewaard na sluiten en heropenen van de app
- webnotificaties blijven afhankelijk van browserondersteuning
- er is geen automatische synchronisatie tussen toestellen

## Niet-functionele aandachtspunten

- mobiele bruikbaarheid is prioritair
- invoer moet snel en foutarm aanvoelen
- app moet offline beschikbaar blijven na installatie
- exports moeten bruikbaar zijn als formeel tweewekenoverzicht
