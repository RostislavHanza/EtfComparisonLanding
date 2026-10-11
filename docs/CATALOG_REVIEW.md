# První veřejná pětice – jedno dávkové schválení

## Proč je katalog prázdný

20 kandidátů v etf_sync_candidates není publikovaný katalog. API čte public.etfs s published=true a verified_at nejvýše 14 dní starým. Synchronizace sama nezveřejňuje nové fondy. Aktuální vzdálený stav pochází z potvrzení správce, nikoli z přímého přístupu této úlohy.

Pět finálních věcných návrhů je v `data/review/priority-five.pending.json`, evidence v `priority-five.evidence.json`. Nula fondů má nyní skutečné lidské schválení: verifiedAt/verifiedBy jsou null a usageReview.approved=false. Pending nelze importovat. Vybranou část návrhu lze po skutečném potvrzení připravit a importovat bez dalšího programování; pro porovnání potřebujete alespoň dva fondy.

## Co správce kontroluje

| Fond | Aktuální název / index | Nákladovost | Původ doplněných údajů a konkrétní zbývající kontrola |
| --- | --- | --- | --- |
| SPY | State Street SPDR S&P 500 ETF Trust / S&P 500 Index | 0.0945 % | Název, přesná sazba, index a Quarterly od emitenta; API má starší název a 0.09 %. Posoudit právo na omezený přehled faktů, nikoli reprodukci dokumentu. |
| VOO | Vanguard S&P 500 ETF / S&P 500 Index | 0.03 % | Název/sazba z API, index a Quarterly z Vanguard. Posoudit použití těchto faktů a kontrolních podkladů. |
| IVV | iShares Core S&P 500 ETF / S&P 500 Index | 0.03 % | Název/sazba z API, index a Quarterly z iShares. Posoudit faktické doplnění a BlackRock podmínky. |
| VTI | Vanguard Morningstar Total Stock Market ETF / Morningstar US Total Market Index | 0.03 % | Název/index z aktuálního profilu, Quarterly z Vanguard, sazba API. Datum pozorovaného stavu není historické datum přejmenování; June factsheet má ještě CRSP. |
| IWM | iShares Russell 2000 ETF / Russell 2000 Index | 0.19 % | Název/sazba z API, index a Quarterly z iShares. Posoudit faktické doplnění a BlackRock podmínky. |

Ticker a NYSE Arca pocházejí u všech pěti z TickerInside; listing/ticker jsou navíc kontrolované emitentským dokladem. Každé pole má oddělený origin, verification nebo authored. Český popis je vlastní text projektu, věcně ověřovaný proti emitentovi. Nepřebíráme reklamu, obrázky, grafy, holdings, ceny, indexové série ani kompletní dokumenty do veřejného katalogu.

**Konkrétní primární kontrolní odkazy:**

- SPY: https://www.ssga.com/us/en/individual/etfs/state-street-spdr-sp-500-etf-trust-spy a https://www.ssga.com/library-content/products/factsheets/etfs/us/factsheet-us-en-spy.pdf
- VOO: https://investor.vanguard.com/investment-products/etfs/profile/voo a https://fund-docs.vanguard.com/F0968.pdf
- IVV: https://www.ishares.com/us/products/239726/ishares-core-sp-500-etf a https://www.ishares.com/us/literature/fact-sheet/ivv-ishares-core-s-p-500-etf-fund-fact-sheet-en-us.pdf
- VTI: https://investor.vanguard.com/investment-products/etfs/profile/vti a https://fund-docs.vanguard.com/F0970.pdf
- IWM: https://www.ishares.com/us/products/239710/ishares-russell-2000-etf a https://www.ishares.com/us/literature/fact-sheet/iwm-ishares-russell-2000-etf-fund-fact-sheet-en-us.pdf

Všechny tyto profily/PDF byly v této metodické kontrole opět skutečně načteny HTTP 200. Aktuální profil VTI potvrzuje Morningstar, profil SPY 0.0945. Factsheety mají podkladové datum 30. 6. 2026; poplatky API VOO/VTI 28. 4. 2026, IVV/IWM 27. 7. 2026. Pozorovaný aktuální stav, datum dokumentu/filingu, datum stažení a lidská kontrola jsou odlišné údaje. Aktuální název VTI není zpětně datovaný do června. Datum snímku se v batch workflow bere z skutečně zaznamenané snapshotObservedAt; správce výslovně potvrzuje tento snímek, své verifiedAt doplní sám.

## Licence: vymezení rozhodnutí

TickerInside je hlavní datový zdroj pro skutečně poskytované základní údaje. Aktuálně přečtené https://tickerinside.com/api/ a https://tickerinside.com/api/index.md výslovně popisují fund JSON, CC BY 4.0, uchovávání aktuálních souborů a atribuci odkazem na fondovou stránku. Všech pět JSON uvádí license=CC BY 4.0. Používáme jen ticker/name/identifiers.exchange/expense_ratio a příslušné poplatkové datum; nikoli jiné identifiers, holdings, history/flows nebo ceny. Historie a flows mají odlišné podmínky. Úplný právní dokument odkazovaný dokumentací https://tickerinside.com/legal/ vrátil 403 a nebyl přečten; dříve uváděný /terms/ se nyní také nepodařilo načíst. Souhrn API není tvrzen jako nezávislé právní stanovisko. Před finálním souhlasem správce zkontroluje dostupný právní dokument pro případ dalších omezení.

Licence TickerInside se nevydává za oprávnění k cizím dokumentům. U emitentů posuzujeme použití několika jednotlivých faktů a ověřování správnosti, odděleně od kopírování chráněného obsahu. Nevyvozujeme automaticky ani zákaz všech faktů, ani plošné právo vše kopírovat:

- SSGA PDF/footer má požadavek písemného souhlasu k reprodukci díla. Použitelnost tohoto omezení pro konkrétní faktické doplnění SPY nebyla právně uzavřena.
- Vanguard úplné podmínky pro použitá metadata nebyly dostatečně doloženy. Ochrana indexových dat není sama o sobě zákaz uvedení názvu benchmarku, ale konečné posouzení pro tento projekt není hotové.
- iShares odkazuje na https://www.blackrock.com/corporate/compliance/terms-and-conditions; poslední pokusy blokovala HTTPS proxy. Práva k ratingům se nesměšují s našimi fakty; ratingy nepoužíváme.

**Konkrétní akce správce:** potvrdit oprávnění pro omezená faktická doplnění a původní české popisy na podkladě přečtených podmínek, případného povolení nebo doloženého posouzení. Zapsat konkrétní dokumenty/URL a závěr do usageReview.basis. Pouhé „souhlasím“ nebo odkazy bez podkladu nestačí. Lze schválit jen některé fondy. Alternativa při nejistotě: získat písemné vyjasnění emitenta nebo licencovaný zdroj chybějícího indexu/dividendové politiky; do té doby fond ponechat pending. Pole nevyplňovat smyšlenou náhradou. Faktický původ a API atribuce už nevyžadují ruční přepisování desítek zdrojových položek.

## Praktický poslední krok: vyplnit jeden souhlas a spustit dávku

V kořeni projektu zkopírujte novou malou šablonu (nepřepisuje existující soubor):

```sh
node --input-type=commonjs -e "const fs=require('node:fs');fs.mkdirSync('.cache',{recursive:true});fs.copyFileSync('data/review/priority-five.batch-approval.example.json','.cache/approval.json',fs.constants.COPYFILE_EXCL)"
```

V `.cache/approval.json` doplňte pouze:

- reviewer a verifiedAt: skutečný kontrolor a ISO čas jeho datové i právní kontroly se zónou.
- approvedTickers: seznam zkontrolovaných fondů, např. VOO/IVV, nebo všech pět. Prázdný seznam nikoho neschvaluje.
- confirmAllListedSources=true: až po kontrole výše uvedeného souhrnu a všech zdrojů vybrané dávky.
- usageReview.approved=true: až po doloženém rozhodnutí; basis uvádí konkrétní právní podklad ke všem použitým zdrojům a faktickým doplněním. policyUrl je hlavní platný odkaz (API/licence nebo emitent); ostatní podklady doplňte v basis.

reviewedDraftSha256 nechte ze šablony: váže souhlas na přesné údaje návrhu. Změna dat znamená nový souhrn a nové schválení, ne opravu hashe naslepo. Datum snímku, přiřazení zdrojů, datum skutečné kontroly jednotlivých polí a identita kontrolora práv se přenesou z tohoto výslovného společného potvrzení; neodvozují se jako lidské schválení z API stažení. Pokročilý původní per-source/per-fund manifest je stále podporovaný, pokud potřebujete oddělené schvalovatele/právní podklady.

```sh
npm run prepare:etfs -- data/review/priority-five.pending.json .cache/approval.json .cache/approved-etfs.json
npm run import:etfs -- .cache/approved-etfs.json
```

Oba kroky jsou bez DB zápisu. Příprava odmítne neschválenou/nekompletní dávku, změněný hash, neznámé/duplicitní tickery, chybějící původ/licenci nebo staré/fiktivní datum kontroly. Existující výstup se nepřepisuje; při opakování zvolte nový název. Validátor žádné právní podklady nečte místo člověka. V této úloze nevznikl produkční validní import, protože nebyl dodán skutečný souhlas; validní syntetická dávka existuje pouze uvnitř izolovaných testů.

Zkontrolujte/zazálohujte dotčené řádky a správný cílový projekt: SUPABASE_URL musí být https://kdkxoykuhqwodimawcrs.supabase.co a serverový SUPABASE_SECRET_KEY nebo SUPABASE_SERVICE_ROLE_KEY musí mít oprávnění k zápisu. Tajné hodnoty nepatří do souboru/příkazu/Gitu. Teprve po úspěšném dry run a výslovném rozhodnutí správce:

```sh
npm run import:etfs -- .cache/approved-etfs.json --apply
```

Upsert podle tickeru aktualizuje IVV/IWM bez duplicit a ostatní fondy mimo dávku zachová. published=true vzniká až za plným validátorem. Automatický opt-in SPY/VTI ponechte vypnutý. Po importu obnovte Preview `/api/catalog` a stránku; dva fondy již umožní porovnání, kalkulačku a následný e-mailový krok. Není potřeba nová migrace ani další programování. V této úloze nebyl proveden vzdálený zápis nebo skutečný e-mail.

## Rozšíření a automatické aktualizace

Stejný mechanismus lze použít pro další kandidáty: jejich návrh musí mít sedm skutečných původů a chybějící index/dividendy doplněné z doloženého zdroje, vlastní popis a konkrétní schválení. Pro novou dávku připravte odpovídající digest; neupgradujte automaticky 15 neprověřených kandidátů na katalog. SCHB/SCHD/RSP vyžadují kontrolu a explicitní povolení příslušných emitentských zdrojů.

Stávající synchronizace mění jen nákladovost u již publikovaného, čerstvě schváleného fondu s explicitním opt-in, přesnou shodou názvu a datovanou SEC nákladovostí. Starší/undatovaná API nákladovost neprojde, lidské verified_at se neobnovuje, statický název/index/dividendy/popis se nepřepisují. VTI/SPY mají jiné názvy než API, SPY navíc market_data bez datované přesné sazby; nelze je touto synchronizací degradovat na starší údaje. Čerstvost lidské kontroly nadále vyžaduje týdenní kontrolu správce.
