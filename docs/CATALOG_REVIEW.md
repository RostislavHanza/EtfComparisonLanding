# První veřejný katalog: podklady ke schválení

## Stav

Při této úloze byly skutečně načteny odpovědi TickerInside, aktuální stránky emitentů a všech pět oficiálních PDF factsheetů (HTTP 200). Evidence je v `data/review/priority-five.evidence.json`: konkrétní URL, SHA-256 staženého souboru, datum evidence a minimální projekce API bez holdings/cen. Celé dokumenty nejsou znovu distribuovány. Jde o výzkumnou kontrolu asistenta, **nikoli schválení člověkem**. Stav úspěšné vzdálené synchronizace 20 kandidátů/0 chyb pochází z potvrzení uživatele; tato úloha do Supabase nevstupovala.

Pět návrhů má vyplněné věcné parametry. **Nula záznamů nyní splňuje všechny publikační požadavky.** Všechny čekají na nezávislý doklad NYSE, lidskou kontrolu a doložené schválení práv. `usageReview.approved=false`, všechny lidské kontroly jsou null a `dataAsOf` zůstává null do schválení významu celkového data. Existující import je proto odmítne před jakýmkoli databázovým zápisem.

| Ticker | Název návrhu podle emitenta (symboly ® nejsou součástí textu návrhu) | Index podle emitenta | Nákladovost (%) | Distribuce | Stav |
| --- | --- | --- | ---: | --- | --- |
| SPY | State Street SPDR S&P 500 ETF Trust | S&P 500 Index | 0.0945, gross i net v factsheetu | Quarterly | Čeká na NYSE/práva/člověka; nebrat zaokrouhlených 0.09 z API |
| VOO | Vanguard S&P 500 ETF | S&P 500 Index | 0.03 | Quarterly | Čeká na NYSE/práva/člověka |
| IVV | iShares Core S&P 500 ETF | S&P 500 Index | 0.03 | Quarterly | Čeká na NYSE/práva/člověka |
| VTI | Vanguard Morningstar Total Stock Market ETF | Morningstar US Total Market Index | 0.03 | Quarterly | Navíc nutné schválit aktuální název/index a jeho datum proti starším podkladům |
| IWM | iShares Russell 2000 ETF | Russell 2000 Index | 0.19 | Quarterly | Čeká na NYSE/práva/člověka |

České popisy v pending JSON jsou původní krátké formulace podle doložených cílů fondů. Neobsahují očekávané výnosy, zkopírované marketingové odstavce ani příslib dostupnosti pro retail v EU. Quarterly je frekvence distribuce, nikoli garantovaná výše dividendy. Volitelné reinvestování u brokera není akumulační třída fondu.

## Konkrétní doklady po fondech

- **SPY:** [aktuální SSGA profil](https://www.ssga.com/us/en/individual/etfs/state-street-spdr-sp-500-etf-trust-spy), [factsheet](https://www.ssga.com/library-content/products/factsheets/etfs/us/factsheet-us-en-spy.pdf). Factsheet datovaný 30. 6. 2026, strana 1: název/ticker, cíl S&P 500, gross i net expense ratio 0.0945 %. Profil potvrzuje sazbu; Fund Information a Listing Information jsou označené 11. 10. 2026 a uvádějí Quarterly a NYSE ARCA/SPY. Aktuální titul používá State Street a ochranné značky; návrh je normalizuje jako běžný text. API 0.09 % je market_data bez data, pro veřejnou sazbu se nepoužije.
- **VOO:** [Vanguard profil](https://investor.vanguard.com/investment-products/etfs/profile/voo), [factsheet F0968](https://fund-docs.vanguard.com/F0968.pdf). Factsheet k 30. 6. 2026: název/ticker, S&P 500, plná replikace, 0.03 %, Quarterly, NYSE Arca. Ve veřejném HTML profilu jsou rovněž expenseRatio 0.03 %, expenseRatioAsOfDate 28. 4. 2026 a distributionSchedule Quarterly; tato informace nebyla získána přes interní API. Návrh primárně odkazuje na čitelný factsheet.
- **IVV:** [iShares profil](https://www.ishares.com/us/products/239726/ishares-core-sp-500-etf), [factsheet](https://www.ishares.com/us/literature/fact-sheet/ivv-ishares-core-s-p-500-etf-fund-fact-sheet-en-us.pdf). Factsheet k 30. 6. 2026: S&P 500 Index (USD), 0.03 %, Quarterly, NYSE Arca; profil potvrzuje tyto hodnoty. Zobrazovaný index je normalizovaný na S&P 500 Index, nikoli jinou investiční strategii; označení USD v tabulce benchmarku je kontext měny.
- **VTI:** [aktuální Vanguard profil](https://investor.vanguard.com/investment-products/etfs/profile/vti), [factsheet F0970](https://fund-docs.vanguard.com/F0970.pdf). Factsheet k 30. 6. 2026 uvádí staré Vanguard Total Stock Market ETF / CRSP US Total Market Index, 0.03 %, Quarterly, NYSE Arca. Současně vysvětluje plánované přejmenování CRSP na Morningstar a fondů v červenci 2026. Aktuální profil již uvádí fundFullName Vanguard Morningstar Total Stock Market ETF, objective a benchmarkShortName Morningstar US Total Market Index; TickerInside má stále starý název. Návrh proto nepřebírá starý název/index jako aktuální. Přesné účinné datum nového názvu/indexu ve zkoumaných podkladech není: `as_of=null` u těchto polí. June factsheet se nesmí vydávat za důkaz tehdejší platnosti nového názvu. Nákladovost ve veřejném HTML: 0.03 %, datum 28. 4. 2026. VTI neumožňujte automatickou synchronizaci nákladovosti, dokud se nevyřeší přesná shoda názvu s API. Stejnou shodu nesplňuje ani SPY: API používá starší SPDR S&P 500 ETF Trust bez State Street, navíc zde není datovaný SEC fee zdroj.
- **IWM:** [iShares profil](https://www.ishares.com/us/products/239710/ishares-russell-2000-etf), [factsheet](https://www.ishares.com/us/literature/fact-sheet/iwm-ishares-russell-2000-etf-fund-fact-sheet-en-us.pdf). Factsheet k 30. 6. 2026: Russell 2000, 0.19 %, Quarterly, NYSE Arca; profil potvrzuje.

Podkladové datum nákladovosti v TickerInside: VOO/VTI 28. 4. 2026, IVV/IWM 27. 7. 2026; jde o API deklaraci SEC filing data. Citované SEC filing v této úloze nebyly nezávisle přečteny. Novější API datum samo nečiní starší emitentský factsheet aktuálnějším ani lidsky ověřeným. Datum cen/holdings se pro nákladovost nepoužívá.

## Co stále chybí

### Nezávislý listing NYSE

Všech pět adres `https://www.nyse.com/quote/ARCX:{TICKER}` i NYSE listings directory vrátily HTTP 200, ale stažený obsah obsahuje obecný shell a žádnou identitu konkrétního fondu. Nemáme tedy ověřený NYSE dokument pro jednotlivé tickery. Emitentské doklady burzu potvrzují, ale stávající validátor výslovně vyžaduje navíc zdroj na nyse.com. Jeho pravidlo nebylo oslabeno. Do sources se nevkládá shell jako falešný doklad. Uživatel musí v běžném prohlížeči vyhledat fond v [NYSE ETF directory](https://www.nyse.com/listings_directory/etf), doložit ticker/burzu a zaznamenat konkrétní zobrazený dokument/sekci a jeho skutečné datum. Pokud není zdroj dostupný, fond zůstane pending.

### Práva k použití

- [TickerInside terms](https://tickerinside.com/terms/) byly skutečně přečteny: aktuální vlastní práce/soubory pod CC BY 4.0, i komerční použití s atribucí. Licence této projekce neuděluje práva k jiným emitentským dokumentům. Neuchováváme ani nepoužíváme holdings/ceny/history/flows; jejich podmínky nelze zaměnit.
- SSGA produktový footer výslovně podmiňuje reprodukci/kopírování/předání obsahu písemným souhlasem SSGA. Oprávnění pro konkrétní omezený faktický přehled zde nebylo schváleno. Pouhá atribuce tento požadavek nenahrazuje.
- Vanguard factsheety mají copyright a indexová označení. Kompletní podmínky použití vybraných metadat nebyly ověřeny. Nejde o schválení kopírování dokumentů ani CUSIP/indexových dat; obecný zákaz u CUSIP neinterpretujeme jako licenční závěr ke každému faktu.
- iShares odkazuje na [BlackRock terms](https://www.blackrock.com/corporate/compliance/terms-and-conditions); HTTPS proxy blokuje jeho načtení (403 při vytvoření tunelu). Omezení Morningstar ratings na produktových stránkách nejsou automaticky vydávána za podmínky veškerých fund metadat; ratings nepoužíváme. Pro naše pole je právní kontrola stále otevřená.
- NYSE odkazuje na [ICE terms](https://www.ice.com/privacy-security-center/terms-of-use), rovněž blokované proxy. Je nutná kontrola oprávnění pro listingový údaj.

Operátor má zaznamenat skutečný podklad pro použití **všech** vybraných zdrojů: licenci, oprávnění/povolení nebo doložený závěr vztahující se ke konkrétním faktickým metadatům a původním popisům. `usageReview.policyUrl` může podle současného validátoru odkazovat jen na schválenou doménu; BlackRock/ICE jsou kontrolní odkazy, nikoli nyní validní policyUrl. Pokud oprávnění vyžaduje právě tyto domény, jejich přidání do allowlistu musí být samostatná doložená změna, ne nahrazení odkazu jiným URL. Jedno approved=true bez podkladu ke všem zdrojům nestačí.

## Bezpečné schválení a import

1. Spusťte `npm run review:etfs -- data/review/priority-five.pending.json`. Jde pouze o kontrolní report; nyní očekávejte 0/5. Žádná databáze se nekontaktuje a `--apply` je pro tento report zakázané.
2. Zkopírujte návrh do svého pracovního schvalovacího JSON. Do importu vyberte pouze úplně doložené fondy. Odstraňte pomocná review metadata nebo je ponechte jako dokumentaci; importní validátor z nich nevytváří schválení.
3. Pro každý fond fyzicky porovnejte hodnoty s dokumenty, doplňte NYSE source pro `exchange`, skutečné `as_of` každého použitého podkladu, `verified_at` a `verifiedBy`. Neodhadujte neznámé datum; použijte datovaný dokument nebo ponechte fond pending. U VTI je potřeba doložit nový název/index k datu přehledu; přesný den přejmenování je nutný jen při historickém datování změny, nikoli pro lidsky potvrzený aktuální stav. `retrievedAt` je technická evidence a **nesmí** se kopírovat do lidského verifiedAt/verified_at. Nevyplňujte všechna data automaticky dneškem.
4. Doplňte skutečné rozhodnutí `usageReview` včetně kontrolora, data, právního základu a dohledatelné policyUrl. `approved=true` až po této kontrole. V basis uveďte odkazy/podklady pro všechny zdroje. `dataAsOf` zvolte podle doložené platnosti celého přehledu a popište metodiku; nové přejmenování VTI nelze zpětně datovat k červnovému factsheetu.
5. Spusťte existující dry run: `npm run import:etfs -- ./schvaleny-katalog.json`. Musí projít beze změny validačních pravidel. Pending soubor nyní správně selže. Ověření starší než 14 dní se odmítne; mechanické posunutí data není kontrola.
6. Před zápisem si v Supabase zkontrolujte a zazálohujte dotčené řádky, zejména IVV/IWM a jejich `tickerinside_sync_enabled`. Import publikuje schválené řádky a zachová existující opt-in; nepovoluje jej automaticky. Pro VTI a SPY jej nechte vypnutý: názvy API neodpovídají návrhu podle emitentů a SPY navíc nemá datovaný SEC fee zdroj. Záznamy mimo dávku zůstávají beze změny.
7. Až po schválení a dry run spusťte s již existujícími serverovými proměnnými `npm run import:etfs -- ./schvaleny-katalog.json --apply`. Script má upsert s `onConflict:'ticker'`; IVV a IWM se aktualizují místo vložení duplicit. Nikdo v této úloze tento příkaz nespustil. Nevkládejte klíč do příkazu, JSON ani Git historie.
8. Ověřte unikátnost tickerů, `published`, `/api/catalog`, zobrazené zdroje/datum a kalkulačku. Import není důkaz správného doručení e-mailu.

Rozšíření zbývajících 15 kandidátů v tomto kroku nebylo zahájeno: podmínka úplného doložení prvních pěti není splněna. Úspěšná synchronizace všech 20 kandidátů nenahrazuje uvedené schválení.
