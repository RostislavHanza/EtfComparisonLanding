# Finální UX kalkulačky odhadovaného výnosu

## Skutečný uživatelský prompt

Přesné dostupné zadání z vloženého textu, bez doplňování starších promptů:

```text
Pracuj v repozitáři `RostislavHanza/EtfComparisonLanding` výhradně na větvi `design-exploration`. Větev `main` neměň.

# Úkol: Finální úprava kalkulačky odhadovaného výnosu

Současná aplikace už má funkční katalog pěti ETF (SPY, VOO, IVV, VTI a IWM), historická data, model investice a historický graf.

Potřebuji cíleně upravit UX, nikoliv znovu vytvářet celý systém.

## 1. Přejmenování a nové rozložení kalkulačky

Současné nadpisy:

- „02 / Váš model“
- „Co může znamenat čas?“

nahraď názvem:

**„02 / Odhadovaný výnos“**

Kalkulačka má být vizuálně podobná původnímu jednoduchému srovnávacímu grafu, ale místo provozních nákladů bude ukazovat odhadovaný zisk.

Pořadí prvků:

1. **Investovaná částka v Kč** – číselný vstup a slider, vzájemně synchronizované.
2. **Investiční horizont** – například 1, 3, 5, 10 nebo 20 let.
3. **Srovnání odhadovaného zisku všech vybraných ETF** – jeden řádek pro každý fond.

Každý řádek ETF musí obsahovat:

- Ticker a název ETF.
- Přímo editovatelné číselné pole „Předpokládaný roční výnos (%)“.
- Velký vodorovný zelený pruh znázorňující odhadovaný zisk.
- Vedle pruhu výraznou částku odhadovaného **zisku v Kč**.
- Nenápadnou možnost „Obnovit podle historie“.

Žádné samostatné velké karty s „Modelovou konečnou hodnotou investice“.

Žádný přepínač „Historický / Hypotetický scénář“.

Žádný checkbox ani tlačítko pro zapnutí úpravy procent – procenta se musí dát **rovnou přepsat**.

### Výpočet

`futureValue = investment × (1 + annualReturn / 100) ^ horizonYears`

`profit = futureValue − investment`

**Hlavní zobrazená částka je pouze zisk nebo ztráta**, tedy rozdíl mezi budoucí modelovou hodnotou a počáteční investicí.

Příklad: při vkladu 100 000 Kč a modelové budoucí hodnotě 162 000 Kč ukaž výrazně **+62 000 Kč**, nikoliv 162 000 Kč.

Pruhy všech ETF musí používat společnou stupnici. Největší zisk má nejdelší zelený pruh. Pokud je výsledek záporný, zobraz červený pruh a zápornou částku; kladné a záporné hodnoty porovnávej smysluplně vůči společné nule.

Ošetři neplatné výnosy včetně hodnot nižších než −100 %.

Kalkulačka musí fungovat i pro jediné vybrané ETF a přehledně se přizpůsobit mobilním displejům.

## 2. Výchozí procenta podle historie

Každé vybrané ETF má vlastní automaticky předvyplněný předpokládaný roční výnos.

Předvyplnění vychází ze skutečné historické kumulativní výkonnosti daného ETF za zvolené **historické referenční období**.

Přepočet na anualizované geometrické tempo:

`annualizedReturn = ((1 + cumulativeReturn / 100) ** (1 / periodYears) − 1) × 100`

Předvyplněné procento je rovnou editovatelné. Po ruční změně se okamžitě přepočítá zisk či ztráta a délka pruhu příslušného ETF.

Jednotlivé ETF mají nezávislé vstupy. Úprava procenta jednoho fondu nesmí změnit ostatní.

Při změně investované částky nebo investičního horizontu zachovej všechna ručně upravená procenta.

Pokud historický výnos není k dispozici, ponech procentní pole prázdné a umožni vlastní vstup. Nevymýšlej náhradní výnos.

### Výnos po průběžných nákladech

Uživatel chce modelový zisk po zohlednění průběžné nákladovosti ETF.

- Pokud zdroj poskytuje historickou výkonnost ETF po průběžných nákladech, **expense ratio znovu neodečítej**.
- Předvyplněný výnos vycházející z takových dat je již po těchto nákladech.
- Ručně zadávané procento interpretuj jako předpokládaný roční výnos po průběžných nákladech fondu.
- Pokud někdy použiješ hrubý výnos indexu, odděl tento případ metodicky a případný nákladový odhad jasně označ.
- Náklady brokera, daně a kurzové změny model nezahrnuje.

## 3. Historické referenční období: jeden společný přepínač

Ovládání **„Historické referenční období“** přesuň z horní kalkulačky přímo k historickému grafu do sekce:

**„Historický vývoj ETF“**

Zde zobraz přepínač:

**1 rok | 3 roky | 5 let**

Tento přepínač ale musí ovládat **DVĚ VĚCI SOUČASNĚ**:

1. Historický spojnicový graf pod kalkulačkou.
2. Předvyplněné procento výnosnosti a tím i odhadovaný zisk v kalkulačce nad grafem.

### Přesné chování při změně historického období

Například uživatel přepne z pěti let na tři roky:

1. Graf zobrazí skutečná historická data za poslední tři roky, pokud jsou dostupná.
2. U každého vybraného ETF načti skutečný kumulativní výnos za poslední tři roky.
3. Přepočítej jej na anualizovaný roční výnos.
4. **Aktualizuj tím editovatelné procento u každého ETF.**
5. Automaticky přepočítej zisky/ztráty a zelené/červené pruhy.
6. Investiční horizont ponech beze změny.

**Důležité:** Při přepnutí historického období záměrně obnov výchozí procenta podle nově vybrané historie, a to i pokud je uživatel předtím ručně změnil. Po přepnutí je může znovu ručně upravit.

Naproti tomu změna částky nebo investičního horizontu **nesmí ruční procenta resetovat**.

Malé tlačítko „Obnovit podle historie“ u konkrétního ETF nastaví výchozí výnos podle právě vybraného referenčního období, aniž by ovlivnilo ostatní fondy.

### Rozlišení dvou časových údajů

- **Investiční horizont** určuje, na kolik budoucích let se počítá modelový zisk.
- **Historické referenční období** určuje, z jak dlouhé minulosti se odvodí výchozí roční procento a jaká historická data se zobrazí v grafu.

Příklad: uživatel zvolí investiční horizont 10 let a historické referenční období 3 roky. Model použije anualizované tempo z posledních tří let pro hypotetický desetiletý scénář.

Nikde netvrď, že jde o spolehlivou předpověď.

Pokud pro vybrané období existuje kumulativní výnos, ale není k dispozici dostatečně dlouhá historická časová řada pro graf, můžeš předvyplnit procento ze skutečného kumulativního výnosu. Graf však nesmí předstírat, že pokrývá celé období. Viditelně uveď skutečný rozsah grafu.

## 4. Historický spojnicový graf

Pod kalkulačkou zachovej výrazný graf **„Historický vývoj ETF“**.

- Přepínač období umísti přímo nad něj.
- Graf musí obsahovat pouze skutečné historické body, nikoli interpolaci mezi začátkem a koncem.
- Osa X: skutečná data.
- Osa Y: normalizovaná hodnota se společným začátkem 100.
- Vybraná ETF mají vlastní odlišitelné křivky, pokud jsou data dostupná.
- Po změně vybraných ETF se odpovídajícím způsobem změní křivky.
- Po změně historického období se změní zobrazená historie i výchozí procenta kalkulačky.
- Přidej čitelnou legendu a tooltip.
- Zachovej responzivitu pro mobil.
- Uveď zdroj, datum podkladu a dostupný časový rozsah.

Pokud se používají časové řady samotných ETF místo jejich sledovaných indexů, ponech správný nadpis „Historický vývoj ETF“. Nevydávej historické ceny ETF za hodnoty indexů.

Nehledej za každou cenu nová placená API. Využij existující infrastrukturu a skutečně dostupné historické údaje.

Nevymýšlej chybějící pětiletou historii z kratší časové řady.

Dodržuj pravidla zdrojů, licenci a atribuci.

## 5. Detailní srovnání ETF až pod grafem

Ponech dosavadní podrobnou sekci „Souvislosti / Vedle sebe. Srozumitelně.“ až pod historickým grafem.

Zachovej v ní:

- Sledovaný index.
- Roční nákladovost ETF.
- Datum kontroly nákladovosti a datum jejího podkladu.
- Orientační roční náklady při zvolené investici, pokud zapadají do tabulky.
- Dividendovou politiku.
- Českou charakteristiku ETF.
- Datum ověření údajů.
- Datum datového snímku.
- Rozbalovací původ a ověření každého údaje.
- Odkazy na zdroje.
- Atribuci TickerInside CC BY 4.0.

Původní dominantní graf nákladovosti už nechci. Nákladovost je doplňující parametr, nikoliv hlavní vizualizace.

Zachovej jednoduché mobilní rozložení tabulky.

## 6. Texty a srozumitelnost

Použij nadpis:

**„02 / Odhadovaný výnos“**

U zelených/červených pruhů je hlavní výsledná částka označena jako:

**„Odhadovaný zisk / ztráta“**

U editovatelného procenta:

**„Předpokládaný výnos ročně (%)“**

U historického grafu:

**„Historický vývoj ETF“**

Nepoužívej zbytečně abstraktní formulace jako „Co může znamenat čas?“ ani velké opakující se kolonky „Modelová konečná hodnota“.

Zachovej krátké viditelné upozornění:

„Výchozí předpoklad vychází z historické výkonnosti ETF. Jde o modelový scénář, nikoliv předpověď. Minulé výnosy nezaručují budoucí výsledky.“

Doplň stručné upozornění, že korunový model bez měnového přepočtu nezohledňuje změny USD/CZK, daně ani poplatky brokera.

Podrobné výpočty a metodiku schovej do volitelně rozbalitelné sekce, ale zachovej povinnou atribuci zdroje.

## 7. Testování

Otestuj minimálně:

1. Správné pořadí investovaná částka → horizont → srovnávací pruhy odhadovaného zisku.
2. Správný výpočet zisku bez přičítání původního vkladu do zobrazované částky.
3. Společnou stupnici pruhů a správné znázornění ztrát.
4. Nezávisle editovatelná procenta pro každé ETF.
5. Okamžitý přepočet při ruční změně procenta.
6. Zachování ručních procent při změně částky a investičního horizontu.
7. Změnu historického grafu při změně referenčního období.
8. Současnou aktualizaci předpokládaných procent a odhadovaných zisků při změně historického období.
9. Reset ručně změněných procent při výslovném přepnutí historického období.
10. Funkčnost „Obnovit podle historie“ pro konkrétní ETF.
11. Správnou anualizaci kumulativních historických výnosů.
12. Chybějící/null data bez vymyšlených hodnot.
13. Historické časové řady bez falešných bodů.
14. Ochranu proti dvojímu odečítání expense ratio.
15. Responsivitu na mobilu.
16. Zachování detailního srovnání ETF pod grafem.

Spusť lint, typecheck, unit testy, build, browser testy a kontrolu Vercel Functions.

Zachovej fungující katalog Supabase, srovnání ETF, analytiku, cookies, lead capture a e-mailové workflow.

Neprováděj zbytečné databázové migrace ani vzdálené zápisy do Supabase. Neposílej skutečné e-maily.

## 8. Dokončení

Aktualizuj potřebnou dokumentaci a AI log.

Commitni a pushni pouze na `design-exploration`.

`main` musí zůstat beze změny.

Na závěr stručně napiš:
- Co se změnilo v kalkulačce a grafu.
- Jak se odvozuje výchozí procento každého ETF.
- Jak přepnutí historického období současně mění graf i odhadovaný zisk.
- Jaká skutečná historická období graf podporuje.
- Jaké testy prošly.
- Commit SHA a stav Vercel Preview.

**Priorita: jednoduché, přehledné a vizuálně výrazné srovnání odhadovaných zisků pro všechna vybraná ETF. Jediný historický přepínač musí ovládat graf i výchozí procenta.**
```

## Provedené změny a kontrola

Výchozí commit c9b2108f5e450e6006fbf31e26ddbae165aeb3f6, čistá větev design-exploration, existující checkout. Přečteno AGENTS.md a současné komponenty, výpočty, CSS, dokumentace a testy. Žádné delegování ani nové služby/závislosti/env.

- Cílená úprava frontendového UX: „02 / Odhadovaný výnos“, částka a slider → horizont → řádky všech vybraných ETF místo velkých karet. Zobrazovaná hlavní částka je zisk/ztráta = budoucí modelová hodnota minus vklad. Zisk zelený a se znaménkem +, ztráta červená a záporná.
- Sdílená lineární stupnice min(0, zisky) až max(0, zisky) a společná nula. Null není 0 a nemá pruh; nulový zisk má nulovou délku. Platné řádky určují stupnici, žádné normalizování každého fondu odděleně. Model funguje i pro jediný fond, stávající e-mailové srovnání nadále vyžaduje 2–5.
- Vstupy procent přímo editovatelné a nezávislé. Změna částky/horizontu zachovává ruční sazby. Jediná skupina tlačítek 1/3/5 let nad historickým grafem záměrně obnoví všechny sazby novým CAGR a přepočítá zisky; horizont nemění. Kliknutí již vybraného období není přepnutí a ruční sazby neruší. Obnovit podle historie je samostatná volba konkrétního fondu.
- Použita pouze existující skutečná data a licence; žádné nové HTTP stahování, právní workflow, databázové změny ani falšování ověření. ETF graf a datovaný společný týdenní rastr zůstávají: 52/156 týdnů, pětiletý r5/CAGR se nevydává za pětiletou křivku.
- Výnosy po průběžných nákladech, žádný nový odpočet expense ratio. Viditelná modelová/FX/daňová/broker varování a metodika zachovány. Table/source/CC atribuce až pod grafem zachovány.
- Lokální parametry v parent komponentě zachovávají návrat z formuláře; stále nejde o nové ukládání sazeb/horizontu v Supabase. SMTP/cookies/analytics/backends se nemění.

## Testy a opravy

První nová scale unit kontrola odhalila zápornou JavaScript nulu (−0 místo 0). Normalizována na obyčejnou nulu. Následně 54/54 testů prošlo bez skipped; zahrnují profit-only výpočet, záporné sazby, −100 %, invalid/NaN, CAGR bez dvojích poplatků a sdílenou stupnici v kladné/záporné/smíšené/nulové/null sadě.

Browser sada byla aktualizována pro nové zadání (přepnutí reference nyní musí resetovat ruční sazby, původní očekávání je překonané). Ověřuje pořadí, +62 000 Kč při výnosu 62 % na rok místo 162 000 Kč; −54 200 Kč u 200 000 Kč / −10 % / 3 roky; procentní délky pruhů a společnou nulu; přímou editaci, nezávislost, lokální obnovu, reset všech sazeb a změnu historie, zachování horizontu, všech pět ETF i jediný fond, null/outage, tooltip, návrat z formuláře, synchronizaci slideru a krajní platné částky na mobilu. Izolované API fixture nikdy nejsou skutečné Supabase zápisy nebo e-maily.

Lint, typecheck, produkční build a NodeNext runtime všech 10 API endpointů prošly. Oficiální Vercel Node builder také ověřil všech 10 artefaktů a regresi chybného .ts importu. Původní browser sady prošly včetně obnoveného srovnání, bezpečného mail-failure, prázdného katalogu, cookie/revokace a admin. Nová kontrola měla zpočátku příliš přísnou toleranci pro CSS procenta serializovaná prohlížečem; z 1e−8 upravena na 1e−5, následná cílená sada prošla na 320/390/1440 px včetně null/outage. Vizuálně prohlédnuty mobilní a desktopové screenshoty; stávající sticky designové menu může překrýt část dlouhého elementového screenshotu, nejde o nový panel v toku kalkulačky. Při vizuální kontrole byla sjednocena i fyzická šířka tracků: sloupec částek má pevnou šířku, jinak by počet číslic změnil pixelovou stupnici pruhů. Přidána browser regrese různě dlouhých částek (62 000 proti 1 000 Kč) a nové konečné sestavení. Read-only HEAD veřejného Preview skončil URLError, jeho nasazení není ověřené. Lokální Git autor ověřen RostislavHanza a noreply, fetch větve odpovídal HEAD (0/0). Konečný celý npm run test:browser po úpravě tracků prošel s exit 0: všechny původní i nové sady, mobilní šířky od 320 px a desktop do 1440 px, nulová/chybějící historie a kontrola stejné fyzické stupnice. Finální lint a git diff --check bez chyb. Devět změněných/nových souborů skenováno proti dostupným secret hodnotám: žádná shoda. Commit/push je autorizovaný poslední krok pouze na design-exploration; main se nemění. Žádné skutečné e-maily, vzdálené databázové změny, úpravy environment variables nebo ruční deployment.
