# Zdroje a ruční ověřování ETF

## Schválené primární zdroje

| Zdroj | Co ověřit | Způsob pro MVP |
| --- | --- | --- |
| https://www.nyse.com/ | Ticker, právní název a listing na NYSE Arca | Oficiální listing nebo dokument s identitou a burzou |
| https://www.ssga.com/ | Fondy State Street/SPDR, index, expense ratio, dividendy | Produktová stránka, factsheet a prospekt |
| https://investor.vanguard.com/ | Fondy Vanguard, index, expense ratio, dividendy | Produktová stránka a oficiální dokumenty |
| https://www.ishares.com/ | Fondy iShares, index, expense ratio, dividendy | Produktová stránka, factsheet a prospekt |

Oficiální dokumenty Vanguard na `fund-docs.vanguard.com` jsou povolené jako doplňkový primární dokument emitenta. Schválení domény není oprávnění automaticky kopírovat její obsah. Zkontrolovat podmínky používání a případnou licenci pro konkrétní zveřejnění; uchovat odkaz na podmínky a záznam rozhodnutí. Neopisovat celé licencované tabulky nebo dokumenty.

Přístup z cloudového prostředí byl při předchozí kontrole blokován proxy HTTP 403. Konkrétní data, dostupnost veřejných API, exportů a právní podmínky zde nebyly nezávisle ověřeny. Neprohlašujeme, že tyto služby mají veřejné API, ani že je scraping povolený. Nedokumentované interní endpointy a obcházení blokací se nepoužívají.

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

Pro MVP není implementován automatický import ani Vercel Cron. Aktuální údaje (index, nákladovost, dividendová politika) kontrolovat týdně a při oznámené změně. Denní režim má smysl až pro dynamické údaje jako NAV, které nyní nesbíráme.

Automatizaci doplnit až pro dokumentované API nebo export s povolením zpracování a zveřejnění. Adaptér bude ukládat návrh změn, ověřovat identitu/typy/rozsahy/datum a neočekávané změny vyžadovat ruční schválení. Cron bude autentizovaný, idempotentní, s limity a auditním výsledkem; při chybě nikdy neoznačí stará data za právě ověřená a nepřepíše je neúplnou dávkou.
