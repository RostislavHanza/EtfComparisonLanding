# Historický a hypotetický vývoj investice

## Skutečně ověřené odpovědi

GET https://tickerinside.com/api/v1/fund/{ticker}.json (ticker malými písmeny), dokumentace https://tickerinside.com/api/. V této úloze byly skutečně načteny všechny odpovědi; redukované hodnoty, URL, čas stažení a hash celé odpovědi jsou v `data/review/performance-observations.json`. Raw odpovědi jsou pouze v ignorované pracovní cache, nikoli ve veřejném bundle.

| ETF | r1: 1 rok | r3: 3 roky | r5: 5 let | as_of cen |
| --- | --- | --- | --- | --- |
| SPY | 20.5 % | 87.1 % | 86.7 % | 2026-10-09 |
| VOO | 20.5 % | 87.5 % | 87.2 % | 2026-10-09 |
| IVV | 20.6 % | 87.5 % | 87.2 % | 2026-10-09 |
| VTI | 20.0 % | 85.8 % | 77.4 % | 2026-10-09 |
| IWM | 18.5 % | 69.4 % | 31.8 % | 2026-10-09 |

Jsou to **kumulativní total returns**, nikoli roční výnosy. Dokumentace výslovně říká, že výnosy používají dividendově upravené ceny; as_of je datum podkladových cen, nikoli holdings. Všech pět také poskytlo neprázdné weekly. Tuto řadu nepoužíváme, neukládáme do katalogu ani nezveřejňujeme. Hodnoty v tabulce dokumentují jedno skutečné načtení, nejsou pevný runtime fallback nebo záruka budoucí dostupnosti.

## Licence a atribuce

Aktuálně načtená API dokumentace zahrnuje vypočtené údaje aktuálních snapshotů pod deklarovanou CC BY 4.0. Každá použitá odpověď uvádí tuto licenci. Úplné /legal/ (revize 9. 10. 2026), /terms/ a /api/ již nezávisle ověřil provozovatel, viz `priority-five.evidence.json`; to není nové tvrzení o právním auditu tohoto kódu. Tento režim pokrývá vlastní práci TickerInside, nikoli automaticky práva třetích stran. Historie holdings a ETF flows mají jiná pravidla a nepoužíváme je.

Rozlišujeme vypočtené kumulativní výnosy r1/r3/r5 od redistribuce původního cenového feedu. Dokumentace výslovně říká, že poskytovatel není licencovaný k redistribuci price feedu. Proto neposíláme weekly, raw ceny, last_close, holdings, obrázky nebo historii do prohlížeče; graf vlastního scénáře je náš matematický výpočet, nikoli rekonstruovaná historická cenová řada. Rozšíření na raw historii by potřebovalo samostatně ověřené oprávnění.

UI uvádí konkrétní fund JSON, fondovou stránku TickerInside, CC BY 4.0, datum cen a informaci, že korunové hodnoty jsou vlastní výpočet. Providerovo cite_html se nevkládá jako HTML. Žádný nový právní schvalovací workflow ani placená služba nevznikly.

## Server a kešování

Nový veřejný GET `/api/performance` vrací pouze pět normalizovaných výnosových záznamů a seznam unavailable. Pevný seznam SPY/VOO/IVV/VTI/IWM; query nebo klientský URL vstup nerozhoduje o upstream cíli. Metody mimo GET (včetně TRACE/POST) odmítá stejný Vercel handler/guard. Server ověřuje ticker, ETF/NYSE Arca, CC BY 4.0, konečné číslo v rozsahu od −100 % a platné nepředbíhající as_of. Null nebo chybějící výnos zůstává null; malformovaná čísla se nevydávají za nulu.

Pět zdrojů se načítá sekvenčně, každý má pětisekundový timeout. User-Agent odkazuje na projekt. Vercel Function má maxDuration 60 s. Úspěšná odpověď má public max-age=300, s-maxage=86400; příslušný běžící server má jednodenní paměťovou keš a společný in-flight požadavek. Browser má pětiminutovou keš; celý balík načítá jednou, ne při pohybu slideru, přepnutí ETF/období nebo změně scénáře.

Při dílčí chybě server uchová poslední platný záznam, pokud jej tato instance má, s původními daty/retrievedAt a stale=true; UI varuje, že obnovení selhalo. Částečný výsledek má pětiminutovou keš. Při úplném výpadku bez předchozího snapshotu vrací bezpečnou 503 a na instanci pět minut potlačuje opakované pokusy. Hypotetický režim i původní srovnávač dále fungují. Keš není trvalé úložiště: cold start nebo jiný CDN region může znovu načíst zdroj; nejde o globálně garantovanou jedinou denní dávku. Nepoužívá se žádné bulk history API.

Nebyla změněna Supabase ani její migrace/katalog/synchronizace, SMTP konfigurace nebo souhlasy. Nové env proměnné a API klíče nejsou potřebné. Serverové importy mají `.js` a nové API zahrnují NodeNext i oficiální Vercel artifact kontroly.

## Výpočty a UI

Investovaná částka je společná s existujícím srovnáním, zůstává uložená v dosavadním e-mailovém procesu. ETF historického podkladu se vybírá z právě porovnávaných fondů.

- **Jak by se investice vyvíjela v minulosti:** `investment * (1 + cumulativeReturn / 100)`, období 1/3/5 let, změna, modelová konečná hodnota a zisk/ztráta. Null: Data nejsou dostupná. Bez falešné interpolované historické křivky.
- **Hypotetický vývoj:** vlastní roční výnos −100 až 100 %, horizont 1–30 celých let, `(1 + annualReturn / 100) ** years`. Roční předpoklad začíná prázdný, není přítomen pevný fallback výnos. Graf obsahuje rok 0 a hodnoty po celých letech, přístupné také jako text.
- **Volitelné převzetí:** až po explicitním kliknutí použít `((1 + cumulative / 100) ** (1 / years) - 1) * 100`. Zobrazí se upozornění na mechanické opakování historického tempa, NE predikci. Bez výnosových dat tlačítko nejde použít.
- **Roční průběžné náklady:** menší samostatná sekce, dosavadní `amount * expenseRatio / 100`, náklady promítané do hodnoty fondu, nikoli faktura. Z dividendově upravených total returns ani NAV je znovu neodečítáme.

Výnosy podkladového USD trhu aplikované na nominální vklad v Kč ignorují historické změny USD/CZK. Nejde o skutečně dosažený korunový výnos, prognózu nebo investiční doporučení. Nezohledňují daně a brokera. UI říká „Minulé výnosy nezaručují budoucí výsledky.“ PRIIPs/KID a investiční rizika zůstávají. Nová volba režimu/horizontu/ročního předpokladu je lokální pracovní nastavení; dosavadní uložený výběr ETF a částka se zachovávají, scénářové parametry se nově do DB neukládají.

## Ověření na Preview

Po automatickém deploymentu commitu otevřete `/api/performance`: očekávejte pět fondů s r1/r3/r5, asOf, konkrétním sourceUrl a licencí, žádné weekly nebo raw ceny. Zkontrolujte skutečné aktuální asOf, nikoli očekávání neměnné tabulky výše.

Na landing page vyberte ETF a posuňte částku: historické hodnoty se přepočítají bez nové API žádosti. Porovnejte SPY 3 roky (při doložených 87.1 % a vkladu 100 000 Kč výsledek 187 100 Kč); neúčtuje se znovu 0.0945 %. Přepněte na vlastní scénář, zadejte −10 % a 3 roky: 72 900 Kč. Tlačítko převzetí historického tempa musí vyplnit CAGR, nikoli kumulativní r3/r5. V DevTools zkontrolujte počet volání `/api/performance`, zdrojové datum, odkazy, mobilní přetékání a vlastní scénář při blokovaném performance API.

Browser testy používají izolované odpovědi, testovací e-maily se neodesílají. Push není potvrzení deploymentu; živý Preview a skutečné SMTP doručení je nutné odlišit od místních kontrol.
