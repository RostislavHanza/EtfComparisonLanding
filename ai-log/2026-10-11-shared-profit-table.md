# Jedna společná tabulka odhadovaného zisku

## Skutečně dostupný prompt

Doslovné výňatky aktuálního uživatelského zadání:

> Nahraď jednotlivé karty **jedinou společnou srovnávací tabulkou/grafem**, kde jsou všechny vybrané ETF jako řádky pod sebou.

> **ETF | Předpokládaný výnos ročně (%) | Odhadovaný zisk v Kč**

> Společný popisek „Procenta jsou předvyplněna podle historické výkonnosti po průběžných nákladech ETF“ zobraz pouze jednou pod tabulkou.

> Společné tlačítko „Obnovit podle historie“ zobraz také pouze jednou pod tabulkou. Obnoví historicky odvozené výchozí procento u všech vybraných ETF.

> Jde jen o úpravu prezentace, ne o přepis celé kalkulační logiky.

> Otestuj responsivitu, editaci procent a přepočet. Commitni a pushni pouze na `design-exploration`, `main` neměň.

Další požadavky stejného promptu: nezávislé přímo editovatelné sazby a okamžité zisky, zelené/červené pruhy na společné stupnici, částka/horizont nad tabulkou a přepínač reference u grafu ovládající graf i automatické sazby. Jde o shrnutí, nikoli dodatečně rekonstruovaný prompt.

## Změny

Čistý výchozí checkout design-exploration, commit 8492530540c978e50fddc48a03d456e8e10f68ad. Přečteny současné komponenty/CSS/browser test a použita již známá AGENTS.md pravidla. Žádní další agenti.

- Jedna sémantická table s colgroup, thead a scope=col/row. Záhlaví se opakuje pouze v přístupných jménech jednotlivých inputů, ne jako viditelný text. Individuální labely, poznámky, obnova a podružné údaje ve ziskových řádcích odstraněny; náklady/index/zdroje zůstávají v detailní tabulce pod historickým grafem.
- Společný popisek a jediné tlačítko obnovy všech vybraných fondů. Nevybrané lokální sazby se nepřepisují. Přepínač období, výpočty CAGR/profit/scale, bezpečné null/invalid chování, fetch/keš a parent state zachovány.
- Mobilní tři sloupce, ticker/vstup/pruh a zisk; plné názvy v řádkovém záhlaví jsou na úzkém mobilu vizuálně skryté, dostupné čtečkám a v podrobném srovnání. Žádné samostatné karty nebo horizontální scroll. Desktop má názvy a zisky vedle pruhů; všechny tracky mají stejné fyzické šířky.
- README a PERFORMANCE.md aktualizovány na společnou tabulku a dávkovou obnovu, starší AI logy zůstávají evidencí dřívějšího chování.

## Kontroly

Lint, typecheck, 54/54 unit/backend testů (bez skipped) a build prošly. Build načetl a spustil všech 10 emitovaných NodeNext API endpointů bez TypeScript loaderu. Žádný serverový modul, migrace nebo environment variable se neměnily; skutečné SMTP/remote Supabase testy nebyly provedeny.

Browser sada doplněna o jediné společné záhlaví/popisek/tlačítko, žádné per-row labely/tlačítka, dávkovou obnovu všech pěti ručně změněných sazeb, stejnou fyzickou stupnici, jednu/pět řádků, mobilní 320/390 a desktop 1440 px. Původní suite zachovává e-mailové a privacy/rate-limit/backend regresní pokrytí pomocí izolovaných fixtures, nikoli živých e-mailů.

Celý finální browser suite prošel s exit 0, včetně mobilního rozložení 320/390 px a desktopu 1440 px, úprav sazeb, obnovy všech pěti fondů, null/outage a stávajících cookies/e-mailových/administrátorských fixtures. Prohlédnuty mobilní a desktopové screenshoty: jeden kompaktní celek, společné sloupce a porovnatelné pruhy. Stávající sticky designový přepínač překrývá část dlouhého elementového screenshotu; nejde o vložený řádek tabulky nebo novou změnu navigace. Závěrečný lint/diff --check bez chyb. Sken změněných souborů proti dostupným tajným env hodnotám bez shod. Push není potvrzení dokončeného Vercel deploymentu. Lokální autor RostislavHanza / GitHub noreply ověřen, fetch větve odpovídá HEAD; žádné globální git změny, zásahy do main nebo cloudových služeb.
