# CH CONSTRUCT TIMESHEET - COMMERCIËLE OFFERTE DOCUMENTEN

## 📦 Gegenereerde Bestanden

### 1. **COMMERCIELE-OFFERTE.md**
Uitgebreid Markdown document met alle offerte informatie:
- Executive summary
- Kostensamenvatting
- Pricing modellen vergelijking
- ROI analyse
- Concurrentie analyse
- Roadmap & timeline
- Onderhoud & support
- Licentie modellen

**Gebruik:**
- Lezen in elke Markdown editor
- Exporteren naar PDF met Pandoc
- Exporteren naar Word met Pandoc
- Printen of digitaal versturen

**Exporteren naar PDF:**
```bash
pandoc COMMERCIELE-OFFERTE.md -o COMMERCIELE-OFFERTE.pdf --pdf-engine=xelatex
```

**Exporteren naar Word:**
```bash
pandoc COMMERCIELE-OFFERTE.md -o COMMERCIELE-OFFERTE.docx
```

---

### 2. **CH-Construct-Timesheet-Commerciele-Offerte.xlsx**
Professioneel Excel pricing sheet met 8 interactieve worksheets:

#### 📊 Sheet Overzicht:

**1. Executive Summary**
- One-pager overzicht
- Key value propositions
- Kostensamenvatting (basis + uitbreidingen)
- Aanbevolen pakket met ROI

**2. Ontwikkelkosten**
- Gedetailleerde kostenopbouw per module
- FASE 1: Core App (voltooid) - €8,415
- FASE 2-4: Optionele uitbreidingen - €47,250
- Complexiteit indicators (Hoog/Medium/Laag)
- Automatische berekeningen (ex + inc BTW)

**3. Pricing Calculator** 🔢 **INTERACTIEF!**
- Input velden (gele cellen):
  - Aantal gebruikers
  - Contract periode (jaren)
  - Support level
- Automatische berekening van:
  - SaaS model kosten
  - One-time license kosten
  - Hybrid model kosten (AANBEVOLEN)
  - 3-jaar TCO vergelijking
- Volume discount tabel

**4. ROI Analysis**
- Scenario: Bouwbedrijf met 10 werknemers
- Huidige situatie (papier) vs. CH Construct
- Tijdsbesparing berekeningen
- Investment & ROI cijfers
- Break-even periode
- Netto winst berekening

**5. Concurrentie**
- Feature vergelijking met 4 concurrenten
- Pricing vergelijking
- Score matrix
- Unique Selling Points
- Visual indicators (✅/❌/⚠️)

**6. Roadmap**
- FASE 1-4 timeline
- Deliverables per fase
- Duur en kosten per fase
- Status indicators
- Planning overzicht

**7. Onderhoud & Support**
- 3 Support tiers (Basic/Professional/Enterprise)
- Jaarlijkse kosten
- Response times & SLA's
- Inclusies per tier
- À la carte services

**8. Licentie Modellen**
- Model A: SaaS Subscription
- Model B: One-time License
- Model C: Hybrid (AANBEVOLEN ⭐)
- Voor/nadelen per model
- 3-jaar TCO vergelijking (10 gebruikers)

---

## 🎯 Hoe Te Gebruiken

### Excel Bestand Gebruiken:

1. **Open het bestand** in Microsoft Excel of Google Sheets
2. **Navigeer naar "Pricing Calculator"** sheet
3. **Pas de GELE cellen aan** met klant specifieke parameters:
   - Aantal gebruikers (B5)
   - Contract periode in jaren (B6)
   - Support level (B7)
4. **Bekijk automatische berekeningen** voor verschillende pricing modellen
5. **Kopieer relevante sheets** naar klant-specifieke offerte
6. **Pas branding aan** (optioneel): voeg logo toe, verander kleuren

### Klanten Presentatie:

**Optie 1: Email Offerte**
1. Export "Executive Summary" + "ROI Analysis" naar PDF
2. Attach Excel voor interactieve calculator
3. Attach Markdown document voor details

**Optie 2: Presentatie Meeting**
1. Open Excel bestand
2. Start met "Executive Summary"
3. Laat "ROI Analysis" zien met klant-specifieke cijfers
4. Gebruik "Pricing Calculator" live met klant input
5. Toon "Concurrentie" voor marktpositie
6. Sluit af met "Roadmap" en volgende stappen

**Optie 3: Website/Portal**
1. Export Markdown naar HTML
2. Host online voor prospects
3. Link naar Excel download voor interactieve calculatie

---

## 💰 Pricing Samenvatting (Quick Reference)

### Huidige App (Production Ready):
- **Ontwikkelkosten**: €8,415 (ex BTW) | €10,182 (inc BTW)
- **Status**: Voltooid, 4,345 regels code, 32 bestanden

### Verkoop Modellen:

| Model | Best Voor | Jaar 1 | 3-Jaar Totaal | ROI |
|-------|-----------|--------|---------------|-----|
| **SaaS** (€15/user/maand) | Grote teams | €1,800 | €5,400 | 11 maanden |
| **One-time** (€5,000 + 20%) | Kleine bedrijven | €6,000 | €8,000 | 8 maanden |
| **Hybrid** (€4,500 + €6/user/m) ⭐ | Mid-market | €5,220 | €6,660 | 10 maanden |

*Gebaseerd op 10 gebruikers*

### Uitbreidingen (Optioneel):

| Module | Kosten (ex BTW) | Duur |
|--------|-----------------|------|
| Backend/API | €7,500 | 8-12 weken |
| iOS App | €10,500 | 8 weken |
| Android App | €9,000 | 6 weken |
| Team Features | €6,000 | 6-8 weken |
| Integraties | €4,500+ | 4-6 weken |
| Reporting | €6,000 | 6-8 weken |
| White-label | €3,750 | 4-6 weken |

---

## 🎨 Aanpassingen Maken

### Excel Kleuren Aanpassen:

Het Excel bestand gebruikt een bouw/tech kleurenschema:
- **Primary (Blauw)**: #1E3A8A
- **Secondary (Oranje)**: #F97316
- **Success (Groen)**: #10B981
- **Danger (Rood)**: #EF4444

Om eigen huisstijl toe te voegen:
1. Open `generate_excel_offerte.py`
2. Pas `COLORS` dictionary aan (regel 17-26)
3. Voer script opnieuw uit: `python generate_excel_offerte.py`

### Logo Toevoegen:

1. Open Excel bestand
2. Ga naar "Executive Summary" sheet
3. Insert → Picture → selecteer logo
4. Positioneer in cel A1-B2
5. Resize naar ~150x50 pixels

### Prijzen Aanpassen:

1. **Pricing Calculator sheet** - pas base rates aan in cellen
2. **Development Costs sheet** - update uurlonen/tarieven
3. Alle formules updaten automatisch!

---

## 📧 Klant Communicatie Templates

### Email Template 1: Eerste Contact

```
Onderwerp: Offerte CH Construct Timesheet - Werkurenregistratie voor [Bedrijfsnaam]

Beste [Naam],

Graag stuur ik u de offerte voor CH Construct Timesheet, onze werkurenregistratie 
oplossing specifiek ontwikkeld voor de bouw- en technische dienstverleningssector.

In de bijlage vindt u:
- Executive Summary (PDF) met kernpunten
- Volledige offerte (Excel) met interactieve calculator
- Technische documentatie (PDF)

Highlights:
✅ 100% offline functionaliteit (werkt overal)
✅ ROI binnen 10-12 maanden
✅ Nederlandse interface, bouw-specifiek
✅ Direct Production Ready

Voor [X] gebruikers schat ik het volgende:
- 3-jaar investering: €X,XXX
- 3-jaar besparing: €XX,XXX
- Netto winst: €XX,XXX (XXX% ROI)

Graag plan ik een demo in van 30 minuten om de app te laten zien.

Met vriendelijke groet,
[Naam]
```

### Email Template 2: Na Demo

```
Onderwerp: Vervolgstappen CH Construct Timesheet

Beste [Naam],

Bedankt voor het demo gesprek van vandaag. Zoals besproken zijn dit de volgende stappen:

1. Pilot periode (30 dagen, gratis)
   - 5 gebruikers
   - Volledige functionaliteit
   - Support included

2. Bij goedkeuring: implementatie binnen 1 week
   - Setup & configuratie
   - Logo import
   - Training (4 uur)
   - Go-live support

Investering: €X,XXX (eenmalig) + €XXX/maand
ROI: XX maanden

Bijgevoegd vindt u de aangepaste offerte met uw specifieke cijfers.

Wanneer schikt het om te starten met de pilot?

Met vriendelijke groet,
[Naam]
```

---

## 🔧 Technische Details

### Bestand Gegenereerd Met:
- **Python**: 3.14.3
- **Library**: openpyxl 3.1.2
- **Datum**: 15 april 2026

### Regenereren:

```bash
# Installeer dependencies
pip install -r requirements.txt

# Genereer Excel
python generate_excel_offerte.py
```

### Systeem Requirements:
- **Voor Python script**: Python 3.8+
- **Voor Excel**: Microsoft Excel 2016+ of Google Sheets
- **Voor Markdown**: Elke Markdown editor, Pandoc voor conversie

---

## 📊 Data Bronnen

Alle cijfers in de offerte zijn gebaseerd op:

1. **Ontwikkelkosten**: Werkelijke development time (5 dagen, 113 uur)
2. **Code metrics**: 4,345 regels code, 32 bestanden
3. **Markt tarieven**: €65-100/uur (NL gemiddeld 2026)
4. **Concurrentie**: Openbare pricing van Toggl, Clockify, Harvest, TimeCamp
5. **ROI berekeningen**: Industriegemiddelden bouwsector (€30/uur, 2-3u/week besparing)
6. **Uitbreidingen**: Schatting senior developer (ervaring met similar projects)

---

## ✅ Checklist Voor Klant Offerte

Voordat je de offerte verstuurt:

- [ ] Klant informatie ingevuld (naam, bedrijf)
- [ ] Aantal gebruikers aangepast in Calculator
- [ ] ROI berekening geverifieerd met klant cijfers
- [ ] Relevante pricing model(len) geselecteerd
- [ ] Logo toegevoegd (optioneel)
- [ ] Contact informatie bijgewerkt
- [ ] Geldigheid datum ingesteld (standaard 3 maanden)
- [ ] Spelling en grammatica gecontroleerd
- [ ] Alle links/email adressen werken
- [ ] PDF exports getest
- [ ] Demo/pilot voorwaarden besproken

---

## 📞 Support & Vragen

Voor vragen over deze offerte documenten:
- **Technisch**: Zie `SPEC.md` en `docs/` folder
- **Functioneel**: Zie `docs/02-functionele-analyse.md`
- **Gebruikers**: Zie `docs/03-gebruikershandleiding.md`

---

**Versie**: 1.0  
**Laatst bijgewerkt**: 15 april 2026  
**Auteur**: Generated by OpenCode AI

*Succes met de verkoop!* 🚀
