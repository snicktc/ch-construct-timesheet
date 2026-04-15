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
```

## 📋 Test Feedback Mechanismen

### 1. Pre-commit Hook (Automatisch)

Bij elke `git commit` worden automatisch de volgende checks uitgevoerd:

1. **ESLint** - Code quality checks
2. **Vitest** - Alleen tests voor gewijzigde bestanden

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

Output:
```
File                  | % Stmts | % Branch | % Funcs | % Lines |
----------------------|---------|----------|---------|---------|
All files             |   87.5  |   85.2   |   90.1  |   87.5  |
 utils/timeCalc.ts    |  100.0  |  100.0   |  100.0  |  100.0  |
 utils/weekHelpers.ts |   85.3  |   82.1   |   87.5  |   85.3  |
```

HTML report: `coverage/index.html`

## 🔧 Configuration

### vitest.config.ts
- Test environment: happy-dom
- Coverage thresholds: 80%
- Parallel execution: 4 threads

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

Minimum coverage requirements:
- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

Critical paths require 100% coverage:
- Time calculations
- Database hooks
- "Same as Yesterday" feature

## 🚫 Bypassing Pre-commit Hook

**Niet aanbevolen**, maar mogelijk in noodgevallen:
```bash
git commit --no-verify -m "Emergency fix"
```

## 🔄 CI/CD Integration

Pre-commit hooks geven **lokale feedback**.

Voor volledige CI/CD setup (GitHub Actions), zie hoofddocumentatie.
