# Dočasná Preview diagnostika ETF synchronizace

## Použitý prompt

Uživatel uvedl, že pracujeme pouze na `design-exploration`, poskytl Preview URL a potvrdil aplikování `202610110004_etf_sync.sql`. Skutečné zadání:

> Přidej dočasné testovací tlačítko „Otestovat synchronizaci ETF“ pro Preview.
>
> Tlačítko může být dostupné pouze v `APP_ENV=preview`. Kliknutí spustí existující synchronizační mechanismus `/api/etf-sync`. Zachovej serverové zabezpečení pomocí `CRON_SECRET`. `CRON_SECRET` se nikdy nesmí posílat do prohlížeče, ukládat do frontendového JavaScriptu ani zobrazovat v UI.
>
> Neotvírej veřejný neautentizovaný endpoint, který může synchronizaci spustit. Pokud bezpečné spuštění z prohlížeče vyžaduje autentizaci, vytvoř jednoduchý a bezpečný postup pro administrátora; nepoužívej veřejné skryté tlačítko jako ochranu.
>
> Po dokončení zobraz přehledný výsledek: počet načtených kandidátů, počet aktualizovaných ETF, počet chyb a celkový stav. Při chybě zobraz bezpečnou a srozumitelnou hlášku bez tajných údajů. Synchronizace nesmí automaticky publikovat ETF. Zbytečně nepřestavuj existující implementaci a nepřidávej placené služby. Tlačítko a diagnostická stránka musí jít jednoduše odstranit před finálním odevzdáním.
>
> Spusť testy, lint, typecheck a build. Změny commitni a pushni pouze do `design-exploration`. `main` neměň. Nic nenasazuj ručně a neměň environment variables.
>
> Na konci mi napiš, kde tlačítko najdu, jak se jako administrátor bezpečně přihlásím a co přesně mám udělat pro spuštění prvního importu.

## Rozhodnutí a změny

- Zachován stávající import, denní UTC omezení, databázový zámek a pravidla schvalování/publikování. Původní GET stále vyžaduje Cron Bearer secret.
- Samostatná dočasná stránka `?admin=etf-sync`; backend blokuje administraci mimo Preview. Nepřidány žádné proměnné ani externí služby, prostředí a vzdálené služby nezměněny.
- Administrátorskou identitou je vlastník serverově nakonfigurované schránky `SMTP_USER`. Veřejná žádost o přihlášení nemůže měnit příjemce ani spustit synchronizaci. Omezení IP/globální frekvence a společné SMTP denní kvóty.
- Jednorázový náhodný 256bitový token, hash v DB, 10minutová expirace, vazba na APP_BASE_URL. Fragment URL se odstraní z adresního řádku; pouze vědomý POST tlačítkem token spotřebuje. GET nic nepotvrdí. Session má 30minutovou expiraci, pouze hash v DB a HttpOnly/Secure/SameSite=Strict cookie; logout ji zruší.
- Nová samostatná migrace `202610110005_preview_admin.sql` připravena k ručnímu aplikování. Staré aplikované migrace nezměněny. Anonymní i běžné Supabase role nemají přístup k admin tabulce/RPC.
- POST `/api/etf-sync` ověří Origin/JSON, Preview a session; teprve server sestaví interní Cron autorizaci. Secret není v klientském bundle, odpovědi ani přihlašovacím e-mailu.
- Opakované spuštění vrací uložené počty z původního běhu, nikoli smyšlený nový úspěch. Selhání SMTP není úspěchem; logování používá existující bezpečné kódy.
- Dokumentace obsahuje postup prvního importu a přesný seznam dočasných částí k odstranění.

## Kontrola a opravy

- První typecheck zachytil, že spread VercelRequest nezachová metody IncomingMessage. Interní požadavek nyní dědí původní request a mění pouze serverovou hlavičku pro autorizaci.
- Původní test očekával 405 pro libovolný POST. Po přidání autentizovaného POST správně očekává 403 pro požadavek bez Origin; nové testy kontrolují anonymní POST, cizí Origin, Production, explicitní potvrzení, expiraci/jednorázovost, RLS, SMTP příjemce a odmítnutí SMTP.
- Lokální PostgreSQL testy používají PGlite; SMTP/API testy jsou izolované náhrady, žádný skutečný e-mail ani import do vzdálené databáze nebyl proveden.
- Prohlížečová diagnostika ověřena na 320/390/768 px: žádné spuštění GET/skenerem, odstranění fragmentu, vědomé přihlášení, počty výsledků, odhlášení, žádná autorizační hlavička z prohlížeče a skrytí ovládání při nedostupnosti Preview endpointu.
- Stávající browser suite ověřila srovnávač na 320/390/768/1100/1440 px, uložený výběr/částku, potvrzení, archivní návrhy a chybové stavy.

## Omezení skutečného ověření

Novou migraci musí aplikovat uživatel. Skutečné doručení administrátorského e-mailu, dostupnost nového Preview buildu a import TickerInside → Vercel → Supabase nebyly v této úloze vykonány. Automatické publikování kandidátů není implementováno záměrně. Žádná změna main, environment variables, ruční deployment nebo vzdálená migrace.

## Finální výsledky kontrol

`npm run typecheck`, `npm run lint`, `npm test` (31/31) a `npm run build` prošly. Obě výše popsané prohlížečové sady prošly. Dodatečný izolovaný API test ověřil autentizovaný POST, uložené počty, odmítnutí expirované session a chybějícího Cron secretu před spuštěním importu. Lokální autor ověřen: RostislavHanza, GitHub noreply. Před commitem zkontrolován diff a výskyt známých serverových secretů bez vypisování jejich hodnot.
