# Technische Documentatie

## Overzicht

`timesheet` is een frontend-only PWA gebouwd met React, TypeScript en Vite. Alle businessdata wordt lokaal opgeslagen in IndexedDB via Dexie. Er is geen backend.

## Technologie

- React 19
- TypeScript
- Vite 7
- Dexie 4
- jsPDF + jsPDF-AutoTable
- vite-plugin-pwa
- ESLint 9

## Starten

```bash
npm install
npm run dev
```

Belangrijke scripts:

```bash
npm run lint
npm run build
npm run preview
```

## Installatie

### Vereisten

- Node.js 20+
- npm 10+

### Lokale installatie

```bash
npm install
```

### Ontwikkelserver

```bash
npm run dev
```

Standaard draait Vite lokaal op een development URL zoals:

```text
http://localhost:5173
```

## Architectuur

## Mappen

```text
src/
  components/   herbruikbare UI-blokken
  db/           Dexie database en types
  hooks/        app-specifieke React hooks
  pages/        schermen
  utils/        business helpers, export, notificaties, data transfer
  sw.ts         custom service worker
```

## Schermarchitectuur

- `App.tsx`
  - bepaalt actieve tab
  - verwerkt welkomstscherm
  - verwerkt notificatie-open state via query params
- `TodayPage.tsx`
  - dagregistratie en repeat-flow
- `WeekPage.tsx`
  - 2-wekenoverzicht en export
- `ClientsPage.tsx`
  - klantenbeheer
- `SettingsPage.tsx`
  - profielbeheer, notificaties, data-acties

## Data-opslag

## IndexedDB

De database staat in `src/db/database.ts`.

Database naam:

```text
timesheet
```

Tabellen:

- `employees`
- `clients`
- `locations`
- `timeEntries`
- `weekExports`

Belangrijke indices:

- `timeEntries: [employeeId+date]`
- `weekExports: [employeeId+weekStart+weekEnd]`

## Datamodel

### Employee

- profielgegevens
- standaardwaarden voor pauze/starttijd
- logo als base64 string
- `sortOrder` voor profielvolgorde

### Client

- klantnaam
- standaard locatie
- `lastUsedAt`

### Location

- losse locatielijst voor hergebruik

### TimeEntry

- werknemerprofiel + datum
- klantreferentie en gedenormaliseerde klantnaam
- locatie, tijden, pauze, rit-credit
- chauffeurstatus en notities

### WeekExport

- historiek van uitgevoerde exports

## Hooks

### `useProfiles`

- live lijst van profielen
- create/update/delete
- active/inactive toggling
- bewaakt verwijderregel voor profielen met registraties

### `useActiveProfile`

- beheert actief profiel in memory
- onthoudt laatste keuze in `localStorage`
- valt terug op eerste actieve profiel

### `useClients`

- live lijst van klanten
- sorteert op `lastUsedAt`
- synchroniseert locaties

### `useTimeEntry`

- laadt dagregistraties per profiel en datum
- haalt vorige werkdag op
- create/update/delete
- ondersteunt repeat van vorige werkdag

### `useHorizontalSwipe`

- eenvoudige pointer-gebaseerde swipe helper
- gebruikt in `Vandaag` en `Week`

## Business utilities

### `timeCalc.ts`

- tijd parsing
- minuten naar `HH:mm`
- blok- en dagtotalen

### `weekHelpers.ts`

- datumkeys
- weekstart
- 5-daagse en 14-daagse periodes
- ISO weeknummer

### `pdfExport.ts`

- genereert 2-weken PDF
- voegt logo, kop, tabellen en samenvatting toe
- output als `Blob` en `File`

### `notifications.ts`

- notificatie-instellingen in `localStorage`
- permissievraag
- testnotificatie
- checks voor dagelijkse reminder en vrijdag export-prompt

### `dataTransfer.ts`

- export van volledige appdata naar JSON
- import/herstel met volledige replace
- reset van alle data

### `logoUtils.ts`

- resize van uploadlogo’s
- standaardlogo’s voor bekende exportbestemmelingen

## PWA

PWA-configuratie staat in `vite.config.ts` en `src/sw.ts`.

### Kenmerken

- manifest via `vite-plugin-pwa`
- custom service worker via `injectManifest`
- precaching van build-assets
- `CacheFirst` runtime caching voor lokale styles, scripts, images en fonts
- notificatieklik opent of focust de app

Belangrijke bestanden:

- `vite.config.ts`
- `src/sw.ts`
- `src/main.tsx`
- `src/vite-env.d.ts`
- `public/icon-192.png`
- `public/icon-512.png`

## Export en code splitting

PDF-export is lazy loaded vanuit `WeekPage`:

- `pdfExport.ts` wordt pas gedownload bij export of delen
- dit verlaagt de initiële bundle impact van jsPDF-gerelateerde dependencies

## localStorage keys

Gedefinieerd in `src/utils/storageKeys.ts`:

- `timesheet.activeEmployeeId`
- `timesheet.notificationSettings`
- `timesheet.lastDailyNotificationDate`
- `timesheet.lastExportPromptPeriod`

## Linting

Lintconfig staat in `eslint.config.js`.

Gebruik:

```bash
npm run lint
```

De codebase is lint-groen en build-groen.

## Build

Productiebouw:

```bash
npm run build
```

Output:

- `dist/index.html`
- `dist/assets/*`
- `dist/manifest.webmanifest`
- `dist/sw.js`

## Deploy

De app is een statische frontend en kan gedeployed worden op elke host die statische bestanden kan serveren.

### Standaard productieflow

```bash
npm install
npm run lint
npm run build
```

Deploy daarna de volledige inhoud van `dist/`.

### Geschikte hostingopties

- Netlify
- Vercel
- GitHub Pages
- Azure Static Web Apps
- Firebase Hosting
- een eigen nginx of Apache server

### Belangrijke deployvoorwaarden

- serveer `dist/` als root van de site
- gebruik HTTPS in productie
- laat `sw.js` en `manifest.webmanifest` ongecachet of kort gecachet uitleveren wanneer mogelijk
- zorg dat PNG/JPG/SVG assets correct als statische bestanden bereikbaar zijn

### Voorbeeld met eenvoudige statische server

Na build kan lokaal getest worden met:

```bash
npm run preview
```

Of met een generieke statische server op `dist/`.

### PWA productie-opmerking

- de service worker werkt correct in productie-builds
- in development staat PWA runtime standaard uit
- na deploy kan een vorige service worker nog actief zijn; bij testen is een harde refresh soms nodig

### Cache updates

- `vite-plugin-pwa` staat op `autoUpdate`
- bij nieuwe deploys wordt een nieuwe service worker geïnstalleerd
- gebruikers krijgen de update zodra de nieuwe versie actief wordt

### Backup-advies

Omdat alle data lokaal op het toestel staat, is het aanbevolen om voor toestelwissels of browser-reset eerst via de app een backup te exporteren.

## Belangrijke ontwerpkeuzes

- local-first opslag zonder backend
- minimale, directe businesslogica in hooks en utils
- sheets in plaats van zware routing/modalsystemen
- lazy loading van PDF-functionaliteit
- notificatie-open gedrag via query-based app-state in plaats van volledige router

## Legacy migratie

Bij het opstarten probeert de app automatisch data te migreren van de vroegere projectnaam `ch-timesheet` naar `timesheet`.

- oude IndexedDB `ch-timesheet` wordt gelezen en overgezet naar `timesheet` als de nieuwe DB nog leeg is
- oude `localStorage` keys worden overgenomen naar `timesheet.*`
- na succesvolle migratie worden de oude keys verwijderd
- daarna wordt de oude IndexedDB `ch-timesheet` ook verwijderd
- de migratie draait slechts eenmalig via een migratievlag in `localStorage`

## Bekende beperkingen

- geen backend sync tussen toestellen
- webnotificaties blijven beperkt door browsermogelijkheden
- styling is custom CSS, niet Tailwind
- swipe is bewust lichtgewicht en pointer-gebaseerd

## Aanbevolen volgende uitbreidingen

1. Echte routering voor deep links en notificatieflows
2. Type-aware ESLint config met project-aware rules
3. Meer geavanceerde accessibility op autocomplete en sheets
4. Eventuele sync/export naar externe systemen
