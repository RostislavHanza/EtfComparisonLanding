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

Gmail poskytuje SMTP přijetí, nikoli spolehlivý delivery webhook. `sent` je zpráva přijatá pro příjemce, `failed` chyba; `confirmed_at` je automatické ověření při serverovém zpracování odkazu z aktivní stránky. Automatické `delivered` se nově nevykazuje. Případné historické delivery stavy zůstávají v databázi. SMTP nemá garantovanou idempotenci; po nejasném výpadku mohla zpráva dorazit a nový pokus může vytvořit další. Automatická fronta/retry/bounce zpracování odloženy.

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

Backend uloží kontakt/srovnání a snapshot, potom pošle opakovaně použitelný 256bitový token v URL fragmentu. V DB je jen hash. Aktivní stránka automaticky POSTem ověří token a získá novou 30denní HttpOnly/SameSite=Lax/Secure session, bez tlačítka. E-mail potvrdí pouze poprvé. Původní e-mailový odkaz funguje i na jiném zařízení nebo po skončení session; samotné ID nestačí. Nové odkazy mají maximální platnost 90 dní, nepoužité žádosti se mažou po 30 dnech. Podrobnosti a požadovaná migrace 008 jsou v části 12.

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
3. **Test skutečného odeslání:** na vstupu vybrat 2–5 ETF, zadat vlastní povolenou adresu a kliknout na Zaslat tabulku na mail; marketing se nenabízí. Částka se nastaví až po otevření odkazu. Očekávat pravdivé předání SMTP. V Supabase ověřit srovnání, částku/výběr, consent false a zprávu sent. V Gmail Sent lze diagnosticky zkontrolovat zprávu; skutečné doručení ověřit v cílové schránce/spamu, v Preview pouze v cílové schránce `SMTP_USER`; test jiného příjemce vyžaduje prostředí s produkčním režimem, kde testovací omezení neplatí. Samotné sent/verify není důkaz doručení.
4. Zkontrolovat profesionální HTML i textovou alternativu. Odkaz neobsahuje e-mail, má fragment. První aktivní otevření automaticky nastaví confirmed_at bez dalšího tlačítka. Ověřit obnovený výběr/částku a přístupovou cookie. Změnit částku/výběr, uložit, reload. Otevřít tentýž e-mailový odkaz v jiném prohlížeči bez cookie: musí obnovit přehled, ale confirmed_at a počet potvrzovacích událostí nesmí změnit. Samotné ID bez cookie přístup neposkytne.
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

## 8. TickerInside synchronizace: ruční Preview, budoucí Production

Původní tři migrace jsou již aplikované a nespouštějí se znovu. Operátor samostatně zkontroluje a aplikuje **pouze novou** `supabase/migrations/202610110004_etf_sync.sql`. V tomto vývoji nebyla aplikovaná vzdáleně. Neobsahuje žádná produkční data.

Na Vercelu používá endpoint stávající SUPABASE_URL, SUPABASE_SECRET_KEY (nebo legacy serverový klíč) a CRON_SECRET. Nepotřebuje TickerInside klíč, SMTP ani novou placenou službu. Vercel musí mít odchozí HTTPS přístup na tickerinside.com a svůj Supabase projekt. Tato změna nezasahuje do uložených environment variables. Funkce má maxDuration 60 s; 20 souborů stahuje se dvěma workery, timeoutem 4 s na požadavek a limitem 1 MiB. DB operace mají timeout 5 s. Žádné automatické HTTP retry.

Ruční spuštění po aplikování nové migrace a samostatném nasazení nové větve (nejde o součást této implementace): v shellu s již bezpečně nastavenými APP_BASE_URL a CRON_SECRET:

```sh
curl --fail-with-body -H "Authorization: Bearer $CRON_SECRET" "$APP_BASE_URL/api/etf-sync"
```

Stejný endpoint je dostupný lokálně přes dev:api, ale jeho autorizované volání se skutečnou konfigurací zapisuje do Supabase; pro izolované testy používat npm test. Unauthenticated GET vrací 401 a nic nenačítá. Běžný výsledek má state=ok/partial a počty candidates/updated/failed; 20 candidates a 0 updated je správný výsledek bez schválených fondů. busy vrací 409. already_attempted znamená bez nových požadavků na API. Úplné selhání zdrojů vrací 503, audit zůstává v DB. Detail chyb prohlédnout v etf_sync_runs; absence nové migrace také vrací 503. Ověřit skutečné počty v DB, nikoli pouze HTTP 200.

Připravený Cron v vercel.json: `0 4 * * 1` → GET /api/etf-sync, jednou týdně v pondělí kolem 04:00 UTC (v Praze 06:00 při letním a 05:00 při zimním čase). Vercel připojuje Authorization Bearer CRON_SECRET. Cron se spouští jen v Production, nikoli v Preview. Nic zde nedokládá, že již běží. Pro design-exploration Preview funguje ruční volání; Production se nyní nenasazuje a main se nemění. Denní /api/maintenance zůstává samostatný.

Přístup k tarifu projektu nemáme. Dokumentaci https://vercel.com/docs/cron-jobs/usage-and-pricing při této kontrole blokovala proxy CONNECT 403. Operátor musí před Production ověřit dostupnost Cron, maxDuration a použití tarifu pro komerční demo Clientelo; kompatibilitu či nulové náklady na konkrétním účtu nelze potvrdit. U plánu s nižší přesností může čas spuštění kolísat. Nepřidáváme externí scheduler ani placenou službu.

Kandidáti nejsou veřejný katalog. Po kontrole primárních zdrojů doplnit index, dividendovou politiku a popis, použít validovaný ruční import a schválit licenci konkrétního použití. Až poté může operátor nastavit tickerinside_sync_enabled=true pouze u vybraných již publikovaných fondů; předběžné IVV/ITOT/IWM nepovolovat bez plného schválení. Vyžaduje se soulad názvu s API a datum SEC podkladu nákladovosti, které neustupuje proti původnímu dokladu. Třída market_data neprovádí veřejné aktualizace.

Samotná synchronizace neobnovuje verified_at ani neuvolňuje published. Celý srovnávač na Preview lze skutečně otestovat teprve po naplnění alespoň dvou úplných schválených fondů a ověření backendu; tento krok neprokazuje doručení e-mailů.

## Dočasná Preview diagnostika synchronizace

Pouze pro `APP_ENV=preview`; nepřidává žádné environment variables. Používá existující Supabase serverový klíč, `RATE_LIMIT_SECRET`, Gmail SMTP a `CRON_SECRET`. `APP_BASE_URL` musí být HTTPS adresa tohoto Preview, aby přihlašovací odkaz vedl zpět do správného prostředí.

1. Po již aplikované migraci `202610110004_etf_sync.sql` ručně aplikujte **novou** `supabase/migrations/202610110005_preview_admin.sql` v Supabase SQL editoru. Předchozí migrace nespouštějte znovu. Nová tabulka obsahuje pouze hashe tokenů/session, časové limity a původ webu; anonymní ani běžný přihlášený Supabase uživatel k ní nemá přístup.
2. Po automatickém dokončení Git preview buildu otevřete `https://etf-comparison-landing-git-design-exploration-rh-6003.vercel.app/?admin=etf-sync`.
3. Klikněte na **Poslat přihlašovací odkaz administrátorovi**. Příjemcem je výhradně serverové `SMTP_USER`; návštěvník si nemůže zvolit jinou adresu. Nejvýše 1 žádost/minutu globálně, 6/den globálně, 3/hodinu na IP a společný SMTP limit 100/den. SMTP přijetí zprávy není potvrzením doručení.
4. Ve schránce Gmail (případně spamu) otevřete odkaz a do 10 minut klikněte na **Potvrdit přihlášení**. Pouhý GET nic nepotvrzuje. Token je ve fragmentu URL, odstraní se z adresního řádku a při vědomém potvrzení se odešle přes HTTPS. Je jednorázový; databáze uchovává pouze SHA-256 hash. Vlastník této schránky má pro tuto diagnostiku administrátorské oprávnění.
5. Klikněte na **Otestovat synchronizaci ETF**. POST `/api/etf-sync` vyžaduje platnou 30minutovou session v `Secure; HttpOnly; SameSite=Strict` cookie a povolený Origin/JSON. Teprve backend vytvoří interní autorizaci pomocí `CRON_SECRET`; secret se nikdy nevrací do prohlížeče. Původní GET pro Cron stále vyžaduje Bearer secret.
6. Výsledek ukáže počet načtených kandidátů, aktualizovaných katalogových ETF, chyb zdroje a stav. Jeden pokus/den UTC a databázový zámek zůstávají zachovány. Opakovaný pokus vrací uložené počty. Při chybě databáze/timeoutu nemusí být počty dostupné: neinterpretujte chybu jako úspěch, zkontrolujte `etf_sync_runs`. API nevrací interní chyby, adresy ani tokeny.
7. Odhlaste se tlačítkem **Odhlásit se**; session bude serverově zrušena. Expirace je 30 minut bez prodlužování. Staré přístupy se odstraní při další žádosti o přihlášení.

**Import nepublikuje ETF.** Tři nepublikované záznamy IVV/ITOT/IWM zůstanou nepublikované. `candidates=20, updated=0` může být správně: katalog vyžaduje samostatné schválení povinných údajů a explicitní opt-in aktualizací. Diagnostika nezaručuje dostupnost kompletního srovnávače bez schváleného katalogu.

Odstranění před odevzdáním: odstraňte `src/PreviewAdmin.tsx`, `src/preview-admin.css`, odbočku `admin=etf-sync` v `src/App.tsx`, `api/preview-admin.ts`, `server/preview-admin.ts`, jeho místní API route a Vercel function nastavení, metodu `sendAdmin` a POST větev/import v `api/etf-sync.ts`. Zachovejte původní chráněný GET, import a Cron. Tabulku/RPC lze později odstranit novou migrací; aplikované migrace nepřepisujte. Alternativně `APP_ENV=production` již tyto administrátorské operace blokuje.

Skutečné doručení přihlašovacího e-mailu a import na Vercelu nebyly v Codexu provedeny. Testy používají lokální PostgreSQL a mock SMTP/API; první skutečné ověření proveďte výše uvedeným postupem.

Lokální ověření dočasného UI (API nahrazena fixtures; nejde o test vzdálených služeb): po `npm run build` a spuštění `npm run preview` spusťte `BROWSER_PATH=/usr/bin/chromium node tests/browser/preview-admin.mjs`. Stávající srovnávač ověřuje `npm run test:browser`.

## Kontrola balení Vercel Functions

Runtime Node.js 24 vychází z `package.json` (`engines.node`). Serverová konfigurace používá `NodeNext`; všechny lokální importy v `api/`, `server/` a serverových závislostech `shared/` mají příponu `.js`. TypeScript resolver je při vývoji mapuje na zdrojové `.ts`, ale emitovaný ESM musí odkazovat na soubory dostupné v produkčním balíčku. Nepřidávejte `includeFiles` pro kopírování zdrojových TS jako náhradu za správné importy.

- `npm run check:server`: skutečná kompilace a načtení/vykonání všech devíti API handlerů běžným Node.js s vypnutou podporou TS. Součást `npm run build`, tedy i Vercel buildCommand.
- `npm run check:vercel`: lokální oficiální builder `@vercel/node` vytvoří devět Lambda artefaktů pro Node.js 24 a kontrola je spustí v samostatných adresářích. Závislosti již musí být instalované; instalace a projektový build jsou v této diagnostice vynechány, aby se kontrolovalo pouze balení funkcí. Regresní zkouška dočasně změní import v testovacím artefaktu na neexistující `http.ts` a ověří detekci `ERR_MODULE_NOT_FOUND`.
- Kontroly nečtou skutečné účty do testovacích požadavků, nepoužívají SMTP/Supabase a zakazují externí fetch. Funkční dotazy používají pouze bezpečné metody/validace a nepřihlášený GET administrace.

Po Git push vyčkejte na nový automatický Preview deployment a ověřte, že odpovídá novému commitu. Otevřete `/api/preview-admin`: při `APP_ENV=preview` bez přihlášení má vrátit HTTP 200 a `{"authenticated":false}`. V Runtime Logs nesmí být `ERR_MODULE_NOT_FOUND`. Potom otevřete `/?admin=etf-sync`; teprve nyní případně vyžádejte přihlašovací e-mail a proveďte ruční import podle předchozího postupu. Samotná HTTP kontrola nepotvrzuje doručení e-mailu ani úspěšný import.

## Lišta soukromí a odvolání analytiky

Pro nový projekt aplikujte migraci `202610110006_analytics_revocation.sql` po předchozích migracích. V současném Preview už ji správce úspěšně aplikoval; tam ji znovu nespouštějte. Přidává tabulku revokovaných návštěv, blokování opožděných zápisů a rozšíření stávajícího withdraw/purge; nevytváří kontakty ani ETF data. Žádné nové environment variables. Do její aplikace funguje původní mazání, ale není nová serverová ochrana proti opožděným událostem; úplné ověření proveďte až po migraci.

Po automatickém Preview deploymentu otestujte anonymní návštěvu v čistém prohlížeči (bez měření), Odmítnout, reload, formulář bez analytiky, Nastavení soukromí → Přijmout analytiku, interakci a Odmítnout. V Supabase ověřte odstranění událostí daného visitId, zachované srovnání/session a revokované UUID. Test mazání při výpadku: v DevTools blokujte /api/events, odvolejte souhlas a ověřte chybu/retry, nulové nové měření i po reloadu; po odblokování musí retry uspět. Skutečné e-maily při tomto diagnostickém scénáři neodesílejte. Funkční e-mailový průchod je samostatný ruční test pouze na SMTP_USER.

Katalog vyplňte dávkovým schvalovacím souborem a prepare:etfs/dry run/explicitním importem dle docs/CATALOG_REVIEW.md. Lišta sama pending fondy nezveřejňuje. `npm run check:vercel` musí nadále projít pro všech deset funkcí.

## Zveřejnění pětice podle nové datové metodiky

Aktuálně správce potvrdil zveřejnění všech pěti fondů; původní import kvůli kalkulačce neopakujte. První pětice má již konkrétní manifest `data/review/priority-five.demo-approval.json` s admin a výslovným rozhodnutím provozovatele; nejde o licenci emitentů. Finální `data/priority-five.approved.json` prošel validací/dry run. Po kontrole této dávky správce spustí `npm run import:etfs -- data/priority-five.approved.json --apply` a ověří `/api/catalog` podle [CATALOG_REVIEW.md](CATALOG_REVIEW.md). Tento vývoj --apply nepoužil. Sources JSON zachová skutečný původ, verification, autorství, licenci a význam dat; usage_review rozliší rozhodnutí provozovatele a uchová známá omezení. Nová migrace ani nové environment variables nejsou potřeba. Dosud aplikované migrace znovu nespouštějte. 14denní čerstvost kontroly se automaticky neprodlužuje.


## Historická kalkulačka

GET `/api/performance?comparison=ID` je chráněný serverový endpoint pro pět publikovaných tickerů; žádné nové environment variables, Supabase změny nebo SMTP požadavky. Vercel maxDuration 60 s, serverová keš upstream úspěchu jeden den, privátní HTTP odpověď bez CDN kešování, při chybě krátká keš/retry a pravdivý chybový stav. Postup Preview a omezení: [PERFORMANCE.md](PERFORMANCE.md). `check:server` a `check:vercel` nyní zahrnují všech deset API funkcí. Žádná migrace se kvůli kalkulačce nepouští.

## 12. Automatické otevření e-mailového odkazu a chráněná data

Nová migrace **202610120008_reusable_comparison_links.sql** musí být aplikována samostatně správcem v Supabase SQL Editoru, jednou, po kontrole připraveného souboru. Nahrazuje implementaci existujícího service-role RPC `redeem_comparison`: token se otevřením nespotřebuje, každé platné otevření vytvoří novou session; potvrzení e-mailu a jeho analytická událost nastanou jen jednou. INSERT trigger nastavuje novým odkazům pevnou platnost 90 dní od vytvoření. Žádné tabulky nebo ETF údaje se nemění. Existující expirace nejsou prodlouženy, expirované/zneplatněné odkazy se neobnovují. Historická migrace 007 zůstává beze změny; aplikace její RPC již nepoužívá. 008 funguje s aplikovanou 007 i bez ní. Původní migrace neopakovat. V této úloze nebyla žádná migrace aplikována vzdáleně. Environment variables jsou beze změny.

Veřejný vstup nabízí ticker/název/datum kontroly, výběr 2–5 a e-mail. Výchozí uložená částka 100 000 Kč je pracovní hodnota, nikoli investiční doporučení; uživatel ji nastaví v odemčeném srovnávači. Marketing se nenabízí a nové marketingConsent=false; doručení žádosti ho nevyžaduje.

Token je pouze ve fragmentu, který JavaScript odstraní z adresního řádku. GET/HEAD stránky nevolá potvrzovací RPC. Viditelná fokusovaná stránka automaticky zavolá POST /api/access s Origin a JSON; backend kontroluje 256bitový token, hash, expiraci a rate limit. Získaná session je HttpOnly/Secure/SameSite=Lax. Tabulky a historie se načtou až po serverem potvrzeném read_comparison. Samotný React příznak nebo ID URL přístup neudělí. Neukládáme token do localStorage, analytiky nebo logů. E-mailový odkaz je přístupový údaj: jeho držitel může otevřít přehled, proto jej nesdílejte.

Běžné HTTP/JS neaktivní skenery nic nepotvrdí. **Plně aktivní prohlížečový skener není spolehlivě rozlišitelný od uživatele bez další interakce.** Může potvrdit přístup, ale odkaz tím nezneplatní pro uživatele. Link nefunguje s vypnutým JavaScriptem; otevření karty na pozadí čeká na její aktivaci. Platný e-mailový odkaz funguje opakovaně bez původní session, bez dalšího tlačítka a bez zadávání e-mailu. Potvrzení ani expiraci opakováním neprodlužujeme. Session pro návrat přes ?comparison=ID má platnost 30 dní; po jejím skončení použijte původní e-mailový odkaz. Nepotvrzené žádosti se nadále při denním úklidu mažou po 30 dnech, potvrzené přehledy po 90 dnech od poslední úpravy. Smazání přehledu nebo zneplatnění tokenu přístup znemožní; jeho maximální 90denní platnost nepřepisuje retenci.

Ruční Preview kontrola po migraci: na vstupu očekávejte výběr a e-mail bez kalkulačky. Odešlete jen na povolený SMTP_USER (skutečné odesílání není součást této cloudové úlohy). Otevřete link v aktivním okně: bez dalšího tlačítka se zobrazí uložený výběr a kalkulačka. Upravte částku/výběr a uložte je. Obnovte stránku, znovu otevřete stejný e-mailový odkaz, smažte cookie a zkuste jej také v novém anonymním okně: všechny platné návraty musí obnovit uložené nastavení. Přímé ?comparison=ID bez cookie musí být odmítnuto. GET /api/access neověřuje. Katalog s ID, performance s ID a comparison vyžadují odpovídající cookie; odpovědi historie jsou private/no-store. Expiraci otestujte jen na vyhrazeném testovacím záznamu, nikoli na skutečných uživatelích.

Bezpečnostní zneplatnění provádí pouze správce podle známého ID srovnání: parametrizovaným `UPDATE public.comparisons SET token_expires_at=now() WHERE id=$1` zablokuje další použití e-mailového odkazu. Pokud musí ukončit i všechny vydané sessions, v téže transakci provede `DELETE FROM public.comparison_sessions WHERE comparison_id=$1`. SQL Editor místo `$1` vyžaduje konkrétní UUID testovacího/schváleného záznamu; token ani e-mail se do příkazu nevkládá. Tyto zásahy v této úloze nebyly provedeny. Preview administrátorské přihlášení zůstává jednorázové a tato změna se ho netýká.
