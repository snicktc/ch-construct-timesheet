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
numbersections: true
titlepage: true
logo: "_shared/logo_CH-Construct.png"
header-left: "CH Construct"
header-center: "timesheet"
header-right: "Functionele Analyse"
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
| Documenttype | Functionele Analyse |
| Product | timesheet |
| Versie | 1.0.0 |
| Status | Goedgekeurde baseline |
| Datum | 2026-04-13 |
| Eigenaar | CH Construct |
| Doelgroep | Product owner, business analyst, development team |
| Bronnen | `SPEC.md`, huidige applicatie, bestaande projectdocumentatie |

## Wijzigingshistoriek

| Versie | Datum | Wijziging | Auteur |
|---|---|---|---|
| 1.0.0 | 2026-04-13 | Eerste geconsolideerde functionele analyse | OpenCode |

\newpage

## 1. Doel en context

`timesheet` is een Progressive Web App voor het registreren van werkuren per werknemerprofiel. De oplossing is ontworpen voor snel mobiel gebruik, met minimale invoerfrictie en een tweewekelijks exportmoment naar PDF.

De oplossing ondersteunt een lokale, toestelgebonden workflow. De app is bedoeld voor situaties waarin een werknemer zelfstandig zijn prestaties registreert zonder afhankelijk te zijn van een online backend.

## 2. Scope

### 2.1 In scope

- profielbeheer per werknemer
- gedeelde klantenlijst
- dagregistratie met meerdere blokken per dag
- week- en tweewekenoverzicht
- PDF-export en delen
- lokale notificatie-instellingen
- lokale backup, import en reset
- PWA-installatie en offline gebruik

### 2.2 Buiten scope

- centrale server of cloudsync
- multi-user rechtenbeheer
- payroll integratie
- automatische synchronisatie tussen toestellen
- native mobiele app stores

## 3. Gebruikers en rollen

### 3.1 Eindgebruiker

De primaire gebruiker is een medewerker die dagelijks werkuren registreert.

Belangrijkste noden:

- snel uren ingeven
- weinig stappen per registratie
- duidelijk overzicht over de gewerkte dagen
- eenvoudige export naar een opdrachtgever of werkgever

### 3.2 Beheerder op toestel

Dezelfde gebruiker of een verantwoordelijke kan profielen, klanten en toesteldata beheren.

Belangrijkste noden:

- profielen toevoegen of aanpassen
- klanten onderhouden
- backups maken en terugzetten
- data wissen op het toestel

## 4. Kernbegrippen

### 4.1 Profiel

Een profiel stelt een werknemer voor. Een profiel bevat naam, exportbestemmeling, standaardinstellingen en eventueel een logo.

### 4.2 Klant

Een klant is een gedeeld bedrijfs- of projectrecord dat bij registraties gekozen kan worden. Een klant heeft een standaard locatie.

### 4.3 Locatie

Een locatie is de plaats waar een prestatie uitgevoerd wordt. Locaties worden hergebruikt over klanten en registraties.

### 4.4 Tijdsblok

Een tijdsblok is één registratie op één dag voor één profiel. Een dag kan meerdere blokken bevatten.

### 4.5 Tweewekenperiode

Het weekscherm groepeert prestaties per periode van 14 kalenderdagen, met nadruk op de 10 werkdagen.

## 5. Businessregels

### 5.1 Profielen

- alleen actieve profielen verschijnen in de profielwisselaar
- een profiel met registraties kan niet verwijderd worden
- het laatst gekozen actieve profiel wordt onthouden
- het actieve profiel wordt visueel duidelijk gemarkeerd in de profielwisselaar
- als een eerder actief profiel niet meer correct geladen kan worden, biedt de app een herstelstap

### 5.2 Klanten

- klanten zijn gedeeld over alle profielen
- een klant heeft één standaard locatie
- gebruik van een klant werkt `laatst gebruikt` bij
- het klantveld in de registratieflow mag een vorige selectie tonen, maar maakt het zichtbare zoekveld leeg zodra de gebruiker opnieuw wil zoeken

### 5.3 Dagregistraties

- een dag mag meerdere blokken bevatten
- het eerste blok van een dag gebruikt standaard de profielpauze
- volgende blokken starten standaard met `0` pauze
- een overlap tussen blokken is toegestaan, maar geeft een waarschuwing
- chauffeur staat standaard op `Ja`
- rit-credit mag elke niet-negatieve minuutwaarde bevatten
- rit-credit toont standaard `0`, maar laat die vooringevulde waarde verdwijnen zodra de gebruiker begint te typen

### 5.4 Export

- een export betreft een volledige tweewekenperiode
- export gebeurt in PDF-formaat
- export kan lokaal gedownload of gedeeld worden

### 5.5 Dataopslag

- alle gegevens blijven lokaal op het toestel
- gegevens zijn niet automatisch beschikbaar op andere toestellen
- backup en restore zijn expliciete handelingen van de gebruiker
- backups bevatten naast businessdata ook relevante lokale app-instellingen

## 6. Gebruikersflows

### 6.1 Eerste start

1. gebruiker opent de app
2. er is nog geen profiel aanwezig
3. de app toont het welkomstscherm
4. gebruiker maakt het eerste profiel aan
5. de app opent de dagelijkse registratieflow

### 6.2 Nieuwe dag registreren

1. gebruiker opent `Vandaag`
2. gebruiker kiest datum of gebruikt de standaarddag
3. gebruiker kiest klant
4. locatie wordt automatisch ingevuld
5. gebruiker vult tijdsblok in
6. gebruiker slaat op
7. dagtotaal wordt bijgewerkt

### 6.3 Zelfde als gisteren

1. gebruiker opent een lege dag
2. de app toont de groene kaart `Zelfde als gisteren?`
3. gebruiker bevestigt
4. blokken van de vorige werkdag worden gekopieerd

### 6.4 Dag openen vanuit weekoverzicht

1. gebruiker opent `Week`
2. gebruiker tikt op een dag
3. app opent `Vandaag` op exact die gekozen dag
4. app markeert zichtbaar dat de dag uit het weekoverzicht komt
5. gebruiker kan meteen een blok toevoegen of bestaande blokken bekijken

### 6.5 Profiel wisselen

1. gebruiker kiest een ander profiel via de profielswitcher
2. alle data in het scherm wordt herladen voor dat profiel
3. de keuze wordt onthouden

### 6.6 Backup en herstel

1. gebruiker exporteert een backup
2. de app maakt een JSON-bestand
3. gebruiker bewaart dat bestand extern
4. later kan de gebruiker de backup opnieuw importeren

## 7. Schermanalyse

## 7.1 Vandaag

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
- registratiekaarten met tijden en locaties
- contextlabel wanneer een dag vanuit `Week` werd geopend

### Belangrijkste acties

- blok toevoegen
- blok bewerken
- blok verwijderen
- vorige werkdag kopieren
- datum wisselen
- klant zoeken vanuit een leeg zoekveld ondanks een voorgeselecteerde klant

### Verwacht gedrag

- lege dagen tonen meteen een registratieformulier
- klikken vanuit `Week` houdt de gekozen dag actief
- bewerken en verwijderen gebeuren via een sheet
- overlap tussen blokken leidt tot een bevestigingsdialoog en niet tot een harde blokkering

## 7.2 Week

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

## 7.3 Klanten

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

## 7.4 Meer

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

## 8. Functionele beschrijving van gegevens

### 8.1 Profielgegevens

Een profiel beschrijft de standaardwerkwijze van een werknemer en bepaalt waar exports naartoe gericht zijn.

### 8.2 Klantgegevens

Klanten worden gebruikt als herbruikbare selectiewaarden bij dagregistratie.

### 8.3 Registratiegegevens

Registraties vormen de kern van de oplossing en bepalen zowel dagtotalen als exports.

## 9. Validaties en uitzonderingen

### 9.1 Verplichte velden

- profielnaam en exportbestemmeling
- klant
- locatie
- geldige start- en eindtijd

### 9.2 Tijdsvalidatie

- eindtijd moet later zijn dan starttijd
- overlap met bestaand blok geeft waarschuwing, geen harde blokkering

### 9.3 Verwijderregels

- klant en profielverwijdering vragen bevestiging
- profielverwijdering wordt geweigerd als registraties bestaan

## 10. Meldingen en bevestigingen

De app gebruikt klantgerichte bevestigingsdialogen voor:

- verwijderen van klant
- verwijderen van profiel
- verwijderen van tijdsblok
- import van data
- wissen van alle data
- overlapwaarschuwing bij tijdsblokken
- de app gebruikt geen browser-native technische meldtekst voor deze bevestigingen

## 11. Functionele exportbeschrijving

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

## 12. Export en notificaties

### Export

- export gebeurt per tweewekenperiode
- output is PDF
- delen gebeurt via toestelondersteuning indien beschikbaar

### Notificaties

- dagelijkse herinnering voor registratie
- vrijdagprompt voor export bij complete periode
- de dagelijkse herinnering opent de app op `Vandaag`
- de vrijdagprompt opent de app op `Week` met focus op export

## 13. Gegevensbehoud en beperkingen

- de oplossing is local-first
- de gegevens staan lokaal op het toestel
- gegevens blijven lokaal bewaard na sluiten en heropenen van de app
- webnotificaties blijven afhankelijk van browserondersteuning
- er is geen automatische synchronisatie tussen toestellen

## 14. Niet-functionele aandachtspunten

- mobiele bruikbaarheid is prioritair
- invoer moet snel en foutarm aanvoelen
- app moet offline beschikbaar blijven na installatie
- exports moeten bruikbaar zijn als formeel tweewekenoverzicht
