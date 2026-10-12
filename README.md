# ETF Comparison Landing

Český mobile-first srovnávač ETF: React + Vite + TypeScript + Tailwind, Vercel Functions, Supabase a Nodemailer/Gmail SMTP. Výchozí původní redakční vzhled je zachovaný; backend a frontend jsou propojené; živé služby se v této úloze neměnily.

## Jak web funguje

Redakční úvod → výběr alespoň jednoho ETF bez pevného maxima → e-mail → bezpečný odkaz → automatické ověření v aktivním prohlížeči → interaktivní kalkulačka, historie a podrobné srovnání. Veřejná stránka obsahuje pouze výběr a e-mail; kalkulačka a podrobná data jsou chráněné serverovou session. Výběr a výchozí částka 100 000 Kč se uloží v Supabase; částku lze měnit až v otevřeném přehledu.

Kalkulace je částka × expense ratio / 100 (100 000 Kč × 0,03 % = 30 Kč/rok). Nezahrnuje brokera, konverze, daně nebo změny hodnoty investice a nepředpovídá výnosy. Nové historické r1/r3/r5 jsou kumulativní, vlastní scénář používá složené úročení; oba ignorují historický USD/CZK kurz. Historické total returns se nesnižují znovu o expense ratio. Podrobnosti a skutečné výnosy: [PERFORMANCE.md](docs/PERFORMANCE.md). PRIIPs/KID a omezená dostupnost amerických ETF pro retail v EU jsou viditelné před formulářem; obsah není doporučení.

FAQ, metodika, rizika a informace o zpracování údajů následují za srovnávačem. V tomto zjednodušeném formuláři se marketing nenabízí; nové žádosti mají marketingConsent=false. Dřívější samostatné souhlasy v databázi se nemažou. Provozovatel musí doplnit svou identitu/kontakt a schválit informační texty; do nastavení správce server nepřijímá kontakty.

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

Browser test používá izolované testovací odpovědi API, ne skutečnou databázi nebo odesílání. `BROWSER_PATH` může určit existující Chromium, `TEST_BASE_URL` testovaný build. Testy pokrývají katalog 20 fixtures, stránkování po šesti, dva fondy na mobilní řádek, výběr jednoho i více než pěti fondů, hledání, kalkulačku, formulář, automatické otevření aktivní stránky, obnovení/uložení, souhlas a prázdný katalog na šířkách 320–1440 px. SQL testy spouštějí skutečné migrace na PostgreSQL enginu PGlite a ověřují RLS/oprávnění, tokeny, session, retenci a odstranění starého provider RPC. Mail testy kontrolují konfiguraci, TLS, skutečnou MIME strukturu HTML/text, SMTP acceptance a bezpečné logování. Neprokazují živé Supabase/Gmail SMTP doručení.

## Data a nasazení

První pětice SPY, VOO, IVV, VTI a IWM je podle potvrzení správce již publikovaná v Supabase. [DATA_SOURCES.md](docs/DATA_SOURCES.md) obsahuje zdroje, licenční rozsah a validovaný import. [Seznam 20 kandidátů](data/etf-candidates.csv) není schválený dataset. Synchronizace TickerInside funguje podle potvrzení správce, automaticky však nepublikuje kandidáty. Každé katalogové pole má zdroj/platnost/ověření; týdenní kontrola a limit stáří 14 dní zůstávají. Uložené přehledy zachovávají snapshot a jeho datum. Historická výkonnost se načítá samostatně přes serverovou keš.

Vercel: framework Vite, build `npm run build`, output `dist`, Node 24. Serverové proměnné, databázové migrace, Gmail app password, ověření SMTP, adresu SMTP_USER jako příjemce Preview a denní retenční úklid: [SETUP.md](docs/SETUP.md). Tajné klíče patří pouze na server. RLS a explicitní zákazy chrání kontakty; API používá serverovou validaci, honeypot, kontrolu Origin a atomické HMAC rate limity.

Odkaz má 256bitový token v fragmentu, bez adresy nebo výběru; DB uchovává hash. GET/HEAD odkaz token nespotřebuje. Aktivní, viditelná a fokusovaná JavaScript stránka automaticky zavolá stejnooriginový POST /api/access; nepotřebuje další potvrzovací tlačítko. Skener plně simulující aktivní prohlížeč nelze bez uživatelského kroku spolehlivě odlišit od člověka. E-mailový odkaz je opakovaně použitelný návratový odkaz: každé platné otevření vytvoří novou 30denní session i bez původní cookie nebo na jiném zařízení. Potvrzení e-mailu a jeho funnel událost nastanou pouze poprvé. Nové odkazy mají pevnou platnost nejvýše 90 dní od vytvoření; nepoužité žádosti nadále podléhají 30denní retenci. Starší odkazy si zachovávají původní expiraci. URL po otevření obsahuje pouze náhodné ID a vyžaduje HttpOnly cookie; pro návrat bez cookie použijte původní e-mailový odkaz. Odkaz nesdílejte: jeho držitel získá přístup. Stav `sent` znamená přijetí Gmail SMTP serverem, nikoli doručení. Gmail neposkytuje spolehlivý delivery webhook; doručení zůstává neověřené do testu ve schránce. Potvrzení přístupu (`confirmed_at`) nastává při úspěšném serverovém zpracování odkazu. SMTP nemá garantovanou idempotenci; po síťové nejistotě může opakování poslat další zprávu.

Git větev `design-exploration`; `main` se nemerguje. Ve Vercelu otevřete projekt → Deployments → poslední Preview pro tuto větev → Visit. Push sám neprokazuje úspěšný deployment. Doporučená stabilní testovací doména v `APP_BASE_URL`; preview používá vlastní Supabase projekt a jako jediného testovacího příjemce adresu `SMTP_USER`.

## Zachované návrhy

Bez parametru nebo `?variant=editorial` je skutečná stránka s e-mailovou bránou. Přepínač archivních návrhů se zobrazí až po serverově ověřeném otevření srovnání; samotný parametr variant neobchází e-mailovou bránu. Archivy mají pouze DEMO, nikdy neotevírají chráněná API data. `?variant=editorial-demo` zachovává předchozí frontendový prototyp s výslovně DEMO údaji a simulací e-mailu. Další návrhy: `editorial-blue`, `editorial-green`, `compact-blue`, `compact-green`, `steps-blue`, `steps-green`, `terminal`, `guide` přes `?variant=…`. Přepínač návrhů zůstává pro preview; archivní formuláře neodesílají a zástupné položky nejsou produkční ETF.

## Měření a zbývající omezení

Volitelné měření se spustí až po souhlasu. Události: návštěva, interakce, nastavení, formulář, přijetí, odeslání, potvrzení a otevření. Serverové události se párují jen s měřenými návštěvami, bez e-mailů/tokenů v analytice; neměřené návštěvy nejsou součástí měřeného konverzního jmenovatele. Stav doručení je provozní evidence. Dvě reklamy, odhad 3–7 % návštěv na kontakt / 60–80 % kontaktů na potvrzení a tři prioritní A/B hypotézy zůstávají v [PLAN.md](docs/PLAN.md). Jsou to předpoklady, nikoli skutečné výsledky.

V této úloze nebylo ověřováno živé nastavení služeb ani doručení ve schránce. První pětice je podle potvrzení správce již publikovaná; úplné podmínky zdrojů nebyly právně auditovány. Provozovatel přijal omezené faktické demo; tento záznam není právní stanovisko. Retenční Cron běží na Vercelu jen na produkčních deploymentech; preview vyžaduje vlastní pravidelný úklid. Fronta automatického retry, obnova použitého odkazu, marketingové kampaně, administrace a A/B platforma jsou odložené. Neproveden plný WCAG/performance ani právní audit. Po konfiguraci proveďte celý akceptační průchod podle SETUP.md.

Průběh práce, dostupné skutečné prompty, kontroly a opravy: [ai-log/](ai-log/).

## Gmail SMTP na Vercelu

Server čte `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`, `SMTP_USER`, `SMTP_PASSWORD` (Google app password) a `EMAIL_FROM` (zobrazované jméno + stejná adresa jako SMTP_USER). Hodnoty zůstávají ve Vercel Environment Variables; žádný SMTP klíč nepatří do VITE_* nebo Gitu. Nepotřebujete vlastní odesílací doménu ani další placenou službu. Google účet vyžaduje podmínky pro app passwords/2FA; už vytvořené proměnné není třeba posílat do chatu.

Přesný produkční test je v [SETUP.md](docs/SETUP.md#6-test-na-nasazeném-vercelu): chráněný `/api/mail-health` ověří spojení/přihlášení, potom formulář a vlastní schránka ověří skutečné doručení i návratový přehled. Verify samo e-mail neposílá. Z Codexu SMTP spojení selhalo EAI_AGAIN a proměnné zde chybí; úspěch na Vercelu zatím není prokázaný.

Gmail je určený pro malý testovací provoz. Aplikace omezuje pokusy globálně na 100/den, 20/hodinu na IP a 3/hodinu na adresu. Google má vlastní měnící se limity a může blokovat automatizované přihlášení, kvóty nebo odvolané app password; konkrétní aktuální kvótu ověřte u svého účtu. Název From může Gmail přepsat. SMTP TCP dostupnost, timeout a případná deployment protection musí projít živým testem. Bez debug logů, bez vypínání TLS verifikace; chyby logují jen pevný typ a povolený kód. Automatické retry, zpracování bounce a marketingové rozesílání nejsou součástí MVP.

Finální seznam ručně nastavovaných proměnných a jejich Preview/Production scope: [SETUP.md](docs/SETUP.md#7-finální-konfigurace-pro-ruční-vyplnění-11-října-2026). `PREVIEW_RECIPIENTS` se již nepoužívá; jiné adresy než SMTP_USER Preview odmítá před uložením srovnání. OPERATOR_CONTACT vyplnit samostatně stejnou Gmail adresou. Codex Cloud nepotřebuje přístupy k externím službám pro build a izolované testy. Podle uživatele jsou tři migrace v projektu kdkxoykuhqwodimawcrs již aplikované; znovu je nespouštět.

## TickerInside a týdenní aktualizace

Ověřený bezplatný veřejný zdroj: [TickerInside API](https://tickerinside.com/api/). [Audit 20 skutečných odpovědí](docs/TICKERINSIDE_AUDIT.md), licence a omezení v [DATA_SOURCES.md](docs/DATA_SOURCES.md). Endpoint /api/etf-sync používá CRON_SECRET a zapisuje oddělené kandidáty/audit, nikdy automaticky nepublikuje předběžné fondy. Aktualizuje pouze nákladovost u výslovně povolených kompletních schválených fondů s datovaným SEC podkladem. Index, dividendy a popis API neposkytuje. Migrace synchronizace již byla podle správce aplikována. [Ruční Preview a budoucí týdenní Production Cron](docs/SETUP.md#8-tickerinside-synchronizace-ruční-preview-budoucí-production); tarif ani běžící Cron nebyly ověřeny. Celkové lidské ověření a 14denní limit zůstávají, API stažení je neprodlužuje. Z 20 kandidátů je podle správce publikovaná první pětice.

Dočasná administrátorská diagnostika Preview: otevřete `/?admin=etf-sync`, vyžádejte odkaz do schránky `SMTP_USER`, v e-mailovém odkazu potvrďte přihlášení tlačítkem a spusťte **Otestovat synchronizaci ETF**. Nejdříve ručně aplikujte novou migraci `202610110005_preview_admin.sql`. Postup, ochrany a snadné odstranění jsou v [docs/SETUP.md](docs/SETUP.md#Dočasná-Preview-diagnostika-synchronizace). Funkce je serverově omezena na Preview; bez schválených publikovaných ETF import sám nezprovozní veřejný katalog. Skutečné doručení/import na Vercelu musí být ověřeny samostatně.

Serverové funkce používají Node.js ESM importy s příponou `.js` (TypeScript je při kontrole řeší na zdrojové `.ts`). `api/tsconfig.json` přebírá samostatnou NodeNext konfiguraci z `tsconfig.server.json`; frontend si ponechává Vite/bundler konfiguraci. `npm run build` nyní obsahuje `npm run check:server`: kompilaci backendu a spuštění všech API endpointů běžným Node.js bez TypeScript loaderu. `npm run check:vercel` navíc použije lokální oficiální `@vercel/node` builder a spustí skutečně zabalené funkční artefakty, včetně regresní kontroly chybějícího `.ts` importu. Neprovádí deployment ani volání Supabase/SMTP. Výstupy těchto kontrol jsou pouze v ignorovaném `.cache/`.

První pětice SPY/VOO/IVV/VTI/IWM je podle aktuálního potvrzení správce již publikovaná v Supabase a viditelná na webu. Původní finální dávka `data/priority-five.approved.json` a rozhodnutí `data/review/priority-five.demo-approval.json` zůstávají evidencí omezeného faktického demo modelu pod označením admin. Nepouštějte její import znovu kvůli kalkulačce; nové historické API žádné katalogové řádky nemění. Archivní postup, známá omezení licence a kontrola `/api/catalog`: [CATALOG_REVIEW.md](docs/CATALOG_REVIEW.md).

Souhlas s analytikou je v plovoucím panelu dole na obrazovce. Volby Odmítnout/Přijmout analytiku jsou stejně výrazné, panel je position: fixed mimo rozložení stránky, respektuje safe-area a lze jej zavřít i bez udělení souhlasu. Odkaz Nastavení soukromí je v patičce. Volba v localStorage, náhodné visitId v sessionStorage; žádné analytické cookies ani externí skripty. Marketing je nezávislý na analytice; současný e-mailový formulář jej nenabízí a nové žádosti ukládají marketingConsent=false. Odvolání okamžitě zastaví měření, odstranění přiřazených serverových dat musí být potvrzené; při selhání zůstává viditelná chyba a retry i po reloadu. Původní funkční přístupová cookie se nemaže. Ochranu před opožděnými událostmi zajišťuje migrace 202610110006_analytics_revocation.sql (v aktuálním Preview již aplikovaná podle potvrzení správce; znovu ji nespouštějte); postup a omezení měření viz docs/ANALYTICS.md. Test lišty: `BROWSER_PATH=/usr/bin/chromium node tests/browser/privacy.mjs` (fixtures, bez reálného doručení).

Dávkové schválení dalších fondů: použijte malou kopii priority-five.batch-approval.example.json a `npm run prepare:etfs` podle docs/CATALOG_REVIEW.md. Žádný další kandidát se neschvaluje ani nepublikuje automaticky.

`npm run test:browser` nyní zahrnuje srovnávač, lištu soukromí, Preview administraci i skutečnou atribuci a přesnost SPY/VTI nad izolovanými fixture. Používá izolované browser API fixture; neodesílá skutečné e-maily ani neprovádí vzdálené zápisy.

TickerInside je hlavní zdroj dostupných licencovaných metadat. Tabulka rozlišuje původ, emitentské ověření a vlastní český popis po polích; atribuce obsahuje odkaz na poskytovatele, konkrétní fondovou stránku, CC BY 4.0 a informaci o úpravách. SPY zachovává 0.0945 % od emitenta; VTI aktuální Morningstar název/index. Provozovatel přijal publikaci první pětice pro demo; toto rozhodnutí není licence emitenta nebo právní audit a známá omezení zůstávají v manifestu. Vzdálený katalog se touto změnou nemění; správce už potvrdil zveřejnění pětice. Jednoduchý poslední krok a importní příkazy jsou v docs/CATALOG_REVIEW.md; nejsou potřeba další programové změny ani nová migrace.


## Odhadovaný výnos a historický vývoj ETF

Výběr ETF → částka a horizont → jedna tabulka se společným záhlavím, editovatelnými procenty a pruhy zisku/ztráty → skutečný historický graf ETF → detailní tabulka → e-mail. Žádné oddělené režimy, velké výsledkové karty nebo dominantní graf nákladů. Automatická sazba je CAGR vybraných 1/3/5 let, viditelně zaokrouhlená na dvě desetinná místa. Ruční sazby jednotlivých ETF se nemění při změně částky/horizontu ani návratu z formuláře. Jediný přepínač 1/3/5 let nad historickým grafem záměrně obnoví sazby všech fondů podle nového CAGR a zároveň změní historii; horizont zachová. Společné tlačítko Obnovit podle historie pod tabulkou vrátí sazby všech vybraných fondů. Hlavní částka je zisk = budoucí modelová hodnota minus vklad, nikoli celková hodnota. Pruhy všech fondů mají společnou lineární stupnici a nulu (zelená zisk, červená ztráta). Modelové sazby jsou po průběžných nákladech, expense ratio se znovu neodečítá.

Graf **Historický vývoj ETF** používá licencované vypočtené weekly total returns, nikoli indexové řady nebo raw price feed. Zdroj nabízí 156 týdnů: 52 pro 1 rok, 156 pro přibližně 3 roky; pětiletý souhrnný výnos nevytváří pětiletou křivku. Normalizace = 100, tooltip a klávesnicový slider, skutečné kalendářní týdenní hranice a příslušná atribuce. Null se nenahrazuje nulou, neplatné vstupy nemají falešný výsledek. Podrobnosti: [PERFORMANCE.md](docs/PERFORMANCE.md).

Chráněný serverový `/api/performance?schema=3&comparison=ID` zachovává keš a pevný seznam pětice, nově ověřuje a vrací datované weeklyReturns. Žádné nové klíče nebo dependencies; migrace 202610120008_reusable_comparison_links.sql umožňuje opakované použití původního tokenu nezávisle na session. Výchozí scénář není prognóza, Kč model ignoruje USD/CZK, daně a brokera. Uložený e-mailový průchod nadále zachovává ETF výběr a částku; nové pracovní modelové parametry se do DB neukládají. Analytika, lišta soukromí a Gmail zůstávají zachované.

## E-mailová brána (12. října 2026)

`/api/catalog` bez ID vrací jen ticker, název a datum kontroly pro výběr. `?comparison=ID` vyžaduje serverovou session pro toto ID a zpřístupní kompletní katalog. `/api/performance` vyžaduje stejné ověření a má private/no-store; upstream cache zůstává na serveru. `/api/comparison` i zápis zůstávají svázané s HttpOnly cookie, nezávisle na stavu Reactu. Ověření stále emituje původní `email_confirmed` (ne nový email_verified) a otevření `comparison_opened` jen pro návštěvy s analytickým souhlasem.

Před kontrolou nového Preview aplikujte **pouze novou** migraci `202610120008_reusable_comparison_links.sql` podle [SETUP.md](docs/SETUP.md). Původní migrace neopakovat. Žádná nová environment variable; změna nebyla vzdáleně nasazena ani ověřena skutečným e-mailem.

## Texty a výběr ETF — 12. října 2026

FAQ a potvrzení odeslání mají požadované texty; datum kontroly je pouze v detailu a zdrojích, nikoli ve výběru. Zpráva „Zpráva byla odeslána“ se zobrazí pouze po odpovědi status=sent, která na serveru následuje až po SMTP recipient acceptance a úspěšném zápisu stavu. Chyba nebo pouhé pending/queued nejsou úspěch; SMTP přijetí stále není důkaz doručení do inboxu.

Počet fondů není pevně omezen: minimum jeden, bez duplicit, pouze publikovaný a čerstvě ověřený katalog. Zachovány 8KiB JSON limit a rate limiting. Začíná šest položek, Zobrazit další přidává po šesti. Vyhledávání prochází celý katalog a pro nový dotaz začíná šesti výsledky; vybrané tickery zůstávají označené a dostupné přes odebratelné štítky. Mobil má dva fondy na řádek. Rozsáhlejší detailní tabulka má na desktopu vlastní klávesnicí dostupný horizontální posun, nikoli přetékání celé stránky.

**Před testem uložení jednoho či více než pěti fondů** jednou aplikujte migraci `202610120009_flexible_etf_selection.sql` podle SETUP, část 13. Předchozí 008 zachovává opakované návratové odkazy; pokud ještě nebyla aplikována, aplikujte ji před 009. Historický datový zdroj zůstává ověřený pro publikovanou pětici. Odstranění výběrového limitu nevytváří historická data pro další kandidáty: fond bez podkladů má prázdný vstupní předpoklad, funkční ruční model a žádnou vymyšlenou křivku.

Viditelný zkrácený informační text používá požadované ETFMaster a mailto kontakt. Samostatné oznámení zachovává příjemce/zpracovatele a oddělení případných starších marketingových souhlasů. Před veřejným provozem správce musí sladit OPERATOR_NAME/OPERATOR_CONTACT se zveřejněným kontaktem, ověřit úplnou identitu správce (pokud ETFMaster je pouze značka) a doložit skutečné přenosy údajů mimo EHP včetně použitých záruk. Tyto právní/skutečné provozní informace nelze odvodit z kódu; jejich kontrola není předstírána. Konfigurace ani retenční lhůty nebyly změněny.
