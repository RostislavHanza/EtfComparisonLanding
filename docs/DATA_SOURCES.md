# Zdroje ETF, ověřování a synchronizace

## Schválené primární zdroje

| Zdroj | Co ověřit | Způsob pro MVP |
| --- | --- | --- |
| https://www.nyse.com/ | Ticker, právní název a listing na NYSE Arca | Oficiální listing nebo dokument s identitou a burzou |
| https://www.ssga.com/ | Fondy State Street/SPDR, index, expense ratio, dividendy | Produktová stránka, factsheet a prospekt |
| https://investor.vanguard.com/ | Fondy Vanguard, index, expense ratio, dividendy | Produktová stránka a oficiální dokumenty |
| https://www.ishares.com/ | Fondy iShares, index, expense ratio, dividendy | Produktová stránka, factsheet a prospekt |

Oficiální dokumenty Vanguard na `fund-docs.vanguard.com` jsou povolené jako doplňkový primární dokument emitenta. Schválení domény není oprávnění automaticky kopírovat její obsah. Zkontrolovat podmínky používání a případnou licenci pro konkrétní zveřejnění; uchovat odkaz na podmínky a záznam rozhodnutí. Neopisovat celé licencované tabulky nebo dokumenty.

Předchozí ověřování emitentů blokovala proxy HTTP 403; to je historická informace, nikoli současný důkaz nedostupnosti. Nově je ověřené dokumentované TickerInside API a jeho podmínky (viz níže). Scraping produktových stránek, interní endpointy ani importy holdings/cen nepoužíváme.

`data/etf-candidates.csv` obsahuje 20 kandidátů ke kontrole, nikoli ověřený katalog. Fondy jiných emitentů vyžadují schválení jejich primárního zdroje; lze začít 17 kandidáty ze tří uvedených emitentů. Ani burza kandidátů není pouhou přítomností v seznamu potvrzená. Produkční migrace neobsahuje žádná smyšlená ani demonstrační ETF.

## Postup publikace

1. Ověřit název a ticker, listing NYSE Arca (NYSE), index, nákladovost (přesný název expense ratio), dividendovou politiku a charakteristiku v dokumentech emitenta.
2. Pro každé pole zapsat konkrétní HTTPS URL, datum platnosti, datum kontroly a stručný doklad kontroly (např. název dokumentu, strana a sekce). Uvést skutečného kontrolora. AI výstup není zdroj.
3. Prověřit podmínky použití, vyplnit `usageReview` a nepublikovat fond při nejistotě. Druhý průchod kontroly porovná hodnoty s dokumenty; nic nepřebírat z původních demo sazeb bez ověření.
4. Připravit lokální JSON podle struktury níže. Žádné klíče ani osobní údaje v souboru.
5. Spustit `npm run import:etfs -- ./overena-data.json`. Dry run kontroluje strukturu, domény, úplnost, rozsah sazeb a stáří kontroly, nikoli pravdivost dokumentů.
6. Po kontrole rozdílů spustit se serverovými proměnnými `npm run import:etfs -- ./overena-data.json --apply`. Jde o jeden atomický upsert dávky do Supabase; fondy mimo dávku se nemažou. Zkontrolovat veřejné API a zobrazené datum.
7. Ručně ověřit celý katalog nejméně týdně. Neověřené fondy nepublikovat; při podezření nastavit `published=false` v Supabase. Záznamy starší než 14 dní jsou automaticky skryté pro nové srovnání. Uložený přehled zachovává datový snapshot a jeho datum; uložením změn přijme čerstvá ověřená data.

## Struktura importu (schéma, nikoli data)

Kořen je `{ "records": [...] }`. Každý záznam obsahuje:

- `ticker`, `name`, `exchange` (přesně `NYSE Arca`), `index`, `expenseRatioPercent` (číslo v procentech), `dividends`, `description`;
- `verifiedAt` (ISO čas), `dataAsOf` (datum), `verifiedBy`;
- `sources`: pro každé pole `name`, `exchange`, `index`, `expenseRatioPercent`, `dividends`, `description` alespoň jeden objekt `{field, url, verified_at, as_of, evidence}`. Zdroj burzy musí být na nyse.com; všechny kontroly musí být alespoň tak nové jako `verifiedAt`;
- `usageReview`: `{approved: true, reviewedAt, reviewer, basis, policyUrl}`. Vyplnit skutečné rozhodnutí a důvod oprávnění, nikoli automaticky potvrdit.

Datum nesmí být budoucí, ověření nesmí být starší než 14 dní. Jeden JSON nemůže obsahovat duplicitní tickery. Publikace má přednostně projít testovacím projektem.

## Budoucí automatizace

Původní MVP automatický import výslovně odložilo. Nyní je implementovaná synchronizace dostupných polí TickerInside, s kandidátní vrstvou a výslovně schválenými aktualizacemi nákladovosti. Denní retenční Cron zůstává; týdenní ETF Cron je připraven pouze pro budoucí Production. Aktuální údaje (index, nákladovost, dividendová politika) kontrolovat týdně a při oznámené změně. Denní režim má smysl až pro dynamické údaje jako NAV, které nyní nesbíráme.

Automatizaci doplnit až pro dokumentované API nebo export s povolením zpracování a zveřejnění. Adaptér bude ukládat návrh změn, ověřovat identitu/typy/rozsahy/datum a neočekávané změny vyžadovat ruční schválení. Cron bude autentizovaný, idempotentní, s limity a auditním výsledkem; při chybě nikdy neoznačí stará data za právě ověřená a nepřepíše je neúplnou dávkou.

## TickerInside: ověřený hlavní automatický zdroj

Oficiální dokumentace: https://tickerinside.com/api/. Dokumentovaný endpoint `GET https://tickerinside.com/api/v1/fund/{ticker}.json` používá ticker malými písmeny. Nepotřebuje API klíč. Skutečné odpovědi pro všech 20 kandidátů a jejich omezení jsou v [TICKERINSIDE_AUDIT.md](TICKERINSIDE_AUDIT.md).

Automaticky získáváme ticker, název, burzu, nákladovost v procentech, typ jejího zdroje, případné datum a URL SEC filing a atribuci. Hodnota 0.03 znamená 0,03 %, nikoli 3 %; null nikdy není nula. `as_of` je datum cen a `holdings_as_of` datum holdings, nikoli datum nákladovosti. Používáme jen `expense_ratio_as_of` pro nákladovost; chybějící datum ponecháme null v kandidátní vrstvě. `checkedAt` je náš čas technické kontroly API, nikoli nové lidské ověření fondu.

API index, dividendovou politiku a požadovaný popis pro těchto 20 fondů neposkytuje. Ty se doplňují a schvalují ručně z primárních zdrojů uvedených výše. Dividendový výnos ani kategorie fondu je nenahrazují. SCHB/SCHD/RSP stále potřebují schválení dalších primárních emitentských zdrojů. Validátor dovoluje TickerInside a SEC jako doplňkové zdroje, ale zachovává požadavek samostatného NYSE důkazu burzy a ostatní pravidla ruční publikace.

### Licence a atribuce

Ověřeny https://tickerinside.com/terms/ a https://tickerinside.com/legal/, znění revidované 9. října 2026, a API sekce terms/cite. Vlastní práce TickerInside a aktuální snapshoty jsou CC BY 4.0 s povolením komerčního použití a uchování aktuálních souborů; poskytovatel doporučuje nejvýše jedno načtení souboru za nightly build a identifikující User-Agent. Náš adaptér používá dva souběžné požadavky a nejvýše jednu synchronizační dávku za UTC den, běžně jednu týdně.

Při veřejném použití zobrazujeme odkaz TickerInside na stránku konkrétního fondu, označení CC BY 4.0, odkaz na licenci a informaci o adaptaci dat. Nikdy nevkládáme providerovo cite_html jako HTML. Licence poskytovatele se nevztahuje na cizí práva k holdings/cenám; tato data vůbec neuchováváme. History/flows mají odlišné podmínky, a jejich endpointy nepoužíváme. Market_data bez datovaného SEC podkladu neaktualizuje veřejnou nákladovost. Před rozšířením použití znovu zkontrolovat podmínky; API nezaručuje správnost dat.

### Bezpečné uložení a aktualizace

Nová migrace `202610110004_etf_sync.sql` přidává tabulky etf_sync_candidates, etf_sync_runs, etf_sync_lease a opt-in sloupec etfs.tickerinside_sync_enabled (výchozí false). Neobsahuje seed a nemění původní migrace. Nové tabulky i RPC jsou nepřístupné anon/authenticated.

Validní odpovědi upsertujeme podle tickeru do kandidátů, oddělených od katalogu. Chybné odpovědi zanechají poslední platný snapshot. Chyby mají pevné kódy bez secrets. Každý běh má audit a dvouminutový lease; souběžný běh se odmítne, další běh v témže UTC dni nenačítá API. Opakované dokončení je idempotentní. Přerušený běh se označí jako failed při další zahajovací kontrole po expiraci lease. Schválené pole se nikdy nemaže při chybě jednoho fondu.

Ve veřejném katalogu je možné automaticky měnit pouze nákladovost (a její zdrojové doklady), a to u již publikovaného fondu se schváleným usage_review, úplnými doklady a výslovným tickerinside_sync_enabled=true. Název musí odpovídat, fond musí být čerstvě lidsky ověřený, zdroj musí být SEC filing s datem alespoň tak novým jako dosavadní podklad nákladovosti. API nákladovost je po případné úlevě, nikoli automaticky gross; tuto metodiku musí schvalovatel přijmout před opt-in. Zdroj SEC citovaný API není tímto během nezávisle znovu čten.

published, verified_at, data_as_of, název, burza, index, dividendy a popis v hlavní tabulce zůstávají zachované. Proto jsou nutné další kontroly ručně doplněných polí; celkové lidské ověření po 14 dnech dál vyřadí fond z nových srovnání. Týdenní stažení API neprodlužuje lidské ověření. Přístupový srovnávač zachovává vlastní snapshot.

IVV/ITOT/IWM v současné databázi jsou podle uživatele nepublikované předběžné záznamy: synchronizace je nepublikuje ani nemění. Kandidáty a úplné ověřené záznamy musí operátor zkontrolovat a připravit validovaný ruční import. Teprve po schválení lze povolit aktualizaci nákladovosti. Tento proces zatím sám nenaplní veřejný katalog 15–20 úplnými ETF.
