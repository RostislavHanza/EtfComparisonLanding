# Přepracování kalkulačky: editovatelné modely a skutečná historie ETF

## Skutečně dostupný prompt

Níže je přesné znění uživatelem vloženého zadání; starší prompty nedoplňujeme zpětně.

```text
Pracuj v repozitáři `RostislavHanza/EtfComparisonLanding`, výhradně na větvi `design-exploration`. Větev `main` neměň.

## Úkol: Kompletní přepracování kalkulačky a pořadí sekcí ETF srovnávače

Současná stránka již načítá reálných pět ETF ze Supabase: SPY, VOO, IVV, VTI a IWM. Má také historické výnosy, orientační výpočet nákladů a podrobnou srovnávací tabulku.

Současné UX ale není cílový stav. Kalkulačka má příliš mnoho oddělených režimů a textových výsledků, zatímco hlavní graf stále zobrazuje zejména náklady.

Chci vytvořit jednoduchý, intuitivní ETF srovnávač, ve kterém návštěvník okamžitě vidí historicky odvozený model budoucí hodnoty investice pro všechna vybraná ETF a může přímo upravovat procenta výnosnosti.

### Cílové pořadí stránky

1. Výběr ETF a investované částky.
2. Výnosnost jednotlivých ETF a automaticky předvyplněný model investice.
3. Výrazný graf skutečného historického vývoje sledovaných indexů, případně transparentně označeného historického vývoje ETF.
4. Podrobné srovnání ETF se zdroji a metodikou.
5. Stávající lead capture a e-mailové funkce zachovat na vhodném místě.

Nechci přidávat další zbytečné formuláře, režimy, přepínače ani rozsáhlé vysvětlivky.

---

## 1. Hlavní kalkulačka: výnosnost a model investice

Kalkulačka má pracovat současně se všemi ETF, která si uživatel vybral ke srovnání.

### Společné ovládání

Návštěvník nastaví:
- Investovanou částku v Kč — číselný vstup a slider, synchronizované.
- Investiční horizont — například 1, 3, 5, 10, 15 a 20 let.
- Historické referenční období — 1, 3 nebo 5 let podle skutečně dostupných dat.

Investiční horizont a historické referenční období jsou dvě odlišné věci.

Příklad: výnosnost získaná z posledních pěti let slouží jako výchozí roční předpoklad pro model dalších deseti let. Nesmí se tvrdit, že je to skutečná předpověď.

### Karty jednotlivých ETF

Pro každé vybrané ETF zobraz samostatnou přehlednou kartu obsahující:

- Ticker a název ETF.
- Historické anualizované tempo výnosu za vybrané referenční období.
- **Předpokládaný roční výnos (%) jako rovnou editovatelné číselné pole.**
- Modelovou konečnou hodnotu investice po zvoleném horizontu.
- Modelový zisk nebo ztrátu v Kč.
- Expense ratio jako malý doplňkový údaj.

#### Zcela zásadní UX požadavek

**NECHCI checkbox ani tlačítko „Upravit předpoklad“. Procento musí být rovnou editovatelné.**

Například u IVV se v poli automaticky předvyplní historicky odvozené procento a návštěvník ho může okamžitě změnit z 8 na 6 nebo 10.

Každé ETF má vlastní nezávislý vstup.

Přidej pouze nenápadný odkaz nebo malé tlačítko „Obnovit podle historie“, které vrátí předvyplněnou hodnotu daného fondu.

Při změně investované částky nebo investičního horizontu se ručně upravené procento NESMÍ resetovat.

Při změně historického referenčního období se aktualizují automatické předpoklady. U fondů s ručně upravenou hodnotou uživatelskou úpravu zachovej a nabídni možnost obnovy.

Pokud historický údaj pro dané období chybí, ponech procentní pole prázdné; žádná vymyšlená výchozí hodnota. Jakmile návštěvník ručně zadá předpoklad, model může fungovat i bez historie.

Použij čisté mobilní karty, které se na desktopu mohou zobrazit vedle sebe.

---

## 2. Správné historicky odvozené procento a model výnosu

Použij existující infrastrukturu historických dat z TickerInside, ale nejprve ověř skutečný význam a jednotky hodnot.

Pro historický kumulativní výnos za N let použij anualizované geometrické tempo:

`annualizedReturn = ((1 + cumulativeReturn / 100) ** (1 / N) - 1) * 100`

Předpokládaný roční výnos v editovatelném vstupu předvyplň touto hodnotou.

Model budoucího vývoje:

`futureValue = investment * (1 + assumedAnnualReturn / 100) ** horizonYears`

`profit = futureValue - investment`

Podporuj i záporné předpokládané výnosy, avšak ošetři matematicky neplatné hodnoty, například výnos pod -100 %.

Výsledky zobraz v Kč s přehledným zaokrouhlením.

### Náklady fondu

Uživatel chce vidět **modelovou výnosnost po průběžných nákladech ETF**.

Důležité:
- Pokud historická výkonnost ETF představuje net/total return, průběžné náklady už bývají v této výkonnosti zahrnuty. **Expense ratio z ní znovu neodečítej.**
- U modelu založeného na takovém historickém tempu označ předpoklad jako vycházející z výkonnosti ETF po průběžných nákladech.
- Pokud někdy použiješ hrubou výkonnost samotného indexu, můžeš modelovat odhad čisté výkonnosti po nákladech ETF, ale musí být jednoznačně označeno, že jde o zjednodušený výpočet. Nepoužívej stejnou metodiku bez rozlišení na index a ETF.
- Při ručně upraveném procentu vysvětli stručným popiskem, že uživatel zadává předpokládaný **roční výnos po průběžných nákladech ETF**; nákladovost se podruhé neodečítá.
- Nezaměňuj expense ratio s poplatkem brokera.

Původní velký graf nákladů odstraň. Roční nákladovost zůstane jako doplňkový údaj v kartě a v podrobné tabulce.

---

## 3. Výrazný historický graf pod kalkulačkou

Přímo pod kartami všech vybraných ETF vytvoř velký přehledný spojnicový graf s reálnou historií.

Preferuji **skutečný historický vývoj indexů sledovaných vybranými ETF**:

- SPY, VOO a IVV → S&P 500 Index.
- IWM → Russell 2000 Index.
- VTI → Morningstar US Total Market Index.

### Požadavky na graf

- Osa X: skutečná historická data.
- Osa Y: normalizovaná hodnota, například start = 100.
- Různé indexy mají různé křivky a legendu.
- Pokud více ETF sleduje stejný index, nekresli zbytečně několikrát identickou indexovou křivku.
- Jednoznačně ukaž, kterou křivku představuje který index.
- Období 1, 3 a 5 let podle skutečně dostupných dat.
- Responsivní zobrazení pro mobil.
- Tooltip při interakci s historickými hodnotami.
- Změna vybraných ETF nebo období musí aktualizovat graf.

### Ověření historických dat

Nejdřív ověř, zda je možné získat skutečné historické časové řady indexů, včetně podmínek jejich použití.

TickerInside data pro ETF nejsou automaticky totéž jako historická data příslušných indexů.

Pokud data samotných indexů nejsou dostupná za přiměřených technických a licenčních podmínek, **použij raději skutečné historické časové řady ETF**, které máme oprávnění zobrazovat, a graf správně nazvi:

„Historický vývoj ETF“

V takovém případě:
- Každé vybrané ETF může mít vlastní křivku.
- Normalizuj na společný začátek = 100.
- Uveď skutečný zdroj a datum podkladových dat.
- Rozliš historickou výkonnost ETF od hodnoty samotného indexu.

Nepoužívej uměle vytvořené historické body ani interpolaci mezi počáteční a koncovou hodnotou.

Pokud má zdroj například pouze 156 týdnů historie, nesmíš z toho vymýšlet pětiletý graf. U pětiletého výnosu můžeš zobrazit souhrnnou výkonnost, ale časový graf pouze za skutečně dostupný rozsah a s odpovídajícím označením.

Pokud licenční podmínky nepovolují publikovat původní historickou řadu, neobcházej to přejmenováním dat.

Preferuj jednoduché kešování/serverové načítání a minimum nových závislostí.

---

## 4. Podrobná tabulka až pod historickým grafem

Současnou sekci:

„02 / Souvislosti — Vedle sebe. Srozumitelně.“

přesuň **až pod graf historického vývoje**.

Zachovej všechny užitečné údaje pro jednotlivé fondy:

- Ticker a název ETF.
- Sledovaný index.
- Roční nákladovost.
- Datum kontroly a datum podkladu nákladovosti.
- Orientační roční provozní náklady při dané výši investice, pokud je to přehledné.
- Dividendová politika.
- Česká charakteristika fondu.
- Datum ověření údajů.
- Datum datového snímku.
- Rozbalovací původ a ověření jednotlivých údajů.
- Licenční atribuce TickerInside CC BY 4.0.
- Odkazy na zdroje.

Neztrácej podrobnosti, které už máme, jen je přesuň na logičtější místo.

Na mobilu můžeš místo široké tabulky zobrazit přehledné srovnávací bloky.

---

## 5. Výsledné UX a design

Cílem je, aby návštěvník hned po výběru ETF viděl:

1. Kolik investuje.
2. Jakou historickou výnosnost má každé ETF.
3. Jaké procento automaticky používáme jako předpoklad budoucího scénáře.
4. Možnost toto procento ihned přepsat.
5. Kolik by investice hypoteticky měla za zvolený počet let.
6. Pod tím skutečný historický graf.
7. Teprve pod grafem detailní parametry ETF a jejich zdroje.

Žádný samostatný přepínač „Historie / Hypotetický scénář“.

Žádný checkbox „Upravit výnos“.

Žádný velký dominantní graf provozních nákladů.

Žádné opakování stejných metodických vysvětlení na několika místech.

Krátké upozornění pod kalkulačkou:

„Výchozí předpoklad vychází z historické výkonnosti ETF. Jde o modelový scénář, nikoliv předpověď. Minulé výnosy nezaručují budoucí výsledky.“

Dále stručně upozorni, že korunový model bez historických a budoucích měnových kurzů nezohledňuje změny USD/CZK, daně ani poplatky brokera.

Detailní metodiku a zdroje dej do rozbalovací sekce, ale ponech viditelnou potřebnou atribuci.

Zachovej stávající kvalitní vizuální styl, jen zlepši informační hierarchii.

---

## 6. Testování

Otestuj minimálně:

- Načtení všech pěti ETF z existujícího katalogu.
- Správné předvyplnění historicky odvozeného ročního tempa pro každé ETF.
- Přepočet kumulativních výnosů na anualizované.
- Rovnou editovatelný předpokládaný výnos u každého ETF.
- Nezávislé úpravy procent pro různé fondy.
- Zachování ruční úpravy při změně částky a horizontu.
- Obnovení historické hodnoty.
- Chybějící/null historická data.
- Záporné výnosy a ochranu před neplatnými hodnotami.
- Správné zacházení s nákladovostí bez dvojího odečtení.
- Zobrazení reálného historického grafu.
- Změnu grafu při výběru jiných ETF a jiného období.
- Správné zobrazení skutečně dostupného období historie.
- Mobilní zobrazení.
- Zachování detailního srovnání ETF pod grafem.

Spusť lint, typecheck, unit testy, build, browser testy a kontrolu Vercel Functions.

Nezasahuj zbytečně do Supabase, e-mailů, souhlasů s cookies ani analytiky. Zachovej jejich funkčnost.

Nevytvářej další právní schvalovací workflow.

---

## 7. Dokončení

Aktualizuj potřebnou dokumentaci a AI log.

Commitni a pushni pouze na `design-exploration`; `main` musí zůstat beze změny.

Neprováděj vzdálené databázové zápisy ani skutečné odesílání e-mailů.

Na závěr mi napiš:

1. Co se vizuálně a funkčně změnilo.
2. Jak se pro jednotlivá ETF počítá výchozí procento výnosnosti.
3. Která historická období jsou skutečně dostupná.
4. Zda je graf indexový, nebo používá jako transparentní alternativu ETF časové řady.
5. Jaké testy prošly.
6. Commit SHA a stav Vercel Preview.

**Priorita: skutečně fungující, přehledný graf a intuitivní model investice, ne další komplikovaný formulář ani přidávání zbytečných kolonek.**
```

## Kontrola a implementace

- Práce v existujícím checkoutu na design-exploration, výchozí commit 034f10766c02c486ccdca55ecb15a537ad35f32e. Žádní další agenti, nové služby, knihovny ani přihlašovací údaje.
- Zkontrolováno AGENTS.md, frontend, sdílené výpočty, performance server/keš, datová evidence, browser testy a dokumentace. Cloudové prostředí již připravené, žádný nový návrh konfigurace ani změna env.
- Použity skutečné fund JSON a API dokumentace uložené v ignorované cache při bezprostředně předchozím kroku. Datum stažení, as_of a hash se nevydávají za nové načtení nebo lidskou kontrolu. Evidence rozšířena o licencované vypočtené weekly, weeks_end a currency; raw ceny/holdings/feed nejsou commitovány ani předávány.
- Dokumentace výslovně definuje weekly jako 156 total-return desetinných zlomků nejstarších první, společný rastr sobota–pátek, poslední konec weeks_end=as_of. Všech pět skutečných souborů má 156 platných týdnů a r1/r3/r5 k 2026-10-09. Součin weekly není přizpůsobován zaokrouhlenému r3.
- Fund API neobsahuje indexové časové řady. V dostupných podkladech není doložen vhodný bezplatný zdroj s veřejnou redistribucí všech tří indexů. Použita uživatelem povolená transparentní alternativa „Historický vývoj ETF“. Nepředstíráme, že jsme prokázali neexistenci všech možných indexových služeb.
- Licencované weekly v aktuálním snapshotu odlišeny od zakázané redistribuce původního third-party price feedu. Atribuce TickerInside/fondových stránek a CC BY 4.0 zachována, označena normalizace. Dřívější nezávislé ověření úplných právních podmínek provozovatelem zůstává podkladem; žádné nové právní workflow.
- Společná částka, horizont a reference, karty všech vybraných ETF. CAGR automaticky ve vstupu zaokrouhlený na 2 desetinná místa, přímo editovatelný. Nezávislé ruční sazby se neruší při změně ostatních parametrů ani návratu z formuláře. Blank/null není 0 %. −100 % je platné, méně nebo více než povolený limit nemá falešný výsledek. Neodečítáme průběžné náklady podruhé.
- Historický graf z reálných týdenních výnosů normalizovaných na 100, 52/156 týdnů, tooltip myš/dotyk/klávesnicový posuvník, vlastní křivky/legenda. Referenčních 5 let podporuje skutečný r5/CAGR, nikoli vymyšlený pětiletý graf. Datum popisuje kalendářní týdenní hranici, ne doložené konkrétní raw obchodní datum. Null se neinterpoluje ani nenahrazuje nulou; společný souvislý suffix.
- Pod grafem zachovány podrobnosti tabulky, zdroje, datování, nákladovost i roční náklad v Kč. Velký graf nákladů a oddělené režimy odstraněny. Model/FX varování stručně viditelné, podrobnosti rozbalovací.
- Endpoint /api/performance stále kešuje a validuje identitu, listing, licenci a datum; nově normalizuje weekly. Chybné weekly nemůže zničit validní kumulativní výnosy. Klient schema=2 obchází starý CDN formát, nikoli bezpečnostní kontroly. Žádné nové requesty při pohybu slideru.
- Nové modelové parametry jsou lokální pracovní stav, nikoli rozšíření Supabase/e-mailové persistence; uložený průchod dál zachovává výběr a částku. NodeNext .js importy zachovány, žádné zásahy do SMTP, cookies, analytiky nebo migrací.
- README opraven i v zastaralých větách o nenaplněném katalogu, nedostupných podmínkách a neexistující synchronizaci: publikovanou pětici a úspěšný import potvrdil uživatel, nevydáváme to za novou vzdálenou kontrolu.

## Kontroly a opravy

- První lint zachytil Node prostředí testu (globální Node typ) a nadbytečné escape znaky; opraveno. Celá následná sada 52 unit/backend testů prošla, lint/typecheck/build také.
- Prošly všechny desítky browser kontrol původního průchodu, zachované varianty, mail-failure, prázdný katalog, privacy/reload/revokace/error a Preview admin. Nové karty/graf testovány na 320/390/1440 px nad izolovanými skutečnými redukovanými daty. Jsou to fixtures, nikoli vzdálený SMTP/Supabase test.
- Oficiální Vercel Node builder ověřil všech deset výsledných artefaktů bez TypeScript loaderu, včetně mutační regrese chybného .ts importu. Není to skutečný deployment.
- Po prohlédnutí 320px screenshotu zůstává graf čitelný a stránka bez horizontálního overflow. Zvětšení osových popisků zachováno. Na samotné sekci se může ve screenshotu překrývat stávající sticky navigace při scrollu; graf je normální sekce, ne modal.
- Doplňkově opraven baseline posledního samostatného částečného týdne na předchozí pátek (nikoli automaticky stejný den −7). Regresní test pokrývá čtvrteční poslední close. Browser test rozšířen o předvyplnění všech pěti fondů, myší tooltip a návrat z formuláře bez resetu.

Finálně prošly lint, typecheck, 52/52 unit/backend testů bez skipped, build a všechny browser sady na posledním buildu. Nové browser kontroly navíc ověřily všechny automatické sazby, tooltip myší a zachování ručních hodnot po návratu z formuláře. Oficiální Vercel builder byl po poslední změně opakován: všech 10 artefaktů a .ts-import mutační regrese prošly. Git diff --check bez chyb; sken 18 změněných/nových souborů proti dostupným secret hodnotám našel 0 shod. Lokální autor ověřen RostislavHanza a GitHub noreply; fetch design-exploration odpovídal HEAD (0/0). Read-only HEAD veřejného Preview skončil URLError; živý stav nového deploymentu se nevydává za ověřený. Commit/push je poslední autorizovaný krok na design-exploration, bez mergování main. Žádné skutečné e-maily, vzdálené databázové zápisy/migrace, cloudové změny ani ruční deployment.
