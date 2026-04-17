# Test Matrix

## Doel

Deze matrix koppelt productgedrag aan de testlaag die het bewaakt. Gebruik dit document om nieuwe regressies op de juiste laag toe te voegen in plaats van dezelfde flow op meerdere lagen te dupliceren.

## Matrix

| Feature | Belangrijk gedrag | Unit | Integration | Component/Page | E2E |
| --- | --- | --- | --- | --- | --- |
| First run | Eerste profiel aanmaken en app openen |  |  | `App.test.tsx` | `e2e/first-run.spec.ts` |
| Active profile restore | Stored profiel herstellen of herstelpad tonen |  | `useActiveProfile.test.ts` | `App.test.tsx` |  |
| Client selection | Zoeken, selecteren, inline nieuwe klant |  |  | `ClientSelect.test.tsx`, `EntryForm.test.tsx` |  |
| Day entry save | Registratie opslaan op Today | `timeCalc.test.ts` | `useTimeEntry.test.ts` | `EntryForm.test.tsx`, `TodayPage.test.tsx` | `e2e/today-entry.spec.ts` |
| Overlap handling | Bevestiging tonen bij overlappende uren |  |  | `EntryForm.test.tsx` |  |
| Repeat previous day | Vorige werkdag kopieren naar lege dag |  | `useTimeEntry.test.ts` | `TodayPage.test.tsx` | `e2e/repeat-previous-day.spec.ts` |
| Week overview | Dagkaart openen en totalen tonen | `weekHelpers.test.ts` |  | `WeekPage.test.tsx` | `e2e/week-to-day.spec.ts` |
| Export availability | Banner tonen bij complete twee weken |  |  | `WeekPage.test.tsx` | `e2e/export-availability.spec.ts` |
| Notifications | Dagelijkse reminder en vrijdagprompt | `notifications.test.ts` |  | `SettingsPage.test.tsx` |  |
| Backup export/import | Backup downloaden en restore bevestigen |  | `dataTransfer.test.ts` | `SettingsPage.test.tsx` | `e2e/backup-import.spec.ts` |
| Legacy migration | Legacy DB en storage migreren |  | `migration.test.ts` |  |  |
| Profile management | Profiel aanmaken, activeren, volgorde wijzigen |  | `useProfiles.test.ts` | `SettingsPage.test.tsx` |  |
| PDF generation | PDF inhoud, bestandsnaam, share fallback |  |  | `WeekPage.test.tsx` gedeeltelijk | Nog uit te breiden |
| Clients page | Volledige klantenbeheerpagina |  | `useClients.test.ts` | Nog uit te breiden |  |

## Volgende gaten

Deze matrix toont nu de belangrijkste resterende uitbreidingen:

1. `ErrorBoundary.tsx` heeft nog geen directe tests.
2. `SettingsPage.tsx` heeft nog lage branchdekking op minder gebruikte paden.
3. `pdfExport.ts` heeft nog vooral happy-path dekking en kan extra branchtests gebruiken.

## Onderhoudsregels

1. Voeg eerst een test toe op de laag waar de regressie het goedkoopst en stabielst te bewaken is.
2. Voeg alleen een extra E2E-test toe wanneer het om een echte kernflow over meerdere schermen gaat.
3. Werk deze matrix bij wanneer een feature verhuist van "nog uit te breiden" naar echte dekking.
