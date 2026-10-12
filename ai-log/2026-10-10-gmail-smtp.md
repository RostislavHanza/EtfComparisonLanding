# Změna poskytovatele a dokončení MVP — 10. října 2026

## Skutečný navazující prompt uživatele

```text
Potřebuji změnit jedno důležité rozhodnutí v aktuální implementaci ETF Comparison Landing.

## Změna: Resend → Gmail SMTP

Původně jsme plánovali odesílání e-mailů přes Resend. Rozhodl jsem se ale použít **Gmail SMTP přes Nodemailer**.

**Na Vercelu už mám vytvořené tyto environment variables:**

- `SMTP_HOST` = `smtp.gmail.com`
- `SMTP_PORT` = `465`
- `SMTP_SECURE` = `true`
- `SMTP_USER` = Gmail adresa
- `SMTP_PASSWORD` = heslo aplikace Google
- `EMAIL_FROM` = zobrazované jméno a Gmail adresa odesílatele

Hodnoty jsou nastavené ve Vercelu. Nepotřebuješ je ode mě získávat a nesmíš je zapisovat do kódu.

## Co potřebuji implementovat

1. Nahraď plánovanou nebo existující integraci Resendu za **Nodemailer + Gmail SMTP**.
2. Odesílání musí probíhat výhradně na backendu přes Vercel Functions, nikdy přímo z React frontendu.
3. Načítej SMTP konfiguraci ze serverových environment variables.
4. Zachovej stávající uživatelský proces:
   - Uživatel porovná vybraná ETF.
   - Zadá e-mail.
   - Backend bezpečně uloží porovnání do Supabase.
   - Uživatel dostane e-mail s odkazem pro potvrzení adresy.
   - Potvrzení musí vyžadovat vědomé kliknutí na tlačítko na stránce, nikoliv pouhé otevření odkazu, aby e-mailové skenery nepotvrzovaly adresy automaticky.
   - Po potvrzení uživatel získá přístup ke svému uloženému porovnání přes personalizovaný odkaz.
5. Zachovej bezpečné tokeny, jejich expiraci, ochranu proti zneužití formuláře a ošetření chyb.
6. E-maily vytvoř jako jednoduché, profesionální HTML zprávy s textovou alternativou a českými texty.
7. Pokud odeslání selže, nesmí frontend zobrazit falešnou informaci o úspěchu. Chybu bezpečně zaloguj bez zveřejnění hesla nebo tokenů.
8. Nepřidávej žádnou další placenou službu ani požadavek na vlastní doménu.

## Technické požadavky

- Použij `nodemailer` a odpovídající TypeScript typy.
- Nastav SMTP podle `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` a `EMAIL_FROM`.
- Ověř správné načítání konfigurace a smysluplně ošetři chybějící proměnné.
- Nezapisuj žádné citlivé údaje do repozitáře.
- Zohledni omezení Gmail SMTP pro malý testovací provoz.
- Ověř, zda lze z Vercel Functions skutečně navázat SMTP spojení. Pokud to v prostředí Codex Cloud nejde otestovat, výslovně to uveď a připrav přesný postup produkčního testu. Netvrď, že odesílání funguje, dokud nebylo skutečně ověřeno.
- Pokud je Resend již implementovaný, bezpečně odstraň nepotřebný kód, závislosti a environment variables z dokumentace. Pokud ještě implementovaný není, rovnou pokračuj s Gmail SMTP.

## Dokumentace a testy

- Aktualizuj `.env.example` bez skutečných hodnot hesel.
- Aktualizuj README: nastavení Gmail SMTP, potřebné Vercel proměnné, test odesílání a známá omezení.
- Zapiš změnu rozhodnutí z Resendu na Gmail SMTP do `ai-log/`.
- Doplň relevantní testy a spusť dostupné testy, lint a produkční build.
- Zachovej původní Editorial design, stávající funkcionalitu ETF srovnávače i ostatní schválené požadavky.

## Git

Pracuj výhradně na větvi `design-exploration`. Větev `main` neměň.

Po dokončení vytvoř smysluplný commit a pushni změny na `design-exploration`.

## Výstup

Na konci mi stručně napiš:

1. Co bylo implementováno.
2. Jaké testy prošly.
3. Co ještě potřebuje moje ruční nastavení.
4. Jak přesně otestovat skutečné doručení e-mailu na nasazeném Vercelu.

Pokračuj v implementaci celého schváleného MVP. Tato zpráva mění pouze poskytovatele e-mailů, nikoliv ostatní zadání.
```

## Implementace a opravy

Navazující zpráva přišla během dokončování API frontendu; původní backend commit `1064cd4` již obsahoval Resend. Historie se nepřepisuje. Aktivní mailer, endpoint a závislost jsou odstraněny; třetí migrace ruší provider RPC a zachovává historické stavy/audit. Současná dokumentace a `.env.example` už staré klíče nevyžadují; starší AI log zůstává pravdivým záznamem před změnou.

- Nodemailer + TS typy pouze na serveru. Validované SMTP env, Gmail 465/TLS nebo 587/povinný STARTTLS, správný From, timeouty, TLS verifikace, vypnuté debug/logger/file/url access. Žádná skutečná adresa nebo heslo nebyly přeneseny z Vercelu.
- Český HTML/text e-mail s potvrzovacím odkazem; žádné PDF/úplná tabulka. SMTP acceptance musí zahrnovat příjemce; rejection/chyba není success. Stav sent není delivered; Gmail nemá implementovaný delivery webhook. Potvrzení výhradně tlačítkem a chráněný následný přístup zachovány.
- Bezpečný log obsahuje pouze pevný typ a povolený kód, nikdy celé Error/response, adresu, token nebo heslo. Globální limit 100 pokusů/den doplňuje IP/adresní limity pro malý testovací provoz.
- Chráněný `/api/mail-health` používá CRON_SECRET a ověří TCP/TLS/auth ze skutečného runtime bez posílání e-mailu. Výsledek výslovně uvádí delivery not_tested. Postup živého testu je v docs/SETUP.md.
- SMTP proměnné v procesu Codex nejsou přítomné (kontrolovány jen názvy/stav). Přímé TLS spojení na smtp.gmail.com:465 selhalo EAI_AGAIN. Tato kontrola neprokazuje dostupnost nebo blokaci Vercel runtime. Nelze tvrdit, že skutečné doručení funguje.
- Doplněn ESLint; první běh hlásil chybějící globální URL/getComputedStyle v browser testu, opraveny deklarace globálů. Po upozornění na nepodporovaný ESLint 9 zkontrolovány peer dependencies a zvolena podporovaná řada 10. Žádná lint pravidla kvůli selhání testu nevypnuta.
- Zůstávají ruční externí kroky: ověřený katalog, Supabase migrace/config, identita správce/retence, finální Vercel env a živý test. Už nastavené SMTP hodnoty se od uživatele nevyžadují.

## Kontroly

Průběžný typecheck prošel a 18 testů před doplněním health testu prošlo. Zahrnuty skutečné MIME HTML/text části přes Nodemailer stream transport; SMTP send/accept/reject/failure používají izolovaný transport, nikoli skutečný Google účet. Finální výsledky jsou doplněny níže až po jejich provedení.

Finální kontroly: `npm ci` prošel s aktuálním lockfile; `npm run lint`, `npm run typecheck`, `npm run build` prošly. `npm test`: **19 passed, 0 failed/skipped**. Browser test prošel na 320/390/768/1100/1440 px, včetně všech archivních variant, návratu/uložení/reloadu, opt-in/odvolání, prázdného katalogu/chybějícího správce/outage a simulované chyby e-mailu bez falešného success. API v browser testu zůstává izolovaný mock, nikoli Google/Supabase.

Po restartu stejného lokálního API adapteru skutečný HTTP GET mail-health přes Vite proxy vrátil bezpečnou 503 bez konfigurace; odstraněná provider route vrátila 404. Živé SMTP auth/doručení nebylo testované. Cloud draft byl aktualizován pro Gmail/lint/startup a odstraněna původní provider síťová doména; saved/requires_publish potvrzeny. Konfigurace dosud není aplikovaná ani publikovaná. Staré přidané názvy proměnných v draft UI lze odstranit ručně, pokud zůstaly; aplikace je nevyžaduje/nečte. Uživatelské SMTP hodnoty z Vercelu nebyly čteny ani měněny.
