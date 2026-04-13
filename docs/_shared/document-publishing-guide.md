# Document Publishing Guide

## Doel

Deze handleiding beschrijft hoe de drie hoofddocumenten van `timesheet` gepubliceerd kunnen worden naar PDF en Microsoft Word met Pandoc.

## Brondocumenten

- `docs/01-technical-design.md`
- `docs/02-functionele-analyse.md`
- `docs/03-gebruikershandleiding.md`

## Ondersteunende bestanden

- `docs/_shared/pandoc-defaults-pdf.yaml`
- `docs/_shared/pandoc-defaults-docx.yaml`
- `docs/_shared/pandoc-header.tex`
- `docs/_shared/logo_CH-Construct.png`
- `docs/_shared/reference-docx-strategy.md`
- optioneel: `docs/_shared/reference.docx`

## Vereisten

Voor PDF:

- Pandoc
- XeLaTeX

Voor Word:

- Pandoc
- optioneel een branded `reference.docx`

## Outputmap

Gebruik bij voorkeur:

```text
output/
```

## Handmatige exportcommando's

### PDF

```bash
pandoc --defaults docs/_shared/pandoc-defaults-pdf.yaml docs/01-technical-design.md -o output/01-technical-design.pdf
pandoc --defaults docs/_shared/pandoc-defaults-pdf.yaml docs/02-functionele-analyse.md -o output/02-functionele-analyse.pdf
pandoc --defaults docs/_shared/pandoc-defaults-pdf.yaml docs/03-gebruikershandleiding.md -o output/03-gebruikershandleiding.pdf
```

### DOCX

```bash
pandoc --defaults docs/_shared/pandoc-defaults-docx.yaml docs/01-technical-design.md -o output/01-technical-design.docx
pandoc --defaults docs/_shared/pandoc-defaults-docx.yaml docs/02-functionele-analyse.md -o output/02-functionele-analyse.docx
pandoc --defaults docs/_shared/pandoc-defaults-docx.yaml docs/03-gebruikershandleiding.md -o output/03-gebruikershandleiding.docx
```

## Geautomatiseerde export

Gebruik:

```powershell
powershell -ExecutionPolicy Bypass -File docs/_shared/build-docs.ps1
```

Het script:

- maakt `output/` aan indien nodig
- genereert PDF-bestanden
- genereert DOCX-bestanden
- gebruikt automatisch `docs/_shared/reference.docx` als dat bestand bestaat

## Controle na publicatie

Controleer per document:

- voorblad met logo, titel, datum en versie
- inhoudstafel
- documentcontrole
- wijzigingshistoriek
- lopende kopteksten
- paginanummers
- geen afgebroken tabellen of verkeerd geneste titels

## Aanbevolen publicatiewerkwijze

1. Werk de Markdown-bron bij.
2. Controleer versienummer en datum.
3. Exporteer naar PDF en DOCX.
4. Voer een visuele kwaliteitscontrole uit.
5. Sla de finale publicaties op in een release- of deliverymap.
