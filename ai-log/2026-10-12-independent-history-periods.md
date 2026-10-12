# Finální texty, jeden oddělovač a dvě nezávislá historická období

Navazuje na `0bcc5763415d4aa25dcaed6a50c05f220d1a255e`, pouze větev `design-exploration`.

## Skutečný prompt — označené výňatky

Uživatel zadal „Finální úpravy designu, textů a historických období“ a výslovně uvedl:

> Web už funguje a současný design je téměř finální. Proveď pouze níže popsané změny. Nepředělávej ostatní části, nepřidávej další funkce, formuláře ani vlastní texty.

> Nyní chci DVA NEZÁVISLÉ přepínače historického období.

> Přepnutí grafu nesmí změnit předpokládaná procenta, odhadovaný zisk ani pruhy v kalkulačce.

> Naopak přepínač A v tabulce nesmí měnit období vykresleného historického grafu.

> Oba přepínače musí mít samostatný stav a fungovat nezávisle.

> Dobrý den,
>
> Vaše osobní kalkulačka ETF je vytvořená.

> Commitni a pushni pouze na `design-exploration`. `main` neměň.

> Neprováděj vzdálené databázové zápisy ani skutečné odeslání e-mailů.

Jde o skutečné výňatky dostupného zadání, nikoli úplný přepis. Ostatní požadavky: jediný silnější oddělovač pod druhým úvodním krokem, Americký trh. ETF NYSE., 04 / Srovnání — Detailní přehled., Zaslat kalkulačku na mail, jeden nadpis FAQ, společný spodní řádek tabulky s původním vysvětlením, obnovením a přepínačem A. Zachování matematických vzorců, záporných výsledků, null historie, zdrojů a ostatních funkčních částí.

## Implementace a kontrola rozsahu

- V aktivním Editorial odstraněn border-bottom posledního úvodního kroku, původní border-top výběru nahrazen jedinou 3px čarou. Odsazení zůstává.
- Upraveny jen požadované nadpisy/labely. FAQ má jediný standardní h2 „Často kladené dotazy“ namísto dvou vizuálních nadpisů. Odpovědi a soukromí zůstávají stejné.
- HTML i textová alternativa vyžádaného e-mailu obsahují požadovaný nový úvod. Funkční odkaz, tokeny, expirace, automatické první potvrzení a opakované návraty se nemění. Administrátorský e-mail se nemění.
- V tabulce přidán jediný poslední tr s colSpan=3: původní společný popisek, společné obnovení a A, nikoli nové karty. Původní ETF řádky, matematika, barvy a společná stupnice se nemění.
- Stav settings.period patří pouze odhadu A; nový settings.graphPeriod pouze grafu B. Oba výchozí 5 let. A obnoví ruční sazby na CAGR příslušného r1/r3/r5; společné obnovení používá A. B mění pouze historické body/rozsah. Částka a horizont zachovávají ruční editaci. Oba stavy zůstávají lokální a nepřidávají DB uložení scénářů.
- Odstraněn již nepravdivý popisek u grafu, který tvrdil, že jeho přepnutí obnoví procenta. Existující metodika aktualizována pouze pro vysvětlení nezávislosti. README/PERFORMANCE/SETUP odpovídají novým labelům a ovládání.
- Nulová/neznámá historie se nedoplňuje; anualizace ani výpočet zisku znovu neodečítají expense ratio. Původní 156týdenní rozsah a omezení pětileté křivky zůstávají.

## Provedené testy a opravy

- Lint, typecheck, unit/backend/SQL testy 62/62 a produkční build prošly. Mail test kontroluje obě znění, MIME alternativy a HTML escaping; neposílá skutečnou zprávu.
- První browser assert úvodního labelu narazil na dekorativní vedoucí mezeru u tečky. Opravena pouze normalizace whitespace v testu; obsah a typografie se nezměnily.
- Celá Chromium browser sada proti lokálnímu produkčnímu buildu prošla. Na 320–1440 px: jeden oddělovač, přesné požadované labely a jediný nadpis FAQ, výběr/stránkování/hledání, odeslání/selhání/pending, automatický opakovaný návrat bez původní cookie, obnovení nastavení, privacy/odvolání, Preview admin a atribuce.
- Kalkulačka na 320/390/1440 px: společný poslední řádek tabulky, A přepočítá CAGR a zisky/pruhy při nezměněném grafu, B mění 52/156 týdnů a popisek pětiletého omezení bez změny sazeb/zisků/pruhů. Ověřena i ruční záporná sazba, změny částky/horizontu, společné obnovení podle A, jeden/pět/šest fondů a null/outage: B ponechá vlastní 0 %, A s chybějící historií obnoví prázdný vstup namísto nulového fallbacku. Slider ani přepínače nepřidávají upstream requests.
- Vizuálně zkontrolován screenshot nové tabulky na 320 px: popisek, obnova i A jsou v jediném společném spodním řádku; tlačítka se vejdou a původní zelené/červené pruhy zůstávají.
- check:server načetl všech deset emitovaných API bez TS loaderu. check:vercel sestavil a zkontroloval všech deset oficiálních Node.js 24 artifacts včetně regresní detekce chybného runtime `.ts` importu. To není ověření živého Preview nebo skutečného SMTP doručení.

## Omezení

Žádná nová migrace, environment variable, služba nebo datový zdroj. Žádné vzdálené databázové zápisy, skutečné e-maily či ruční deployment. Browser API jsou testovací fixtures. Nové historické údaje ani právní schválení nebyly v této úloze tvrzeny. Po push správce může zkontrolovat automatické Vercel Preview; jeho nasazení tímto lokálním testem není potvrzené.
