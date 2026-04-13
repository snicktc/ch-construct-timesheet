# Reference DOCX Strategy

## Doel

Dit document beschrijft hoe een branded `reference.docx` voor Pandoc moet worden opgebouwd, zodat de drie hoofddocumenten ook naar Microsoft Word geëxporteerd kunnen worden met een consistente CH Construct-opmaak.

## Waarom een `reference.docx`

Pandoc kan `.docx` genereren uit Markdown, maar voor branded Word-output zijn vooral deze elementen afhankelijk van een `reference.docx`:

- typografie en heading styles
- paginamarges
- kopteksten en voetteksten
- paginanummers
- tabelstijlen
- cover-opmaak in Word-context

## Aanbevolen bestandsnaam

```text
docs/_shared/reference.docx
```

## Uitgangspunt

Maak eerst een leeg Word-document aan en configureer daar de gewenste stijlen. Bewaar dat bestand als `docs/_shared/reference.docx`.

## Huisstijlrichtlijn

Gebruik als basiskleuren:

- donkerblauw hoofdaccent: `#0B3250`
- lichtgrijze ondersteunende kleur: `#B7B7B7`
- wit voor ruime witmarges en coverbalans

Logo:

- gebruik het nieuwe CH Construct-logo als cover-element
- plaats het groot op het voorblad
- gebruik het niet herhaald op elke pagina in de header, tenzij dat zeer subtiel gebeurt

## Verplichte Word styles

Definieer in `reference.docx` minimaal deze styles:

### 1. Title

- groot formaat
- donkerblauw
- vet
- voldoende witruimte erboven en eronder

### 2. Subtitle

- middelgroot
- donkerblauw of grijs

### 3. Heading 1

- donkerblauw
- vet
- paginabreuk vermijden waar mogelijk

### 4. Heading 2

- donkerblauw
- iets kleiner dan Heading 1

### 5. Heading 3

- donkerblauw of donkergrijs

### 6. Normal

- leesbaar sans-serif lettertype
- 10.5pt of 11pt
- comfortabele regelafstand

### 7. Table / Table Header

- nette celpadding
- headerregel donkerblauw of lichtgrijs
- consistente randdikte

## Koptekst en voettekst

### Header

Aanbevolen inhoud:

- links: `CH Construct`
- midden: `timesheet`
- rechts: documenttype

### Footer

Aanbevolen inhoud:

- links: `Version 1.0.0`
- rechts: paginanummer

## Voorblad in Word

Omdat Pandoc cover-opmaak in DOCX beperkter ondersteunt dan in PDF, wordt aanbevolen om in `reference.docx` een nette titelpagina-opmaak voor `Title`, `Subtitle` en metadata te voorzien.

Het Markdown-document bevat al:

- logo
- titel
- subtitel
- versie
- datum
- documentcontrole

Het `reference.docx` moet dus vooral zorgen voor:

- correcte spacing
- typografie
- kleurgebruik

## Tabellen

De volgende tabellen moeten er in Word goed uitzien:

- documentcontrole
- wijzigingshistoriek
- dependency matrix
- functionele tabellen

Gebruik daarom een consistente tabelstijl met:

- duidelijk headercontrast
- subtiele randen
- geen zware zwarte standaard Word-randen

## Aanmaakstappen

1. Open Microsoft Word.
2. Maak een nieuw leeg document.
3. Pas `Title`, `Subtitle`, `Heading 1`, `Heading 2`, `Heading 3`, `Normal` aan.
4. Configureer header en footer.
5. Configureer paginanummering.
6. Maak een voorbeeldtabel en pas de tabelstijl aan.
7. Bewaar als:

```text
docs/_shared/reference.docx
```

## Gebruik in exportflow

Zodra `reference.docx` bestaat, zal de exportscript deze automatisch gebruiken voor `.docx` uitvoer.

## Validatie

Controleer na export:

- coverpagina correct
- inhoudstafel aanwezig
- headings correct genest
- tabellen leesbaar
- header/footer zichtbaar
- paginanummers aanwezig
