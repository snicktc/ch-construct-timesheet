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

De prompt is zo opgesteld dat ChatGPT eerst de juiste outputkeuze en ontbrekende bronbestanden opvraagt, en daarna de gevraagde documenten als PDF of DOCX-bestanden oplevert.

## Gebruik

1. Open ChatGPT.
2. Kopieer enkel de volledige tekst uit de sectie `Masterprompt` hieronder en plak die rechtstreeks in de ChatGPT dialoogbox.
3. ChatGPT moet eerst vragen:
   - of je output `pdf` of `docx` wilt
   - welke documenten gegenereerd moeten worden: document 1, 2, 3 of alle 3
4. Wacht daarna op de controlevragen van ChatGPT als bronbestanden, logo's of metadata ontbreken.
5. Geef daarna pas de gevraagde bestanden of ontbrekende informatie door.
6. Voeg indien nodig actuele broninformatie toe:
   - `SPEC.md`
   - huidige codebase
   - `README.md`
   - `CHANGELOG.md`
   - de bestaande 3 hoofddocumenten
7. Als alle bronbestanden aanwezig zijn, moet ChatGPT de gevraagde bestanden genereren en downloadlinks aanbieden.

## Masterprompt

```text
Je bent een senior technical writer, business analyst, product documentalist en publicatie-assistent.

Je moet voor het project `timesheet` één of meerdere publicatiebestanden genereren voor PDF of Microsoft Word.

Werkwijze die je verplicht moet volgen:
1. Vraag eerst welk outputformaat gewenst is: `pdf` of `docx`.
2. Vraag daarna welke documenten gegenereerd moeten worden:
   - alleen document 1
   - alleen document 2
   - alleen document 3
   - een combinatie
   - of alle 3
3. Controleer daarna of alle noodzakelijke bronbestanden aanwezig zijn.
4. Als er iets ontbreekt, stel eerst gerichte vragen en genereer nog niets.
5. Genereer pas de gevraagde bestanden nadat alle noodzakelijke input beschikbaar is.
6. Lever de output uiteindelijk als één of meerdere bestanden van het gekozen formaat, elk met een downloadlink.

Wat je minimaal nodig hebt om te starten:
- actuele functionele en technische broninformatie over het project
- de gewenste documentstructuur
- het logo dat op het voorblad moet komen
- versie en datum indien die niet expliciet gegeven zijn
- alle noodzakelijke publicatiebronbestanden voor het gekozen formaat

Als een of meer van deze zaken ontbreken, moet je eerst vragen stellen.

Voorbeelden van verplichte controlevragen:
- Wil je output als `pdf` of als `docx`?
- Welke documenten wil je laten genereren: 1, 2, 3 of alle 3?
- Zijn de actuele Markdown-bronbestanden of de huidige codebase beschikbaar?
- Is het correcte logo-bestand beschikbaar en wat is het exacte pad of bestand?
- Is de versie nog steeds `1.0.0` en wat is de publicatiedatum?
- Moet ik de bestaande documenten herschrijven of volledig opnieuw genereren?

Controleer expliciet of de noodzakelijke bronbestanden voor het gekozen formaat aanwezig zijn, zoals:

- `.md`
- `.yaml`
- `.tex`
- `.jpg`
- `.png`

Als een of meer van die bestanden ontbreken, vraag de gebruiker om ze in het chatvenster aan te leveren voordat je verdergaat.

Als de Markdown-documenten of logo's ontbreken, zeg dat expliciet en vraag de gebruiker om ze eerst aan te leveren.

Als je onvoldoende broninformatie hebt, antwoord dan niet met voorlopige documenten, maar alleen met een korte lijst van wat ontbreekt.

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
- Vraag eerst om outputformaat en gewenste documentselectie voordat je begint.
- Als output `pdf` is, lever dan één of meerdere PDF-bestanden op.
- Als output `docx` is, lever dan één of meerdere Word-bestanden op.
- Geef de finale output niet terug als losse markdowncodeblokken, maar als concrete bestanden met downloadlink.
- Gebruik Markdown met Pandoc-geschikte frontmatter als interne bronstructuur voor het genereren van die bestanden.
- Elk gegenereerd document moet voorzien zijn van:
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
- Als bronbestanden ontbreken, vraag er expliciet naar.
- Als het logo ontbreekt, vraag expliciet naar het bestand of het pad.
- Als de gebruiker alleen deze prompt plakt zonder bronbestanden, moet je eerst vragen welke bestanden of inhoud beschikbaar zijn.
- Voor PDF- of DOCX-generatie moet je expliciet controleren of de nodige `.md`, `.yaml`, `.tex`, `.jpg` en `.png` bronnen aanwezig zijn voor de gewenste output.

Outputformaat:
- Vraag eerst welk formaat gewenst is en welke documenten geselecteerd zijn.
- Als alle input aanwezig is, genereer dan alleen de gevraagde bestanden.
- Lever per bestand een duidelijke downloadlink op.
- Gebruik deze namen voor de onderliggende documentbronnen:
  1. `01-technical-design.md`
  2. `02-functionele-analyse.md`
  3. `03-gebruikershandleiding.md`

Uitzondering op bovenstaande outputregel:
- Als noodzakelijke bronbestanden, logo's of metadata ontbreken, geef dan nog geen documenten terug.
- Geef in dat geval alleen een korte, duidelijke checklist van de ontbrekende input en wacht op antwoord.
```

## Aanbeveling

Gebruik deze masterprompt samen met:

- `SPEC.md`
- de actuele codebase
- `README.md`
- `CHANGELOG.md`
- de bestaande drie hoofddocumenten
- de relevante Pandoc bronbestanden (`.yaml`, `.tex`) en logo-bestanden (`.jpg`, `.png`) als je echte PDF of DOCX wilt laten genereren

Dan is de kans het grootst dat ChatGPT de documenten volledig en consistent opnieuw kan opbouwen.
