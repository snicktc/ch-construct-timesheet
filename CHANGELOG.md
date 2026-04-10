# Changelog

## 1.0.0

Eerste volledige oplevering van `timesheet`.

### Toegevoegd

- PWA basis met manifest, service worker en offline caching
- Dexie database-laag met tabellen voor profielen, klanten, locaties, registraties en exports
- welkomstscherm voor eerste profiel
- profielwisselaar met onthouden actief profiel
- dagregistratie met meerdere blokken per dag
- snelle tijdchips, pauzechips en “Meer opties” in het invoerformulier
- kopieerflow “Zelfde als gisteren?”
- 2-wekenoverzicht met subtotalen en samenvatting per klant
- PDF-export en Web Share flow
- klantenbeheer
- profielbeheer met actief/inactief en volgordebeheer
- logo upload en standaardlogo’s per exportbestemmeling
- notificatie-instellingen en lokale webnotificaties
- backup export, import en reset van alle data
- swipe navigatie voor dag- en periodenavigatie

### Technisch

- lazy loading voor PDF-export
- linting opgezet en lint-groen gemaakt
- build-groen gemaakt inclusief PWA-output
- functionele en technische documentatie toegevoegd
