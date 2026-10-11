# Nastavení funkčního MVP

## 1. Supabase a katalog

Uživatel 11. října 2026 potvrdil úspěšné aplikování migrací `202610100001_mvp.sql`, `202610100002_retention.sql` a `202610100003_gmail_smtp.sql` do projektu `kdkxoykuhqwodimawcrs`. Nespouštět je znovu. Tato informace pochází od uživatele, nikoli z živé kontroly databáze. Build migrace nespouští. Pro případnou Production použít samostatnou databázi; testovací projekt nepoužívat pro produkční osobní údaje.

RLS a oprávnění zakazují anon/authenticated tabulky i privilegované RPC. Server používá `SUPABASE_URL` a `SUPABASE_SECRET_KEY` (nebo legacy `SUPABASE_SERVICE_ROLE_KEY`). Nikdy je nedávat do `VITE_*`, frontendových souborů ani Gitu.

Podle [DATA_SOURCES.md](DATA_SOURCES.md) importovat ručně ověřené fondy. Bez alespoň dvou není možné vytvořit srovnání; cíl je 15–20 fondů, výběr 2–5. Kandidáti nejsou ověřená data a migrace neobsahuje produkční seed.

## 2. Gmail SMTP

Uživatel již nastavil ve Vercelu šest proměnných; není nutné sdílet jejich hodnoty nebo vytvářet další e-mailovou službu:

- `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_SECURE=true` (implicitní TLS);
- `SMTP_USER`: skutečná Gmail adresa;
- `SMTP_PASSWORD`: Google heslo aplikace, nikoli hlavní heslo účtu;
- `EMAIL_FROM`: jméno a stejná adresa jako SMTP_USER, například formát `ETF přehled <VAŠE_GMAIL_ADRESA>`.

Google účet musí umožňovat app passwords (obvykle 2FA; některé účty/organizace je zakazují). Nepřidáváme požadavek na vlastní doménu. Podporován i 587/false s povinným STARTTLS; jiné porty/hosty či nejasná booleovská hodnota se odmítnou. Nezapínat debug/logger a nevypínat ověření TLS certifikátu. Nastaveny connect/greeting/socket timeouty a serverový maxDuration 60 s; skutečnou podporu pro svůj Vercel runtime ověřte deployem.

Gmail poskytuje SMTP přijetí, nikoli spolehlivý delivery webhook. `sent` je zpráva přijatá pro příjemce, `failed` chyba; `confirmed_at` je pozdější explicitní potvrzení. Automatické `delivered` se nově nevykazuje. Případné historické delivery stavy zůstávají v databázi. SMTP nemá garantovanou idempotenci; po nejasném výpadku mohla zpráva dorazit a nový pokus může vytvořit další. Automatická fronta/retry/bounce zpracování odloženy.

Vhodné pouze pro malý testovací provoz: aplikace omezuje všechny pokusy na 100/den (UTC bucket), IP na 20/h a adresu na 3/h. Kvóty Google, další používání účtu a bezpečnostní blokace se mohou lišit; jejich aktuální hodnoty zde nebyly ověřeny. Nevyužívat pro hromadný marketing. E-mail obsahuje profesionální české HTML i text, pouze odkaz a informace o potvrzení.

## 3. Ostatní Vercel nastavení

Framework Vite, `npm ci`, build `npm run build`, output `dist`, Node 24. Větev `design-exploration` pro Preview, produkční `main` ponechat beze změny. Serverové proměnné podle `.env.example`:

- Supabase URL a secret uvedené výše;
- šest již vytvořených SMTP proměnných;
- `APP_BASE_URL`: stabilní HTTPS origin tohoto webu bez cesty/query; pro Preview vlastní stabilní alias. Link se neodvozuje z nedůvěryhodného Host;
- `APP_ENV`: `preview` nebo `production`, lokálně `development`;
- `RATE_LIMIT_SECRET`: nejméně 32 náhodných znaků pro HMAC limiter;
- Preview/development přijímá pouze adresu z `SMTP_USER`. Jiný zadaný e-mail odmítne před uložením srovnání. `PREVIEW_RECIPIENTS` se již nečte; není potřeba;
- `OPERATOR_NAME`: skutečný správce; `OPERATOR_CONTACT`: stejná Gmail adresa jako `SMTP_USER`, vyplněná zvlášť. Bez obou server nepřijímá kontakty;
- `CRON_SECRET`: samostatný náhodný secret nejméně 32 znaků, odlišný od `RATE_LIMIT_SECRET`, pro údržbu a chráněný SMTP test;
- volitelně `ALLOWED_ORIGINS`: přesné další originy bez wildcard; deployment `VERCEL_URL` je povolen automaticky.

Preview musí používat oddělenou databázi a testovací příjemce. Po změně env provést redeploy. Staré proměnné poskytovatele aplikace nečte. Existující vyplněné hodnoty bez zásahu uživatele nemažeme ani nepřepisujeme. `.env*` ignoruje Git kromě `.env.example`.

## 4. Přístup, retence a měření

Backend uloží kontakt/srovnání a datový snapshot, potom pošle jednorázový 256bitový token v URL fragmentu. V DB jen hash. Samotný GET neprovádí konfirmaci; až tlačítko POSTem. Odkaz platí 7 dní; HttpOnly/SameSite=Lax/Secure cookie umožní 30denní přístup v potvrzujícím prohlížeči. Návratové URL má náhodné ID bez e-mailu a vyžaduje cookie. První potvrzení může být na jiném zařízení. Po ztrátě session/spotřebování odkazu je v MVP potřeba nové srovnání.

Rychlostní limity jsou atomické v DB; klíče IP/e-mailu jsou HMAC, nikdy čitelná IP/adresa. Na Vercelu používáme důvěryhodný proxy header; při jiném hostingu je nutné změnit důvěryhodný zdroj IP. Ošetřena validace výběru/částky/e-mailu/souhlasu, Origin, honeypot a velikost JSON. Chyba SMTP nebo zápisu výsledného stavu se přizná, frontend neukáže úspěch. Log obsahuje jen pevný typ/kód, ne SMTP odpověď, heslo, token, adresu nebo celý Error.

Nepotvrzené srovnání 30 dní, potvrzené 90 dní od poslední úpravy + další denní cleanup. Vercel Cron `15 3 * * *` volá `/api/maintenance` s Bearer CRON_SECRET; odstraní kaskádově data, osiřelé kontakty, session/limity a 90denní analytiku/legacy audit receipts. Cron spouští Vercel pouze na produkčních deploymentech. Preview čistit vlastním plánovačem nebo denně `select public.purge_expired_data();` v SQL Editoru. Monitorovat chyby a dostupnost Cron pro svůj plán. Cron není import ETF.

Marketingový souhlas nepodmiňuje doručení. Automatický marketing není implementován; souhlasy se také čistí podle této MVP retence. Absence nového souhlasu není odvolání dřívějšího; vyřizuje správce. Před spuštěním musí správce schválit informační texty a zajistit práva subjektů údajů.

Analytika až po opt-in. Odvolání odpojí srovnání od návštěvy a smaže přiřazené události. Při chybě odvolání UI nabízí retry a klient další události neposílá; do dokončení uchová jen čekající požadavek. Nepoužíváme reklamní pixely ani externí click tracking.

## 5. Lokální vývoj

Node 24, `npm ci`; `.env.local` z `.env.example` s bezpečně doplněnými hodnotami, nikdy necommitovat. `npm run dev:api` načte soubor a spustí stejné Vercel handlery na 127.0.0.1:3001. `npm run dev` má API proxy; lokální `APP_BASE_URL=http://localhost:5173`, `APP_ENV=development`, příjemce musí být adresa z `SMTP_USER`. Alternativně `vercel dev`. Import script čte process environment; použijte bezpečné env bindings nebo Node `--env-file`, ne hodnoty v příkazech zapisovaných do logu.

`npm test`, `npm run lint`, `npm run typecheck`, `npm run build`. Browser test: spustit preview na 4173, nainstalovat Chromium přes Playwright nebo použít BROWSER_PATH a spustit `npm run test:browser`. Fixtures/mocks neprokazují SMTP spojení/doručení.

## 6. Test na nasazeném Vercelu

1. Ověřit Preview deployment pro `design-exploration` a scope env (Preview musí obsahovat všechny SMTP proměnné). Nastavit/reviewnout ostatní proměnné; migrace v projektu `kdkxoykuhqwodimawcrs` jsou podle uživatele již aplikované. Importovat alespoň dvě skutečně ověřená ETF; příjemce v Preview musí být `SMTP_USER`. Redeploy. Nastavit APP_BASE_URL na skutečný stabilní origin.
2. **Test TCP/TLS/auth z Vercel Function:** volat chráněný GET `/api/mail-health`. Například ve svém lokálním shellu, kde proměnná CRON_SECRET již bezpečně existuje:

   ```sh
   curl --fail-with-body -H "Authorization: Bearer $CRON_SECRET" "$APP_BASE_URL/api/mail-health"
   ```

   Očekávané 200: `{"ok":true,"smtp":"verified","delivery":"not_tested"}`. Jde o reálné spojení/přihlášení z Vercelu; neposílá e-mail a NEpotvrzuje doručení. 401 může být buď naše oprávnění, nebo Vercel deployment protection (ověřit tělo/hlavičky); použít autorizovaný přístup k preview. 503 značí chybějící config nebo neověřené SMTP; Vercel Runtime Logs mají pouze bezpečný kód. EAUTH: ověřit app password/účet; ETIMEDOUT/ESOCKET/ENOTFOUND: síť/DNS/TLS. Neposílat do chatu hesla ani přístupové odkazy.
3. **Test skutečného odeslání:** na stránce vybrat 2–5 ETF a částku, pokračovat, zadat vlastní povolenou adresu, marketing nechat prázdný. Očekávat pravdivé předání SMTP. V Supabase ověřit srovnání, částku/výběr, consent false a zprávu sent. V Gmail Sent lze diagnosticky zkontrolovat zprávu; skutečné doručení ověřit v cílové schránce/spamu, v Preview pouze v cílové schránce `SMTP_USER`; test jiného příjemce vyžaduje prostředí s produkčním režimem, kde testovací omezení neplatí. Samotné sent/verify není důkaz doručení.
4. Zkontrolovat profesionální HTML i textovou alternativu. Odkaz neobsahuje e-mail, má fragment. Otevření stránky ještě nesmí nastavit confirmed_at; kliknout na tlačítko. Ověřit obnovený výběr/částku, confirmed_at a přístupovou cookie. Změnit částku/výběr, uložit, reload. Jiný prohlížeč bez session nemá přístup; použité potvrzení není opakovatelné.
5. **Chybový test pouze v odděleném Preview:** dočasně zneplatnit app password a redeploy, nebo použít vyhrazené testovací prostředí. Formulář musí ukázat chybu, nevydat success a zapsat failed, log nesmí mít adresu/heslo/token. Vrátit správné nastavení a redeploy. Ověřit chybné tickery/Origin/limity a expiraci. Neprovádět proti produkčnímu provozu.
6. Potvrdit úklid dat a právní texty; teprve živý e-mailový průchod, ověřený katalog a úspěšný deployment umožňují považovat MVP za nasazené.

**Stav ověření:** z Codex Cloud nebylo možné navázat SMTP spojení (EAI_AGAIN), nejsou zde SMTP env ani oprávnění k Vercel runtime. Proměnné už nastavené na Vercelu nepřenášíme do chatu. TCP dostupnost Vercel→Gmail ani skutečné doručení tímto vývojem zatím nejsou prokázané. Nepožadujeme vlastní doménu nebo novou placenou službu.

## 7. Finální konfigurace pro ruční vyplnění (11. října 2026)

Žádná proměnná není nutná v Codex Cloud pro kontrolu kódu, build nebo izolované testy. Následující serverové proměnné patří do Vercel → Project → Settings → Environment Variables. Preview a Production mají oddělené hodnoty tam, kde je uvedeno. Production je zde jen konfigurace pro budoucí spuštění; větev main neměníme. Žádné hodnoty nedáváme do VITE_*.

| Název | Kde | Nutnost | Typ | Hodnota / získání | Vercel scope |
| --- | --- | --- | --- | --- | --- |
| SUPABASE_URL | Vercel | Povinná | Konfigurace | Preview: `https://kdkxoykuhqwodimawcrs.supabase.co`; Production: URL samostatného produkčního projektu | Preview + Production |
| SUPABASE_SECRET_KEY | Vercel | Povinná, pokud nepoužijete legacy alternativu níže | Secret | Supabase Project Settings → API Keys → secret key (sb_secret_…), nikoli publishable/anon | Preview + Production, pro příslušný projekt |
| SMTP_HOST | Vercel | Povinná pro e-mail | Konfigurace | `smtp.gmail.com` | Preview + Production |
| SMTP_PORT | Vercel | Povinná pro e-mail | Konfigurace | `465` | Preview + Production |
| SMTP_SECURE | Vercel | Povinná pro e-mail | Konfigurace | `true` | Preview + Production |
| SMTP_USER | Vercel | Povinná pro e-mail | Konfigurace, osobní údaj | Vlastní Gmail adresa; zároveň jediný povolený příjemce v Preview/development | Preview + Production |
| SMTP_PASSWORD | Vercel | Povinná pro e-mail | Secret | Google účet → Zabezpečení → Hesla aplikací; již vytvořené App Password | Preview + Production |
| EMAIL_FROM | Vercel | Povinná pro e-mail | Konfigurace, osobní údaj | `ETF přehled <VAŠE_GMAIL_ADRESA>` nebo samotná adresa; musí odpovídat SMTP_USER | Preview + Production |
| APP_ENV | Vercel | Povinná | Konfigurace | Preview: `preview`; Production: `production` | Preview + Production, odlišné hodnoty |
| APP_BASE_URL | Vercel | Povinná | Konfigurace | Skutečný stabilní HTTPS origin daného nasazení, bez cesty/query/fragmentu; zjistit ve Vercel deploymentu/doménách | Preview + Production, vlastní URL |
| RATE_LIMIT_SECRET | Vercel | Povinná | Secret | Samostatně vygenerovaný náhodný řetězec nejméně 32 znaků | Preview + Production |
| OPERATOR_NAME | Vercel | Povinná pro ukládání kontaktů | Konfigurace | Skutečné jméno/název správce, vyplní uživatel | Preview + Production |
| OPERATOR_CONTACT | Vercel | Povinná pro ukládání kontaktů | Konfigurace, veřejný kontakt | Stejná Gmail adresa jako SMTP_USER; zadat konkrétní adresu, ne text SMTP_USER | Preview + Production |
| CRON_SECRET | Vercel | Povinná pro mail-health a údržbu; ne pro samotný formulář | Secret | Druhý nezávislý náhodný řetězec nejméně 32 znaků, jiný než RATE_LIMIT_SECRET | Preview pro mail-health/ruční údržbu; Production pro Cron i mail-health |
| SUPABASE_SERVICE_ROLE_KEY | Vercel | Volitelná legacy alternativa k SUPABASE_SECRET_KEY | Secret | Supabase API Keys → Legacy API Keys → service_role; nenastavovat obě kvůli redundanci, kód upřednostňuje SUPABASE_SECRET_KEY | Stejný scope jako nahrazovaný klíč |
| ALLOWED_ORIGINS | Vercel | Volitelná | Konfigurace | Prázdné/nenastavené; jen při dalších používaných doménách přesné HTTPS originy oddělené čárkou, bez wildcard | Pouze prostředí vyžadující další originy |
| VERCEL_URL | Vercel automaticky | Automatická, ručně nenastavovat | Konfigurace | Vercel systémový hostname deploymentu, automaticky povolen pro Origin; nenahrazuje APP_BASE_URL | Preview + Production |

Secrets lze vygenerovat na vlastním počítači příkazem `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Spustit zvlášť pro RATE_LIMIT_SECRET a CRON_SECRET; neukládat výstup do Gitu/chatu. Vercel nevyhodnotí hodnotu `SMTP_USER` v jiné proměnné jako odkaz na Gmail adresu; do OPERATOR_CONTACT/EMAIL_FROM vyplnit skutečnou adresu ručně. Již vyplněné hodnoty prostředí tento postup automaticky nemaže ani nenahrazuje.

Nepoužívané proměnné: RESEND_API_KEY, RESEND_WEBHOOK_SECRET a PREVIEW_RECIPIENTS. Z aktivního kódu/vzorové konfigurace jsou vyřazené. SUPABASE_PROJECT_REF, VERCEL_PROJECT_ID, VERCEL_ORG_ID ani přístupové tokeny pro správu služeb aplikace nevyžaduje; pro tento ruční postup je nepřidávat. Existující vyplněné hodnoty ve Vercelu/Codex Cloud zůstávají nedotčené.

Pouze pro dobrovolný lokální vývoj se serverem používat `.env.local` se stejnými serverovými názvy, ale APP_ENV=development a APP_BASE_URL=http://localhost:5173. Není to požadavek na Codex Cloud. Browser fixture testy mají dvě volitelné běžné konfigurace: TEST_BASE_URL (výchozí http://127.0.0.1:4173) a BROWSER_PATH (cesta k existujícímu Chromium; jinak Playwright). Ani jedna nepatří do Vercelu. Pro ruční import ETF stačí SUPABASE_URL a jeden serverový Supabase klíč v prostředí spuštění importu; project ref ani management token není potřeba.

CRON_SECRET Vercel používá v Authorization pro Cron z vercel.json; Cron běží pouze v Production. Preview tato proměnná chrání mail-health a ruční údržbu. Všechny SMTP proměnné se vyhodnocují serverově při běhu funkce, nikoli ve frontendovém buildu. Samotná konfigurace nemůže nahradit naplnění ověřeného katalogu ani skutečný test doručení.
