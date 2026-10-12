# Dokončení RSP, SCHB a SCHD

Výchozí commit e4ef04c2706e5034a873a71604b7daa6687e23ff, pouze design-exploration. Správce v aktuálním zadání potvrzuje již publikovaných 17 fondů. Historické evidence předchozí blokace se nepřepisují jako údajně úspěšné staré kontroly.

## Skutečný prompt — označené výňatky

> Cílem je dokončit ověření těchto tří fondů a připravit jejich import stejným způsobem jako předchozích 17 ETF.

> Neměň design webu, kalkulačku ani ostatní funkcionalitu.

> U každého ETF ověř přímo z aktuálních oficiálních zdrojů emitenta: přesný název, ticker, burzu NYSE Arca, sledovaný index, roční nákladovost, frekvenci distribuce dividend.

> Uvedené hodnoty ber jako údaje k ověření, nikoliv automaticky jako potvrzené skutečnosti.

> Pokud přímý přístup na stránky opět vrací HTTP 403, zkus jiné veřejné oficiální dokumenty emitenta, například produktový factsheet nebo prospekt. Neobcházej technické blokace neoficiálními proxy a nepředstírej, že zdroj byl ověřen.

> Připrav nový samostatný importní JSON pouze pro poslední úspěšně ověřené fondy, například: data/final-three.approved.json

> Současných 17 ETF neměň a nevytvářej duplicity.

> Neprováděj žádné vzdálené databázové zápisy ani skutečné odesílání e-mailů.

Jde o skutečné výňatky viditelného zadání. Ostatní požadavky: metadata/české popisy/zdroje/skutečné datování a oddělení publikace od faktické kontroly jako v minulých dávkách; historie 1/3/5, skutečné body a nákladový model; dry run, katalog/výběr/tabulka/graf/zdroje/mobil, lint/typecheck/testy/build/Vercel Functions, dokumentace. Viditelné zadání končí u „Připrav import k následnému prov“; chybějící text nebyl domýšlen. V práci se zachovává předchozí schválený workflow větve a commit/push; vzdálený import není prováděn.

## Skutečná ověření a omezení zdrojů

- Aktuálně znovu načteny všechny tři uživatelem uvedené oficiální profily: HTTP 200. Skutečné nové časy, SHA-256 a malé faktické výňatky v final-three.evidence.json; minulé CONNECT 403 jsou historické a dnes netvrdíme, že aktuální profily zůstávají blokované.
- RSP: přesný název/NYSE ARCA/ticker/benchmark/total i net expense ratio 0.2 a Distribution frequency: Quarterly ověřeny z veřejných HTML-embedded údajů produktu Invesco. Žádné interní dng API volání. Odkazovaný PDF URL vrátil HTML, nikoli PDF; nevydává se za přečtený factsheet.
- SCHB/SCHD: jméno/Symbol/Exchange NYSE Arca, Inc./Index Name/Total Expense Ratio 0.030/0.060 % přímo z produktového profilu. Čtvrtletní rytmus doložen skutečným emitentským ledgerem příjmových distribucí 12/10/2025, 03/25/2026, 06/24/2026, 09/23/2026. Nikoli podle nesouvisejícího výkonnostního ovládání Monthly/Quarterly a nikoli jen podle uživatelského předpokladu. Nejde o garanci budoucích částek/dividend nebo tvrzení o formálně přečtené prospectus policy.
- Pokusy o veřejné factsheety/prospekty: první odhadované resource cesty vrátily 404, poté použity skutečné odkazy z oficiálních profilů. Resource viewer stránky HTTP 200; jejich Bynder PDF host a regulatory Dfinview host blokovány síťovou bránou CONNECT 403. Obsah těchto PDF/prospektů nebyl ověřen. Žádná proxy, žádný obchvat; ověřené hodnoty pocházejí z dostupných vlastních produktových profilů.
- Konkrétní TickerInside odpovědi všech tří znovu načteny HTTP 200: CC BY 4.0, NYSE Arca/etf, r1/r3/r5, 156 weekly bodů a as_of/weeks_end 2026-10-09. Redukovaná evidence bez raw cen/holdings. SCHD API jméno bez interpunkce U.S. opraveno podle emitenta; nákladovosti se shodují.

## Dávka a minimální změny

- final-three.approved.json pouze tři záznamy. Pending technický návrh, digestem svázaný manifest, skutečná evidence a aktuální redukovaná historie ve final-three.* pod data/review.
- Stejné oddělení jako u 17: aktuální pokyn provozovatele připravit dávku v již přijatém omezeném faktickém modelu není tvrzením osobní lidské návštěvy zdrojů ani právním auditem. Admin je administrativní label; čas verifiedAt je skutečný technický krok AI. Final review/spuštění zápisu jsou samostatné kroky správce. Žádná smyšlená osobní identita, datum lidského potvrzení ani emitentské právní povolení.
- Přidány pouze oficiální domény invesco.com a schwabassetmanagement.com a příslušné tři ticker→issuer vazby v importním validátoru. Žádné oslabení ostatních pravidel zdrojů/licence/stáří/rozhodnutí/spoof domén. API zdroj polí odlišen od emitentských indexů/distribuce/opravovaného jména a vlastních popisů. Dosavadní licence/atribuce a výhrady práv třetích stran zachovány, nikoli nově právně schváleny.
- Žádná změna frontendového kódu, matematických funkcí, historického cache/loaderu, designu, e-mailů, cookies nebo analytiky. Změněn jen importní validator, data, dokumentace a regresní testy. Nová FINAL_THREE_CATALOG.md má přesný ruční postup; REMAINING_CATALOG.md uvádí současný stav a zachovává původní evidenci jako historii.

## Kontroly

- Dry run stávajícího import:etfs: 3 validní záznamy, žádný zápis. --apply nebylo spuštěno.
- První typecheck nového testu našel implicitní any v history.find. Opravena explicitní návratová typu normalizovaných historických záznamů; finanční data/validace nebyly kvůli testu upraveny.
- Lint/typecheck, 69 unit/backend/SQL testů a build prošly. Nové testy potvrzují emitentské údaje, digest/rozhodnutí, čerstvost a odmítnutí cizího emitenta/spoof domény; skutečná r1/r3/r5 a 53/157 bodů, hrubý/net nákladový round trip, 0 % → −200/−30/−60 Kč při 100 000 Kč za rok. Opakovaný upsert vede na 20 fondů bez duplicit, předchozích 17 a jejich zdroje/srovnání/kontakt zůstávají beze změny. Pouze lokální PGlite.
- Celá Chromium browser suite proti lokálnímu buildu prošla, včetně skutečných metadata/historických fixtures všech 20 na 320/1440 px. Ověřen jednotlivý RSP, společný výběr RSP/SCHB/SCHD, všechny tři křivky, red bars a nákladové výsledky, metadata/detail a zachování původního průchodu. API odpovědi jsou izolované fixtures, nikoli vzdálený import nebo SMTP test.
- Check:server i oficiální Vercel Node.js 24 builder načetly/provedly všech 10 endpointů, včetně regrese TS importu. Nejde o ověření nasazeného Preview runtime.
- Diff bez tajných hodnot; lokální Git autor RostislavHanza/GitHub noreply zkontrolován, globální konfigurace se nemění.

## Ruční dokončení

Po kontrole konkrétní dávky a správného projektu může správce provést stávající --apply podle FINAL_THREE_CATALOG.md a zkontrolovat `/api/catalog` s celkem 20 ETF. Žádná nová migrace, env nebo služba není nutná. V této práci nebyly měněny vzdálené DB/služby, skutečné e-maily ani main; žádný ruční deployment.
