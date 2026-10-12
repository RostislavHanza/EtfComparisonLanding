# Katalog a nastavení soukromí

## Skutečné zadání (výňatky, nikoli rekonstruované starší prompty)

Uživatel: „Navazujeme na commit \"462506595a9bbdce80c004eeafdf602654842df9\".“

„Pokud oficiální produktová stránka emitenta jednoznačně potvrzuje NYSE Arca, vyhodnoť, zda ji můžeme přijmout jako dostatečný primární zdroj.“

„Nezaměňuj dostupnost veřejné stránky s oprávněním libovolně kopírovat její obsah.“

„Současné pending záznamy automaticky nezveřejňuj. Lidské schválení ani právní kontrolu nepředstírej.“

„Chci tento souhlas přesunout do běžné cookie lišty / nastavení soukromí.“

„Při odvolání analytiky nesmí UI falešně hlásit úspěch, pokud serverové odstranění souvisejících dat selhalo.“

„Commitni a pushni pouze na \"design-exploration\". \"main\" zůstane beze změny.“

Celé zadání dále vyžaduje nezávislý marketing, žádné měření před souhlasem, zachování funkčních cookies, testy katalogu i browseru, regresní kontrolu Vercel Functions a zákaz vzdálených migrací, skutečných e-mailů, změn Vercel proměnných a ručního nasazování. Výše jsou skutečné dostupné výňatky; jiné historické prompty se nedoplňují. Nebyli použiti další AI agenti ani generování finančních údajů.

## Kontrola zdrojů a rozhodnutí

- Navázáno na existující podklady pěti ETF. Všech pět veřejných produktových profilů a všech pět oficiálních PDF opět skutečně vrátilo HTTP 200. technicalRecheck v evidence JSON uchovává skutečný čas a hash, oddělený od původní evidence, platnosti údaje a lidské kontroly. PDF i profily SPY/VOO/VTI mají původní hash. Stránky iShares se mohou měnit, jejich factsheety mají původní hash; dostupnost ani hash nejsou právním schválením.
- Oficiální profil/factsheet příslušného emitenta může doložit NYSE Arca. Minimální změna validátoru vyžaduje známou dvojici ticker–doména a výslovný ticker i NYSE Arca v důkazu. Cizí emitent, podvržená doména a TickerInside jako jediný důkaz burzy se odmítají. Ostatní publikační požadavky zůstávají.
- SPY nadále používá emitentských 0.0945 %, nikoli zaokrouhlených nedatovaných 0.09 z API. VTI nadále používá aktuální Morningstar název/index, nepřepisuje historickou platnost starého CRSP factsheetu. Bez shody názvu nelze tyto fondy bezpečně přepnout na automatickou aktualizaci.
- BlackRock/ICE právní odkazy byly znovu zkoušeny: HTTPS proxy stále odmítá tunel 403. SSGA reprodukční omezení a neuzavřené Vanguard/BlackRock právo na vybraná metadata zůstávají konkrétními překážkami. Povolení domén BlackRock/ICE platí pouze pro policyUrl, nikoli pro primární fondové zdroje nebo automatické schválení.
- Pět fondů má věcné podklady pro finální kontrolu; žádný nemá schválené usageReview nebo doplněné lidské datum/kontrolora. Žádné publikování ani vzdálený import neproběhl. Zbylých patnáct není vydáváno za úplně ověřené.
- Nový malý přípravný script převádí existující pending JSON a výslovné rozhodnutí správce do validované importní dávky. Správce potvrzuje každý použitý dokument a skutečné datum. Script nezískává klíče, nespojuje databázi, neodvozuje schválení a nepřepisuje existující výstup. Následný import zachovává existující validátor/upsert tickeru.

## Souhlas a opravy

- Původní analytická volba byla samostatný blok u srovnávače; formulář má pouze marketingový checkbox. Nahrazena lištou Nastavení soukromí v toku redakční stránky. Přijetí a odmítnutí mají stejný vzhled, klávesnicové ovládání a mobilní cíle. Nepředstíráme analytické cookies: jde o localStorage preference, sessionStorage visitId a vlastní Supabase události.
- Odvolání okamžitě zastaví track/attribution a počká na rozběhlé analytické požadavky. Neúspěšné odstranění zůstává jako čekající operace i přes reload; UI nabízí opakování a nehlásí smazání. Nové přijetí je možné až po dokončení čekajícího odstranění.
- Zjištěný problém: původní změna souhlasu regenerovala visitId i při reloadu. Opraveno zachováním session ID při obnově uděleného souhlasu; browser test ověřuje shodu.
- Serverová mezera: opožděný požadavek mohl po withdraw znovu vložit událost nebo attribution. Nová aditivní migrace 006 přidává revokační záznam, ochranné triggery a rozšiřuje existující withdraw/retenci. Funkční srovnání, session a marketing se nemažou. Stávající migrace nebyly upraveny. Migrace byla testována jen v izolovaném lokálním PostgreSQL, vzdáleně se neaplikovala.
- Při prvních kontrolách upraveno TypeScript zúžení unknown a typ návratového souboru dávkového helperu. Nepovoloval se any ani oslabování validace.

## Ověření

Lokální kontroly a testy používají izolované fixture, lokální PostgreSQL/PGlite a mockované browser API. Neprokazují živý SMTP, vzdálený import, licenci nebo stav Preview. Oficiální @vercel/node kontrola skutečně sestavuje artefakty devíti endpointů a spouští je v Node 24 bez TypeScript loaderu; obsahuje regresi chybného .ts importu.

Výsledek závěrečných kontrol je doplněn po jejich dokončení níže. Žádné environment variables se neměnily; nebyl proveden skutečný e-mail, vzdálená migrace ani ruční deployment. Veřejný katalog bude použitelný až po skutečném schválení a importu správce.

Závěrečná kontrola odhalila dvě chyby testovacího kódu: browser evaluate odkazoval na nedeklarovaný globál pro ESLint (opraveno globalThis.sessionStorage), a nový seed předběžných ETF nesplňoval existující DB constraint alespoň šesti zdrojů. Opravena pouze izolovaná fixture; databázová ochrana se neoslabovala. Opakovaný běh již prošel všemi 38 testy.

První kompletní browser běh prošel: srovnávač 320/390/768/1100/1440 px, soukromí 320/390/768/1440 px a administrace 320/390/768 px. Při skutečné vizuální kontrole uloženého screenshotu 320 px následně doplněno vnitřní odsazení lišty a zkrácen její vysvětlující text bez nepodstatného technického názvu Supabase v hlavním UI. Identifikátor, vlastní události a absence analytických cookies zůstávají vysvětlené. Poté opakován build a browser ověření.

## Konečný výsledek kontrol

- Lint a samostatný typecheck: PASS.
- `npm test`: 38/38 PASS, včetně lokální migrace, odmítnutí pending dat, emitentského důkazu, syntetického lidského schválení a upsertu předběžných IVV/IWM bez duplicit se zachováním opt-in synchronizace. Syntetická schválení zůstala pouze v izolovaných testech.
- `npm run build`: PASS; NodeNext check načetl/spustil všech 9 endpointů bez TS loaderu.
- `npm run check:vercel`: PASS, 9 skutečných artefaktů oficiálního builderu v Node 24 a detekce záměrně chybného .ts importu. Bez vzdáleného deploymentu.
- Kompletní `npm run test:browser` nad finálním frontendovým buildem: PASS. Srovnávač v 5 šířkách, soukromí ve 4, administrace ve 3; nové přijetí/odmítnutí/reload/retry, formulář bez analytiky a zachování funkční cookie. Mobilní screenshot 320 px byl vizuálně zkontrolován. Browser API jsou výslovně mockované, nikoli produkční ověření služeb.
- Read-only review report stále správně ukazuje 0/5 publikačně validních pending fondů. Žádná lidská data ani právní souhlas nebyly doplněny asistentem.
- Kontrola diffu a porovnání se známými injektovanými secret hodnotami neodhalily tajné údaje; hodnoty se nikdy nevypisovaly. `.cache/` není součástí commitu. Autor ověřen v lokální konfiguraci jako RostislavHanza s GitHub noreply e-mailem; globální konfigurace se neměnila.
- Přípravný helper odstraňuje z výstupní výslovně schválené dávky pouze draftové reviewStatus/blockers, původní pending soubor nemění. Ani toto nenahrazuje kontrolu člověka.
