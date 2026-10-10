# Nastavení funkčního MVP

## 1. Supabase

Vytvořit oddělený testovací a produkční projekt (doporučen evropský region). V SQL Editoru aplikovat migraci `supabase/migrations/202610100001_mvp.sql`, nebo používat standardní Supabase CLI workflow. Migrace není automaticky spouštěná při buildu a nebyla aplikována na živý projekt.

Tabulky mají RLS a žádné veřejné politiky; anon/authenticated nemají přímý přístup ani možnost spouštět privilegované RPC. Vercel server používá projektový secret/service_role klíč. Tento klíč nikdy nevkládat do `VITE_*`, frontendové konfigurace ani repozitáře.

Importovat pouze ručně schválené údaje podle DATA_SOURCES.md. Bez alespoň dvou dostupných ověřených fondů není možné vytvořit srovnání. Cíl katalogu je přibližně 15–20 fondů; aplikace podporuje 2–5 současně.

## 2. Resend a doména

Založit Resend projekt, přidat odesílací doménu/subdoménu a vložit DNS záznamy podle Resend (SPF/DKIM; vhodné DMARC podle vlastní doménové politiky). Po ověření zvolit skutečnou `EMAIL_FROM`, např. formát `ETF přehled <adresa@vase-domena>`; skutečnou adresu nevymýšlíme.

Vytvořit API klíč omezený na odesílání. Pro webhook nakonfigurovat `https://VAS-WEB/api/resend-webhook`, události `email.delivered`, `email.bounced`, `email.failed`, `email.complained` a vložit podpisový secret do `RESEND_WEBHOOK_SECRET`. Endpoint musí být pro Resend dosažitelný; deployment protection může vyžadovat samostatnou testovací doménu nebo odpovídající nastavení přístupu.

Vypnout sledování kliknutí/otevření u transakčních zpráv: potvrzení sleduje naše aplikace a nechceme, aby cizí přesměrování nesla přístupové tokeny. Otestovat zachování URL fragmentu v odeslaném odkazu. Odesílá se pouze odkaz, nikdy PDF nebo tabulka.

## 3. Vercel a prostředí

Framework Vite; build `npm run build`; output `dist`; Node 24. Ve Vercel nastavení vytvořit serverové proměnné podle `.env.example`:

- `SUPABASE_URL` a `SUPABASE_SECRET_KEY` (nebo legacy `SUPABASE_SERVICE_ROLE_KEY`);
- `RESEND_API_KEY`, `EMAIL_FROM`, `RESEND_WEBHOOK_SECRET`;
- `APP_BASE_URL`: stabilní HTTPS origin bez query nebo cesty (např. vlastní testovací doména). Používá se při tvorbě odkazů, nikdy se neodvozuje z nedůvěryhodného Host headeru;
- `APP_ENV`: `preview` nebo `production`, lokálně `development`;
- `RATE_LIMIT_SECRET`: nejméně 32 náhodných znaků, lokálně lze vytvořit `openssl rand -hex 32`. Skutečnou hodnotu necommitovat;
- `PREVIEW_RECIPIENTS`: explicitní čárkami oddělený seznam vlastních testovacích adres. Preview/development jiným příjemcům neposílá;
- případně `ALLOWED_ORIGINS`: další přesné originy, bez wildcard. Aktuální Vercel deployment origin z důvěryhodného `VERCEL_URL` je povolen automaticky.

Preview musí používat oddělenou databázi a testovací příjemce. Nepoužívat produkční klíče pro veřejné designové testování. Po změně proměnných znovu nasadit. `.env.example` má jen názvy; skutečné `.env*` ignoruje Git.

## 4. Přístup a provozní omezení

Požadavek uloží srovnání i kontaktní adresu; Resend odešle unikátní 256bitový token v URL fragmentu. V DB je jen hash. Stránka vyžaduje explicitní potvrzení tlačítkem (POST), aby skener e-mailu pouhým GET nespotřeboval token. Potvrzení je jednorázové, platnost 7 dní; vydá HttpOnly/SameSite=Lax/Secure session na 30 dní. V URL uloženého přehledu je pouze náhodné ID, přístup vyžaduje odpovídající session. Na jiném zařízení lze provést první potvrzení; již použitý odkaz po ztrátě session vyžaduje novou žádost o srovnání. Automatická obnova starého odkazu je odložená funkce.

Stavy `pending`, `sent`, `delivered`, `failed`, `bounced`, `complained` jsou oddělené od `confirmed_at`. Resend přijetí zprávy neznamená doručení; webhooky mají ověření podpisu, deduplikaci a ochranu pořadí. Předčasný webhook vrací chybu pro opakování poskytovatelem, dokud není uložen provider ID.

MVP odesílá synchronně, s provider idempotency key na srovnání. Při chybě zobrazí pravdivou chybu a dovolí novou žádost pod rate limitem. Odložené: pracovní fronta, automatické opakování všech selhání, hromadné kampaně, účty a administrace. Monitorovat nevyřízené/failed zprávy v databázi; při síťové nejistotě může zpráva dorazit i přes chybovou odpověď aplikace.

Omezení frekvence je atomické v databázi, ne v paměti funkce. Klíče IP/e-mailu jsou HMAC, nikoli čitelná IP či e-mail; používá se důvěryhodný Vercel proxy header. Bez produkčního Vercel proxy nespoléhat na veřejně dodávaný header jako identitu IP. Při změně hostingu upravit důvěryhodný zdroj IP.

## 5. Povinné kroky před produkcí

Doplnit skutečného provozovatele, kontakt, právní základ a zkontrolované informační texty. Návrh retence: nepotvrzené srovnání/kontakt 30 dní, uložený přehled 90 dní od poslední úpravy; marketingové souhlasy podle schválených samostatných pravidel. V první verzi musí provozovatel pravidelně provádět úklid a vyřizovat žádosti o odstranění; tabulky mají kaskádové odstranění kontaktních dat. Historie marketingového souhlasu musí být interpretována odděleně; absence nového souhlasu není odvoláním staršího.

Testovací kritérium: importovaná ověřená ETF → výběr 2–5 → email do povolené testovací schránky → podpisovaný delivered webhook → explicitní potvrzení → obnovený výběr/částka → uložit úpravy → reload. Zkontrolovat expiraci, cizí session a chyby. Tento postup nelze nahradit mockem nebo pouhým úspěšným buildem.
