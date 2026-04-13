---
title: "ChatGPT Prompt voor Documentgeneratie"
subtitle: "timesheet"
document_type: "AI Prompt"
company: "CH Construct"
author: "CH Construct"
version: "1.0.0"
date: "2026-04-13"
lang: nl-BE
toc: true
toc-depth: 2
numbersections: true
titlepage: true
logo: "_shared/logo_CH-Construct.png"
header-left: "CH Construct"
header-center: "timesheet"
header-right: "AI Prompt"
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

## Doel

Dit document bevat een herbruikbare masterprompt om ChatGPT drie publicatieklare hoofddocumenten te laten genereren voor `timesheet`:

1. technisch ontwerp
2. functionele analyse
3. gebruikershandleiding

De prompt is zo opgesteld dat de output geschikt is als Markdown-bron voor verdere omzetting naar PDF en Microsoft Word via Pandoc.

## Gebruik

1. Open ChatGPT.
2. Geef de volledige prompt uit dit document.
3. Voeg indien nodig actuele broninformatie toe:
   - `SPEC.md`
   - huidige codebase
   - `README.md`
   - `CHANGELOG.md`
   - de bestaande 3 hoofddocumenten
4. Vraag ChatGPT om de 3 documenten afzonderlijk terug te geven.
5. Sla de output op als:
   - `docs/01-technical-design.md`
   - `docs/02-functionele-analyse.md`
   - `docs/03-gebruikershandleiding.md`

## Masterprompt

```text
Je bent een senior technical writer, business analyst en product documentalist.

Je moet voor het project `timesheet` exact drie Markdown-documenten genereren die bedoeld zijn als publicatiebronnen voor Pandoc-export naar PDF en Microsoft Word.

Context:
- Productnaam: timesheet
- Bedrijf: CH Construct
- Contactpersoon: Chris Van der Snickt
- Bedrijf entiteit: PM Nation CommV
- Ondernemingsnummer: BE0707.878.977
- Adres: Burgstraat 8, 9960 Assenede
- E-mail: chris@vandersnickt.be
- Versie: 1.0.0
- Talen:
  - technisch ontwerp: Engels
  - functionele analyse: Nederlands
  - gebruikershandleiding: Nederlands

Doelen:
1. Document 1: pure technische opbouw van de app, inclusief architectuur, technologische keuzes, exacte libraryversies en gebruikte third-party tools.
2. Document 2: volledige functionele analyse/beschrijving van de app zoals een business analyst deze voor een development team zou schrijven.
3. Document 3: volledige gebruikers- en beheerdershandleiding voor eindgebruikers zonder technische programmeerkennis.

Belangrijke outputregels:
- Geef exact 3 afzonderlijke Markdown-documenten terug.
- Elk document moet volledige Pandoc YAML-frontmatter bevatten.
- Elk document moet voorzien zijn van:
  - titel
  - subtitel
  - documenttype
  - bedrijf
  - auteur
  - versienummer
  - datum
  - taal
  - TOC-instellingen
  - header/footer metadata
  - logo pad `_shared/logo_CH-Construct.png`
- Elk document moet vooraan bevatten:
  - voorblad
  - documentcontrole
  - revisiecontrole
  - wijzigingshistoriek
  - colofon/contactblok
- Schrijf in Markdown die goed werkt met Pandoc naar PDF en DOCX.
- Gebruik duidelijke headingstructuur met genummerde hoofdstukken.
- Voeg geen HTML-only oplossingen toe als Markdown/Pandoc volstaat.
- De inhoud moet volledig, onderhoudbaar en professioneel zijn.

Opmaakvereisten:
- Donkerblauwe CH Construct huisstijl veronderstellen via metadata en Pandoc templates.
- TOC dynamisch laten genereren.
- Paginanummers en lopende kopteksten moeten voorbereid zijn via metadata.
- Geen overbodige emoji of marketingtaal.
- Schrijf zakelijk, helder en volledig.

Document 1 moet heten:
- `01-technical-design.md`

Document 1 inhoud minimaal:
- Purpose and scope
- Product summary
- Technology stack and exact version matrix
- Architectural decisions and rationale
- Source structure
- Data model and persistence design
- Hooks and state management
- Feature modules
- PWA architecture
- Notifications architecture
- PDF export architecture
- Backup, import and migration
- Build, quality and deployment
- Developer operations reference
- Performance and profiling guide
- Constraints and known limitations
- Documentation maintenance rules

Document 2 moet heten:
- `02-functionele-analyse.md`

Document 2 inhoud minimaal:
- Doel en context
- Scope
- Gebruikers en rollen
- Kernbegrippen
- Businessregels
- Gebruikersflows
- Volledige schermanalyse van Vandaag, Week, Klanten en Meer
- Wat de gebruiker ziet
- Belangrijkste acties
- Verwacht gedrag
- Validaties en uitzonderingen
- Meldingen en bevestigingen
- Functionele exportbeschrijving
- Notificaties
- Gegevensbehoud en beperkingen
- Niet-functionele aandachtspunten

Document 3 moet heten:
- `03-gebruikershandleiding.md`

Document 3 inhoud minimaal:
- Inleiding
- Belangrijk voor je begint
- Installatie op Android stap voor stap voor een leek
- Installatie op iPhone 15 stap voor stap voor een leek
- Eerste profiel aanmaken
- Profielen gebruiken
- Klanten beheren
- Werkuren registreren
- Tijdchips en formulieren uitleggen
- Overlapwaarschuwingen uitleggen
- Weekoverzicht gebruiken
- PDF exporteren en delen
- Notificaties gebruiken
- Applicatie beheren
- Belangrijk: gegevens en veiligheid
- Backup maken
- Data importeren
- Alle data wissen
- Problemen oplossen
- Onderhoud en goede werkwijze
- Samenvatting voor dagelijks gebruik

Extra inhoudelijke eisen:
- Maak expliciet duidelijk dat alle data lokaal op het toestel staat.
- Vermeld dat er geen automatische cloudsync of multi-device sync is.
- Leg uit dat notificaties browserafhankelijk zijn.
- Vermeld dat exports PDF zijn.
- Vermeld dat backups ook relevante lokale instellingen kunnen bevatten.
- Vermeld het migratiepad van legacy `ch-timesheet` naar `timesheet` in de technische doc.
- Maak onderscheid tussen technische, functionele en eindgebruikersinformatie.
- Vermijd onnodige duplicatie tussen de drie documenten.

Brongebruik:
- Gebruik alle aangeleverde projectbestanden als bron van waarheid.
- Als er conflicten zijn tussen oude docs en huidige code, volg de actuele codebasis.
- Als een detail niet zeker is, formuleer neutraal zonder te hallucineren.

Outputformaat:
- Geef de drie documenten in deze volgorde:
  1. `01-technical-design.md`
  2. `02-functionele-analyse.md`
  3. `03-gebruikershandleiding.md`
- Zet elk document in een apart Markdown codeblok.
- Voeg geen extra uitleg buiten de documenten toe.
```

## Aanbeveling

Gebruik deze masterprompt samen met:

- `SPEC.md`
- de actuele codebase
- `README.md`
- `CHANGELOG.md`
- de bestaande drie hoofddocumenten

Dan is de kans het grootst dat ChatGPT de documenten volledig en consistent opnieuw kan opbouwen.
