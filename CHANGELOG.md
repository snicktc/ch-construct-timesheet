# Changelog

## Niet uitgebracht

### Toegevoegd

- verlofweken: markeer een kalenderweek (ma-zo) als verlof via een knop in het 2-wekenoverzicht
- verlofweken worden overgeslagen bij het navigeren (swipe en pijltjes springen naar de eerstvolgende werkweek)
- verlofweken tellen niet mee in subtotalen, samenvatting en de “werkweek compleet”-melding
- PDF-export laat verlofweken volledig weg; bij een half-verlof 2-wekenblok toont de PDF enkel de gewerkte week (titel, periode en bestandsnaam passen mee aan)

### Gewijzigd

- de 2-wekenperiode is nu vast verankerd: elke periode start op maandag van een oneven ISO-week (bv. week 15-16, 17-18) en verschuift niet meer mee met de dag waarop de app geopend wordt

### Opgelost

- verlofweken worden nu mee opgenomen in backup-export en -import en gewist bij “Wis alle data” (backupformaat versie 3; oudere backups blijven importeerbaar)
- de vooraf gegenereerde PDF wordt opnieuw aangemaakt wanneer registraties of verlofweken wijzigen, zodat “Deel PDF nu” nooit een verouderd bestand verstuurt
- profielwijzigingen (naam, bestemmeling, standaardwaarden) zijn meteen zichtbaar in het dag- en weekoverzicht en in de PDF, zonder herladen of profielwissel
- dagtotalen in de PDF worden op de juiste pagina getekend wanneer een weektabel over meerdere pagina's loopt
- de vrijdag-exportnotificatie werkt nu effectief: ze verschijnt op vrijdag vanaf 18:00 van de laatste gewerkte week van de periode wanneer alle werkdagen ingevuld zijn, met respect voor verlofweken

### Technisch

- nieuwe Dexie-tabel `leaveWeeks` (database versie 3) met samengestelde index `[employeeId+weekStart]`
- nieuwe hook `useLeaveWeeks` en helper `getWeekStartKey`
- uitgebreide unit-tests voor database, hook, weekhelpers, PDF-export en het weekoverzicht

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
