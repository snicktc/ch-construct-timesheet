# Test Feedback Demo

## ✅ Setup Compleet!

Je hebt nu een complete automatische test feedback setup:

### 🎯 Wat werkt er nu?

1. **Pre-commit hook** - Bij elke commit:
   - ✅ Automatische ESLint checks
   - ✅ Vitest tests voor gewijzigde bestanden
   - ✅ Commit wordt geblokkeerd bij failures

2. **Test Commands**:
   ```bash
   npm test              # Watch mode - instant feedback
   npm run test:run      # Single run
   npm run test:coverage # Coverage report
   npm run test:ui       # Browser UI
   ```

3. **Coverage Reports**:
   - Terminal output bij elke test run
   - HTML report in `coverage/index.html`
   - JSON data in `coverage/coverage-final.json`

### 📊 Huidige Status

- ✅ 16 tests passing
- ✅ timeCalc.ts: 100% coverage
- 📈 Overall coverage: ~1% (normaal - we hebben pas 1 test file)

### 🔄 Volgende Stappen

1. Voeg meer tests toe volgens het testplan
2. Coverage zal automatisch toenemen
3. Pre-commit hook voorkomt regressions

### 💡 Hoe werkt de feedback?

**Scenario 1: Alle tests slagen**
```bash
$ git commit -m "Add feature"
🔍 Running pre-commit checks...
✔ ESLint passed
✔ Tests passed (16/16)
✅ Pre-commit checks passed!
[main abc123] Add feature
```

**Scenario 2: Test faalt**
```bash
$ git commit -m "Broken code"
🔍 Running pre-commit checks...
✔ ESLint passed
✖ Tests failed (1 failing)
❌ Pre-commit checks FAILED!
Commit aborted.
```

**Scenario 3: Lint error**
```bash
$ git commit -m "Bad formatting"
🔍 Running pre-commit checks...
✖ ESLint found 3 errors
❌ Pre-commit checks FAILED!
Commit aborted.
```

### 🚀 Pro Tips

- **Watch mode tijdens development**: `npm test`
- **Quick check**: `npm run test:run`
- **Full report**: `npm run test:coverage`
- **Debug in browser**: `npm run test:ui`

---

**Test setup succesvol geïnstalleerd op:** 2026-04-15
