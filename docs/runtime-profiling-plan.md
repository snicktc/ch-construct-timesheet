# Runtime Profiling Plan

## Doel

Dit document beschrijft hoe `timesheet` praktisch geprofiled kan worden op echte performantieproblemen in browser en PWA-context.

## Focusgebieden

Profileer eerst deze flows:

1. Opstart van de app
2. Openen van `Vandaag`
3. Openen van `Week`
4. Aanmaken en bewerken van registraties
5. PDF export en delen
6. Migratiepad van oude `ch-timesheet` data

## Aanbevolen omgeving

- Chrome of Edge recent stable
- mobiele emulatie in DevTools
- minstens 1 echte mobiele test op Android
- test met kleine dataset en met zware dataset

## Testdatasets

Gebruik minimaal drie datasets:

### 1. Lege dataset

- geen profielen
- geen klanten
- geen registraties

### 2. Normale dataset

- 2 tot 4 profielen
- 20 tot 50 klanten
- 2 weken registraties

### 3. Zware dataset

- 6 tot 10 profielen
- 100+ klanten
- 1000+ `timeEntries`
- meerdere `weekExports`

## Metingen

## 1. Startup

Meet:

- tijd tot eerste render
- tijd tot interactieve UI
- tijd tot migratie afgerond is

Controleer:

- main thread blokkering
- onnodige synchronous localStorage/IndexedDB pieken
- service worker registratie-impact

Tools:

- Chrome DevTools Performance
- Lighthouse PWA + Performance

## 2. Vandaag-scherm

Meet:

- tijd voor openen van dag
- tijd voor laden van `entries`
- tijd voor laden van `previousWorkdayEntries`
- tijd voor openen van formulier/sheet

Controleer:

- aantal rerenders bij datumwissel
- resubscribe gedrag van `liveQuery`
- effect van swipe op renderdruk

Tools:

- React DevTools Profiler
- Chrome Performance flame chart

## 3. Week-scherm

Meet:

- tijd voor laden van 14 dagen overzicht
- tijd voor berekenen van klantsamenvatting
- impact van complete-periode banner

Controleer:

- rerenders van dagkaarten
- CPU-piek bij complete 2-wekenperiode
- geheugengebruik na meerdere periodewissels

## 4. Invoerformulier

Meet:

- tijd voor openen van sheet
- tijd voor historiekquery van tijdchips
- tijd voor opslaan van nieuwe entry

Controleer:

- hoeveel records de tijdhistoriekquery leest
- of suggesties merkbaar vertragen bij grote datasets
- of klantautocomplete responsief blijft

## 5. PDF-export

Meet:

- tijd voor lazy load van `pdfExport`
- tijd voor genereren van PDF
- geheugengebruik tijdens export

Controleer:

- JS heap pieken
- garbage collection na export
- herhaald exporteren zonder tab refresh

## 6. Notificatie- en migratieflow

Meet:

- impact van `runNotificationChecks()` bij app start
- impact van `migrateLegacyTimesheetData()` bij eerste start na rename

Controleer:

- geen dubbele migratie
- geen onnodige IndexedDB reads na eerste run

## Concrete tooling

### Chrome DevTools Performance

Gebruik voor:

- startup traces
- lange tasks
- layout/paint pieken
- main-thread blocking tijdens PDF export

### React DevTools Profiler

Gebruik voor:

- `TodayPage`
- `WeekPage`
- `EntryForm`
- `ClientSelect`

Let op:

- onnodige rerenders
- props/state churn
- kost van list rendering

### Memory tab

Gebruik voor:

- heap snapshot voor en na 5 exports
- heap snapshot voor en na 20 dag/periodewissels
- detectie van retained `File`, `Blob`, arrays of subscriptions

## Aanbevolen scenario's

### Scenario A: Dagelijkse happy path

1. Open app
2. Open `Vandaag`
3. Tik `Zelfde als gisteren`
4. Sluit en heropen app

Verwacht:

- geen merkbare jank
- korte IndexedDB activiteit
- geen oplopend geheugen na herhaling

### Scenario B: Intensief plannen

1. Wissel 20 keer van dag via swipe
2. Open en sluit formulier meerdere keren
3. Bewerk meerdere entries

Verwacht:

- geen oplopende subscription count
- geen steeds tragere navigatie

### Scenario C: Zware weekflow

1. Open `Week`
2. Swipe 10 periodes vooruit/achteruit
3. Exporteer 3 keer PDF
4. Deel PDF

Verwacht:

- geen retained oude PDF-bestanden
- geen steeds tragere periodewissels

## Performance budget voorstel

Richtwaarden voor mobiele ervaring:

- startup render: < 2s op mid-range toestel
- dagwissel: < 150ms zichtbaar responsief
- openen formulier: < 100ms
- PDF export: < 3s voor normale dataset
- weekweergave: < 300ms voor normale dataset

## Mogelijke volgende optimalisaties als profiling problemen toont

1. klantsamenvatting cachen of incrementeel berekenen
2. historische tijdchips beperken tot recentere periode of aparte cachetabel
3. `WeekPage` opdelen in memoized subcomponenten
4. exportbanner pre-generation verder throttlen of pas op user intent starten
5. extra code splitting voor zwaardere hulplibraries indien nodig

## Rapportageformat

Per meetronde vastleggen:

- toestel / browser
- datasetgrootte
- flow
- gemeten tijd
- observatie
- vermoedelijke oorzaak
- voorgestelde fix
