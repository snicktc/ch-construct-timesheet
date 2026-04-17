# Test Governance

## Doel

Dit document legt vast hoe `timesheet` automatisch gevalideerd en vrijgegeven wordt via GitHub.

## Automatische flow

1. Lokale `pre-commit` voert snelle checks uit op gewijzigde bestanden.
2. GitHub Actions workflow `CI` draait automatisch op `pull_request` naar `main` en op `push` naar `main`.
3. GitHub Actions workflow `Deploy to GitHub Pages` draait alleen na een succesvolle `CI`-run op `main`.
4. `main` blijft beschermd met verplichte status checks.

## Verplichte GitHub checks

De branch protection voor `main` vereist deze checks:

- `lint`
- `test-vitest`
- `build`
- `test-e2e`

## Branch protection beleid

Instellingen voor `main`:

- pull request vereist voor merge
- verplichte status checks moeten slagen voor merge
- stale approvals worden verworpen na nieuwe commits
- branch protection geldt niet voor admins tenzij later expliciet ingeschakeld

## Feedbackkanalen

Bij elke automatische validatie is feedback zichtbaar via:

- commit status checks
- pull request checks
- GitHub Actions job logs
- `coverage-report` artifact
- `playwright-report` artifact
- `playwright-test-results` artifact bij falende E2E runs

## Actuele dekking

Laatste gemeten baseline via `npm run test:coverage`:

- statements: `73.53%`
- branches: `66.39%`
- functions: `66.39%`
- lines: `74.13%`

Daarom staan de globale Vitest thresholds momenteel op `65%` als afdwingbare tussenstap.

## Huidige E2E smoke scope

De Playwright suite bewaakt deze kritieke flows:

- first run onboarding
- vandaag-entry toevoegen
- week naar dag navigatie
- repeat previous day
- export availability bij volledige periode
- backup export en import

## Onderhoudsregels

1. Voeg geen nieuwe deploy-workflows toe die `CI` omzeilen.
2. Gebruik Playwright alleen voor kritieke smoke flows.
3. Houd vereiste status checks gelijk met de jobs in `.github/workflows/ci.yml`.
4. Verhoog coverage thresholds pas nadat de nieuwe baseline stabiel groen is in CI.
5. Werk dit document bij wanneer de workflow-namen, mergevoorwaarden of E2E smoke scope wijzigen.
