# Zdroje ETF, ověřování a synchronizace

## Schválené primární zdroje

| Zdroj | Co ověřit | Způsob pro MVP |
| --- | --- | --- |
| https://tickerinside.com/api/ | Ticker, název, identifiers.exchange, expense_ratio a poplatkové datum | Hlavní licencovaný zdroj aktuálního fund JSON; emitent pro kontrolu a chybějící fakta |
| https://www.nyse.com/ | Ticker, právní název a listing na NYSE Arca | Oficiální listing nebo dokument s identitou a burzou |
| https://www.ssga.com/ | Fondy State Street/SPDR, index, expense ratio, dividendy | Produktová stránka, factsheet a prospekt |
| https://investor.vanguard.com/ | Fondy Vanguard, index, expense ratio, dividendy | Produktová stránka a oficiální dokumenty |
| https://www.ishares.com/ | Fondy iShares, index, expense ratio, dividendy | Produktová stránka, factsheet a prospekt |

Oficiální dokumenty Vanguard na `fund-docs.vanguard.com` jsou povolené jako doplňkový primární dokument emitenta. Schválení domény není oprávnění automaticky kopírovat její obsah. Zkontrolovat podmínky používání a případnou licenci pro konkrétní zveřejnění; uchovat odkaz na podmínky a záznam rozhodnutí. Neopisovat celé licencované tabulky nebo dokumenty.

Předchozí ověřování emitentů blokovala proxy HTTP 403; to je historická informace, nikoli současný důkaz nedostupnosti. Aktuálně je přečtené dokumentované TickerInside API a jeho licenční sekce (viz níže); úplné /legal/ a /terms/ byly následně nezávisle otevřeny a ověřeny provozovatelem podle jeho upřesnění zadání. Scraping produktových stránek, interní endpointy ani importy holdings/cen nepoužíváme.

`data/etf-candidates.csv` obsahuje 20 kandidátů ke kontrole, nikoli ověřený katalog. Fondy jiných emitentů vyžadují schválení jejich primárního zdroje; lze začít 17 kandidáty ze tří uvedených emitentů. Ani burza kandidátů není pouhou přítomností v seznamu potvrzená. Produkční migrace neobsahuje žádná smyšlená ani demonstrační ETF.

## Postup publikace

1. Ověřit název a ticker, listing NYSE Arca (NYSE nebo příslušný oficiální emitent), index, nákladovost (přesný název expense ratio), dividendovou politiku a charakteristiku v dokumentech emitenta.
2. Pro každé pole zapsat konkrétní HTTPS URL, datum platnosti, datum kontroly a stručný doklad kontroly (např. název dokumentu, strana a sekce). Uvést skutečného kontrolora. AI výstup není zdroj.
3. Doložit licenční režim skutečně převzatých údajů, zaznamenat známá omezení a explicitní rozhodnutí provozovatele v `usageReview`. Nevydávat omezené faktické demo za licenci emitenta nebo povolení chráněného obsahu. Druhý průchod kontroly porovná hodnoty s dokumenty; nic nepřebírat z původních demo sazeb bez ověření.
4. Připravit lokální JSON podle struktury níže. Žádné klíče ani osobní údaje v souboru.
5. Spustit `npm run import:etfs -- ./overena-data.json`. Dry run kontroluje strukturu, domény, úplnost, rozsah sazeb a stáří kontroly, nikoli pravdivost dokumentů.
6. Po kontrole rozdílů spustit se serverovými proměnnými `npm run import:etfs -- ./overena-data.json --apply`. Jde o jeden atomický upsert dávky do Supabase; fondy mimo dávku se nemažou. Zkontrolovat veřejné API a zobrazené datum.
7. Ručně ověřit celý katalog nejméně týdně. Neověřené fondy nepublikovat; při podezření nastavit `published=false` v Supabase. Záznamy starší než 14 dní jsou automaticky skryté pro nové srovnání. Uložený přehled zachovává datový snapshot a jeho datum; uložením změn přijme čerstvá ověřená data.

## Struktura importu (schéma, nikoli data)

Kořen je `{ "records": [...] }`. Každý záznam obsahuje:

- `ticker`, `name`, `exchange` (přesně `NYSE Arca`), `index`, `expenseRatioPercent` (číslo v procentech), `dividends`, `description`;
- `verifiedAt` (ISO čas), `dataAsOf` (datum), `verifiedBy`;
- `sources`: pro každé pole `name`, `exchange`, `index`, `expenseRatioPercent`, `dividends`, `description` alespoň jeden objekt `{field, url, verified_at, as_of, evidence}`. Zdroj burzy musí být na nyse.com nebo na explicitně povolené doméně příslušného emitenta pro daný ticker. Emitentský důkaz musí výslovně uvádět ticker i NYSE Arca; všechny kontroly musí být alespoň tak nové jako `verifiedAt`;
- `usageReview`: `{approved: true, reviewedAt, reviewer, basis, policyUrl}`. Vyplnit skutečné rozhodnutí provozovatele a jeho podklad, nikoli automaticky potvrdit; varianta operator-publication-decision je popsaná níže.

Datum nesmí být budoucí, ověření nesmí být starší než 14 dní. Jeden JSON nemůže obsahovat duplicitní tickery. Publikace má přednostně projít testovacím projektem.

## Budoucí automatizace

Původní MVP automatický import výslovně odložilo. Nyní je implementovaná synchronizace dostupných polí TickerInside, s kandidátní vrstvou a výslovně schválenými aktualizacemi nákladovosti. Denní retenční Cron zůstává; týdenní ETF Cron je připraven pouze pro budoucí Production. Aktuální údaje (index, nákladovost, dividendová politika) kontrolovat týdně a při oznámené změně. Denní režim má smysl až pro dynamické údaje jako NAV, které nyní nesbíráme.

Automatizaci doplnit až pro dokumentované API nebo export s povolením zpracování a zveřejnění. Adaptér bude ukládat návrh změn, ověřovat identitu/typy/rozsahy/datum a neočekávané změny vyžadovat ruční schválení. Cron bude autentizovaný, idempotentní, s limity a auditním výsledkem; při chybě nikdy neoznačí stará data za právě ověřená a nepřepíše je neúplnou dávkou.

## TickerInside: ověřený hlavní automatický zdroj

Oficiální dokumentace: https://tickerinside.com/api/. Dokumentovaný endpoint `GET https://tickerinside.com/api/v1/fund/{ticker}.json` používá ticker malými písmeny. Nepotřebuje API klíč. Skutečné odpovědi pro všech 20 kandidátů a jejich omezení jsou v [TICKERINSIDE_AUDIT.md](TICKERINSIDE_AUDIT.md).

Automaticky získáváme ticker, název, burzu, nákladovost v procentech, typ jejího zdroje, případné datum a URL SEC filing a atribuci. Hodnota 0.03 znamená 0,03 %, nikoli 3 %; null nikdy není nula. `as_of` je datum cen a `holdings_as_of` datum holdings, nikoli datum nákladovosti. Používáme jen `expense_ratio_as_of` pro nákladovost; chybějící datum ponecháme null v kandidátní vrstvě. `checkedAt` je náš čas technické kontroly API, nikoli nové lidské ověření fondu.

API index, dividendovou politiku a požadovaný popis pro těchto 20 fondů neposkytuje. Index a dividendová politika se doplňují a schvalují jako jednotlivé ověřené emitentské fakty; český popis je vlastní stručný text projektu. Dividendový výnos ani kategorie fondu je nenahrazují. SCHB/SCHD/RSP stále potřebují schválení dalších primárních emitentských zdrojů. TickerInside je nyní původ poskytovaných metadat, SEC případný podklad; validátor ale přijímá důkaz NYSE nebo jednoznačný doklad příslušného emitenta a ostatní pravidla ruční publikace.

### Licence a atribuce

Aktuální kontrola načetla https://tickerinside.com/api/ a https://tickerinside.com/api/index.md i všech pět prioritních JSON. Dokumentace uvádí aktuální fund soubory pod CC BY 4.0, trvalou licenci již publikovaných vlastních příspěvků, uchování aktuálních kopií, atribuci na stránku fondu a nejvýše jedno načtení za nightly build. Identifikující User-Agent je doporučen a adaptér ho používá; dvě souběžná načtení a nejvýše jedna dávka za UTC den, běžně týdně. Dokumentace pro identifiers.exchange výslovně uvádí Nasdaq Trader directory jako upstream; neprezentujeme jej jako údaj získaný přímo od NYSE ani jako sublicenci celé cizí databáze. Rozsah pro MVP: ticker/name/identifiers.exchange/expense_ratio a data poplatku; nikoli FIGI/ISIN/CUSIP, holdings, ceny, history nebo flows. API označuje celé odpovědi license=CC BY 4.0; tato deklarace není nezávislé oprávnění k cizím chráněným dokumentům. Provozovatel následně doložil nezávislé otevření a ověření https://tickerinside.com/legal/ (revize 9. 10. 2026), https://tickerinside.com/terms/ a https://tickerinside.com/api/. /legal/ výslovně potvrzuje CC BY 4.0 pro vlastní práci TickerInside v aktuálních API snapshotech včetně komerčního použití s atribucí; aktuální /api/v1/fund/ soubory pod tento režim patří. Evidence označuje skutečný původ tohoto ověření od provozovatele, nikoli nové HTTP načtení AI. Licence automaticky nepokrývá práva třetích stran.

Při veřejném použití zobrazujeme odkaz TickerInside na stránku konkrétního fondu, označení CC BY 4.0, odkaz na licenci a informaci o adaptaci dat. Nikdy nevkládáme providerovo cite_html jako HTML. Licence poskytovatele se nevztahuje na cizí práva k holdings/cenám; tato data vůbec neuchováváme. History/flows mají odlišné podmínky, a jejich endpointy nepoužíváme. Market_data bez datovaného SEC podkladu neaktualizuje veřejnou nákladovost. Před rozšířením použití znovu zkontrolovat podmínky; API nezaručuje správnost dat.

### Bezpečné uložení a aktualizace

Nová migrace `202610110004_etf_sync.sql` přidává tabulky etf_sync_candidates, etf_sync_runs, etf_sync_lease a opt-in sloupec etfs.tickerinside_sync_enabled (výchozí false). Neobsahuje seed a nemění původní migrace. Nové tabulky i RPC jsou nepřístupné anon/authenticated.

Validní odpovědi upsertujeme podle tickeru do kandidátů, oddělených od katalogu. Chybné odpovědi zanechají poslední platný snapshot. Chyby mají pevné kódy bez secrets. Každý běh má audit a dvouminutový lease; souběžný běh se odmítne, další běh v témže UTC dni nenačítá API. Opakované dokončení je idempotentní. Přerušený běh se označí jako failed při další zahajovací kontrole po expiraci lease. Schválené pole se nikdy nemaže při chybě jednoho fondu.

Ve veřejném katalogu je možné automaticky měnit pouze nákladovost (a její zdrojové doklady), a to u již publikovaného fondu se schváleným usage_review, úplnými doklady a výslovným tickerinside_sync_enabled=true. Název musí odpovídat, fond musí být čerstvě lidsky ověřený, zdroj musí být SEC filing s datem alespoň tak novým jako dosavadní podklad nákladovosti. API nákladovost je po případné úlevě, nikoli automaticky gross; tuto metodiku musí schvalovatel přijmout před opt-in. Zdroj SEC citovaný API není tímto během nezávisle znovu čten.

published, verified_at, data_as_of, název, burza, index, dividendy a popis v hlavní tabulce zůstávají zachované. Proto jsou nutné další kontroly ručně doplněných polí; celkové lidské ověření po 14 dnech dál vyřadí fond z nových srovnání. Týdenní stažení API neprodlužuje lidské ověření. Přístupový srovnávač zachovává vlastní snapshot.

IVV/ITOT/IWM v současné databázi jsou podle uživatele nepublikované předběžné záznamy: synchronizace je nepublikuje ani nemění. Kandidáty a úplné ověřené záznamy musí operátor zkontrolovat a připravit validovaný ruční import. Teprve po schválení lze povolit aktualizaci nákladovosti. Tento proces zatím sám nenaplní veřejný katalog 15–20 úplnými ETF.

### Ruční spuštění v Preview přes prohlížeč

Dočasná stránka `?admin=etf-sync` umožňuje vlastníkovi schránky `SMTP_USER` po jednorázovém potvrzení přihlašovacího odkazu spustit stejný import. Vyžaduje samostatnou migraci `202610110005_preview_admin.sql`; přesný postup je v `docs/SETUP.md`. Zabezpečení, licence, kontrola dat, denní limit, zámek a zákaz automatického publikování zůstávají zachovány. UI reportuje kandidáty, nikoli počet schválených nebo zveřejněných fondů.

## Prvních pět fondů: schválená demo dávka, zápis čeká

SPY/VOO/IVV/VTI/IWM mají finální validní import v `data/priority-five.approved.json`. Provozovatel výslovně přijal omezené faktické demo a publikaci všech pěti; manifest `data/review/priority-five.demo-approval.json` zapisuje admin, skutečný čas přípravy a známá omezení. Technická kontrola vychází z již stažených doložených podkladů, ne nového smyšleného právního/lidského auditu. Původní pending/evidence se zachovávají beze změny a pending nadále neprojde importem. Rozpory SPY 0.0945 % / API 0.09 % a aktuální VTI Morningstar jsou zachované. Konkrétní poslední krok správce, dry run a ověření veřejného katalogu: [CATALOG_REVIEW.md](CATALOG_REVIEW.md).

Emitentská alternativa listingu je nyní implementována pro fondy SSGA, Vanguard (včetně fund-docs) a iShares uvedené v mapě validátoru. TickerInside není samostatným publikačním důkazem burzy. BlackRock/ICE jsou povolené pouze pro policyUrl právní kontroly, nikoli automaticky jako finanční datové zdroje. HTTP dostupnost nebo zařazení domény do allowlistu není schválení licence.


## Metodika tickerinside-primary-v1

Nová pětice eviduje sedm polí včetně tickeru. Každý zdroj má role=origin/verification/authored a provider=tickerinside/issuer/project/sec. Origin znamená skutečný původ hodnoty; verification je kontrolní dokument, nikoli tvrzení, že jeho licence poskytla právo k převzatému API údaji. Authored je povolené jen pro původní popis v tomto repozitáři. TickerInside origin musí mít konkrétní fund endpoint, CC BY 4.0 a patřit k poli, které skutečně poskytuje. Každé pole musí mít původ, samotný verification nestačí. Staré schválené importy/snapshoty i synchronizační doklady zůstávají kompatibilní.

Sources JSON navíc uchovává retrieved_at a date_basis: provider_filing_date pro datované API náklady, observed_state pro skutečně pozorovaná metadata bez historického data. as_of u observed_state znamená den pozorovaného stavu, nikoli nedoložené datum účinnosti. API as_of cen se nepoužívá pro metadata. verified_at označuje skutečně provedenou technickou kontrolu pod přijatým dávkovým rozhodnutím. Rozhodnutí o použití se eviduje samostatně v usageReview; ověřování faktů není reprodukce celého díla a link není blanket licence.

Malý batch manifest nahrazuje ruční přepisování zdrojových ID, dat a opakovaných kontrolorů jedním výslovným potvrzením přesného návrhu (SHA-256), vybranými tickery, skutečným kontrolorem/časem a doloženým usageReview. Pokročilý per-fund manifest dál funguje. Podrobný postup a zbylé právní otázky: CATALOG_REVIEW.md. Databázová migrace není potřebná: doplňující evidence zůstává v existujícím sources JSONB.


### Rozhodnutí provozovatele pro omezené demo

Validátor nevyžaduje právní audit jednotlivých veřejných faktů: vyžaduje doložená data/licence a explicitní rozhodnutí. Nová dávka má `usageReview.approvalType=operator-publication-decision`, `issuerPermissionClaimed=false` a povinná neprázdná limitations. `approved=true` je přijetí použití a publikace provozovatelem, nikoli důkaz udělené licence emitentem. Tyto položky se ukládají do existujícího JSONB, bez migrace; staré schvalovací formáty zůstávají podporované. Domény, původ sedmi polí, výslovný důkaz NYSE Arca, data/freshness, hodnota a duplicity se stále kontrolují. TickerInside deklarace CC BY 4.0 se nepřenáší na emitentská doplnění.


## Historická výkonnost pro kalkulačku

Aktuální fund JSON poskytuje r1/r3/r5 jako kumulativní dividendově upravené výnosy, datum cen as_of a volitelnou weekly řadu. Pro pět publikovaných fondů byly všechny tři výnosy skutečně načtené. Používáme vypočtené kumulativní údaje a nově také dokumentované licencované weekly total returns z aktuálního CC BY 4.0 snapshotu; raw cenová historie, holdings a history/flows nejsou veřejně redistribuovány. Weekly jsou desetinné zlomky a mají explicitní dokumentovaný časový rastr, nikoli raw indexové ceny. Nezaměňovat CC BY vlastní práce poskytovatele s právy třetích stran nebo licencí k původnímu price feedu. Konkrétní hodnoty, atribuce, keš, datová omezení a výpočty: [PERFORMANCE.md](PERFORMANCE.md), redukovaná evidence `data/review/performance-observations.json`. Nejde o nový právní schvalovací systém. Tato funkcionalita nezasahuje do datových řádků Supabase ani synchronizačních pravidel.


Historický graf je ETF alternativa, nikoli indexová historie. Týdenní výnosy všech pěti byly ověřeny ze skutečných existujících API odpovědí, 156 bodů a weeks_end=as_of. Zdroj a adaptace/normalizace jsou v grafu viditelné, null se nevyplňuje ani nepřeklenuje. Detailní datování/licenční rozdíl vůči raw price feedu a skutečná dostupnost 1/3/5 let: [PERFORMANCE.md](PERFORMANCE.md). Automatické načtení dál nepublikuje nové fondy ani nemění zdrojové schválení katalogu.
