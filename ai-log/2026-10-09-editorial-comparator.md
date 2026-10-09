# Původní Editorial a interaktivní srovnávač — 9. října 2026

## Skutečný prompt

```text
Chci pokračovat ve vývoji ETF landing page.

Jako výchozí design použij původní variantu Editorial (Redakční) z prvního kola vizuálních návrhů, tedy verzi před posledním commitem se šesti barevnými variantami.

Najdi ji v historii Gitu a použij její původní vzhled jako základ. Nevracej celý projekt na starší commit a nemaž historii. Ostatní návrhy zatím zachovej, ale původní Editorial nastav jako výchozí stránku.

Co chci nově vyzkoušet

Chci vidět, jak bude v tomto designu vypadat skutečný interaktivní ETF srovnávač.

Navrhni a implementuj vizuální prototyp následujícího průchodu:

1. Výběr ETF

Návštěvník si vybere 2–3 skutečná ETF obchodovaná na NYSE Arca, například SPY, VOO a IVV.

2. Interaktivní porovnání

Přidej přehlednou srovnávací tabulku s parametry, jako jsou:

- sledovaný index,
- roční nákladovost,
- způsob vyplácení dividend,
- základní charakteristika fondu.

Tabulka musí reagovat na změnu vybraných ETF.

3. Kalkulačka nákladů

Přidej jednoduchou interaktivní kalkulačku.

Návštěvník zadá investovanou částku v Kč pomocí posuvníku nebo číselného pole.

Kalkulačka zobrazí orientační roční náklady jednotlivých ETF podle jejich expense ratio.

Příklad: při investici 100 000 Kč a nákladovosti 0,03 % zobraz 30 Kč ročně.

Výsledek doplň jednoduchým sloupcovým grafem, který se při změně částky nebo výběru ETF okamžitě aktualizuje.

Nejde o predikci výnosů. Graf má ukazovat pouze porovnání orientačních ročních nákladů.

4. E-mail až po sestavení srovnání

Nechci, aby e-mailový formulář dominoval úvodní stránce.

Návštěvník si nejprve vybere ETF a nastaví porovnání. Poté klikne na pokračování a zobrazí se formulář:

„Vaše srovnání je připravené.“

„Pošleme vám odkaz na interaktivní přehled, ke kterému se můžete kdykoliv vrátit.“

Po zadání e-mailu zatím pouze simuluj úspěšné odeslání a zobraz náhled toho, jak by vypadala stránka otevřená z e-mailového odkazu.

Zachovej vybraná ETF i nastavenou investovanou částku.

Design

- Zachovej původní redakční styl, typografii a celkovou vizuální identitu.
- Design má být elegantní, moderní, důvěryhodný a ne příliš křiklavý.
- Srovnávač, kalkulačka a graf musí vizuálně zapadat do stránky.
- Zaměř se především na mobilní zobrazení.
- Nepřidávej zbytečně složité grafy ani přeplněný dashboard.

Důležité

Zatím jde o funkční frontendový prototyp.

Neimplementuj Supabase, backend, skutečné odesílání e-mailů ani ukládání osobních údajů.

Používej pouze ověřené údaje o ETF. Pokud některý údaj nemáš ověřený, jasně ho označ jako demonstrační a nevydávej ho za aktuální skutečnost.

U kalkulačky vysvětli, že jde o orientační výpočet podle expense ratio, který nezahrnuje poplatky brokera, měnové konverze ani změny hodnoty investice.

Zachovej upozornění na omezenou dostupnost amerických ETF pro retailové investory v EU.

Aktualizuj README a "ai-log/", proveď build a typecheck.

Výsledek chci prohlédnout na Vercelu. Po dokončení vytvoř samostatný commit a pushni změny na "design-exploration". Nic nemerguj do "main".

 Neměň globální konfiguraci.
```

## Rozhodnutí a zdroje

- Přečteny AGENTS.md a aktuální kód; pracovní strom byl čistý. Původní vzhled nalezen v commitu 1716fea před šestibarevným kolem. Porovnání `git show 1716fea:src/styles.css` s aktuálním styles.css ukázalo totožný soubor. Použita původní paleta, serifový hero titulek „Americká ETF. Jasnější pohled.“ a kompozice; bez resetu projektu či přepisování historie.
- Nová komponenta EditorialComparator je výchozí bez parametru a přes ?variant=editorial. Ostatních šest variant i Terminal/Guide zachováno. Nové styly odděleny v editorial-comparator.css.
- Aktuální zadání výslovně umožňuje porovnání a kalkulačku před e-mailem. Pro tento frontendový prototyp má přednost před původním plánem a AGENTS.md o uzamčení srovnání do potvrzení; není implementován ani předstírán produkční zabezpečený přístup.
- Pokusy o načtení primárních zdrojů přes curl --fail --location vrátily HTTP 403:
  - SPY: https://www.ssga.com/us/en/individual/etfs/state-street-spdr-sp-500-etf-trust-spy
  - VOO: https://fund-docs.vanguard.com/F0968.pdf
  - IVV: https://www.ishares.com/us/products/239726/ishares-core-sp-500-etf
- Nic z těchto dokumentů nebylo ověřeno. Použity tickery výslovně zadané uživatelem, ale všechny parametry (včetně názvů, indexu, dividend a sazeb) jsou v UI označeny jako DEMO. SPY 0,0945 %, VOO/IVV 0,03 % jsou vstupy demonstrace, ne tvrzení o aktuální nákladovosti. Odkazy jsou „zdroj k ověření“, nikoli důkaz již provedené kontroly. Datum aktuálnosti dat není vymyšleno.
- Výpočet je částka v Kč × procentní sazba / 100. Omezení vstupů: 0 až 10 milionů Kč, konečná čísla; neplatný vstup zachová poslední platný graf a blokuje pokračování. Graf má společnou stupnici v Kč/rok, kterou může měnit podle rozsahu hodnot; nejde o výnos.
- Mobilní tabulka má stejné skutečné řádky a buňky, ale skládá je podle parametrů do bloků s tickery. Nevyžaduje široký dashboard ani externí grafovou knihovnu.
- Výběr a částka se zachovávají po simulaci. Ukázkový veřejný odkaz obsahuje jen tickery a částku; otevření nové karty obnoví přehled. Žádný e-mail v URL, logu, databázi ani localStorage; pole se při simulaci vymaže. Žádná síťová komunikace pro odeslání.

## Kontroly a opravy

- Typecheck a produkční build prošly. Dva nově přidané testy výpočtu pokrývají 100 000 × 0,03 % = 30 Kč, další sazbu, nulu, desetinné částky a odmítnutí neplatných vstupů.
- První prohlížečová kontrola odhalila horizontální přetékání přepínače na šířce 320 px kvůli dlouhému názvu výchozí varianty. Opraveno omezením štítku a povolením zmenšení selectu. Výsledky opakované kontroly budou doplněny po dokončení.
- Globální Git konfigurace nebyla měněna; zůstává ověřená lokální identita RostislavHanza s GitHub noreply e-mailem.

- Po opravě prošla kontrola produkčního buildu v Chromium na 320, 390, 768, 1100 a 1440 px: původní paleta, bez horizontálního přetékání, úvod bez e-mailu, výběr 2–3, reaktivní sloupce tabulky a graf, nula / neplatné / desetinné částky / posuvník, validace e-mailu, zachovaný výběr a částka po simulaci i po otevření demo URL. Bez JavaScriptových chyb a POST požadavků, bez localStorage.
- Ověřeno načtení všech šesti barevných variant a původních Terminal/Guide URL; také bezpečný fallback neplatné částky, tickerů a varianty v URL.
- V dočasném testovacím skriptu opraven selektor tlačítka zahrnující šipku a očekávání pořadí tickerů po opětovném výběru. Šlo o chyby testu, ne o nefunkční aplikaci. Finální průchod dokončen bez selhání.
- Prohlédnuty mobilní i desktopové screenshoty v /tmp. Zdrojová diagonální šipka nahrazena standardní šipkou pro systémový font; přepínač původního Editorial používá původní zelený akcent.
- Kompletní WCAG audit, čtečka obrazovky, skutečné doručování, ověření finančních dat a úspěch Vercel nasazení nejsou prokázány. Commit a push se provedou po závěrečné kontrole; výsledek bude ověřen vzdáleným SHA. Main zůstává mimo změny.
- Závěrečný typecheck, build a oba testy prošly. Kontrola běžných vzorů klíčů, tokenů, JWT, credential URL a .env nenašla shodu; git diff --check bez chyb. Efektivní autor i committer jsou RostislavHanza s lokálním GitHub noreply e-mailem. Kontrola vzorů není absolutní záruka nepřítomnosti všech tajných údajů.
