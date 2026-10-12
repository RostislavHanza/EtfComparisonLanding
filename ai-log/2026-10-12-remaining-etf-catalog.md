# Zbývajících 15 ETF: 12 připravených, 3 nedoložené

Výchozí commit `0ea8372941dd71c8f76ed6d38cca9ba2e4bf7038`, pouze větev design-exploration.

## Skutečný prompt — označené výňatky

> Z připraveného seznamu 20 fondů zbývá dokončit těchto 15:
>
> DIA, IJH, IJR, ITOT, MDY, RSP, SCHB, SCHD, SPYD, VEA, VT, VTV, VUG, VWO, VYM.

> Pro každý ze zbývajících 15 fondů ověř aktuální údaje z primárních zdrojů emitenta:
>
> správný název a ticker, burzu, sledovaný index, průběžnou nákladovost, způsob distribuce dividend.

> Zvlášť ověř případné změny názvu, indexu či nákladovosti. Nespoléhej automaticky na starší hodnoty ze synchronizačního API.

> Připrav schválený importní manifest pro zbývajících 15 fondů se stejnou strukturou a pravidly jako u první pětice. Neuváděj smyšlené datum kontroly ani smyšlené potvrzení člověkem. Pokud je pro publikaci potřeba rozhodnutí provozovatele, zřetelně jej odděl od faktického ověření údajů.

> Využij existující importní mechanismus. U ITOT aktualizuj existující záznam, nevytvářej duplicitu.

> Vzdálené databázové zápisy neprováděj. Na konci předej přesný postup a připravený import, abychom ho mohli samostatně aplikovat.

> Commitni a pushni pouze na `design-exploration`. `main` neměň.

Tyto výňatky jsou ze skutečného dostupného zadání. Další požadavky: vlastní české popisy, původ a datování, skutečná dostupná historie bez vymýšlení, zachování všech původních fondů/srovnání/designu, kontroly dat/lint/typecheck/testy/build a dokumentace výsledků. Žádné nové služby, funkce webu ani přístupové požadavky.

## Skutečně provedené zdrojové ověření

- Načteno 15 konkrétních aktuálních TickerInside fund JSON: všechny HTTP 200, identity NYSE Arca/etf, CC BY 4.0, skutečné r1/r3/r5, weekly 156, as_of/weeks_end 2026-10-09. Redukovaná evidence neobsahuje raw ceny, holdings, FIGI ani marketingové popisy. Celé odpovědi jsou pouze v ignorované lokální .cache.
- Načteny primární stránky 3 State Street, 3 iShares a 6 Vanguard, plus 3 SSGA a 6 Vanguard factsheety. Kontrola factsheetů přes pdftotext a veřejného HTML včetně publikovaných embedded dat Vanguard. Žádné interní nedokumentované API nebo průběžný scraping. SHA-256, skutečná stažení a chyby v remaining-fifteen.evidence.json.
- Ověřena metadata 12 fondů. VTV/VUG: aktuální veřejné profily uvádějí Morningstar v názvech i indexech, API stále staré názvy a červnové factsheety CRSP. Aktuální stav upřednostněn bez vymyšleného data přejmenování. DIA/MDY: upřednostněny plné aktuální názvy State Street včetně Trust. Nákladovost se u všech 12 shoduje s aktuálním emitentem; VYM 0,04 %, VEA 0,03 %, VUG/VTV 0,03 %. DIA Monthly, ostatní Quarterly; explicitní listing NYSE Arca.
- RSP/SCHB/SCHD: primární stránky Invesco/Schwab Asset Management blokuje síťová brána CONNECT 403. Zkuseny veřejné Schwab quote stránky a SEC filing indexy z API, rovněž blokované. Není to tvrzení origin HTTP 403 nebo právního zákazu. Omezení nebylo obcházeno. Samotná dostupná API historie/identita neověří chybějící aktuální index/distribuci; ty jsou null, žádný z těchto tří není importován/schválen.
- První pokus o textový výpis použil nedostupné bs4; použita standardní HTMLParser. Assertion NYSE Arca u MDY upravena na skutečné uppercase ARCA v emitentské tabulce, žádný finanční údaj nebyl změněn kvůli průchodu validátorem.

## Dávka a oddělené rozhodnutí

- data/remaining-twelve.approved.json je validní import pouze kompletních dvanácti.
- Návrh, konkrétní dávkový manifest s hashem, faktická evidence, blokované řádky a redukovaná skutečná historie jsou pod data/review/remaining-fifteen.*. Stávající prepareApprovedCatalog a validateImport beze změny; celý import skutečně prošel jejich kontrolami a suchým CLI během.
- Manifest zaznamenává výslovný aktuální pokyn provozovatele připravit schválený import stejným dříve přijatým omezeným faktickým modelem, se zúžením pouze na technicky doložené fondy. Admin je provozovatelův administrativní label, nikoli vymyšlené jméno člověka. Skutečná technická kontrola AI a její čas jsou výslovně odděleny od osobní lidské kontroly či právního povolení. Žádná údajná lidská návštěva zdrojů, formální právní audit nebo povolení emitenta se netvrdí. Finální přezkoumání konkrétní dávky a spuštění samostatného zápisu jsou kroky správce podle REMAINING_CATALOG.md.
- Licence TickerInside a existující atribuce/omezení třetích stran se nemění; indexy/distribuce/opravované názvy jsou konkrétní emitentská fakta a vlastní české popisy, nikoli obsah falešně označený jako licencovaný z TickerInside. Úplné podmínky TickerInside nebyly znovu prohlášeny za nedostupné ani znovu právně auditovány.

## Minimální technické změny a testy

- Původní pevná performance allowlist rozšířena na 20 známých kandidátů, aby nové fondy mohly využívat skutečnou dostupnou historii. Stávající endpoint, identita/burza/licence/datum, keš/singleflight, stale fallback a zabezpečení zůstávají. Nejvýše 3 souběžné requesty namísto dlouhých 20 sekvenčních timeoutů (7 skupin × 5 sekund) v existujícím časovém rozpočtu. Allowlist nenastavuje published ani nepublikuje metadata blokovaných fondů.
- Data webu/UI, historické/kalkulační rovnice, e-mailové mechanismy a souhlasy se nemění. README, PERFORMANCE a nový REMAINING_CATALOG.md uvádějí skutečný stav a přesné příkazy.
- Lint, typecheck, 66 unit/backend/SQL testů a build prošly. Nové testy: skutečná dvanáctka a její provenance, Morningstar korekce, Monthly/Quarterly, odmítnutí blokovaných/neodsouhlasených/změněných/stale řádků, 15 skutečných historických odpovědí, maximálně 3 requesty, opakovaný upsert ITOT bez duplicity, zachování všech pěti původních řádků/zdrojů a uloženého snapshotu/kontaktu. Ověřeno také, že staré API názvy VTV/VUG nemohou změnit schválené nové názvy ani při zapnutém opt-in synchronizace.
- Doplněný regresní test synchronizace zpočátku zaměnil řazení podle tickeru s řazením podle názvu. Opraven pouze očekávaný pořádek; skutečná metadata ani synchronizační ochrana se neměnily.
- CLI dry run: 12 strukturálně platných záznamů, databáze nebyla změněna. Žádné --apply zde nebylo spuštěno.
- Celá browser sada prošla na místním buildu s izolovanými API. Navíc test skutečné kombinace 5+12 metadata/historie v mock API na 320/1440 px: 17 řádků a historických křivek, hledání ITOT, jeho nákladový model 0 % → −30 Kč za rok při 100 000 Kč, aktuální index Morningstar v tabulce a žádný horizontální overflow. Původní cookie, e-mailový přístup, soukromí, admin a atribuce nadále procházejí. Žádné skutečné e-maily/databázové zápisy.
- check:server a oficiální Vercel Node.js 24 builder pro všech 10 endpointů prošly včetně TS import regrese. Nejde o ověření vzdáleného deploymentu nebo SMTP.

## Co zůstává

Pouze správce po kontrole dávky spustí stávající dry run a následně --apply podle docs/REMAINING_CATALOG.md. Výsledkem bude 17 fondů, nikoli falešných 20; RSP/SCHB/SCHD musí zůstat nepublikované, dokud nejsou doloženy jejich primární údaje. Nová migrace ani nové credentials nejsou potřeba. Žádné vzdálené služby, prostředí nebo main nebyly měněny.
