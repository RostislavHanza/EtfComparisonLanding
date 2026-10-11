# První veřejná pětice: připravená dávka pro demo

Aktualizace při práci na kalkulačce: provozovatel potvrdil, že všech pět ETF již importoval, publikoval a vidí na webu. Níže je evidence původní přípravy a archivní importní postup; kvůli nové kalkulačce jej neopakujte. Tato úloha žádný vzdálený zápis neprovádí.

## Stav a rozhodnutí provozovatele

Provozovatel v zadání navazujícím na commit 4532ad22ae0fc554628be60adfc37e928689013b výslovně přijal model omezených faktických údajů, transparentní atribuce a vlastních českých popisů a rozhodl o publikaci SPY, VOO, IVV, VTI a IWM pro technické demo. Označení schvalovatele je **admin**, nikoli vymyšlené osobní jméno. Toto rozhodnutí neopakujeme jako požadavek na další právní audit.

- `data/review/priority-five.demo-approval.json`: skutečně zaznamenané rozhodnutí, výběr všech pěti, admin, čas provedené technické kontroly a hash přesného návrhu.
- `data/priority-five.approved.json`: finální validní importní JSON, **dosud nebyl zapsán do Supabase**.
- Původní pending/evidence zůstávají jako nezměněné podklady; jejich null/false nejsou aktuální stav finální dávky.

Čas verifiedAt v manifestu je skutečný čas kontroly uložených podkladů a přípravy dávky, ne vymyšlený čas právního auditu nebo nové osobní návštěvy webu správcem. Label admin zaznamenává provozovatele, pod jehož rozhodnutím byla kontrola provedena. Zdrojové retrievedAt/as_of zůstávají původní; pozorovaný stav není historické datum účinnosti. Při této přípravě byly znovu zkontrolovány již stažené API odpovědi, všech deset emitentských podkladů proti evidovaným hashům, listing/distribuce a opravy SPY/VTI; nové stažení nebylo vydáváno za novou lidskou kontrolu.

## Zkontrolované údaje a původ

| ETF | Název | Index | Nákladovost | Distribuce / burza |
| --- | --- | --- | --- | --- |
| SPY | State Street SPDR S&P 500 ETF Trust | S&P 500 Index | 0.0945 % | Quarterly / NYSE Arca |
| VOO | Vanguard S&P 500 ETF | S&P 500 Index | 0.03 % | Quarterly / NYSE Arca |
| IVV | iShares Core S&P 500 ETF | S&P 500 Index | 0.03 % | Quarterly / NYSE Arca |
| VTI | Vanguard Morningstar Total Stock Market ETF | Morningstar US Total Market Index | 0.03 % | Quarterly / NYSE Arca |
| IWM | iShares Russell 2000 ETF | Russell 2000 Index | 0.19 % | Quarterly / NYSE Arca |

Ticker a burza pocházejí z TickerInside, listing je navíc doložen oficiálním emitentem. Název/nákladovost VOO/IVV/IWM a sazba VTI jsou z API. SPY přesná sazba a aktuální název, aktuální název/index VTI a všechny indexy/distribuce používají konkrétní emitentské faktické podklady. České popisy jsou původní. V JSON je pro každé pole origin/verification/authored, provider, datum a URL. SPY API 0.09 % nenahrazuje přesnější 0.0945 %, starý název/index VTI se nevrací do katalogu.

Primární podklady:

- SPY: https://www.ssga.com/us/en/individual/etfs/state-street-spdr-sp-500-etf-trust-spy a https://www.ssga.com/library-content/products/factsheets/etfs/us/factsheet-us-en-spy.pdf
- VOO: https://investor.vanguard.com/investment-products/etfs/profile/voo a https://fund-docs.vanguard.com/F0968.pdf
- IVV: https://www.ishares.com/us/products/239726/ishares-core-sp-500-etf a https://www.ishares.com/us/literature/fact-sheet/ivv-ishares-core-s-p-500-etf-fund-fact-sheet-en-us.pdf
- VTI: https://investor.vanguard.com/investment-products/etfs/profile/vti a https://fund-docs.vanguard.com/F0970.pdf
- IWM: https://www.ishares.com/us/products/239710/ishares-russell-2000-etf a https://www.ishares.com/us/literature/fact-sheet/iwm-ishares-russell-2000-etf-fund-fact-sheet-en-us.pdf

Podklady a datum stažení jsou v priority-five.evidence.json. Červnový VTI factsheet ještě obsahuje CRSP; aktuální profil potvrzuje Morningstar. Datum přejmenování nebylo domyšleno. API datované poplatky VOO/VTI mají 28. 4. 2026, IVV/IWM 27. 7. 2026; pozdější kontrola není nové datum platnosti filingu.

## Přiměřené schválení, nikoli tvrzení o právním povolení

Tři oddělené části:

1. **Technická kontrola:** skutečné hodnoty, emitent, NYSE Arca, původ sedmi polí, datum kontroly a čerstvost. Tyto kontroly validátor zachovává.
2. **Doklady licence a zdrojů:** aktuální fund JSON, API dokumentace a nezávisle ověřené /legal/ (revize 9. 10. 2026) a /terms/ potvrzují CC BY 4.0 pro vlastní práci TickerInside v aktuálních snapshotech včetně komerčního použití s atribucí; API původ má konkrétní ticker URL/licenci. Atribuce odkazuje na poskytovatele, fond, licenci a úpravy. Emitentská fakta nejsou označována jako licencovaná od TickerInside.
3. **Rozhodnutí provozovatele:** explicitní dávkový souhlas svázaný s hashem. `usageReview.approved=true` v této dávce znamená přijetí použití a publikace provozovatelem, což upřesňuje `approvalType=operator-publication-decision`. Neznamená absolvovaný právní audit. `issuerPermissionClaimed=false` a limitations se zachovají v existujícím usage_review JSONB.

Provozovatel nezávisle otevřel a ověřil https://tickerinside.com/legal/, https://tickerinside.com/terms/ a https://tickerinside.com/api/ a doložil jejich licenční ustanovení v upřesnění zadání. Tato evidence je výslovně označena jako ověření provozovatele, nikoli nové síťové měření této úlohy. Známá omezení zůstávají: licence TickerInside automaticky nepokrývá práva třetích stran. Písemné povolení ani plošná licence emitentů nebyly získány. Provozovatel přijal model několika jednotlivých faktů, ne kopie chráněných dokumentů. SSGA omezuje reprodukci díla; úplné použití metadat Vanguard/BlackRock nebylo právně posouzeno. To se nezaměňuje ani s prokázaným zákazem zveřejnit jednotlivý fakt, ani s povolením emitenta. Nepoužíváme marketing, obrázky, holdings, historii ani indexové časové řady. Rozšíření na chráněný obsah vyžaduje samostatné oprávnění.

Na základě nového výslovného rozhodnutí provozovatele není pro tuto omezenou demo dávku požadován další formální audit nebo opakované vyplňování desítek polí. Známá omezení zůstávají zaznamenaná. Automatický import nemůže toto rozhodnutí vytvořit pro další fondy.

## Poslední krok: kontrola dávky a explicitní import

Zkontrolujte finální pětici a manifest výše. Nic již není potřeba ručně přepisovat do databáze ani doplňovat jméno/čas. Suchá kontrola v kořeni projektu:

```sh
npm run import:etfs -- data/priority-five.approved.json
```

Očekávaný výstup: 5 záznamů, pouze dry run, databáze nebyla změněna. Finální zápis je samostatný krok správce po kontrole dávky: serverové SUPABASE_URL musí ukazovat na https://kdkxoykuhqwodimawcrs.supabase.co, SUPABASE_SECRET_KEY nebo SUPABASE_SERVICE_ROLE_KEY musí mít právo zapisovat. Hodnoty nevkládejte do příkazu, JSON ani Gitu. Zkontrolujte správný projekt a zálohujte dotčené existující řádky, pak spusťte:

```sh
npm run import:etfs -- data/priority-five.approved.json --apply
```

Upsert používá onConflict=ticker: IVV/IWM se aktualizují bez duplicit, ITOT a fondy mimo dávku se nemění. published=true se zapisuje až po plné validaci. V tomto vývoji nebyl příkaz --apply spuštěn. **Nová migrace ani nové environment variables nejsou potřeba.** Již aplikované migrace znovu nespouštějte.

Dávka není navždy čerstvá: 14denní limit technického ověření zůstává. Před pozdějším importem nebo týdenní obnovou proveďte skutečnou kontrolu zdrojů a vytvořte novou datovanou dávku; pouze neposouvejte datum bez kontroly. Pro opakovanou přípravu z nezměněného návrhu a skutečně aktualizovaného manifestu slouží existující prepare:etfs s novým výstupním názvem:

```sh
npm run prepare:etfs -- data/review/priority-five.pending.json data/review/priority-five.demo-approval.json .cache/new-reviewed-import.json
```

Výstup se úmyslně nepřepisuje. Změna návrhu vyžaduje kontrolu nových údajů a aktualizaci schvalovacího hashe. Původní jednoduchá prázdná šablona i detailní manifest zůstávají pro další dávky kompatibilní, nikdo se automaticky neschvaluje.

## Ověření veřejného katalogu po zápisu

Otevřete https://etf-comparison-landing-git-design-exploration-rh-6003.vercel.app/api/catalog. Očekávejte HTTP 200 a funds obsahující SPY/VOO/IVV/VTI/IWM. Nula kandidátů není podmínkou; kandidátní tabulka může dál mít 20 řádků. V public.etfs zkontrolujte pět dotčených tickerů, published=true, verified_by=admin a správné hodnoty. Veřejné API nepředává interní usage_review.

Obnovte landing page, vyhledejte a vyberte 2–5 fondů, ověřte přesnou SPY sazbu, Morningstar VTI, kalkulačku a atribuci/zdroje. E-mailový krok lze pak otestovat ručně přes SMTP_USER; zde nebyl žádný skutečný e-mail poslán ani tento vzdálený stav ověřen.

Synchronizace nadále vytváří kandidáty, nikoli schválení. Aktualizace nákladovosti vyžaduje opt-in, čerstvou kontrolu, shodný název a datovaný dostatečně nový SEC podklad. SPY/VTI mají odlišné API názvy, SPY navíc zaokrouhlenou undatovanou sazbu; ani náhodně zapnutý opt-in je nesmí degradovat. Statická pole se nepřepisují. Dalších 15 fondů vyžaduje vlastní kompletní podklady a výslovný výběr v nové dávce; tato pětice je automaticky neschvaluje.
