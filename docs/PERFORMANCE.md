# Model investice a skutečný historický vývoj ETF

## Pořadí a ovládání

Výběr 2–5 ETF → e-mail → automatické serverové ověření odkazu → částka (číslo/slider) a horizont → společná tabulka zisku/ztráty všech vybraných fondů → historický graf s jediným přepínačem reference → podrobná tabulka → původní e-mailový průchod. Žádné přepínání Historie/Scénář, checkbox nebo tlačítko pro povolení editace. Dominantní graf nákladů odstraněn; expense ratio je u fondu i v tabulce a orientační roční náklad zůstal v tabulce.

Každý fond má rovnou editovatelné procento. Automatický předpoklad je CAGR skutečného kumulativního r1/r3/r5:

`((1 + cumulativeReturn / 100) ** (1 / referenceYears) - 1) * 100`

Vstup se předvyplní zaokrouhleným tempem na dvě desetinná místa; právě tato viditelná sazba je modelový vstup. Model = `investment * (1 + annualAssumption / 100) ** horizonYears`, zisk = model − vklad. Hlavní částka je pouze tento zisk/ztráta, kladné mají znaménko +, nikoli celková budoucí hodnota. Pruhy sdílejí lineární doménu od min(0, zisky) do max(0, zisky); společná nula správně rozlišuje zelené zisky a červené ztráty. Null nemá pruh, nula má nulovou délku. Funguje i jediný fond (e-mail nadále vyžaduje 2–5). Horizont (1/3/5/10/15/20 let) a referenční období (1/3/5 let) jsou odlišné parametry. Výchozí období 5 let a horizont 10 let nejsou předpověď.

Ručně upravená sazba každého fondu přetrvá změnu částky a horizontu i cestu do e-mailového formuláře a zpět. Jediný přepínač referenčního období 1/3/5 let přímo nad historickým grafem záměrně resetuje všechny ruční sazby na CAGR nové reference, zároveň změní graf a zisky, ale zachová horizont. Jediné společné tlačítko Obnovit podle historie pod tabulkou obnovuje sazby všech vybraných fondů. Společné záhlaví, jeden popisek a jedna obnova nahrazují opakované popisky v jednotlivých řádcích. Na mobilu zůstávají tři kompaktní sloupce, ticker/numerický vstup/zisk a pruh; plné názvy v řádkovém záhlaví jsou dostupné čtečkám a viditelné v detailním srovnání. Vyprázdnění vstupu je také ruční volba. Bez rN je vstup prázdný, žádné 0 % nebo pevný fallback; vlastní sazba funguje i při výpadku historie. Povolené rozmezí −100 až 100 %, neplatné/blank výsledky se nevydávají za poslední platný model. Modelové sazby/horizont jsou lokální stav této návštěvy; e-mailová DB nadále uchovává původní ETF výběr a částku, nikoli nové parametry. Nová navigace/reload osobního odkazu je znovu předvyplní podle historie.

## Výkonnost a náklady

Podklad je dividendově upravená tržní výkonnost ETF, nikoli hrubá indexová řada nebo garantovaný NAV výnos. Průběžné náklady už ovlivňují hodnotu fondu, a tedy jeho tržní výkonnost; neodečítáme expense ratio podruhé. Ruční sazba je předpoklad **po průběžných nákladech ETF**. Broker, daně a měnové změny zahrnuty nejsou. Model v Kč pouze aplikuje procento USD podkladu na nominální vklad, není to historicky dosažený korunový výnos. Původní výpočet amount × expense ratio / 100 je jen tabulkový doplněk, nikoli faktura.

Viditelné upozornění: „Výchozí předpoklad vychází z historické výkonnosti ETF. Jde o modelový scénář, nikoliv předpověď. Minulé výnosy nezaručují budoucí výsledky.“ Podrobnosti jsou v rozbalovací metodice, atribuce zůstává viditelná.

## Skutečný zdroj a dostupná období

Dokumentované https://tickerinside.com/api/v1/fund/{ticker}.json, reference https://tickerinside.com/api/. Evidence skutečně načtených redukovaných odpovědí, URL, časů a hashů v `data/review/performance-observations.json`. Pro všech pět jsou r1/r3/r5 kumulativní procenta:

| ETF | 1 rok | 3 roky | 5 let | Datum cen |
| --- | --- | --- | --- | --- |
| SPY | 20.5 % | 87.1 % | 86.7 % | 2026-10-09 |
| VOO | 20.5 % | 87.5 % | 87.2 % | 2026-10-09 |
| IVV | 20.6 % | 87.5 % | 87.2 % | 2026-10-09 |
| VTI | 20.0 % | 85.8 % | 77.4 % | 2026-10-09 |
| IWM | 18.5 % | 69.4 % | 31.8 % | 2026-10-09 |

Všechny poskytují také **156 weekly total returns, jako desetinné zlomky, nejstarší první**, ve společném týdenním rastru s `weeks_end=as_of`. −0.0239 znamená −2.39 %, nikoli −0.0239 %. Tuto vypočtenou licencovanou řadu lze použít; není to raw historický cenový feed. Žádné nové načtení nebylo předstíráno: použity skutečné odpovědi uložené při předchozím kroku v témže datovém snímku. Runtime je obnovuje existující keší.

Graf pro 1 rok bere posledních 52 týdenních změn; pro 3 roky celých 156. Pro reference 5 let se může použít r5 při výpočtu CAGR, ale graf má jen dostupných 156 týdnů, ne vymyšlených pět let. UI to výslovně uvádí. Při plné dostupnosti jde o základ k 13. 10. 2023 a poslední týden k 9. 10. 2026; 157 bodů obsahuje normalizační základ a 156 skutečných výnosových intervalů. Zdrojové r3 se může od součinu zaokrouhlených týdenních výnosů mírně lišit.

### ETF, nikoli indexy

Dokumentované fund API neposkytuje samostatné indexové časové řady S&P 500, Russell 2000 nebo Morningstar US Total Market Index. `/index.json` je seznam souborů/fondů, nikoli cenová historie indexu. V dostupných podkladech nebyl doložen společný bezplatný indexový zdroj s právem k veřejné redistribuci všech tří indexových řad. Nepoužíváme domnělé indexové endpointy, placené služby nebo tabulkové souhrnné indexové výnosy jako časové řady.

Transparentní alternativa je **Historický vývoj ETF** s vlastní křivkou každého vybraného ETF. SPY/VOO/IVV mohou být podobné, jsou to odlišné ETF series a nepředstírají tři samostatné indexy. VTI historie může zahrnovat jiný benchmark před nynějším Morningstar; není to zpětná historie jediného současného indexu.

### Normalizace, datum a mezery

Hodnota začíná na 100, pak se násobí `value *= (1 + weeklyReturnFraction)`. Nejde o interpolaci mezi souhrnnými r1/r3/r5 ani graf budoucího scénáře. Čáry spojují pouze skutečné týdenní body; žádné denní hodnoty se nevytvářejí. Baseline 100 je matematická normalizace, nikoli zdrojová cena.

Dokumentace říká týdny sobota–pátek a poslední interval zakončený as_of. Kalendářní konce týdnů jsou deterministicky přiřazené podle tohoto dokumentovaného rastru; někdy je skutečný obchodní závěr ve čtvrtek kvůli svátku. Tooltip proto říká **Týden končící**, nikoli „cena zobchodovaná přesně v tento den“. Poslední částečný týden zachovává skutečný as_of. Graf neobsahuje raw obchodní datum/cenu, kterou API neposkytlo.

Null se nenahrazuje nulou a přes mezeru se výnos nenásobí. Používá se společný souvislý úsek po poslední chybějící hodnotě; délka/skutečné hranice jsou v UI. Pokud společný úsek chybí, křivka se nezobrazí a text vysvětlí dostupnost. Neúplná/špatná weekly nemůže zničit jinak validní rN/model: normalizátor vrátí prázdnou historii s historyUnavailable.

## Licence a keš

API dokumentace výslovně popisuje current fund JSON s vypočtenými weekly returns pod CC BY 4.0. Nezávislé ověření /legal/ (revize 9. 10. 2026), /terms/ a /api/ od provozovatele zůstává evidované v priority-five.evidence.json. Povolení k vlastní vypočtené práci TickerInside není automatická licence k původnímu third-party price feedu. Proto se **nepublikují raw ceny, last_close, holdings, historie holdings/flows ani indexové časové řady**. Graf použitím weekly neobchází zákaz redistribuce price feedu přejmenováním: konkrétní vypočtené weekly pole je přímo součástí deklarovaného licencovaného snapshotu. Zdrojový odkaz, fondová stránka, CC BY a označení normalizace zůstávají viditelné. Nové právní schvalování se nevytváří.

GET `/api/performance?comparison=ID` vyžaduje platnou session daného srovnání a stále používá pevný seznam pětice, ověřuje identitu/NYSE Arca/licenci/datum a má pětisekundové timeouty, single-flight, serverovou upstream keš jeden den, HTTP private/no-store a kratší keš při partial/outage. Nově vrací ověřené `weeklyReturns` s weekEnd/returnFraction. Nikdy provider HTML, raw ceny nebo holdings. Klient používá `?schema=3&comparison=ID`, aby neměl předchozí CDN formát bez řady; parametry nemění upstream URL. Slider/procenta/reference/horizont nic nově nestahují. Keš není globální trvalé úložiště; cold start/region může znovu načítat. Stale zachovává původní datum a má viditelnou informaci.

Výpočty a zdroje se nemění. E-mailová brána nově vyžaduje migraci 008 pro opakovaně použitelný odkaz nezávislý na původní session; žádné nové env nebo dependencies. Vercel NodeNext importy a kontroly všech deseti endpointů zůstávají.

## Praktický Preview test

Nejprve otevřete platný e-mailový odkaz; na veřejné stránce kalkulačka není. V otevřeném srovnání vyberte fondy, nastavte částku a horizont. Všechna procenta jsou okamžitě editovatelná. Přepište SPY na 6 a VOO na −10; změňte částku/horizont: ruční procenta se nemění. Při vkladu 200 000 Kč a horizontu 3 roky musí VOO ukázat −54 200 Kč, nikoli 145 800 Kč. Pruhy mají společnou nulu a ztráta je červená. Klikněte pod tabulkou na Obnovit podle historie: sazby všech vybraných fondů se vrátí na aktuální CAGR. Přepněte u grafu historii: obě sazby se obnoví podle nové reference a graf změní rozsah, horizont zůstane. Zkontrolujte jediný fond, chybějící historii, vlastní nulový/záporný vstup a neplatné hodnoty.

Pod pruhy očekávejte historický ETF graf s legendou, skutečným rozsahem a normalizací 100. Posouvejte prst/myš nebo klávesnicí slider Prohlédnout historický týden: tooltip ukáže týden a hodnoty všech křivek. Změna vybraných fondů/ref aktualizuje řady; 5 let ukazuje pravdivý 156týdenní limit. Detailní tabulka, zdroje, nákladovost a následný e-mailový krok zůstávají pod grafem. Síťový panel má jediné načtení balíku performance, žádné fetch na změnu částky.

Browser testy mají izolované skutečné redukované odpovědi, bez DB zápisů a skutečných e-mailů. Push není potvrzení živého Preview deploymentu.
