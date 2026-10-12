# Historický a hypotetický vývoj investice

## Dostupné skutečné zadání

Výňatky posledního promptu:

> Pět ETF (SPY, VOO, IVV, VTI, IWM) už je publikovaných v Supabase a zobrazuje se na webu.

> Nikdy nepovažuj `r3` ani `r5` za roční procentní výnos.

> Neznámé nebo `null` výnosy zobraz jako „Data nejsou dostupná“, nikdy jako 0 %.

> Z historických total return údajů ani z výnosů NAV automaticky znovu neodečítej expense ratio, aby nedošlo k dvojímu započítání nákladů.

> Ověř licenční podmínky konkrétních výnosových dat; licence TickerInside neznamená automaticky práva k původním cenovým řadám. Nezveřejňuj raw cenové historie od třetích stran bez oprávnění.

> Commitni a pushni na `design-exploration`.

Zadání dále požaduje historické výnosy r1/r3/r5/as_of, vlastní scénář 1–30 let, složené úročení a graf, explicitní případné převzetí CAGR, měnové upozornění, zachování nákladů/SMTP/souhlasů, server/keš, dokumentaci a ověření. Nedoplňovaly se fiktivní starší prompty ani lidské právní schválení. Žádní další agenti nebyli použiti.

## Skutečná kontrola zdroje

V této úloze skutečně HTTP načteno pět fund JSON a dokumentace /api/. Všichni poskytují r1/r3/r5/as_of, CC BY 4.0 a neprázdnou weekly; ceny jsou k 9. říjnu 2026. Přesné redukované hodnoty, čas stažení a SHA-256 v data/review/performance-observations.json. Plné zdrojové odpovědi jen v ignorované cache, do Gitu nepatří. Dokumentace byla textově zkontrolována: cumulative total returns, not annualised, dividend-adjusted closes, as_of cen, raw price feed nesmí být redistribuován.

Pro vlastní vypočtené údaje aktuálních snapshotů dokumentace deklaruje CC BY 4.0 s atribucí a odlišuje historii holdings/flows. Dřívější nezávislé ověření provozovatele /legal/, /terms/, /api/ a revize 9. 10. 2026 zůstává podkladem licenční evidence. Doplňkový síťový pokus otevřít /legal/ v této úloze skončil HTTP chybou; nevydává se to za neplatnost ověření provozovatele nebo za novou licenční blokaci. Rozsah se nerozšiřuje na third-party raw feed. Weekly, raw ceny, holdings ani cenové historie se nepublikují. Žádný nový právní schvalovací systém.

## Změny a důvody

- shared/performance.ts: přesné kumulativní hodnoty, CAGR a řada vlastního složeného úročení; validace záporných sazeb včetně −100 %, null, horizontu a částky.
- Server GET /api/performance pro pevnou pětici, validace identity/NYSE Arca/licence/datum/čísel, pětisekundové timeouty, sekvenční fetch, identifikující User-Agent, 24hodinová memory/CDN keš, single-flight. Při výpadku pravdivý partial/stale s původním datem nebo 503; opakované úplné selhání nepálí zdroj každým requestem na stejné instanci. Žádné klientské URL/klíče nebo Supabase mutace. Cold start a regiony mohou znovu načítat; netvrdí se globální exactly-once refresh.
- Frontend společná částka se srovnávačem, historie 1/3/5 let, konkrétní ETF, datum a zdrojové/CC odkazy. Kč model výslovně ignoruje USD/CZK. Žádná interpolovaná historická cenová křivka. Hypotetický roční předpoklad je prázdný, ne pevný fallback; samostatný vlastní graf a textové hodnoty. CAGR se použije jen po kliknutí s upozorněním NE predikce. Null/výpadek nezablokuje vlastní scénář.
- Původní expense ratio zůstává oddělená menší sekce, ne faktura ani další odpočet z historických total returns/NAV. Přesné SPY a VTI katalogové hodnoty nezměněny. Částka a vybrané ETF nadále používají existující uložený průchod; roční předpoklad/horizont jsou lokální pracovní nastavení, nikoli nová DB funkce.
- Lokální dev adapter a maxDuration 60 s pro nový endpoint; žádná nová env/migrace/služba/dependency. NodeNext .js importy a runtime/official builder regression zachovány pro všech deset funkcí.

## Kontroly a opravy

První celý lint/typecheck/48 testů/build prošel. Později přidaný test endpointu měl TypeScript upozornění na částečnou HTTP fixture; explicitně zúžen přes unknown, nepoužito any. Pět cílených performance testů prošlo, následně celý test suite obsahuje 49 testů. Browser suite prošla pro původní srovnávač, archivní varianty, mail-failure, prázdný katalog, uložené výběry/částky, analytiku/revokaci a cookie ochrany i Preview admin. Nová sada ověřila reálné redukované výnosy nad izolovaným API, kumulativní 3 roky, záporný vlastní scénář, explicitní převzetí CAGR, null/outage bez fallback, zdroje/FX, expense ratio a jediný performance request při ovládání. Šířky nového UI 320/390/1440 px, původní sada až 768/1100 px. Žádné browser API fixture nejsou důkazem vzdáleného doručení nebo Supabase zápisu.

Oficiální Vercel Node builder prošel pro všech deset artefaktů a mutation regresi chybného .ts importu. Doplněna kontrola veřejného endpointu: POST nedosáhne zdroje, úspěšný GET má cache hlavičku a nepředává weekly/holdings/last_close. Lokální screenshot pořizovaný před doplněním ukládání neexistoval; zopakována jen nová browser sada se screenshoty a vizuálně prohlédnut 320px scénář. Drobné mobilní SVG osové popisky zvětšeny; poslední build a cílená browser kontrola následovaly tuto CSS úpravu.

Finálně prošly lint, typecheck, celý suite 49/49 bez skipped, produkční build včetně všech deseti runtime endpointů a cílená mobilní browser kontrola po úpravě SVG popisků. Žádné skutečné e-maily, remote DB zápisy/migrace ani cloudové změny nebo ruční deployment. Git autor se před commitem ověří v lokální konfiguraci. Push sám není důkazem úspěšného Vercel deploymentu; dostupnost veřejného Preview se uvádí odděleně.
