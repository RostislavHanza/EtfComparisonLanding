# Statická reklama a odstranění nepoužívaných webhooků

## Skutečný prompt

Úplné přiložené zadání je beze změn obsahu (řádkové konce sjednoceny na LF) uloženo v [prompts/2026-10-12-simple-ad-webhook-cleanup.txt](prompts/2026-10-12-simple-ad-webhook-cleanup.txt). Neobsahuje tajné klíče. Žádná další rozhodnutí nebo prompty nejsou domýšlené.

## Kontrola současného stavu

Čistá větev design-exploration a známá pravidla AGENTS.md. record_email_webhook(text,text,text,timestamptz) již odstraňuje historická gmail_smtp migrace. Tabulka webhook_receipts zůstala a jediným aktivním referencujícím SQL tělem je purge_expired_data z analytics_revocation migrace. V api/server není volání ani import tohoto mechanismu. Starý test absence RPC přesunut do cílené kontroly nové migrační dávky, test rate limiteru zachován. Historické migrace nedotčeny. Bez přístupu do vzdálené DB nelze tvrdit, že živý projekt nemá vlastní novější funkce; migrace proto předem kontroluje neočekávané odkazy v aplikačních funkcích a používá DROP bez CASCADE.

## Změny

202610120010_remove_email_webhooks.sql: transakční migrace, přesná signatura RPC, odstranění tabulky, stejná retenční funkce bez jediného webhookového DELETE. search_path, security definer, revoke/grant a ostatní cleanup zachovány. Žádné změny email_messages ani SMTP odesílání/stavů. Neprovádí se proti vzdáleným službám.

ads/simple/index.html a style.css: jediný celoplošný HTML odkaz, požadované nadpisy a čtyři přesné položky, bez ikon/CTA/formuláře/JS. Editorial fonty a barvy, kompaktní dvousloupcová mřížka. Odkaz /#comparator je shodný s aktuální interaktivní reklamou, bez hardcodované Preview domény. Vite přidán třetí HTML vstup a konkrétní mapování nového aliasu; jedna pipeline/dist/Vercel projekt. Původní soubory /add ani hlavního webu nejsou změněny; build zachovává jejich asset hashe.

## Ověření

Samostatný browser test prošel na 320×568, 360×640, 390×740, 393×852 a 1440×900: všechny texty, jedno anchor, absence scriptů/API, direct/reload, obsah bez scrollu, dotyk ve spodním prázdném prostoru a desktopové Enter. Přístupnost řešena běžným anchor a focus outline. Finálně prošly lint, typecheck, 76 unit/backend testů, produkční build všech tří HTML vstupů, NodeNext kontrola 10 endpointů a oficiální lokální Vercel builder/runtime test všech 10 artefaktů. Nová migrace byla skutečně aplikována jen do lokálního PGlite po všech původních migracích; ověřeno zachování aktivních email_messages, jediná odstraněná tabulka, odstraněná přesná RPC signatura, bezpečná stále funkční retence, opakovatelnost a zastavení/rollback při neočekávaném rutinovém odkazu. Celá browser sada prošla včetně nezměněné hlavní aplikace, SMTP chybových stavů ve fixtures, soukromí, adminu, historických výpočtů, interaktivního /add a nové reklamy. Screenshot nové reklamy 390 px byl vizuálně prohlédnut. Autor a noreply e-mail i diff/secrets kontrola ověřeny; žádné skutečné e-maily nebo vzdálené DB testy. Při prvním lint běhu chyběl browser global innerHeight; kontrola používá explicitní globalThis.innerHeight. Testovací INSERT byl sladěn se skutečným schématem amount_halere/snapshot, nikoli fiktivním amount_czk.
