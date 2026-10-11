# ETF Comparison Landing

Český mobile-first srovnávač ETF: React + Vite + TypeScript + Tailwind, Vercel Functions, Supabase a Nodemailer/Gmail SMTP. Výchozí původní redakční vzhled je zachovaný; backend a frontend jsou propojené, služby zatím nejsou nakonfigurované v tomto prostředí.

## Jak web funguje

Redakční úvod → hledání ETF podle tickeru/názvu → výběr 2–5 → tabulka parametrů → částka a graf ročních nákladů → e-mail → unikátní odkaz → potvrzení a obnovený interaktivní přehled. E-mail přichází až po sestavení srovnání. Veřejné porovnání poskytuje hodnotu; uložený návratový odkaz motivuje ke kontaktu. Výběr i částka se uloží v Supabase a po otevření lze změny znovu uložit.

Kalkulace je částka × expense ratio / 100 (100 000 Kč × 0,03 % = 30 Kč/rok). Nezahrnuje brokera, konverze, daně nebo změny hodnoty investice a nepředpovídá výnosy. PRIIPs/KID a omezená dostupnost amerických ETF pro retail v EU jsou viditelné před formulářem; obsah není doporučení.

FAQ, metodika, rizika a informace o zpracování údajů následují za srovnávačem. Marketingový souhlas je samostatný a nepovinný. Provozovatel musí doplnit svou identitu/kontakt a schválit informační texty; do nastavení správce server nepřijímá kontakty.

## Spuštění a testy

Node 24, `npm ci`. Pro frontend `npm run dev`; ve druhém terminálu `npm run dev:api` spustí stejné Vercel handlery na lokálním portu 3001. Vite proxy `/api` používá tento adapter. Server čte ignorovaný `.env.local`; před spuštěním nastavte služby podle [.env.example](.env.example) a [SETUP.md](docs/SETUP.md). Alternativně použijte standardní `vercel dev`. Bez konfigurace API vrátí bezpečnou 503 a stránka nabídne opakování načtení, nikoli falešné finanční údaje.

```sh
npm test
npm run lint
npm run typecheck
npm run build
npm run preview -- --port 4173
# v dalším terminálu, po instalaci Chromium:
npx playwright install chromium
npm run test:browser
```

Browser test používá izolované testovací odpovědi API, ne skutečnou databázi nebo odesílání. `BROWSER_PATH` může určit existující Chromium, `TEST_BASE_URL` testovaný build. Testy pokrývají katalog 20 fixtures, maximum pěti fondů, hledání, kalkulačku, formulář, explicitní potvrzení, obnovení/uložení, souhlas a prázdný katalog na šířkách 320–1440 px. SQL testy spouštějí skutečné migrace na PostgreSQL enginu PGlite a ověřují RLS/oprávnění, tokeny, session, retenci a odstranění starého provider RPC. Mail testy kontrolují konfiguraci, TLS, skutečnou MIME strukturu HTML/text, SMTP acceptance a bezpečné logování. Neprokazují živé Supabase/Gmail SMTP doručení.

## Data a nasazení

Produkční katalog není naplněný. Z cloudového prostředí nebylo možné ověřit primární data a podmínky (HTTP 403). [DATA_SOURCES.md](docs/DATA_SOURCES.md) obsahuje schválené zdroje, pravidla a validovaný import. [Seznam 20 kandidátů](data/etf-candidates.csv) není ověřený dataset; cílem je po ruční kontrole zveřejnit přibližně 15–20 fondů. Neověřené fondy se nepublikují. Každé pole má zdroj/platnost/ověření; týdenní kontrola, stáří nad 14 dní vyřadí fond z nových srovnání. Uložené přehledy zachovávají snapshot a jeho datum. Automatický import není implementován.

Vercel: framework Vite, build `npm run build`, output `dist`, Node 24. Serverové proměnné, tři SQL migrace, Gmail app password, ověření SMTP, adresu SMTP_USER jako příjemce Preview a denní retenční úklid: [SETUP.md](docs/SETUP.md). Tajné klíče patří pouze na server. RLS a explicitní zákazy chrání kontakty; API používá serverovou validaci, honeypot, kontrolu Origin a atomické HMAC rate limity.

Odkaz má 256bitový token v fragmentu, bez adresy nebo výběru; DB uchovává hash. Potvrzení tlačítkem zabrání běžnému GET skeneru spotřebovat odkaz. Jednorázové potvrzení platí 7 dní, session ve stejném prohlížeči 30 dní. Návratová URL obsahuje pouze náhodné ID a vyžaduje HttpOnly cookie. Po ztrátě session je v MVP třeba vytvořit nové srovnání. Stav `sent` znamená přijetí Gmail SMTP serverem, nikoli doručení. Gmail neposkytuje spolehlivý delivery webhook; doručení zůstává neověřené do testu ve schránce. Potvrzení přístupu (`confirmed_at`) nastává až po tlačítku. SMTP nemá garantovanou idempotenci; po síťové nejistotě může opakování poslat další zprávu.

Git větev `design-exploration`; `main` se nemerguje. Ve Vercelu otevřete projekt → Deployments → poslední Preview pro tuto větev → Visit. Push sám neprokazuje úspěšný deployment. Doporučená stabilní testovací doména v `APP_BASE_URL`; preview používá vlastní Supabase projekt a jako jediného testovacího příjemce adresu `SMTP_USER`.

## Zachované návrhy

Bez parametru nebo `?variant=editorial` je skutečná API stránka. `?variant=editorial-demo` zachovává předchozí frontendový prototyp s výslovně DEMO údaji a simulací e-mailu. Další návrhy: `editorial-blue`, `editorial-green`, `compact-blue`, `compact-green`, `steps-blue`, `steps-green`, `terminal`, `guide` přes `?variant=…`. Přepínač návrhů zůstává pro preview; archivní formuláře neodesílají a zástupné položky nejsou produkční ETF.

## Měření a zbývající omezení

Volitelné měření se spustí až po souhlasu. Události: návštěva, interakce, nastavení, formulář, přijetí, odeslání, potvrzení a otevření. Serverové události se párují jen s měřenými návštěvami, bez e-mailů/tokenů v analytice; neměřené návštěvy nejsou součástí měřeného konverzního jmenovatele. Stav doručení je provozní evidence. Dvě reklamy, odhad 3–7 % návštěv na kontakt / 60–80 % kontaktů na potvrzení a tři prioritní A/B hypotézy zůstávají v [PLAN.md](docs/PLAN.md). Jsou to předpoklady, nikoli skutečné výsledky.

Chybí živé nastavení služeb, ověřený katalog, kontrola podmínek zdrojů a test zprávy ve skutečné schránce. Produkční spuštění tím zůstává blokované. Retenční Cron běží na Vercelu jen na produkčních deploymentech; preview vyžaduje vlastní pravidelný úklid. Fronta automatického retry, obnova použitého odkazu, marketingové kampaně, administrace a A/B platforma jsou odložené. Neproveden plný WCAG/performance ani právní audit. Po konfiguraci proveďte celý akceptační průchod podle SETUP.md.

Průběh práce, dostupné skutečné prompty, kontroly a opravy: [ai-log/](ai-log/).

## Gmail SMTP na Vercelu

Server čte `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`, `SMTP_USER`, `SMTP_PASSWORD` (Google app password) a `EMAIL_FROM` (zobrazované jméno + stejná adresa jako SMTP_USER). Hodnoty zůstávají ve Vercel Environment Variables; žádný SMTP klíč nepatří do VITE_* nebo Gitu. Nepotřebujete vlastní odesílací doménu ani další placenou službu. Google účet vyžaduje podmínky pro app passwords/2FA; už vytvořené proměnné není třeba posílat do chatu.

Přesný produkční test je v [SETUP.md](docs/SETUP.md#6-test-na-nasazeném-vercelu): chráněný `/api/mail-health` ověří spojení/přihlášení, potom formulář a vlastní schránka ověří skutečné doručení i návratový přehled. Verify samo e-mail neposílá. Z Codexu SMTP spojení selhalo EAI_AGAIN a proměnné zde chybí; úspěch na Vercelu zatím není prokázaný.

Gmail je určený pro malý testovací provoz. Aplikace omezuje pokusy globálně na 100/den, 20/hodinu na IP a 3/hodinu na adresu. Google má vlastní měnící se limity a může blokovat automatizované přihlášení, kvóty nebo odvolané app password; konkrétní aktuální kvótu ověřte u svého účtu. Název From může Gmail přepsat. SMTP TCP dostupnost, timeout a případná deployment protection musí projít živým testem. Bez debug logů, bez vypínání TLS verifikace; chyby logují jen pevný typ a povolený kód. Automatické retry, zpracování bounce a marketingové rozesílání nejsou součástí MVP.

Finální seznam ručně nastavovaných proměnných a jejich Preview/Production scope: [SETUP.md](docs/SETUP.md#7-finální-konfigurace-pro-ruční-vyplnění-11-října-2026). `PREVIEW_RECIPIENTS` se již nepoužívá; jiné adresy než SMTP_USER Preview odmítá před uložením srovnání. OPERATOR_CONTACT vyplnit samostatně stejnou Gmail adresou. Codex Cloud nepotřebuje přístupy k externím službám pro build a izolované testy. Podle uživatele jsou tři migrace v projektu kdkxoykuhqwodimawcrs již aplikované; znovu je nespouštět.
