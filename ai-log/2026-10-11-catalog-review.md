# První pětice ETF: skutečné podklady a čekající schválení

## Skutečný uživatelský prompt

Uživatel potvrdil úspěšnou skutečnou synchronizaci: 20 etf_sync_candidates, poslední běh ok, 0 chyb a 0 publikovaných ETF. Poté zadal:

> Další cíl: dokončit skutečný veřejný ETF katalog, aby šel srovnávač konečně používat.
>
> Prioritně: SPY, VOO, IVV, VTI, IWM.
>
> Pro každý fond doplň a ověř: Přesný ticker a název. Listing NYSE Arca. Sledovaný index. Expense ratio. Dividendovou politiku. Krátký originální český popis. Primární zdroje pro každé pole. Datum platnosti údajů a datum kontroly.
>
> Využij data získaná přes TickerInside, ale chybějící pole ověř v oficiálních zdrojích emitentů a burzy. Nevymýšlej hodnoty, zdroje ani data ověření. Nepovažuj datum stažení API za lidské ověření.
>
> Připrav validovaný JSON pro import těchto ETF podle současného schématu. Pokud nemůžeš doložit oprávnění k publikaci nebo některý důležitý údaj, označ fond jako čekající na kontrolu. Nepublikuj automaticky neověřená data.
>
> Použij existující importní script a validátor. Pokud je to potřeba, připrav jednoduchý kontrolní report a soubor, který bude možné po schválení bezpečně importovat. Nepřidávej placené API ani nové služby.
>
> Pokud se prvních pět fondů podaří kompletně doložit, připrav stejným způsobem zbývající kandidáty z původních 20.
>
> Spusť dostupné validace a testy. Změny commitni a pushni pouze na design-exploration. Neměň main. Neprováděj zápisy do vzdálené Supabase, nic nenasazuj a neodesílej e-maily.
>
> Neprezentuj připravený JSON jako automaticky schválený katalog. Pokud je potřeba lidské schválení, přesně popiš, co mám zkontrolovat.

## Skutečná práce se zdroji

- Prostudován stávající import a validátor. Publikační validátor vyžaduje primární doklady ke šesti polím, zvláštní NYSE doklad, skutečná data ověření/platnosti a usageReview.approved=true. Import již upsertuje podle tickeru. Tato pravidla nezměněna.
- Skutečně načteno pět aktuálních TickerInside JSON odpovědí, produktové stránky SSGA/Vanguard/iShares a všech pět oficiálních PDF factsheetů (HTTP 200). PDFs lokálně přečteny přes pdftotext; z veřejných profilových HTML vyčteny emitentské údaje, nikoli dotazy na interní endpointy. Žádný nový automatický scraper ani API adaptér.
- Do evidence uložena pouze projekce potřebných faktů a hashe/URL/čas zápisu načtených podkladů na disk. Celé PDF/HTML, holdings, ceny, výkonnost, CUSIP/FIGI se necommitují. Technické retrievedAt pochází z mtime skutečně uložené odpovědi, nikoli z vymyšleného lidského ověření. Lidské časové údaje jsou null.
- SPY: emitent uvádí gross i net 0.0945 %, API má zaokrouhlené market_data 0.09 % bez data. Návrh používá emitentskou sazbu.
- VTI: aktuální profil uvádí Vanguard Morningstar Total Stock Market ETF / Morningstar US Total Market Index; API má starší název, červnový factsheet CRSP a očekávanou změnu v červenci 2026. Přesné účinné datum není doloženo. Tento rozpor není skryt ani zpětně datován.
- VOO/IVV/VTI 0.03 %, IWM 0.19 % jsou v emitentských dokumentech, nejen API. Všech pět emitentských podkladů uvádí NYSE Arca a čtvrtletní distribuce. Český popis je původní souhrn doložených cílů.
- NYSE quote adresy všech pěti a directory vrátily HTTP 200, ale obecný navigační shell bez důkazu konkrétního instrumentu. Ani 200, ani route ARCX není prohlášena za ověření listingu. Pokus normálně vykreslit veřejnou NYSE stránku v Chromium se nepodařil; žádné interní API nebylo použito. Samostatný NYSE důkaz stále chybí.
- TickerInside terms skutečně přečteny (CC BY 4.0 aktuální vlastní práce s atribucí). SSGA footer má explicitní podmínku písemného souhlasu pro reprodukci; Vanguard obecná práva použití vybraných metadat nejsou kompletně ověřena. Oficiální odkazované BlackRock/ICE terms blokuje síťová HTTPS proxy 403 při tvorbě tunelu. Omezení Morningstar ratings/CUSIP se neinterpretují jako univerzální pravidlo pro všechna pole. Nelze vytvořit nedoložené právní schválení.

## Soubory a ochrany

- `data/review/priority-five.pending.json`: pět věcných návrhů podle importního schématu, ale s approved=false a prázdnými lidskými kontrolami/nejistými daty. Nejde o validní publikační import.
- `data/review/priority-five.evidence.json`: minimální zdrojová evidence, nesoulady API a status neověřených NYSE dokladů/práv.
- `docs/CATALOG_REVIEW.md`: konkrétní fondy, data podkladů, zdrojové rozpory, zbývající kontrola a ruční workflow. Aktualizovány README/DATA_SOURCES.
- `scripts/check-etf-review.ts` a `review:etfs`: pouze čitelný report přes existující validátor. Neprovádí DB zápis, `--apply` odmítá, nic nevyplňuje za kontrolora.
- `tests/catalog-review.test.ts`: dávka a každý fond samostatně musí být publikací odmítnuty; žádné automatické lidské schválení; všechny vybrané source URL mají skutečně načtený doklad; známé rozpory zůstávají explicitní; report a dry run neprovádějí import.
- Shoda názvu pro synchronizaci není splněna pro VTI ani SPY. Tyto opt-in aktualizace nemají být aktivovány. Import zachovává dřívější opt-in pole; operátor musí před zápisem zkontrolovat současné řádky IVV/IWM. Neprováděna žádná vzdálená změna.

## Omezení a průběžné opravy

První kontrolní běh ukázal očekávané výjimky odmítnutého importu na stderr. Testovací procesy nyní explicitně zachycují stderr, aby očekávané odmítnutí neznepřehledňovalo výstup testů. Zaznamenaná retrievedAt byla zpřesněna na skutečný čas zápisu každého staženého podkladu namísto společného času vytvoření evidenčního souboru.

Podmínka úplného doložení první pětice není splněna; dalších patnáct nebylo zpracováno. Počet věcně připravených návrhů 5, počet úplně schválených/importovatelných fondů 0. Není tvrzeno, že katalog či srovnávač byl tímto veřejně zprovozněn. K tomu je třeba doplnit NYSE/právní podklady, lidské schválení a teprve pak vykonat autorizovaný import.

## Výsledky kontrol

Prošly lint, typecheck, 34/34 testů a produkční build, včetně načtení/vykonání všech devíti emitovaných serverových endpointů. Read-only review report skutečně ukázal 0/5; test skutečného importního dry run potvrdil odmítnutí pending dávky bez jakýchkoli credentials nebo síťových zápisů. Nejsou vydávány testové fixtures za produkční ověření. Neznámý přesný den přejmenování VTI je zdokumentovaný; pro aktuální přehled lze místo historického datování doložit lidsky potvrzený stav k datu profilu.
