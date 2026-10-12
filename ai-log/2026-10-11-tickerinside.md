# TickerInside synchronizace, 11. října 2026

## Skutečné zadání

Níže jsou doslovné relevantní výňatky dvou dostupných uživatelských promptů, nikoli rekonstruovaný celý prompt. První zpráva končila nedokončeným bodem 3; druhá ho doplnila během práce.

> Jako hlavní zdroj použij TickerInside API:
> https://tickerinside.com/api/

> Pokud API některá pole neposkytuje, nevymýšlej je. Rozlišuj mezi získanými, ověřenými a chybějícími informacemi.

> Naším cílem je 15–20 skutečných ETF obchodovaných na NYSE Arca, která se budou zobrazovat ve srovnávači a jejichž dostupná data bude možné automaticky aktualizovat jednou týdně.

> Pokud týdenní Cron na našem aktuálním Preview nejde používat, implementuj funkční ruční spuštění a připrav plánování pro budoucí Production. Netvrď, že Cron běží, dokud to není skutečně ověřeno.

> Stávající validace, evidenci zdrojů, kontrolu stáří dat a published zachovej. Pokud potřebuješ nové tabulky nebo sloupce, připrav novou migraci. Původní migrace neupravuj.

> Pokud nějaký zásadní předpoklad nelze potvrdit, implementuj pouze bezpečně testovatelnou část a přesně vysvětli omezení.

> Po implementaci změny commitni a pushni pouze na design-exploration. Nikdy neměň main.

> Nic nenasazuj, nepouštěj migrace na vzdálené databázi a neupravuj prostředí Vercelu.

Požadované testy: správná/nesprávná API odpověď, neznámý ticker, jiná burza, chybějící/neplatné údaje, výpadek/timeout, duplicity, změna nákladovosti, zachování nepublikovaných fondů a autorizace. Požadována dokumentace zdrojů, licence, ručního spuštění a týdenního plánování. Podle uživatele jsou IVV, ITOT a IWM předběžné nepublikované záznamy, nikoli schválený katalog. Nebyly čteny vzdálenou DB.

## Skutečné ověření zdroje

- Dokumentace tickerinside.com/api/ vrací HTTP 200. Dokumentované sekce terms/cite/sources/fund/reference byly přečtené. První terms/legal požadavky byly HTTP 403; opakování s dokumentací požadovaným identifikujícím User-Agent vrátilo HTTP 200. Neobcházela se autentizace ani nepoužívaly interní endpointy.
- Skutečné HTTP 200 odpovědi všech 20 kandidátů byly stažené a normalizované lokálně. Ticker, název, ETF/NYSE Arca a nákladovost jsou ve všech. 17 má SEC filing s datem a URL, SPY/MDY/DIA jen market_data bez data nákladovosti. Počet ostatních fondů uváděný poskytovatelem nebyl nezávisle ověřen.
- API u těchto fondů neposkytuje sledovaný index, dividendovou politiku ani popis; yield a category je nenahrazují. Proto se nepublikuje žádný neúplný kandidát. Z tohoto ověření je 0 kompletních záznamů schválených pro publikaci.
- Licenci a atribuci dokládají API reference, terms a legal: aktuální snapshoty a vlastní práce TickerInside CC BY 4.0, i komerčně, s uvedením zdroje. Cizí holdings/ceny licence automaticky nepokrývá; neukládáme je. Historii/flows nepoužíváme. SPY expense_ratio=0.09 je market_data, nesmí nahradit dříve viděných oficiálních gross 0.0945 bez kontroly.
- Audit skutečných hodnot, dat filing a SHA-256 odpovědí je v docs/TICKERINSIDE_AUDIT.md. Zmenšená skutečná VOO odpověď je test fixture, nikoli produkční seed.
- Dokumentaci Vercel Cron blokuje proxy CONNECT 403; aktuální tarif účtu nebyl ověřen. Cron připraven pouze pro budoucí Production, nikoli běžící Preview.

## Implementace a kontrola

- Přidán normalizátor a adaptér pouze pro dokumentované fund JSON, bez API klíče. URL je pevná, bez redirectů; timeout, limit odpovědi, max 2 workery; žádné raw serverové chyby do logu.
- Nová migrace 202610110004_etf_sync.sql: kandidáti, audit, lease a explicitní opt-in sloupec. Kandidátní upsert není publikace. RPC atomicky aktualizuje nákladovost pouze existujícího schváleného publikovaného fondu, s opt-in, odpovídajícím názvem, čerstvou lidskou kontrolou a neustupujícím datovaným SEC podkladem. Předběžné IVV/ITOT/IWM zachovává.
- verified_at/published a ručně doplněná pole se nemění. Kontrola stáří 14 dní zůstává. Automatická kontrola nákladovosti má vlastní datum a označení, není nové lidské ověření celého fondu.
- GET /api/etf-sync používá CRON_SECRET. Opakování téhož UTC dne nefetchuje, lease brání souběhu; dokončení je idempotentní. Poslední platná data přežijí chyby a chybná dávka se vrátí transakčně. Výsledky a bezpečné kódy chyb se evidují v DB.
- Připraven týdenní Production Cron, manuální volání pro Preview. Žádný deployment, cloudový draft ani skutečné env nebyly měněné. Migrace nebyla aplikovaná vzdáleně.
- Doplněna atribuce a oddělené datum kontroly a podkladu nákladovosti v existujícím redakčním srovnávači. Nezavádí se dashboard ani nový design.

## Chyby a opravy

První typecheck odhalil chybějící generické typy řádků PGlite v nových testech; doplněny. Při revizi doplněna null-safe validace lease a JSON dávky v SQL. Původní migrace zůstaly beze změny.

## Výsledky

- 20 skutečných stažených odpovědí prošlo normalizátorem; nejde o ověření naplnění Supabase.
- npm test: 27/27 passed, 0 failed, 0 skipped. SQL část běží v izolovaném PGlite, HTTP/SMTP poruchy jsou fixtures; žádné skutečné e-maily.
- npm run lint, npm run typecheck a npm run build prošly po opravách.
- npm run test:browser: responzivita 320/390/768/1100/1440 px a dosavadní uživatelská cesta prošly s izolovanými API fixtures. Samostatně ověřena mobilní atribuce/odkaz licence/datum kontroly nákladovosti bez přetékání, také s fixtures.
- Živé spojení endpointu s Supabase, aplikování nové migrace, naplnění schváleného katalogu, skutečné Vercel Preview a běh Cron nejsou těmito testy ověřené.
