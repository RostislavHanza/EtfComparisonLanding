# Model hrubého výnosu s průběžnými náklady a požadované texty

Výchozí commit `54da53cf35e2fe3a9fd93ecf7890cfee3378f361`, pouze `design-exploration`.

## Skutečný dostupný prompt — označené výňatky

> Procento, které uživatel ručně zadává do tabulky, představuje předpokládané roční zhodnocení před odečtením modelovaných průběžných nákladů ETF.

> Pokud uživatel zadá roční výnos 0 %, odhadovaný zisk musí být záporný, pokud má ETF kladnou nákladovost.

> Proto při předvyplňování procent podle historie použij konzistentní přepočet na modelovaný výnos před náklady, aby následné uplatnění nákladů ve výpočtu nevedlo k jejich dvojímu odečtení.

> netFactor = (1 + assumedGrossReturn / 100) * (1 - expenseRatioPercent / 100)
>
> futureValue = investment * netFactor ** horizonYears
>
> estimatedProfit = futureValue - investment

> assumedGrossReturn = (((1 + historicalAnnualizedNetReturn / 100) / (1 - expenseRatioPercent / 100)) - 1) * 100

> Procenta jsou předvyplněna podle historické výkonnosti.

> Zaslat srovnání na mail

> 01 / Výběr ETF

> Zadejte Email pro zaslání osobní interaktivní kalkulačky

> Neprováděj vzdálené databázové zápisy ani skutečné odesílání e-mailů.

> Commitni a pushni pouze na `design-exploration`. `main` neměň.

Jde o skutečné výňatky, nikoli celý prompt. Další výslovné požadavky: zachovat jedinou silnější čáru, odstranit nadměrnou mezeru na desktopu i mobilu, nezávislost A/B a historická data grafu, ruční procenta/obnovu, žádná neověřená data ani nákladovost, žádné další funkce/texty/design. Požadované lint/typecheck/testy/build/browser kontroly, dokumentace a příklady výpočtu.

## Změny

- scenarioProfit nově vyžaduje skutečnou nákladovost fondu; každý rok použije násobný čistý faktor z promptu. Nový grossReturnFromNet převádí čisté CAGR na hrubý modelový předpoklad, poté se předvyplní původní dvoudecimální vstup. Nejde o tvrzení skutečného historického hrubého výnosu, ale o inverzi tohoto modelu s aktuální nákladovostí.
- Žádná výchozí nulová nákladovost: neznámé/neplatné náklady vrátí null, stejně jako chybějící historický předpoklad. Explicitní nulová nákladovost je platná. Zdroj je již schválený EtfRecord.expenseRatioPercent mapovaný z expense_ratio_percent; SPY nadále používá přesných 0,0945 %.
- U modelu se změnil pouze předpoklad a uplatnění nákladů. Historický graf, jeho body, nezávislý stav B, datové API/keš ani e-mailový přístup se neměnily. A/Obnovit používají inverzní hrubou sazbu aktuální reference; ruční editaci nadále zachovává změna částky/horizontu/B.
- Přesné nové labely a jediná krátká věta ve společném řádku. Sloupec je přesně Odhadovaný zisk; záporné částky/červené pruhy zůstávají. V původní rozbalovací metodice aktualizována jen stávající modelová rovnice, bez přidávání dalších vysvětlujících vět. Dokumentace popisuje matematiku a zaokrouhlení.
- Změřena skutečná mezera: první zmenšení padding/margin vyřešilo mobil (16 px), ale desktop měl stále 224,875 px, protože pravý grid blok byl natažen na výšku hero. Align-self:end odstranil nevyužitý prostor pod kroky; výsledný browser test vyžaduje nejvýše 24 px na všech šířkách. Jediný 3px oddělovač zachován.

## Ověřené příklady

Vklad 100 000 Kč, ruční hrubá sazba 0 %:

| ETF | Nákladovost | Zisk za 1 rok | Zisk za 10 let |
| --- | --- | --- | --- |
| SPY | 0,0945 % | −94,50 Kč | −940,99 Kč |
| VOO | 0,03 % | −30,00 Kč | −299,60 Kč |
| IWM | 0,19 % | −190,00 Kč | −1 883,84 Kč |

Příklady byly skutečně spočítány sdílenou funkcí. Izolovaný matematický test (nikoli historický údaj konkrétního ETF): čistý kumulativní výnos 33,1 % za 3 roky, nákladovost 0,03 %, čisté CAGR 10 %, inverzní hrubá sazba 10,03300990297089 %, nezaokrouhlený výsledný zisk 33 100 Kč. UI používá dvě desetinná místa, a proto může mít malou odchylku; ta není druhým poplatkem.

## Výsledky kontrol

- Lint a typecheck prošly. Unit/backend/SQL suite 63/63: náklady při 0 %, různé skutečné sazby, horizonty 1/3/5/10/20, záporné výnosy a −100 %, nulový vklad/náklady, neplatné sazby/horizonty, null/neplatné náklady a historický round-trip bez dvojího odečtu pro všech pět ETF a období 1/3/5. Žádné skutečné databázové zápisy/e-maily.
- Produkční build a check:server prošly pro všech deset emitovaných Node.js API endpointů. Check:vercel zkontroloval všech deset oficiálních Node.js 24 artifacts a regresi chybného TS runtime importu. Lokální build se nevydává za ověření nasazeného endpointu.
- Celá browser suite proti lokálnímu buildu prošla. Přesné texty a jeden oddělovač/měřená mezera na 320–1440 px; kalkulačka na 320/390/1440 px včetně 0 % v 1/3/5/10/20 letech a skutečně odlišných nákladů SPY/VOO; záporné pruhy, hrubé předvyplnění podle historie, ruční editace/obnova, nezávislé A/B, jediný i více fondů, null/outage a žádné zbytečné performance requesty. Také výběr/stránkování, uložený opakovaný e-mailový odkaz, odmítnutí neoprávněného přístupu, chybové/pending SMTP stavy, privacy/odvolání, admin a atribuce.
- Diff zkontrolován, nezjištěny hodnoty tajných environment variables. Autor z lokální Git konfigurace ověřen jako RostislavHanza a GitHub noreply; globální konfigurace beze změny.

Žádná nová migrace, environment variable, služba nebo datový zdroj. Žádný vzdálený zápis, skutečné odeslání ani ruční deployment. Preview po push není v této úloze vzdáleně ověřené.
