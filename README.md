# timesheet

PWA voor werkurenregistratie per profiel, met lokale opslag in IndexedDB, tweewekenoverzicht en PDF-export.

## Hoofddocumentatie

- Technisch ontwerp: `docs/01-technical-design.md`
- Functionele analyse: `docs/02-functionele-analyse.md`
- Gebruikershandleiding: `docs/03-gebruikershandleiding.md`
- Publicatiehandleiding: `docs/_shared/document-publishing-guide.md`
- Word reference strategie: `docs/_shared/reference-docx-strategy.md`

## Overige referenties

- Changelog: `CHANGELOG.md`
- Bronspecificatie: `SPEC.md`
- Archief oude documentatie: `docs/_archive/`

## Scripts

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

## Pandoc export

Voorbeeld PDF:

```bash
pandoc --defaults docs/_shared/pandoc-defaults-pdf.yaml docs/01-technical-design.md -o output/01-technical-design.pdf
```

Voorbeeld Word:

```bash
pandoc --defaults docs/_shared/pandoc-defaults-docx.yaml docs/03-gebruikershandleiding.md -o output/03-gebruikershandleiding.docx
```

Geautomatiseerde export:

```powershell
powershell -ExecutionPolicy Bypass -File docs/_shared/build-docs.ps1
```

## Opmerking

Alle businessdata blijft lokaal op het toestel. Er is geen backend of serverdatabase.
