# Kontrola proměnných, 11. října 2026

## Použité zadání

Doslovné relevantní výňatky předchozího promptu, nikoli rekonstruovaný celý prompt:

> PREVIEW_RECIPIENTS nebude misto toho se bude posilat na SMTP_USER

> OPERATOR_NAME doplním ručně a OPERATOR_CONTACT je stejna adresa na gmail SMTP_USER.

> RATE_LIMIT_SECRET a CRON_SECRET musí být dva různé bezpečně vygenerované řetězce.

Uživatel uvedl, že migrace 202610100001_mvp.sql, 202610100002_retention.sql a 202610100003_gmail_smtp.sql jsou již aplikované v projektu kdkxoykuhqwodimawcrs. Tato informace nebyla ověřována připojením k databázi.

Následující upřesnění promptu je zaznamenané doslovně:

> Upřesnění předchozího zadání:
>
> **Chci, abys upravil přímo existující návrh Environment Variables v mém Codex Cloud prostředí.**
>
> Nechci pouze textový seznam a nechci vytvářet nový návrh prostředí.
>
> Cílem je mít v Codexu finální, vyčištěný návrh proměnných, který si následně **sám ručně přenesu do Vercelu**.
>
> Postupuj takto:
>
> 1. Zkontroluj, které proměnné aktuální aplikace skutečně používá.
> 2. V existujícím návrhu ponech všechny potřebné proměnné.
> 3. Zachovej všechny již vyplněné hodnoty. Nikdy nepřepisuj ani nemaž existující tajné klíče.
> 4. Odstraň pouze nepotřebné proměnné, které nemají vyplněnou hodnotu. Pokud je nepotřebná proměnná již vyplněná, pouze ji označ jako zastaralou.
> 5. Nepřidávej Resend ani proměnné určené pouze pro automatizovaný přístup k Supabase nebo Vercelu.
> 6. Chci používat `SMTP_USER` také jako jedinou povolenou testovací adresu. Ověř, zda to aktuální kód podporuje. Pokud ne, uprav kód na větvi `design-exploration` tak, aby v Preview používal `SMTP_USER` místo `PREVIEW_RECIPIENTS`, a proveď testy.
> 7. Pokud nemáš možnost existující návrh přímo upravit, výslovně to řekni a vrať mi finální seznam k ručnímu nastavení. Nevytvářej náhradní návrh.
>
> **Důležité:** Nic nenasazuj, neměň Supabase ani Vercel a nevyžaduj žádné nové přístupové údaje.
>
> Na konci mi potvrď, zda jsi skutečně upravil existující návrh proměnných v Codex Cloud, nebo jsi pouze připravil seznam.

## Kontrola a opravy

- Čistý checkout na design-exploration před úpravami. Přečteny AGENTS.md, docs/SETUP.md, README, .env.example, vercel.json, serverové handlery, SMTP konfigurace, import a testovací skripty. Nečteny hodnoty skutečných secrets.
- Preview/development původně používal PREVIEW_RECIPIENTS. Konfigurace nyní používá výhradně normalizovanou adresu SMTP_USER. Cizí příjemce je odmítnut před uložením srovnání, e-mail se nepřesměrovává z cizí adresy na správce. Production nadále posílá na adresu z formuláře.
- PREVIEW_RECIPIENTS odstraněna ze vzorové konfigurace a z použití v běhovém kódu. Test úmyslně obsahuje starou proměnnou, aby prokázal, že se ignoruje. OPERATOR_CONTACT zůstává samostatně vyplňovaná povinná položka.
- Aktualizovány SETUP.md a README; veřejná Supabase URL doplněna pouze do .env.example. Vyplněné lokální soubory prostředí nebyly měněny.
- Existující cloudový draft načten read-only. Tool schema umožňuje aditivní změny požadavků se zachováním hodnot; neobsahuje mazání proměnných ani příznak deprecated. Vrací metadata bez skutečných uložených hodnot, a tedy ani bezpečné rozlišení prázdných a vyplněných secrets. Návrh nebyl aktualizován, nahrazen ani vytvořen nový. Připraven seznam k ručnímu nastavení a úklidu.
- Žádné nové přístupy, deploymenty ani změny vzdálených služeb. Migrace provedené v izolovaném testu PGlite nejsou aplikování migrací do uživatelova Supabase projektu.

## Ověření

- npm test: 20 úspěšných testů, 0 selhání, 0 přeskočených. Nový test ověřuje SMTP_USER, ignorování staré allowlist proměnné, odmítnutí jiného příjemce před zápisem i bezpečné odmítnutí bez SMTP_USER.
- npm run lint, npm run typecheck a npm run build dokončeny bez chyb.
- Jde o lokální a izolované ověření kódu. Skutečné SMTP doručení ani živé nasazení se netestovaly. V době této kontroly změny nebyly commitnuté ani pushnuté.

## Následné zadání uložení změn

Doslovný prompt:

> Ulož všechny změny, které jsi provedl kvůli nahrazení `PREVIEW_RECIPIENTS` proměnnou `SMTP_USER`.
> Zkontroluj diff a ujisti se, že neobsahuje žádné tajné klíče ani nechtěné změny.
> Potom vytvoř commit a pushni ho do existující větve `design-exploration`.
> Nesahej na `main`, nic nenasazuj a neměň žádné environment variables.
> Na konci mi napiš hash commitu a potvrď úspěšný push.

Před commitem zkontrolován kompletní diff šesti souborů a veřejné/testovací hodnoty. Kontrola známých formátů credentials a prázdných secret placeholderů prošla. Lokální autor ověřen jako RostislavHanza s GitHub noreply e-mailem. Již ověřený kód zůstal beze změny; doplněn pouze tento záznam. Commit a push jsou výslovně autorizované tímto následným zadáním; nedává oprávnění k ručnímu deploymentu nebo úpravě environment variables.
