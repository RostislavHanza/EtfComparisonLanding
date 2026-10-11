# První veřejný katalog: podklady ke schválení

## Nejkratší cesta k první veřejné pětici

**20 kandidátů není 20 publikovaných ETF.** Synchronizace aktualizuje `etf_sync_candidates`; nevytváří schválení, nepřepíná published a nedoplňuje index/dividendy/popis. `/api/catalog` čte `public.etfs` s published=true a verified_at nejvýše 14 dní starým. S 0 publikovanými řádky je prázdný výsledek správný. Ani opakované Otestovat synchronizaci ETF toto nevyřeší.

Použijte existující návrh a schvalovací šablonu, nepřepisujte jednotlivé fondy do databáze. V kořeni projektu nejprve vytvořte **lokální kopii** (příkaz původní existující kopii nepřepíše):

```sh
node --input-type=commonjs -e "const fs=require('node:fs');fs.mkdirSync('.cache',{recursive:true});fs.copyFileSync('data/review/priority-five.approval.example.json','.cache/approval.json',fs.constants.COPYFILE_EXCL)"
```

Otevřete `.cache/approval.json` v editoru. Následující doplní skutečný správce po kontrole, nikoli AI:

| Místo v kopii JSON | Co přesně potvrdit / doplnit |
| --- | --- |
| reviewer, verifiedAt | Jméno skutečného kontrolora a ISO čas dokončení kontroly se zónou. Čas stažení API není lidská kontrola. |
| usageReview | approved=true jen při doloženém oprávnění k použití všech vybraných údajů; skutečný reviewer, reviewedAt, konkrétní basis a policyUrl. Pro jednotlivé emitenty lze dát vlastní usageReview přímo do records. |
| records: každý ticker | approved=true pouze pro zkontrolovaný fond; ostatní zůstávají false. dataAsOf je doložené datum datového snímku fondu, nikoli automaticky dnešek nebo datum ceny API. Pole mají navíc vlastní as_of ve zdrojích. |
| confirmedSourceIds | Ze sourceIdsToReview přenést pouze identifikátory dokumentů, které jste skutečně otevřeli a zkontrolovali. Příprava vyžaduje potvrzení všech použitých dokumentů vybraného fondu. |
| sourceDateOverrides | U neznámého data, zejména vti-page, doplnit skutečně doložené datum pro konkrétní evidenceId. Potvrzení aktuálního pozorovaného stavu není historické datum změny CRSP → Morningstar. Pokud datum nelze doložit, VTI nechat neschválené. |

Konkrétní kontrola první pětice: SPY přesně **0.0945 %** podle emitenta; VTI **Vanguard Morningstar Total Stock Market ETF / Morningstar US Total Market Index** podle aktuálního profilu. VOO/IVV/VTI 0.03 %, IWM 0.19 % jsou v připravených emitentských podkladech; při lidské kontrole znovu ověřit aktuální hodnoty. U každého fondu potvrdit ticker + NYSE Arca a čtvrtletní distribuci v uvedeném primárním dokladu, i správnost původního českého popisu. Konkrétní URL a rozpory jsou níže a v evidence JSON.

Právní kontrola stále není hotová: SSGA footer požaduje písemný souhlas pro reprodukci obsahu; pro naše omezené faktické údaje není oprávnění doložené. Vanguard podmínky pro vybraná metadata nejsou kompletně prověřené. BlackRock terms nebylo možné přečíst přes zdejší proxy. Správce musí otevřít příslušné podmínky, zajistit povolení nebo doložené posouzení vztahující se právě na použitá metadata a zaznamenat podklad do basis/policyUrl. Samotná veřejná dostupnost stránky ani vlastní český popis licenci ostatních údajů nenahrazují. TickerInside CC BY 4.0 nepokrývá cizí emitentské dokumenty. Bez doloženého podkladu ponechte usageReview.approved=false.

Po skutečné kontrole spusťte tyto **dva nezapisující** příkazy:

```sh
npm run prepare:etfs -- data/review/priority-five.pending.json .cache/approval.json .cache/approved-etfs.json
npm run import:etfs -- .cache/approved-etfs.json
```

První připraví pouze výslovně schválené fondy a ověří celou dávku. Druhý je dry run. Existující výstupní soubor se nepřepisuje; při další přípravě zvolte nový název. Není nutné schválit všech pět najednou, ale pro funkční porovnání jsou nutné alespoň dva.

Teprve po úspěšné validaci, kontrole cílového projektu a záloze dotčených řádků spusťte správce s existujícími serverovými proměnnými:

```sh
npm run import:etfs -- .cache/approved-etfs.json --apply
```

Import používá SUPABASE_URL a SUPABASE_SECRET_KEY (nebo SUPABASE_SERVICE_ROLE_KEY), nikoli veřejný frontendový klíč. Hodnoty nikdy nepatří do JSON ani příkazu/Gitu. Pro tento projekt musí URL odpovídat `https://kdkxoykuhqwodimawcrs.supabase.co`. Upsert podle tickeru bezpečně aktualizuje IVV/IWM; neschválené fondy mimo dávku, například ITOT, ponechá. published=true vzniká až z plně validní schválené dávky. SPY/VTI automatický opt-in ponechte vypnutý kvůli rozdílům proti API.

Po importu otevřete Preview `/api/catalog` a běžnou stránku: ověřte tickery, datum kontroly a 2–5 fondů v kalkulačce. Znovunačtení katalogu nevyžaduje změny frontendu ani další synchronizaci. Pokud API zůstává prázdné, zkontrolujte cílový projekt, published a čerstvost verified_at; nepřepínejte published hromadně bez validátoru.

**Rozdělení práce:** správce potvrzuje skutečné zdroje/datum a oprávnění k publikaci. Asistent může po dodání výslovného schválení připravit a validovat dávku a zkontrolovat importní výsledek; vzdálený zápis potřebuje samostatné zadání. V této úloze není žádný právní souhlas domýšlen, není vytvořena schválená dávka a neprobíhá vzdálený import. Nová migrace pro publikaci není potřeba.

## Stav

V předchozím commitu byly skutečně načteny odpovědi TickerInside, aktuální stránky emitentů a všech pět oficiálních PDF factsheetů. V této úloze bylo opakovaně načteno všech pět profilů a pět factsheetů (HTTP 200); technicalRecheck odděleně zaznamenává dostupnost a hash, nikoli nové lidské schválení. PDF i stránky SPY/VOO/VTI mají stejný hash jako původní evidence. Evidence je v `data/review/priority-five.evidence.json`: konkrétní URL, SHA-256 staženého souboru, datum evidence a minimální projekce API bez holdings/cen. Celé dokumenty nejsou znovu distribuovány. Jde o výzkumnou kontrolu asistenta, **nikoli schválení člověkem**. Stav úspěšné vzdálené synchronizace 20 kandidátů/0 chyb pochází z potvrzení uživatele; tato úloha do Supabase nevstupovala.

Pět návrhů má vyplněné věcné parametry. **Nula záznamů nyní splňuje všechny publikační požadavky.** Emitentské doklady nyní mohou doložit listing; zbývá lidská kontrola a doložené schválení práv. `usageReview.approved=false`, všechny lidské kontroly jsou null a `dataAsOf` zůstává null do schválení významu celkového data. Existující import je proto odmítne před jakýmkoli databázovým zápisem.

| Ticker | Název návrhu podle emitenta (symboly ® nejsou součástí textu návrhu) | Index podle emitenta | Nákladovost (%) | Distribuce | Stav |
| --- | --- | --- | ---: | --- | --- |
| SPY | State Street SPDR S&P 500 ETF Trust | S&P 500 Index | 0.0945, gross i net v factsheetu | Quarterly | Čeká na práva/člověka; nebrat zaokrouhlených 0.09 z API |
| VOO | Vanguard S&P 500 ETF | S&P 500 Index | 0.03 | Quarterly | Čeká na práva/člověka |
| IVV | iShares Core S&P 500 ETF | S&P 500 Index | 0.03 | Quarterly | Čeká na práva/člověka |
| VTI | Vanguard Morningstar Total Stock Market ETF | Morningstar US Total Market Index | 0.03 | Quarterly | Navíc nutné schválit aktuální název/index a jeho datum proti starším podkladům |
| IWM | iShares Russell 2000 ETF | Russell 2000 Index | 0.19 | Quarterly | Čeká na práva/člověka |

České popisy v pending JSON jsou původní krátké formulace podle doložených cílů fondů. Neobsahují očekávané výnosy, zkopírované marketingové odstavce ani příslib dostupnosti pro retail v EU. Quarterly je frekvence distribuce, nikoli garantovaná výše dividendy. Volitelné reinvestování u brokera není akumulační třída fondu.

## Konkrétní doklady po fondech

- **SPY:** [aktuální SSGA profil](https://www.ssga.com/us/en/individual/etfs/state-street-spdr-sp-500-etf-trust-spy), [factsheet](https://www.ssga.com/library-content/products/factsheets/etfs/us/factsheet-us-en-spy.pdf). Factsheet datovaný 30. 6. 2026, strana 1: název/ticker, cíl S&P 500, gross i net expense ratio 0.0945 %. Profil potvrzuje sazbu; Fund Information a Listing Information jsou označené 11. 10. 2026 a uvádějí Quarterly a NYSE ARCA/SPY. Aktuální titul používá State Street a ochranné značky; návrh je normalizuje jako běžný text. API 0.09 % je market_data bez data, pro veřejnou sazbu se nepoužije.
- **VOO:** [Vanguard profil](https://investor.vanguard.com/investment-products/etfs/profile/voo), [factsheet F0968](https://fund-docs.vanguard.com/F0968.pdf). Factsheet k 30. 6. 2026: název/ticker, S&P 500, plná replikace, 0.03 %, Quarterly, NYSE Arca. Ve veřejném HTML profilu jsou rovněž expenseRatio 0.03 %, expenseRatioAsOfDate 28. 4. 2026 a distributionSchedule Quarterly; tato informace nebyla získána přes interní API. Návrh primárně odkazuje na čitelný factsheet.
- **IVV:** [iShares profil](https://www.ishares.com/us/products/239726/ishares-core-sp-500-etf), [factsheet](https://www.ishares.com/us/literature/fact-sheet/ivv-ishares-core-s-p-500-etf-fund-fact-sheet-en-us.pdf). Factsheet k 30. 6. 2026: S&P 500 Index (USD), 0.03 %, Quarterly, NYSE Arca; profil potvrzuje tyto hodnoty. Zobrazovaný index je normalizovaný na S&P 500 Index, nikoli jinou investiční strategii; označení USD v tabulce benchmarku je kontext měny.
- **VTI:** [aktuální Vanguard profil](https://investor.vanguard.com/investment-products/etfs/profile/vti), [factsheet F0970](https://fund-docs.vanguard.com/F0970.pdf). Factsheet k 30. 6. 2026 uvádí staré Vanguard Total Stock Market ETF / CRSP US Total Market Index, 0.03 %, Quarterly, NYSE Arca. Současně vysvětluje plánované přejmenování CRSP na Morningstar a fondů v červenci 2026. Aktuální profil již uvádí fundFullName Vanguard Morningstar Total Stock Market ETF, objective a benchmarkShortName Morningstar US Total Market Index; TickerInside má stále starý název. Návrh proto nepřebírá starý název/index jako aktuální. Přesné účinné datum nového názvu/indexu ve zkoumaných podkladech není: `as_of=null` u těchto polí. June factsheet se nesmí vydávat za důkaz tehdejší platnosti nového názvu. Nákladovost ve veřejném HTML: 0.03 %, datum 28. 4. 2026. VTI neumožňujte automatickou synchronizaci nákladovosti, dokud se nevyřeší přesná shoda názvu s API. Stejnou shodu nesplňuje ani SPY: API používá starší SPDR S&P 500 ETF Trust bez State Street, navíc zde není datovaný SEC fee zdroj.
- **IWM:** [iShares profil](https://www.ishares.com/us/products/239710/ishares-russell-2000-etf), [factsheet](https://www.ishares.com/us/literature/fact-sheet/iwm-ishares-russell-2000-etf-fund-fact-sheet-en-us.pdf). Factsheet k 30. 6. 2026: Russell 2000, 0.19 %, Quarterly, NYSE Arca; profil potvrzuje.

Podkladové datum nákladovosti v TickerInside: VOO/VTI 28. 4. 2026, IVV/IWM 27. 7. 2026; jde o API deklaraci SEC filing data. Citované SEC filing v této úloze nebyly nezávisle přečteny. Novější API datum samo nečiní starší emitentský factsheet aktuálnějším ani lidsky ověřeným. Datum cen/holdings se pro nákladovost nepoužívá.

## Co stále chybí

### Listing: technická překážka odstraněna

Oficiální produktový profil / factsheet skutečného emitenta je primárním zdrojem identifikace fondu i jeho burzy. Samostatný doklad nyse.com není pro tyto jednoduché fondové údaje nezbytný. Validátor proto přijímá NYSE, nebo známou dvojici ticker–emitent: SSGA pro SPY/SPYD/MDY/DIA, Vanguard/fund-docs pro VOO/VTI/VYM/VTV/VUG/VT/VEA/VWO, iShares pro IVV/ITOT/IWM/IJH/IJR. Emitentský důkaz musí výslovně obsahovat ticker a NYSE Arca, projít doménovou kontrolou, lidským datováním a schválením práv. Stránka jiného emitenta, TickerInside nebo tvrzení bez identifikace fondu nestačí. Šest ostatních povinných polí, čerstvost a usageReview se neoslabují.

Dřívější NYSE HTTP 200 shell stále není ověřeným listingem. Pro první pětici jej však není nutné shánět: použijte již doložené oficiální emitentské zdroje v pending JSON a při závěrečné kontrole je potvrďte.

### Práva k použití

- [TickerInside terms](https://tickerinside.com/terms/) byly skutečně přečteny: aktuální vlastní práce/soubory pod CC BY 4.0, i komerční použití s atribucí. Licence této projekce neuděluje práva k jiným emitentským dokumentům. Neuchováváme ani nepoužíváme holdings/ceny/history/flows; jejich podmínky nelze zaměnit.
- SSGA produktový footer výslovně podmiňuje reprodukci/kopírování/předání obsahu písemným souhlasem SSGA. Oprávnění pro konkrétní omezený faktický přehled zde nebylo schváleno. Pouhá atribuce tento požadavek nenahrazuje.
- Vanguard factsheety mají copyright a indexová označení. Kompletní podmínky použití vybraných metadat nebyly ověřeny. Nejde o schválení kopírování dokumentů ani CUSIP/indexových dat; obecný zákaz u CUSIP neinterpretujeme jako licenční závěr ke každému faktu.
- iShares odkazuje na [BlackRock terms](https://www.blackrock.com/corporate/compliance/terms-and-conditions); HTTPS proxy blokuje jeho načtení (403 při vytvoření tunelu). Omezení Morningstar ratings na produktových stránkách nejsou automaticky vydávána za podmínky veškerých fund metadat; ratings nepoužíváme. Pro naše pole je právní kontrola stále otevřená.
- NYSE odkazuje na [ICE terms](https://www.ice.com/privacy-security-center/terms-of-use), rovněž blokované proxy. Pokud by se NYSE používala jako zdroj, je nutná i kontrola oprávnění k jejímu údaji; první pětice používá emitentské doklady.

Operátor má zaznamenat skutečný podklad pro použití **všech** vybraných zdrojů: licenci, oprávnění/povolení nebo doložený závěr vztahující se ke konkrétním faktickým metadatům a původním popisům. `usageReview.policyUrl` přijímá schválené domény zdrojů a navíc blackrock.com/ice.com pouze pro právní podklady. Jde o oficiální odkazy z emitenta/burzy; jejich povolení v konfiguraci neznamená přečtení ani schválení obsahu. Do basis zahrňte také zbývající právní podklady, samotná jedna policyUrl nepokrývá všechny zdroje. Jedno approved=true bez podkladu ke všem zdrojům nestačí.

## Dávkové schválení a import bez ručního přepisování ETF

1. Zkontrolujte podklady uvedené výše a hodnoty `data/review/priority-five.pending.json`; nejde o automaticky schválený katalog. Práva a skutečného kontrolora musí doplnit správce. Listing je nyní doložitelný emitentem; u VTI potvrďte aktuální Morningstar název/index a datum pozorovaného stavu. Pro historické datum přejmenování je nutný další dokument, nikoli odhad.
2. Zkopírujte `data/review/priority-five.approval.example.json` například do ignorovaného `.cache/approval.json`. Vyplňte vlastní `reviewer`, skutečný `verifiedAt` a právní `usageReview` (approved až po kontrole; reviewer, reviewedAt, basis a skutečný policyUrl). Údaje se nikdy negenerují z času stažení. Pro každý fond nastavte approved=true pouze po kontrole, doplňte dataAsOf, přeneste skutečně zkontrolované sourceIdsToReview do confirmedSourceIds. Neověřený fond nechte approved=false. U zdroje s neznámým datem doplňte sourceDateOverrides podle evidenceId; typicky aktuální vti-page. Jedním potvrzením dokumentu schvalujete jeho použité údaje, nikoli celý web. Lze zvolit per-fund usageReview místo společné právní kontroly.
3. Připravte soubor: `npm run prepare:etfs -- data/review/priority-five.pending.json .cache/approval.json .cache/approved-etfs.json`. Script přenese pouze výslovně schválené fondy, použije data uvedená kontrolorem a projde stávající publikační validátor. Chybějící potvrzení dokumentu, neznámé datum či approved=false práv zablokuje přípravu; nevznikne částečně nevalidní soubor. Existující výstup se nepřepisuje. Script nespojuje databázi a nemá --apply.
4. Ověřte dry run: `npm run import:etfs -- .cache/approved-etfs.json`. U pending JSON má validace stále selhat. Neposouvejte staré verifiedAt mechanicky: 14denní pravidlo zůstává.
5. Před zápisem zkontrolujte/zazálohujte dotčené řádky v Supabase. IVV/IWM se upsertují podle tickeru, nezdvojují. Import zachová dosavadní tickerinside_sync_enabled; **SPY/VTI nechte vypnuté**, API má rozdílný název a u SPY i nedatovaný zaokrouhlený poplatek. Ostatní opt-in povolit až po přijetí metodiky/licence TickerInside.
6. Pouze po kontrole spusťte s již existujícími serverovými proměnnými `npm run import:etfs -- .cache/approved-etfs.json --apply`. Jde o dávkový upsert stávajícím scriptem; fondy mimo dávku se nemažou. Klíče nevkládejte do JSON/příkazu/Gitu.
7. Ověřte pět tickerů bez duplicit, published, `/api/catalog`, zdroje/datum a kalkulačku. Žádný import ani vzdálený zápis nebyl v této úloze proveden.

Prvních pět fondů má nyní věcné podklady připravené k závěrečné kontrole. Zbývá konkrétní lidské ověření dat a práv, nikoli další technické shánění NYSE shellu. Rozšíření použije stejný dávkový postup a 20 již synchronizovaných kandidátů; API samo stále nedodává index/dividendovou politiku. Další fondy nebyly bez úplných zdrojů automaticky doplněny. SCHB/SCHD/RSP vyžadují zvláštní ověření/povolení příslušného emitenta v mapě.
