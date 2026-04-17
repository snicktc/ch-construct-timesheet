# Test Setup & Guide

## 🚀 Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode (tijdens development)
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests once (voor CI/CD)
npm run test:run

# Run tests with coverage
npm run test:coverage

# Install Playwright browser for local E2E runs
npm run playwright:install

# Run Playwright smoke tests
npm run test:e2e
```

## 🧱 Test Layers

De testsuite is opgesplitst in onderhoudbare lagen:

1. **Unit** - Pure utilities en kleine helpers
2. **Integration** - Dexie, hooks en data transfer logica
3. **Component** - React component gedrag via React Testing Library
4. **E2E** - Kritieke gebruikersflows via Playwright

**Onderhoudsregel:** houd detailvalidaties in Vitest en reserveer Playwright voor kritieke end-to-end smoke flows.

## 📋 Test Feedback Mechanismen

### 1. Pre-commit Hook (Automatisch)

Bij elke `git commit` worden automatisch de volgende checks uitgevoerd:

1. **ESLint** - Code quality checks
2. **Vitest** - Alleen tests voor gewijzigde bestanden

Dit blijft de snelle lokale gate. De volledige suite draait automatisch op GitHub bij `pull_request` naar `main` en bij `push` naar `main`.

**Voorbeeld output:**
```bash
$ git commit -m "Add new feature"

🔍 Running pre-commit checks...

✔ Preparing lint-staged...
✔ Running tasks for staged files...
✔ Applying modifications from tasks...
✔ Cleaning up temporary files...

✅ Pre-commit checks passed!

[main abc123] Add new feature
```

**Als tests falen:**
```bash
$ git commit -m "Broken feature"

🔍 Running pre-commit checks...

✖ vitest related --run
  FAIL  src/utils/timeCalc.test.ts
    ✓ parseTimeToMinutes (2ms)
    ✗ calculateEntryMinutes - expected 495, got 500

❌ Pre-commit checks FAILED!
Commit aborted. Fix the issues and try again.
```

### 2. Real-time Feedback (Watch Mode)

Voor directe feedback tijdens development:

```bash
npm run test:watch
```

Dit geeft je instant feedback bij elke file save:
- ✅ Groene checkmarks voor passing tests
- ❌ Rode errors voor failing tests
- 📊 Coverage percentage
- ⚡ Snelle re-runs (alleen gewijzigde files)

### 3. Coverage Reports

```bash
npm run test:coverage
```

Actuele baseline na fase 5:
```
All files             |   58.07 |   58.84  |   56.49 |   58.10 |
```

HTML report: `coverage/index.html`

### 4. GitHub CI Feedback

GitHub Actions draait automatisch deze jobs:

1. `lint`
2. `test-vitest`
3. `build`
4. `test-e2e`

Feedbackkanalen:
- commit en pull request status checks
- job logs in GitHub Actions
- `coverage/` artifact van Vitest
- `playwright-report/` artifact voor E2E
- `test-results/` artifact bij Playwright failures

## 🔧 Configuration

### vitest.config.ts
- Test environment: happy-dom
- Coverage thresholds: `55%` globaal als tussenstap vanaf de huidige baseline
- Parallel execution: 4 threads

### playwright.config.ts
- Browser: Chromium
- Start de app automatisch via `npm run build && npm run preview`
- Screenshots, video en traces blijven enkel behouden bij failures
- HTML report wordt gegenereerd in `playwright-report/`
- E2E smoke scope: first run, vandaag-entry, week-naar-dag, repeat previous day, export availability, backup/import

### lint-staged
Runs op gewijzigde files:
- ESLint auto-fix
- Vitest related tests

## 📁 Test Structure

```
tests/
├── setup.ts              # Global test setup
├── __fixtures__/         # Mock data
│   ├── employees.ts
│   ├── clients.ts
│   └── timeEntries.ts
└── helpers/              # Test utilities
    ├── dbSetup.ts
    └── dateHelpers.ts

src/
└── **/*.test.ts          # Co-located tests

e2e/
├── *.spec.ts             # Playwright smoke flows
└── helpers/              # Seed helpers voor browser-state
```

## ✅ Test Best Practices

1. **Descriptive names**: `it('should calculate correct total for multiple entries')`
2. **Arrange-Act-Assert**: Clear test structure
3. **Isolated tests**: No dependencies between tests
4. **Fast tests**: Unit tests < 100ms
5. **Mock external dependencies**: IndexedDB, Date, fetch

## 🐛 Debugging Tests

### VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test"],
  "console": "integratedTerminal"
}
```

### Browser-based debugging
```bash
npm run test:ui
```
Open http://localhost:51204/__vitest__/

## 📊 Coverage Thresholds

Huidige verplichte minimumthresholds:
- Statements: 55%
- Branches: 55%
- Functions: 55%
- Lines: 55%

Geplande volgende verhoging:
- focus op `ClientsPage`, `pdfExport.ts`, `logoUtils.ts`, `useHorizontalSwipe.ts`, `sw.ts`
- daarna thresholds verhogen richting `65-70%`

Kritieke paden die prioritair hoog moeten blijven:
- time calculations
- database hooks
- notifications
- migration
- `Same as Yesterday`
- first-run, backup/import en export availability smoke flows

## 🚫 Bypassing Pre-commit Hook

**Niet aanbevolen**, maar mogelijk in noodgevallen:
```bash
git commit --no-verify -m "Emergency fix"
```

## 🔄 CI/CD Integration

Pre-commit hooks geven **lokale feedback**.

GitHub Actions geeft de volledige automatische validatie:

1. Open een pull request naar `main` of push naar `main`
2. GitHub start automatisch lint, Vitest, build en Playwright
3. Gebruik de jobstatussen als merge gate
4. Open artifacts bij failures om screenshots, traces en reports te bekijken
