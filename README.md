# ETF Comparison Landing

**Interaktivní srovnávač amerických ETF s kalkulačkou výnosů, historickými daty a osobním přehledem zasílaným e-mailem.**

Mobile-first webová aplikace umožňující jednoduše porovnávat americké ETF na základě skutečných dat. Kombinuje přehlednou landing page, dvě reklamní varianty, interaktivní kalkulačku a měření konverzní cesty.

## Živé stránky

| Stránka | Odkaz |
|---|---|
| **Hlavní ETF srovnávač** | [Otevřít hlavní web](https://etf-comparison-landing.vercel.app/) |
| **Interaktivní reklama – kalkulačka** | [Otevřít reklamu A](https://etf-comparison-landing.vercel.app/add) |
| **Jednoduchá informační reklama** | [Otevřít reklamu B](https://etf-comparison-landing.vercel.app/add-simple) |

## 1. O projektu

ETF Comparison Landing pomáhá uživatelům vytvořit vlastní přehled vybraných amerických ETF bez nutnosti registrace.

Návštěvník si na hlavní stránce vybere jeden nebo více fondů, zadá e-mailovou adresu pro zaslání srovnání a získá osobní odkaz na interaktivní přehled.

Po otevření odkazu jsou dostupné:

- **Kalkulačka odhadovaného zisku** – výpočet podle investované částky, horizontu a předpokládané výkonnosti.
- **Historický vývoj ETF** – graf porovnávající výkonnost vybraných fondů.
- **Detailní srovnání** – nákladovost, sledované indexy, dividendová politika a další parametry.
- **Uložené srovnání** – možnost měnit výběr ETF a investovanou částku a vracet se ke stejnému přehledu.

E-mailová adresa slouží k doručení vyžádaného srovnání a k automatickému potvrzení dané e-mailové adresy prostřednictvím osobního odkazu.

Osobní odkaz lze používat opakovaně, včetně otevření na jiném zařízení, po dobu nejvýše 90 dní od vytvoření.

## 2. UX a pořadí sekcí

Aplikace je navržena primárně pro mobilní zařízení, kde návštěvník prochází jednoduchou, navazující konverzní cestou.

**Hodnota nabídky → výběr ETF → e-mail pro zaslání srovnání**

| Pořadí | Sekce | Zdůvodnění |
|---|---|---|
| **1** | Úvodní nadpis a hodnota nabídky | Návštěvník nejprve zjistí, že jde o americká ETF a kalkulačku výnosů. Čtyři stručné důvody vysvětlují, jaký přehled získá a proč pokračovat. |
| **2** | Výběr ETF | Následuje jednoduchá interakce výběru fondů |
| **3** | E-mailový formulář | Po vytvoření vlastního výběru uživatel zadá adresu a odešle si odkaz na své srovnání. |
| **4** | Doplňující informace | FAQ, zdroje, metodika, upozornění na rizika a ochrana osobních údajů poskytují potřebný kontext. |

Na desktopu je rozložení přizpůsobeno větší obrazovce: výběr ETF a e-mailový formulář tvoří hlavní obsahovou část a informační benefity jsou umístěny za nimi.

**Hlavní UX rozhodnutí:** Kalkulačka, historický graf a detailní tabulky nejsou součástí veřejné úvodní stránky. Zpřístupní se až prostřednictvím osobního odkazu zaslaného na e-mail. Landing page se tak soustředí na jednoduchý proces výběru ETF a vyžádání srovnání.

## 3. Reklamní varianty

Projekt obsahuje dvě samostatné reklamní varianty. Obě směřují do stejného ETF srovnávače, ale představují jeho hodnotu odlišným způsobem.

### Varianta A – interaktivní kalkulačka

[https://etf-comparison-landing.vercel.app/add](https://etf-comparison-landing.vercel.app/add)

Interaktivní reklama ukazuje orientační výpočet na příkladu fondů SPY a VOO.

Uživatel může přímo v reklamě měnit investovanou částku, investiční horizont a historické referenční období.

Smyslem varianty je umožnit návštěvníkovi vyzkoušet princip kalkulačky ještě před přechodem na hlavní stránku.

**Označení zdroje návštěvy:** `ad-a`

### Varianta B – informační reklama

[https://etf-comparison-landing.vercel.app/add-simple](https://etf-comparison-landing.vercel.app/add-simple)

Jednoduchá statická reklama představuje čtyři hlavní přínosy aplikace: odhadovaný zisk, historický vývoj, detailní srovnání a osobní přehled na e-mail.

Celá reklamní plocha je klikací a vede přímo k výběru ETF.

Smyslem varianty je sdělit hodnotu nástroje rychle, bez nutnosti předchozí interakce.

**Označení zdroje návštěvy:** `ad-b`

Návštěvy bez přiřazeného reklamního zdroje používají hodnotu `direct`.

## 4. Konverzní cesta a analytika

Aplikace měří jednotlivé kroky od příchodu návštěvníka až po vyžádání a otevření osobního srovnání.

Konverzní cesta:

**Návštěva → interakce s ETF → výběr fondů → e-mailový formulář → přijetí žádosti → odeslání e-mailu → otevření srovnání**

| Událost | Význam |
|---|---|
| `landing_view` | Zobrazení landing page |
| `comparison_interacted` | Interakce s výběrem nebo vyhledáváním ETF |
| `comparison_configured` | Sestavení výběru ETF |
| `form_started` | Zahájení vyplňování e-mailového formuláře |
| `lead_submit_attempt` | Pokus o odeslání formuláře |
| `lead_accepted` | Přijetí platné žádosti serverem |
| `email_sent` | Přijetí e-mailu SMTP serverem |
| `email_confirmed` | První platné otevření osobního e-mailového odkazu |
| `comparison_opened` | Oprávněné otevření uloženého srovnání |

### Atribuce reklamních zdrojů

Součástí konverzního funnelu je také ukládání informace, **ze které reklamní varianty návštěvník přišel**.

Používají se tři hodnoty:

- `ad-a` – interaktivní reklama `/add`.
- `ad-b` – informační reklama `/add-simple`.
- `direct` – návštěva bez přiřazené reklamní varianty.

Každá reklama přesměrovává na hlavní web s příslušným parametrem `utm_campaign`.

Po udělení analytického souhlasu se zdroj návštěvy uchovává v rámci dané návštěvy a přiřazuje k měřeným událostem. Při vytvoření srovnání se atribuce zaznamenává také na serveru, takže lze propojit příchod z reklamy, odeslání formuláře a následné otevření e-mailového odkazu.

Funnel tak umožňuje samostatně sledovat konverzní cestu návštěvníků z obou reklamních variant i přímé návštěvnosti.

### Konverzní metriky

**Hlavní konverzí je přijatý kontakt vůči měřeným návštěvám.**

\[
\text{Konverze formuláře} =
\frac{\text{lead\_accepted}}{\text{landing\_view}}\times100\,\%
\]

Jako navazující ukazatel kvality kontaktu se vyhodnocuje také podíl návštěv, které vedly k prvnímu platnému otevření osobního srovnání (`email_confirmed`).

Toto rozlišení umožňuje sledovat zvlášť úspěšné vyplnění formuláře a následné využití zaslaného odkazu.

### Soukromí

Nepovinná analytika se aktivuje až po udělení souhlasu návštěvníkem. Souhlas lze následně odvolat.

Aplikace nepřenáší e-mailové adresy ani přístupové tokeny do analytických událostí. K rozlišení zdrojů návštěv používá povolené hodnoty `ad-a`, `ad-b` a `direct`.

Měřené konverze odpovídají návštěvám se souhlasem s analytikou, nikoli automaticky veškeré návštěvnosti webu.

Podrobnosti: [docs/ANALYTICS.md](docs/ANALYTICS.md).

## 5. Očekávaná konverze

Pro vyhodnocení konverzního funnelu jsou stanoveny orientační plánovací předpoklady.

| Metrika | Očekávaná hodnota |
|---|---|
| Návštěva → přijatý kontakt | **3–7 %** |
| Přijatý kontakt → první otevření srovnání | **60–80 %** |
| Návštěva → první otevření srovnání | **1,8–5,6 %** |

Hodnoty představují výchozí hypotézy, nikoli naměřené výsledky.

## 6. Hypotézy pro A/B testování

Tři hypotézy jsou seřazeny podle předpokládaného dopadu na konverzi.

| Priorita | Hypotéza | Očekávaný dopad |
|---|---|---|
| **1 – Nejvyšší** | Konkrétnější vyjádření hodnoty ETF srovnání v úvodu zvýší podíl návštěvníků pokračujících k formuláři. | Lepší pochopení nabídky hned při příchodu na stránku. |
| **2 – Střední** | Předvybraný výchozí výběr ETF zvýší podíl dokončených formulářů. | Menší náročnost prvního kroku a rychlejší začátek srovnání. |
| **3 – Nižší** | Jasnější informace o tom, co přijde e-mailem, zvýší podíl otevřených osobních srovnání. | Menší nejistota při zadávání adresy a větší motivace otevřít doručený odkaz. |

Podrobnější návrh měření a experimentů je v [docs/PLAN.md](docs/PLAN.md).

## 7. ETF data a zdroje

Aplikace pracuje s katalogem **20 publikovaných amerických ETF** v databázi Supabase:

SPY, VOO, IVV, VTI, IWM, DIA, IJH, IJR, ITOT, MDY, SPYD, VEA, VT, VTV, VUG, VWO, VYM, RSP, SCHB a SCHD.

U fondů jsou evidovány zdroje údajů, datum jejich platnosti a datum ověření. Fondy s ověřením starším než 14 dní nejsou dostupné pro nové srovnání.

### Použité zdroje

| Zdroj | Účel |
|---|---|
| [TickerInside API](https://tickerinside.com/api/) | Identifikace ETF, vybrané údaje o nákladovosti a historické výkonnosti |
| [NYSE](https://www.nyse.com/) | Ověření burzovního zařazení |
| [State Street / SPDR](https://www.ssga.com/) | Oficiální parametry fondů SPDR |
| [Vanguard](https://investor.vanguard.com/) | Dokumentace a parametry fondů Vanguard |
| [iShares](https://www.ishares.com/) | Dokumentace a parametry fondů iShares |
| [SEC](https://www.sec.gov/) | Regulatorní dokumenty a další podklady |

Konkrétní zdrojové odkazy jednotlivých fondů jsou součástí jejich datových záznamů.

### Metodika a kontrola dat

- [DATA_SOURCES.md](docs/DATA_SOURCES.md) – zdroje ETF a proces jejich ověřování.
- [TICKERINSIDE_AUDIT.md](docs/TICKERINSIDE_AUDIT.md) – audit externího datového API.
- [PERFORMANCE.md](docs/PERFORMANCE.md) – historická výkonnost a metodika výpočtů.
- [CATALOG_REVIEW.md](docs/CATALOG_REVIEW.md) – kontrola a publikace fondů.
- [data/](data/) – podklady katalogu a záznamy kontrol.

Historická výkonnost slouží k porovnání minulého vývoje fondů. Výpočty budoucího odhadovaného zisku jsou modelové a vycházejí ze zadaných předpokladů. Nejsou zárukou budoucích výsledků.

## 8. Technické řešení

| Oblast | Technologie |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Hosting | Vercel |
| Backend | Vercel Functions |
| Databáze | Supabase / PostgreSQL |
| Odesílání e-mailů | Nodemailer, Gmail SMTP |
| Automatizované testování | TypeScript testy, PGlite, Playwright |
| Vývoj s AI agentem | OpenAI Codex |
| Verzování | Git |

### Architektura a zabezpečení

Backend zajišťuje validaci formuláře, ukládání srovnání, odesílání e-mailů, přístupové tokeny a práci s ETF daty.

Osobní srovnání jsou chráněna serverově ověřovaným přístupem. Přístupové tokeny se generují kryptograficky náhodně a v databázi se ukládají jejich otisky.

Přístupová session používá zabezpečenou HttpOnly cookie. Supabase omezuje přímý veřejný přístup prostřednictvím RLS a databázových oprávnění.

Proti automatizovanému zneužití jsou implementovány serverová validace vstupů, rate limiting a omezení velikosti požadavků.

Citlivé přístupové údaje jsou určeny výhradně pro serverové prostředí.

## 9. Lokální spuštění

Projekt používá Node.js 24 a npm.

```bash
git clone https://github.com/RostislavHanza/EtfComparisonLanding.git
cd EtfComparisonLanding

npm ci
cp .env.example .env.local
```

Do `.env.local` je potřeba doplnit konfiguraci služeb podle [docs/SETUP.md](docs/SETUP.md).

Spuštění frontendové části:

```bash
npm run dev
```

Spuštění lokálního API v druhém terminálu:

```bash
npm run dev:api
```

### Testování

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run check:vercel
```

Browser testy používají sestavenou aplikaci a Chromium:

```bash
npm run preview -- --port 4173
npm run test:browser
```

Testovací prostředí používá také izolované databázové testy a simulované API odpovědi. Způsob konfigurace a ověření externích služeb je uveden v [docs/SETUP.md](docs/SETUP.md).

## 10. Dokumentace a AI log

Projekt vznikal iterativně s využitím AI agenta **OpenAI Codex** a průběžným verzováním změn.

Adresář [ai-log/](ai-log/) obsahuje dostupné prompty, záznamy implementace, technická rozhodnutí, výsledky testů a související dokumentaci vývoje.

Podrobnější technické informace jsou dostupné v adresáři [docs/](docs/).

Vývojová historie je zachycena v jednotlivých Git commitech.

## 11. Omezení

- Projekt slouží k informativnímu porovnávání ETF, nikoli k jejich přímému nákupu nebo obchodování.
- Historická výkonnost a modelové výpočty nepředstavují investiční doporučení.
- Modelové projekce nezahrnují všechny individuální náklady, daně a měnové vlivy.
- Doručení e-mailových zpráv závisí na dostupnosti a pravidlech SMTP poskytovatele.
- Analytika zachycuje pouze návštěvníky s uděleným souhlasem.
- Aktuálnost údajů závisí na pravidelném ověřování a dostupnosti externích zdrojů.
