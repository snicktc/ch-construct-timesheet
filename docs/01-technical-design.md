---
title: "Technical Design"
subtitle: "timesheet"
document_type: "Technical Design"
company: "CH Construct"
author: "CH Construct"
version: "1.0.0"
date: "2026-04-13"
lang: en-GB
toc: true
toc-depth: 3
numbersections: false
titlepage: true
logo: "_shared/logo_CH-Construct.png"
header-left: "CH Construct"
header-center: "timesheet"
header-right: "Technical Design"
footer-left: "Version 1.0.0"
footer-right: "Page \\thepage"
---

## Document Control {.unnumbered}

| Field | Value |
|---|---|
| Document type | Technical Design |
| Product | timesheet |
| Version | 1.0.0 |
| Status | Approved baseline |
| Date | 2026-04-13 |
| Owner | CH Construct |
| Intended audience | Development team, technical lead, deployment owner |
| Source documents | `SPEC.md`, codebase, README, CHANGELOG |

## Revision Control {.unnumbered}

| Field | Value |
|---|---|
| Version | 1.0.0 |
| Date | 2026-04-13 |
| Author | OpenCode |
| Approved by | Chris Van der Snickt |
| Status | Approved baseline |
| Change summary | Consolidated technical design for the current `timesheet` implementation and publishing workflow |

## Revision History {.unnumbered}

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-04-13 | Initial consolidated technical design | OpenCode |

## Colophon / Contact {.unnumbered}

| Field | Value |
|---|---|
| Contact person | Chris Van der Snickt |
| Company | PM Nation CommV |
| VAT number | BE0707.878.977 |
| Address | Burgstraat 8, 9960 Assenede |
| Email | chris@vandersnickt.be |

## Purpose and Scope

This document describes the technical structure of the `timesheet` application. It explains the chosen architecture, the implementation approach, the libraries and tools in use, and the operational characteristics of the app as deployed today.

The document is intended to support:

- development continuity
- technical onboarding
- build and deployment maintenance
- architectural review
- troubleshooting and future extension work

## Product Summary

`timesheet` is a frontend-only Progressive Web App for time registration. The application is optimized for mobile usage and stores all business data locally in the browser by using IndexedDB through Dexie.

The product currently supports:

- multiple employee profiles
- shared client and location management
- multiple time blocks per day
- two-week overview and export flow
- PDF generation and native share support where available
- local reminders and local-first notifications
- backup, import and full local reset
- offline usage through service worker caching

## Technology Stack and Version Matrix

### Runtime dependencies

| Package | Version | Purpose |
|---|---|---|
| `react` | `^19.2.4` | UI framework |
| `react-dom` | `^19.2.4` | DOM renderer |
| `dexie` | `^4.4.2` | IndexedDB abstraction |
| `jspdf` | `^4.2.1` | PDF generation |
| `jspdf-autotable` | `^5.0.7` | PDF tables |

### Development dependencies

| Package | Version | Purpose |
|---|---|---|
| `vite` | `^7.1.12` | Build tool and dev server |
| `@vitejs/plugin-react` | `^5.1.0` | React integration for Vite |
| `typescript` | `~6.0.2` | Type system and compiler |
| `vite-plugin-pwa` | `^1.2.0` | PWA manifest and service worker integration |
| `eslint` | `^9.39.4` | Static code quality checks |
| `@eslint/js` | `^9.39.4` | ESLint base config |
| `typescript-eslint` | `^8.58.0` | TypeScript lint support |
| `eslint-plugin-react-hooks` | `^7.0.1` | React hooks linting |
| `eslint-plugin-react-refresh` | `^0.5.2` | React refresh linting |
| `globals` | `^17.4.0` | Global variable configuration |
| `@types/node` | `^24.12.2` | Node typings |
| `@types/react` | `^19.2.14` | React typings |
| `@types/react-dom` | `^19.2.3` | React DOM typings |

## Key Technical Decisions

### Local-first architecture

The application does not depend on a backend. All operational data is stored locally on the user's device. This minimizes infrastructure complexity and supports offline-first behaviour.

Reasons for this choice:

- works without server provisioning
- suitable for single-device field usage
- predictable privacy model
- fast local interactions

Trade-off:

- no native cross-device synchronization

### IndexedDB through Dexie

Dexie is used as the persistence layer because it provides a significantly more maintainable API than raw IndexedDB while still preserving full client-side storage capabilities.

Reasons for this choice:

- typed table definitions
- structured schema evolution
- live query support
- better readability for transaction logic

### PWA delivery model

The application is distributed as a Progressive Web App. This allows installation on Android devices through Chrome while keeping the deployment model static and simple.

Reasons for this choice:

- installable experience without native packaging
- offline capability through service worker caching
- simple GitHub Pages deployment path

### Lazy-loaded PDF generation

PDF generation libraries are loaded only when export or share is requested.

Reasons for this choice:

- smaller main application bundle
- faster initial page load
- lower mobile startup cost

## System Architecture

### High-level architecture

The system has four main layers:

1. UI pages and reusable UI components
2. feature hooks and page orchestration logic
3. utility modules for domain logic, export, migration and notifications
4. local persistence through Dexie and IndexedDB

### Source structure

```text
src/
  components/   reusable UI components
  db/           Dexie schema and typed models
  hooks/        feature hooks and UI behaviour hooks
  pages/        screen-level components
  utils/        domain helpers, export, migration, notifications, transfer
  sw.ts         custom service worker entry
```

### Screen modules

| File | Responsibility |
|---|---|
| `App.tsx` | app shell, tab routing, startup states |
| `TodayPage.tsx` | daily registration flow |
| `WeekPage.tsx` | two-week overview and export |
| `ClientsPage.tsx` | shared client management |
| `SettingsPage.tsx` | profiles, notifications, data actions |

## Data Storage Design

### Database name

The active IndexedDB database name is:

```text
timesheet
```

### Tables

| Table | Purpose |
|---|---|
| `employees` | employee profiles |
| `clients` | shared client records |
| `locations` | shared location values |
| `timeEntries` | daily time blocks |
| `weekExports` | export history |

### Important indexes

| Table | Index |
|---|---|
| `timeEntries` | `[employeeId+date]` |
| `weekExports` | `[employeeId+weekStart+weekEnd]` |

### Data models

#### Employee

Contains:

- identity and export target
- export logo as base64 image data
- default break and start time
- active state
- ordering metadata

#### Client

Contains:

- client name
- default location
- last used timestamp

#### Location

Contains:

- reusable location text values

#### TimeEntry

Contains:

- employee and date binding
- client id and denormalized client name
- location
- start and end time
- break duration
- travel credit duration
- driver status
- notes

#### WeekExport

Contains:

- employee binding
- exported date range
- export timestamp
- export format

## State Management and Hooks

### `useProfiles`

Responsibilities:

- live profile list
- profile CRUD operations
- active/inactive toggling
- deletion guard for profiles with registrations

### `useActiveProfile`

Responsibilities:

- active profile resolution
- localStorage persistence of the selected profile
- fallback to first active profile
- recovery handling when stored active profile state is no longer valid

### `useClients`

Responsibilities:

- live client list
- client CRUD
- sorting by last usage
- location synchronization

### `useTimeEntry`

Responsibilities:

- day entries loading
- previous workday lookup
- create, update and delete entry operations
- repeat previous workday logic

### `useHorizontalSwipe`

Responsibilities:

- lightweight pointer-based horizontal swipe detection
- used on day and fortnight screens

## Feature Modules

### Daily registration

The daily screen supports:

- date navigation
- quick entry creation
- editing and deleting time blocks
- overlap confirmation
- carry-over from previous workday
- opening a specific day from the fortnight view and preserving that selected date

### Client management

The client screen supports:

- viewing all clients
- sheet-based add/edit flow
- confirmation before destructive delete
- client lookup and selection from a searchable input in the entry flow

### Profile management

The settings screen supports:

- profile CRUD
- ordering
- active/inactive toggle
- export logo upload and default logo selection
- visual active-profile indication through the profile switcher

### Confirmation and sheet flow

The application uses internal confirmation dialogs instead of browser-native confirm popups.

This applies to:

- client deletion
- profile deletion
- time block deletion
- overlapping time warning
- data import confirmation
- clear-all-data confirmation

### Export flow

The week screen supports:

- PDF creation
- Web Share API sharing where available
- export history persistence

## PWA Architecture

### Build integration

PWA support is configured in `vite.config.ts` through `vite-plugin-pwa`.

### Service worker strategy

The application uses `injectManifest` and a custom service worker entry in `src/sw.ts`.

Features:

- precaching of generated build assets
- cache-first runtime strategy for same-origin static assets
- notification click handling

### Installability

The application is configured for install on Android and supports GitHub Pages deployment under:

```text
/ch-construct-timesheet/
```

## Notifications Architecture

Notification support is local only.

Responsibilities of `notifications.ts`:

- store reminder preferences in localStorage
- request browser permission
- trigger test notifications
- run startup checks for daily reminder and Friday export prompt

Constraint:

- this remains browser-limited and cannot guarantee native background scheduling semantics

## PDF Export Architecture

`pdfExport.ts` generates the two-week export file.

Features:

- logo rendering
- period header
- weekly tables
- client summary table
- total lines
- file and blob output

Performance strategy:

- module loaded lazily from `WeekPage`

## Backup, Import and Migration

### Backup and restore

Handled through `dataTransfer.ts`.

Capabilities:

- export all business data to JSON
- restore all business data from JSON
- clear all local data
- include relevant application localStorage state in backup payloads

### Rename migration

Handled through `migration.ts`.

Capabilities:

- migrate local data from legacy `ch-timesheet` to `timesheet`
- copy legacy localStorage keys where required
- delete old storage after successful migration
- keep legacy storage intact if migration cannot safely complete

## Build, Quality and Deployment

### Scripts

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

### Quality gates

- ESLint must pass
- TypeScript build must pass
- production Vite build must pass
- documentation updates should be reviewed when functionality or architecture changes

### Deployment model

The application is deployed as a static site.

Supported hosting examples:

- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting
- Azure Static Web Apps
- static nginx/Apache

### GitHub Pages support

The repository includes a GitHub Actions workflow for Pages deployment.

Important deployment conditions:

- static hosting of `dist/`
- HTTPS
- correct base path handling
- service worker update behaviour awareness during release validation

### Developer Operations Reference

#### Local development URL

The default local Vite development URL is typically:

```text
http://localhost:5173
```

#### Core scripts

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

#### Production build outputs

Expected primary outputs include:

- `dist/index.html`
- `dist/assets/*`
- `dist/manifest.webmanifest`
- `dist/sw.js`

#### Service worker cache updates

- `vite-plugin-pwa` is configured for automatic update behaviour
- newly deployed service workers are installed on the next update cycle
- users may need to fully close and reopen the installed app when validating a fresh deployment

#### Local storage keys

Primary keys currently in use:

- `timesheet.activeEmployeeId`
- `timesheet.notificationSettings`
- `timesheet.lastDailyNotificationDate`
- `timesheet.lastExportPromptPeriod`

#### Operational backup guidance

Because all business data remains local to the device, backup export should be part of normal operational support before:

- browser reset
- device replacement
- manual troubleshooting steps that may clear storage

## Performance and Profiling

Primary profiling areas:

- startup and migration
- day screen live query behaviour
- two-week overview and summary computations
- PDF export memory and CPU cost
- repeated navigation and edit flows

Recommended tooling:

- Chrome DevTools Performance
- Chrome Memory tooling
- React DevTools Profiler
- Lighthouse PWA checks

Recommended datasets:

- empty dataset
- normal dataset
- heavy dataset with large `timeEntries` volume

## Constraints and Known Limitations

- no backend synchronization
- browser-specific notification limitations
- local-only business data
- custom CSS instead of a formal design framework
- Word export can be generated from Markdown through Pandoc, but full branded Word headers and footers benefit from a dedicated `reference.docx`

## Appendices

### Appendix A. External dependencies

All dependency versions are sourced from `package.json` version `1.0.0` of the current repository state.

### Appendix B. Source references

- `package.json`
- `src/db/database.ts`
- `src/hooks/*`
- `src/pages/*`
- `src/utils/*`
- `vite.config.ts`
- `src/sw.ts`
- `README.md`
- `SPEC.md`

### Appendix B.1 Documentation maintenance rules

Use the following rule set to keep the new documentation maintainable:

- technical architecture, dependencies, build or deployment changes: update `01-technical-design.md`
- business rules, behaviour changes, validation rules or screen logic changes: update `02-functionele-analyse.md`
- user-facing flows, installation steps, support procedures or maintenance instructions: update `03-gebruikershandleiding.md`
- release-level changes and milestone notes: update `CHANGELOG.md`

For every change request, perform this documentation check:

1. Did the code change system architecture or dependencies?
2. Did the code change business behaviour or validation rules?
3. Did the change affect what an end user sees or does?
4. Do version number or publication date need updating?
5. Should archived documents remain untouched because they are historical only?

### Appendix C. Runtime Profiling Guide

#### Focus areas

Profile these flows first:

1. application startup
2. opening `Today`
3. opening `Week`
4. creating and editing entries
5. PDF export and share
6. first-run migration from legacy data

#### Recommended datasets

##### Empty dataset

- no profiles
- no clients
- no registrations

##### Normal dataset

- 2 to 4 profiles
- 20 to 50 clients
- 2 weeks of registrations

##### Heavy dataset

- 6 to 10 profiles
- 100+ clients
- 1000+ `timeEntries`
- multiple `weekExports`

#### Metrics to capture

##### Startup

- time to first render
- time to interactive UI
- migration completion time

Check:

- main-thread blocking
- unnecessary localStorage and IndexedDB spikes
- service worker registration impact

##### Today screen

- time to open day
- time to load `entries`
- time to load `previousWorkdayEntries`
- time to open form or sheet

Check:

- rerender count during day changes
- `liveQuery` resubscribe behaviour
- swipe interaction cost

##### Week screen

- time to load 14-day overview
- time to calculate client summary
- impact of complete-period export prompt

Check:

- rerenders of day cards
- CPU spikes when the complete-period banner appears
- memory usage after repeated period changes

##### Entry form

- sheet open time
- time-chip history query cost
- save latency for new entries

Check:

- number of records read for chip suggestions
- responsiveness under large datasets
- client autocomplete responsiveness

##### PDF export

- lazy-load time for `pdfExport`
- generation time
- heap usage during export

Check:

- JavaScript heap peaks
- garbage collection after export
- repeated export without tab refresh

##### Notification and migration flow

- startup impact of `runNotificationChecks()`
- first-run impact of `migrateLegacyTimesheetData()`

Check:

- no duplicate migration
- no repeated unnecessary legacy IndexedDB reads

#### Recommended tools

- Chrome DevTools Performance
- Lighthouse Performance and PWA categories
- React DevTools Profiler
- browser Memory tooling

#### Suggested scenarios

##### Scenario A. Daily happy path

1. open app
2. open `Today`
3. use `Same as yesterday`
4. close and reopen app

Expected:

- no visible jank
- short IndexedDB activity bursts
- no steadily growing memory use

##### Scenario B. Intensive planning

1. switch day 20 times via swipe
2. open and close forms repeatedly
3. edit multiple entries

Expected:

- no rising subscription count
- no progressively slower navigation

##### Scenario C. Heavy week flow

1. open `Week`
2. swipe 10 periods forward and backward
3. export 3 PDFs
4. share a PDF

Expected:

- no retained obsolete PDF files
- no steadily degrading period navigation

#### Performance budget targets

- startup render: under 2 seconds on a mid-range device
- day switch: under 150 ms perceived response
- form opening: under 100 ms
- PDF export: under 3 seconds for a normal dataset
- week overview load: under 300 ms for a normal dataset

#### Reporting format

For every profiling run, record:

- device and browser
- dataset size
- flow under test
- measured duration
- observed issue
- suspected cause
- proposed fix
