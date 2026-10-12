# Poslední tři ETF: RSP, SCHB, SCHD

Správce potvrzuje 17 fondů již publikovaných v Supabase. Tato úloha připravila pouze poslední tři, bez vzdálených zápisů a bez změny předchozích dat/srovnání nebo webového designu.

## Ověřená metadata

| ETF | Název | Burza | Sledovaný index | Roční nákladovost | Distribuce |
| --- | --- | --- | --- | --- | --- |
| RSP | Invesco S&P 500 Equal Weight ETF | NYSE Arca | S&P 500 Equal Weight Index | 0,20 % | čtvrtletní |
| SCHB | Schwab U.S. Broad Market ETF | NYSE Arca | Dow Jones U.S. Broad Stock Market Index | 0,03 % | čtvrtletní |
| SCHD | Schwab U.S. Dividend Equity ETF | NYSE Arca | Dow Jones U.S. Dividend 100 Index | 0,06 % | čtvrtletní |

Skutečná technická kontrola proběhla 12. října 2026 po novém stažení oficiálních produktových stránek a TickerInside JSON. Přesné časy, HTTP výsledky, SHA-256 odpovědí a malé faktické výňatky jsou v `data/review/final-three.evidence.json`. Nejde o tvrzení osobní návštěvy zdrojů člověkem.

**Primární zdroje:**

- https://www.invesco.com/us/en/financial-products/etfs/invesco-sp-500-equal-weight-etf.html
- https://www.schwabassetmanagement.com/products/schb
- https://www.schwabassetmanagement.com/products/schd

Všechny tři nyní skutečně vrátily HTTP 200. Předchozí CONNECT 403 zůstává historickou evidencí, ne aktuální blokací produktových profilů.

Invesco zpřístupňuje potřebná data v HTML-embedded údajích svého veřejného profilu: ticker RSP, exchange NYSE ARCA, název/benchmark, totalExpenseRatio i netExpenseRatio 0.2 a výslovný caption Distribution frequency: Quarterly. Žádné interní dng API nebylo voláno. URL označená jako factsheet PDF ve skutečnosti vrátila HTML; není vydávána za ověřený PDF dokument.

Schwab zveřejňuje na vlastních produktových profilech názvy, Symbol, Exchange NYSE Arca, Inc., Index Name a Total Expense Ratio 0.030/0.060 %. Čtvrtletní rytmus je doložen aktuálním vlastním rozpisem příjmových distribucí: ex-dates 10. 12. 2025, 25. 3. 2026, 24. 6. 2026, 23. 9. 2026 u obou fondů. Jde o ověřenou skutečnou frekvenci zveřejněných distribucí, nikoli garanci budoucí částky nebo tvrzení o přečtení prospectus policy. Factsheet/calendar PDF v oficiálním Bynder vieweru a regulatory viewer jsou nadále blokované bránou; jejich obsah nebyl ověřen a není podkladem importních hodnot. Frekvence nebyla odvozena z nesouvisejícího přepínače výkonnosti Monthly/Quarterly.

API název SCHD vynechává interpunkci U.S.; přesný název pochází od Schwab. Ostatní názvy, ticker, burza a shodná nákladovost mají TickerInside původ a primární emitentské potvrzení. Index a distribuce jsou emitentské fakta, české popisy původní. Nákladové filing dates v API (RSP 27. 8. 2026, SCHB/SCHD 22. 12. 2025) se nesměšují s datem stažení/pozorování/kontroly. Historické datum změny metadat nebylo domyšleno.

## Dávka a rozhodnutí

- `data/final-three.approved.json`: finální validní import pouze RSP/SCHB/SCHD.
- `data/review/final-three.pending.json`: původní technický návrh, sám neimportovatelný bez rozhodnutí.
- `data/review/final-three.demo-approval.json`: konkrétní výběr, hash návrhu, label admin a oddělení aktuálního pokynu provozovatele připravit import stejným dříve přijatým omezeným faktickým modelem od skutečné technické kontroly provedené AI.
- `data/review/final-three.evidence.json`: skutečné technické podklady a omezení jejich dostupnosti.
- `data/review/final-three.performance.json`: nově načtené redukované skutečné historické odpovědi bez raw cen/holdings.

Admin není vymyšlené osobní jméno ani potvrzení osobní lidské kontroly všech stránek. Čas verifiedAt odpovídá provedenému technickému kroku. Správce před samostatným zápisem přezkoumá konkrétní výsledek. Není tvrzen právní audit, plošná licence nebo písemné povolení emitentů. Zůstává přijatý model omezených jednotlivých faktů, transparentní TickerInside CC BY 4.0 atribuce a vlastní české popisy; licence nepokrývá automaticky práva třetích stran. Dokumenty, marketing, raw cenové řady ani holdings se nekopírují.

Importní validátor získal pouze konkrétní oficiální HTTPS domény invesco.com a schwabassetmanagement.com a odpovídající ticker→emitent mapování. Nadále vyžaduje jednotlivé zdroje, licence API, jasný původ, explicitní rozhodnutí a čerstvost. Cizí emitent, spoof doména, prázdná nebo neschválená dávka se odmítá.

## Suchá kontrola a následný import správcem

```sh
npm run import:etfs -- data/final-three.approved.json
```

Očekávaný výstup: **3 záznamy**, pouze dry run, žádný zápis. Po kontrole této konkrétní dávky, správného projektu `kdkxoykuhqwodimawcrs` a záloze dotčených řádků správce ve svém již nastaveném bezpečném prostředí provede:

```sh
npm run import:etfs -- data/final-three.approved.json --apply
```

Právě tento druhý příkaz zapisuje. Zde nebyl spuštěn. Používá existující serverové SUPABASE_URL a SUPABASE_SECRET_KEY nebo SUPABASE_SERVICE_ROLE_KEY, bez klíčů v příkazu/JSON/Gitu. Upsert onConflict=ticker přidá či aktualizuje pouze tři tickery bez duplicit, předchozích 17 zdrojů a jejich snapshoty/srovnání zůstanou zachované. Žádná nová migrace, env, služba nebo frontendová funkce.

Po zápisu zkontrolujte `/api/catalog`: celkem 20 publikovaných fondů, právě jedno RSP/SCHB/SCHD, původních 17 beze změny. Na webu vyhledejte jednotlivé tickery, ověřte zdroje, samostatný i společný výběr a kalkulačku/graf. Při 100 000 Kč, 0 % a jednom roce modelové zisky RSP −200 Kč, SCHB −30 Kč, SCHD −60 Kč. Odeslání skutečného e-mailu je případný samostatný ruční test správce; nebylo provedeno v této úloze.

14denní čerstvost se zachovává. Při pozdějším zápisu se musí provést skutečná nová kontrola; pouze přepsat datum není ověření. Opakovanou přípravu stejného nezměněného návrhu umí existující workflow s novým výstupem:

```sh
npm run prepare:etfs -- data/review/final-three.pending.json data/review/final-three.demo-approval.json .cache/final-three-reviewed.json
```

## Historie a kontroly

U všech tří bylo skutečně znovu získáno r1/r3/r5, 156 týdenních výnosů, as_of/weeks_end 2026-10-09. Tří/pětileté hodnoty jsou kumulativní; předvyplnění dál používá správné CAGR a inverzní nákladový model. Historický graf používá stejné reálné týdenní body, žádnou novou odhadovanou křivku. Zdroj/API/keš ani matematika se neměnily. Při pozdějším null/výpadku je předpoklad nedostupný, nikoli vymyšlený. Pětiletý souhrnný výnos zůstává odlišený od skutečně dostupné přibližně tříleté řady.

Testy zahrnují skutečná metadata, schvalovací digest, emitentské domény a odmítnutí spoofu/cizího emitenta, historii a nákladový round-trip, opakovaný upsert na dvacet bez změny původních sedmnácti/kontaktů/srovnání, browser výběr jednotlivého RSP i všech tří a mobilní zobrazení. Vzdálený katalog a skutečný SMTP nebyly těmito izolovanými testy ověřovány.
