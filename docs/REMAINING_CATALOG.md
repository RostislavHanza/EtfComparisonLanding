# Zbývající katalog: archiv přípravy dvanácti fondů

Aktuální stav: správce potvrdil import této dvanáctky a celkem 17 publikovaných ETF. Produktové stránky posledních tří jsou nyní dostupné a nová samostatná dávka je připravená podle [FINAL_THREE_CATALOG.md](FINAL_THREE_CATALOG.md). Níže zůstává pravdivá historická evidence původních blokací a dávky; neopakujte import dvanácti kvůli dokončení posledních tří.

Skutečná technická kontrola 12. října 2026 využila aktuální veřejné produktové stránky emitentů, jejich veřejné factsheety a konkrétní TickerInside fund JSON. Nejde o tvrzení osobní kontroly provedené člověkem. Přesný čas stažení, SHA-256 odpovědi, chyby a čas následné technické kontroly jsou v `data/review/remaining-fifteen.evidence.json`. Úplné HTML/PDF/holdings se do repozitáře nekopírují.

## Připravená data

| ETF | Aktuální název | Index | Nákladovost | Distribuce |
| --- | --- | --- | --- | --- |
| DIA | State Street SPDR Dow Jones Industrial Average ETF Trust | Dow Jones Industrial Average | 0,16 % | měsíční |
| IJH | iShares Core S&P Mid-Cap ETF | S&P MidCap 400 Index | 0,05 % | čtvrtletní |
| IJR | iShares Core S&P Small-Cap ETF | S&P SmallCap 600 Index | 0,06 % | čtvrtletní |
| ITOT | iShares Core S&P Total U.S. Stock Market ETF | S&P Total Market Index (TMI) | 0,03 % | čtvrtletní |
| MDY | State Street SPDR S&P MIDCAP 400 ETF Trust | S&P MidCap 400 Index | 0,23 % | čtvrtletní |
| SPYD | State Street SPDR Portfolio S&P 500 High Dividend ETF | S&P 500 High Dividend Index | 0,07 % | čtvrtletní |
| VEA | Vanguard FTSE Developed Markets ETF | FTSE Developed All Cap ex US Index | 0,03 % | čtvrtletní |
| VT | Vanguard Total World Stock ETF | FTSE Global All Cap Index | 0,06 % | čtvrtletní |
| VTV | Vanguard Morningstar Value ETF | Morningstar US Large Cap Value Index | 0,03 % | čtvrtletní |
| VUG | Vanguard Morningstar Growth ETF | Morningstar US Large Cap Growth Index | 0,03 % | čtvrtletní |
| VWO | Vanguard FTSE Emerging Markets ETF | FTSE Emerging Markets All Cap China A Inclusion Index | 0,06 % | čtvrtletní |
| VYM | Vanguard High Dividend Yield ETF | FTSE High Dividend Yield Index | 0,04 % | čtvrtletní |

Všech dvanáct má NYSE Arca potvrzenou emitentem, nákladovost porovnanou s API, vlastní stručný český popis a původ každého pole. Ochranné známky se nepřebírají jako grafika; normalizované názvy zachovávají identitu fondu. Listing se dokládá konkrétní produktovou stránkou, nikoli obecným výskytem názvu burzy bez identifikace fondu.

**Odlišnosti:** DIA/MDY mají v API zkrácené názvy bez aktuálního State Street/Trust. VTV/VUG mají v API staré názvy; červnové Vanguard PDF ještě uvádí CRSP, současná veřejná profilová stránka již Morningstar. Použita aktuální stránka, nikoli starý název/benchmark. Historické datum přejmenování nebylo domyšleno. VYM má na současném profilu i v API 0,04 %, VEA 0,03 %, VUG/VTV 0,03 %. Konkrétní datum prospectus filing u nákladovosti se odlišuje od dne pozorování/stažení/kontroly. U ostatních statických údajů je datum dne pozorovaného stavu, nikoli domyšlený den účinnosti změny.

Veřejný Vanguard profil zveřejňuje potřebné údaje v HTML-embedded fund data; použita tato stránka, žádné nedokumentované interní API. Produktové stránky/factsheety zde slouží jednorázové kontrole několika faktů, nikoli automatickému scrapingu při každé návštěvě nebo přebírání marketingových textů.

## Rozhodnutí a soubory

- `data/remaining-twelve.approved.json`: finální validní import dvanácti úplných fondů, pouze jejich řádky.
- `data/review/remaining-fifteen.pending.json`: původní technický návrh těchto dvanácti, bez schválení použití; sám není importovatelný.
- `data/review/remaining-fifteen.demo-approval.json`: konkrétní výběr dvanácti a hash návrhu. Odděluje aktuální výslovný pokyn provozovatele připravit schválený import podle již přijaté omezené faktické metodiky od skutečné technické kontroly provedené AI. Označení admin není tvrzením o osobní kontrole každého dokumentu člověkem; datum je skutečný provedený technický krok. Není tvrzen právní audit ani licence/písemný souhlas emitenta. Finální kontrola a spuštění zápisu nadále patří správci.
- `data/review/remaining-fifteen.evidence.json`: skutečné zdroje, čas stažení/kontroly a odlišnosti API/emitenta.
- `data/review/remaining-fifteen.blocked.json`: RSP, SCHB, SCHD **nejsou schválené ani importovatelné**.
- `data/review/remaining-fifteen.performance.json`: skutečně načtené redukované výnosové odpovědi všech patnácti, bez raw cen nebo holdings; regresní podklad pro dostupnost skutečné historie.

TickerInside fund JSON zůstává licencovaným původem tickerů, burzy, aktuálních shodných názvů a nákladovosti; aktuální vlastní API práce pod deklarovanou CC BY 4.0, s existující atribucí a označením úprav. Index/distribuce, opravené názvy a samostatná kontrola listingu jsou emitentská fakta, nejsou vydávána za licencovaná od TickerInside. Popisy jsou vlastní. Zachována dříve přijatá omezení práv třetích stran a omezený faktický demo model; žádné kopie dokumentů/marketingu/holdings. Rozhodnutí provozovatele se nezaměňuje za právní povolení emitenta.

## Konkrétní blokace tří fondů

Schwab Asset Management stránky pro SCHB/SCHD a Invesco produktová stránka RSP jsou v tomto cloudovém prostředí blokovány síťovou bránou (CONNECT 403), stejně jako zkusené veřejné Schwab quote stránky a SEC filing indexy. Není to prokázaný zákaz publikace faktu ani požadavek na API klíč. Omezení nebylo obcházeno proxy nebo nedokumentovaným API.

API u všech tří poskytuje identitu, NYSE Arca, nákladovost a historii. **To nestačí k požadovanému nezávislému aktuálnímu ověření indexu, distribuce a případných změn metadat.** Proto mají index/distribuci null a nejsou součástí importu. Konkrétní URL a selhání jsou v evidenci. Správce může tyto primární podklady samostatně ověřit z dostupného prohlížeče a doložit skutečné údaje; poté lze připravit další malou dávku stejným workflow. Nepublikovat je jen podle API nebo předpokládaných známých parametrů. V této úloze se žádný údaj o jejich indexu/dividendách nevymýšlí.

## Bezpečný ruční import

Nejprve zkontrolujte tabulku, finální JSON, odlišnosti a evidenci. Dávka se nesmí považovat za osobní lidskou kontrolu jen proto, že je soubor pojmenovaný approved. Její publikace je omezena na kompletní technicky doložené fondy a aktuální pokyn provozovatele; správce před zápisem potvrdí, že tento konkrétní výsledek odpovídá jeho rozhodnutí.

```sh
npm run import:etfs -- data/remaining-twelve.approved.json
```

Očekávaný dry run: **12 záznamů**, žádný zápis. Pokud kontrola data/rozhodnutí nevyhovuje, nepoužijte --apply; nesnižujte validaci. Skutečná kontrola nesmí být nahrazena posunutím data.

V prostředí, kde správce již bezpečně nastavil SUPABASE_URL pro projekt `kdkxoykuhqwodimawcrs` a serverový SUPABASE_SECRET_KEY nebo SUPABASE_SERVICE_ROLE_KEY, po kontrole správného projektu a záloze stávajícího ITOT:

```sh
npm run import:etfs -- data/remaining-twelve.approved.json --apply
```

Upsert onConflict=ticker aktualizuje ITOT bez duplicit. Přidá ostatních jedenáct, nezapisuje původní SPY/VOO/IVV/VTI/IWM, nezasahuje do jejich zdrojů, uložených snapshotů/srovnání, kontaktů ani synchronizačních kandidátů. Nepoužívá delete/truncate a nepublikuje RSP/SCHB/SCHD. **Nová migrace ani proměnné nejsou potřeba.** Zde byl spuštěn pouze dry run; --apply nikoli.

Po importu ověřte `/api/catalog`: celkem 17 publikovaných fondů, ITOT právě jednou, RSP/SCHB/SCHD stále mimo katalog. Současných pět se zachovanými hodnotami. Na webu hledání VTV/VUG, první šestice a Zobrazit další, výběr jednoho/více fondů, skutečná nákladovost a zdroje. Úplný e-mailový proces je samostatný ruční test správce; zde žádný skutečný e-mail nebyl poslán.

Ověření zdrojů má nadále limit 14 dní. Při pozdějším importu nově zkontrolujte podklady a připravte skutečně datovanou dávku, nikoli pouze přepsaná data kontroly. Pro opakované sestavení z tohoto návrhu a kontrolovaného manifestu použijte existující workflow s novým souborem:

```sh
npm run prepare:etfs -- data/review/remaining-fifteen.pending.json data/review/remaining-fifteen.demo-approval.json .cache/remaining-reviewed-import.json
```

Změna návrhu vyžaduje nové skutečné posouzení a odpovídající hash. Automatická synchronizace dále nepublikuje a nemění statická metadata. U nových řádků je automatická změna nákladovosti ve výchozím stavu vypnutá; pokud by ji správce později povolil, existující kontrola názvu/datu brání degradaci VTV/VUG na starší API identitu.

## Historie bez změny webu

Všech patnáct aktuálních API odpovědí má skutečné r1/r3/r5 a 156 weekly return bodů s as_of/weeks_end 2026-10-09. To je datum podkladových cen, nikoli datum kontroly metadat. Historický zdroj rozšířen z pevné pětice na původních dvacet známých tickerů; endpoint zůstává chráněný, se stejnou validací NYSE Arca/identity/licence, timeoutem, keší a zachováním posledních platných dat. Nejvýše tři souběžná načítání dovolí zvládnout dvacet pětisekundových timeoutů v rozpočtu stávající funkce. Žádná cena/holding se neposílá frontendem; jen licencované souhrnné a týdenní výnosy. Širší historická allowlist nepřidává neověřený fond do veřejného katalogu.

Dostupnost výnosu nyní není slibem budoucí dostupnosti: null/chyba zůstává poctivě bez předvyplněné sazby či vymyšlené křivky, ruční model a metadata fungují dál. Pětiletý souhrnný výnos nevytváří vymyšlenou pětiletou řadu; graf nadále respektuje skutečně dostupné týdny. Vzhled a kalkulační matematika se nezměnily.
