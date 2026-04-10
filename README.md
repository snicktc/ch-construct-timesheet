# timesheet

PWA voor werkurenregistratie per profiel, met lokale opslag in IndexedDB, 2-wekelijks weekoverzicht en PDF-export.

## Documentatie

- Functioneel: `docs/functionele-documentatie.md`
- Technisch: `docs/technische-documentatie.md`
- Profiling: `docs/runtime-profiling-plan.md`
- Changelog: `CHANGELOG.md`
- Bronspecificatie: `SPEC.md`

## Kernfeatures

- meerdere profielen met eigen exportbestemmeling en logo
- gedeelde klanten- en locatieslijst
- dagregistratie met meerdere blokken per dag
- snelle tijdchips, repeat van vorige werkdag en dagtotalen
- 2-wekenoverzicht met subtotalen en samenvatting per klant
- PDF-export en delen via Web Share API
- PWA met service worker en offline caching
- lokale notificatie-instellingen
- backup, import en reset van alle data

## Stack

- React 19
- TypeScript
- Vite 7
- Dexie / IndexedDB
- jsPDF + jsPDF-AutoTable
- vite-plugin-pwa

## Scripts

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

## Opmerking

Alle data blijft lokaal op het toestel. Er is geen backend of serverdatabase.
