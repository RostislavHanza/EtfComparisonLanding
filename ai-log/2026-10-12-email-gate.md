# E-mailová brána a automatické otevření srovnání

## Skutečný dostupný prompt

Přesný vložený text uživatele, bez rekonstrukce předchozích promptů:

```text
Pracuj v repozitáři `RostislavHanza/EtfComparisonLanding` výhradně na větvi `design-exploration`. `main` neměň.

## Úkol: Úprava textů a e-mailového přístupu ke srovnávači

Potřebuji upravit úvodní stránku a přístup ke kalkulačce a srovnávacím tabulkám.

Dodrž přesně níže uvedené požadavky. Nepřidávej vlastní marketingové texty, kroky, tlačítka ani jiné funkce.

### 1. Změň hlavní nadpis

Současný nadpis:

„Americká ETF. Jasnější pohled.“

nahraď:

**„Americká ETF. Kalkulačka výnosů.“**

Zachovej současný vizuální styl nadpisu, pouze změň text.

### 2. Zjednoduš úvodní kroky

V části, kde je nyní:

„Malý průvodce velkým trhem“

„Různé fondy. Váš vlastní pohled.“

a čtyři kroky:

01 Vyberte 2–5 ETF
02 Porovnejte parametry
03 Nastavte částku
04 Vraťte se přes odkaz e-mailem

zobraz POUZE následující dva kroky:

**01 Vyberte ETF pro porovnání**

**02 Zadejte Email pro zaslání interaktivní tabulky**

Odstraň původní nadpisy, čtyři kroky a ostatní doprovodné texty z tohoto bloku, včetně odstavce o PRIIPs/KID. Nepřidávej do tohoto bloku nic dalšího.

### 3. Odstraň obrázek A/B/C

Úplně odstraň dekorativní obrázek nebo grafický prvek s označením A/B/C.

Nemá se zobrazovat ani na desktopu, ani na mobilu.

Nenahrazuj ho jinou ilustrací.

### 4. Odstraň marketingový popis a CTA

Úplně smaž tento text:

„Vyberte až pět ETF, porovnejte jejich zaměření a převeďte nákladovost na koruny. Jeden přehled, který si sestavíte sami.“

Odstraň také tlačítko:

„Sestavit moje srovnání →“

A odstraň doprovodný text:

„Bez účtu · V češtině · Žádné sliby výnosu“

Nenahrazuj tyto prvky jinými marketingovými texty ani tlačítky.

### 5. Nová sekce 02 bude pouze e-mailový formulář

Na úvodní stránce bude návštěvník nejprve vybírat ETF.

Následující sekce **02** už nebude kalkulačkou ani srovnávací tabulkou.

Bude obsahovat pouze:
- Pole pro zadání e-mailové adresy.
- Tlačítko **„Zaslat tabulku na mail“**.

Návštěvník musí mít před odesláním zvolená ETF, aby bylo jasné, jaké srovnání mu bude zpřístupněno.

Nedávej do této sekce výnosy, grafy, tabulky ani další nepovinná pole.

Ponech funkční technicky nezbytné informování o odeslání, validaci a souhlasech tam, kde je vyžaduje stávající implementace nebo platné povinnosti. Nesmí však vzniknout další zbytečný krok ověřování.

### 6. Zpřístupnění srovnávače pouze přes e-mailový odkaz

Toto je zásadní změna chování aplikace.

Veřejná vstupní stránka umožňuje:
1. Vybrat ETF.
2. Zadat e-mail.
3. Kliknout na „Zaslat tabulku na mail“.

Poté backend odešle na uvedenou adresu e-mail s unikátním bezpečným odkazem.

**Teprve otevření tohoto odkazu uživateli zpřístupní:**
- Kalkulačku odhadovaného zisku.
- Historický graf ETF.
- Podrobné srovnávací tabulky.
- Ostatní interaktivní části srovnávače.

Samotné otevření odkazu zároveň automaticky potvrdí vlastnictví e-mailové adresy.

**Nesmí existovat další tlačítko „Ověřit e-mail“, další potvrzovací formulář ani nutnost vytvářet účet.**

Ověření musí proběhnout na backendu při bezpečném zpracování e-mailového odkazu. Nestačí pouze skrýt tabulky pomocí CSS nebo nastavit příznak ve frontendu.

Zajisti:
- Bezpečný, obtížně uhodnutelný ověřovací token s omezenou platností.
- Vazbu tokenu na příslušný e-mail a vybrané srovnání.
- Ověření tokenu serverem před zpřístupněním chráněných dat.
- Ochranu před nechtěným opakovaným použitím a únikem tokenu.
- Přístup ke srovnávači po ověření bez opětovného zadávání e-mailu.
- Zachování výběru ETF z úvodní stránky.
- Možnost bezpečně zobrazit srovnání při návratu přes platný odkaz.

Využij co nejvíce současnou implementaci Supabase, Gmail SMTP, potvrzovacích tokenů a e-mailového workflow. Nevytvářej zbytečně nový autentizační systém, pokud stávající mechanismus stačí.

Pokud automatické otevírání odkazů e-mailovými bezpečnostními skenery může způsobit předčasné spotřebování tokenu, ošetři tento případ bezpečně bez přidání dalšího tlačítka pro uživatele.

### 7. Žádná kalkulačka na veřejné úvodní stránce

Dokud návštěvník neotevře ověřovací odkaz z e-mailu, nemá být dostupná kalkulačka, graf ani podrobné srovnání.

Po úspěšném ověření zobraz dosavadní interaktivní srovnávač v jeho aktuální podobě.

Zachovej jeho funkce:
- Investovanou částku.
- Investiční horizont.
- Odhadovaný zisk ETF.
- Editovatelná předpokládaná procenta.
- Historické referenční období propojené s odhadem i grafem.
- Historický graf.
- Detailní tabulku ETF.
- Zdroje a atribuci.

**Nyní neměň podobu kalkulačky ani její výpočty.** Úkolem je pouze změnit úvodní stránku a řízení přístupu.

### 8. Zachování stávajících funkcí

Zachovej:
- ETF katalog v Supabase.
- Výběr 2–5 ETF.
- Gmail SMTP.
- Analytiku a měření funnelu.
- Cookie nastavení a správu souhlasů.
- Současná bezpečnostní opatření.
- Datové zdroje a licenční atribuci.
- Funkčnost Vercel Preview.

Pokud současné metriky funnelu obsahují samostatný krok „email_verified“, zaznamenej jej při skutečném úspěšném ověření odkazu.

Nevytvářej duplicitní potvrzovací kroky nebo zbytečné nové tabulky.

### 9. Testování

Otestuj:
- Přesné nové texty na úvodní stránce.
- Odstranění A/B/C obrázku.
- Odstranění původního CTA a marketingového popisu.
- To, že sekce 02 obsahuje e-mailový formulář.
- Zachování výběru ETF.
- Odeslání potvrzovacího odkazu.
- Automatické ověření e-mailu po otevření platného odkazu.
- Zobrazení kalkulačky a tabulek až po ověření.
- Nemožnost obejít ověření přímou URL nebo úpravou frontendu.
- Neplatné a expirované tokeny.
- Opakované otevření odkazu a chování e-mailových skenerů.
- Zachování vybraných ETF po přechodu z e-mailu.
- Mobilní i desktopové rozložení.
- Zachování dosavadních výpočtů a funkcí.

Spusť lint, typecheck, unit testy, build, browser testy a kontrolu Vercel Functions.

Aktualizuj dokumentaci a AI log.

Commitni a pushni pouze na `design-exploration`, `main` neměň.

Neprováděj vzdálené databázové zápisy, migrace ani skutečné odeslání e-mailu bez nutnosti a předchozího potvrzení. Pokud je pro tento tok migrace nutná, připrav ji a jasně to uveď.

### Výstup

Na závěr napiš:
1. Které přesné texty a prvky jsi odstranil či změnil.
2. Jak funguje e-mailový odkaz a automatické ověření.
3. Jak je srovnávač chráněn před otevřením bez ověření.
4. Zda je nutná Supabase migrace nebo změna environment variables.
5. Jaké testy prošly.
6. Commit SHA a stav Preview.

Priorita: **jednoduchý vstupní web, výběr ETF, e-mail a okamžitý přístup k interaktivnímu srovnání po otevření doručeného odkazu. Bez dalších kroků a bez nevyžádaných změn UI.**
```

## Výchozí stav a rozhodnutí

Čistá větev design-exploration na commitu 41a1d20fa744b0b4caa2519addbfbbd561c9367d. Přečteny API access/catalog/comparison/performance, serverová aplikace/repository/mail/http, původní SQL a ochrana souhlasů, frontend/modely/keš a testy. Žádní další agenti. Nejnovější zadání výslovně nahrazuje dřívější potvrzovací tlačítko a veřejný srovnávač; AGENTS.md/PLAN.md aktualizovány na tento schválený rozsah.

Požadavek bez dalšího lidského kroku nelze spojit s absolutní identifikací všech skenerů: plně aktivní JS prohlížečový skener může vypadat jako uživatel. Implementována ochrana běžných GET/HEAD a neaktivních browser návštěv, omezení sděleno během práce a v README/SETUP.md; nepředstírá se úplná odolnost.

## Implementace

- Přesný h1 „Americká ETF. Kalkulačka výnosů.“ při stejné typografii. Intro pouze dva přesně zadané kroky. Odstraněn marketingový odstavec, hero CTA, footnote a intro nadpisy/PRIIPs blok. PRIIPs/rizika zůstávají v existujícím FAQ/patičce.
- A/B/C ve skutečnosti dědil desktopový CSS pseudo-element. Zrušen cíleně pro functional Editorial, nikoli nahrazen ilustrací. Browser regrese kontroluje computed pseudo-content, nejen nepřítomnost img/div v DOM.
- Veřejná sekce 02 obsahuje e-mail a Zaslat tabulku na mail, plus technický honeypot a nezbytné chybové/privacy informace. Bez dobrovolného marketing checkboxu; nové marketingConsent=false a server odmítá neoprávněný marketing opt-in v tomto formuláři; historické souhlasy se nemění. Text version nové žádosti 2026-10-12. Výchozí pracovní částka 100 000 Kč se uloží a mění až uvnitř srovnání.
- Public /api/catalog promítá pouze ticker/name/verifiedAt. ID v query nezpřístupní index/nákladovost/sources: kompletní katalog vyžaduje app.read s cookie vázanou na toto ID. /api/performance také vyžaduje tuto serverovou kontrolu, HTTP private/no-store; upstream 24h memory keš a single-flight beze změny. Klient schema=3 a cache dle ID. Uložené osobní GET/PUT chráněné původní read/update RPC. CSS/React příznak nejsou bezpečnostní hranicí.
- Fragmentový token 256 bitů je odstraněn z adresního řádku. Viditelná a fokusovaná JS stránka automaticky odešle stejnooriginový JSON POST; žádné uživatelské potvrzovací tlačítko nebo nové přihlášení. Původní limit, hash, expiry, atomické redeem a HttpOnly/Secure/Lax session zachovány.
- Nová migrace 202610120007_email_link_access.sql: pouze privilegovaná funkce reopen_comparison pro stále platný token, potvrzené srovnání a jeho existující neexpirovanou session. Anon/authenticated nemají právo. První použití je stále přes původní jednorázovou funkci; opětovné použití v jiném prohlížeči bez cookie neudělí přístup. Žádné původní migrace ani ETF data se nemění.
- Na veřejné stránce ani cestou archive variant neotevřeme jinou kalkulačku; přepínač designů až po serverově ověřeném přístupu. Archivní komponenty/kód zůstaly pro autorizované vizuální porovnání.
- Kalkulačka/graf/tabulka a výpočty nezměněny; kalkulačka dostává pouze ID pro chráněné načtení dat. Obnovené snapshoty fungují i při výpadku aktuálního katalogu; nové nedostupné fondy pak nelze přidat a ukládání je vypnuté, chyba je viditelná.
- E-mail HTML/text vysvětluje automatické otevření, bez dalšího ověřovacího CTA. Preview admin e-mail/explicitní přihlášení se záměrně nemění. Funnel nadále používá email_confirmed a comparison_opened z SQL pouze při platné atribuci; nezavádíme fiktivní email_verified. Výběr/configured/submit klientské události přesunuty k současnému procesu, souhlas a revokace zachovány.
- Žádné nové environment variables, služby, dependencies, uložené cloudové nastavení, Supabase zápisy nebo skutečné e-maily. Migrace pouze připravena, neaplikována. Starší veřejné deploymenty nejsou změnou Gitu zpětně staženy a plný browser scanner nelze garantovaně identifikovat.

## Testy, nalezené chyby a opravy

- První lint opravil Node-vs-browser globální jména ve fixture (globalThis). Typecheck následně prošel.
- 56 unit/backend testů prošlo po přidání katalogové bezpečnostní hranice a PGlite migrace; další dva testy pokrývají serverové opakování svázané session a GET/HEAD 405. Kompletní 58/58 bez skipped prošlo. Testy SQL dokazují jediné email_confirmed/session při opakování, token/session expiry, odmítnutí cizí session/anon RPC. Výpočty a původní SQL/cookies/SMTP/rate limits také zůstávají pokryté.
- Build a oficiální Vercel Node builder ověřily všech 10 endpointů, včetně .ts-import mutační regrese. Žádné cloudové deploymenty nebo externí servisní volání z těchto kontrol.
- Browser test neaktivního skeneru nejprve nastavil init script, ale hash-only goto nedělalo nový dokument: opravena testovací navigace na skutečný nový URL dokument, bez změny funkční logiky.
- Nový pseudo-element test zachytil ABC na širších displejích: první CSS pravidlo mělo stejnou specificity jako pozdější inherited pravidlo. Doplněna vyšší specificity (.editorial.original-editorial), bez plošného important nebo změny archivních stylů.
- Browser fixtures aktualizovány: nový email-only funnel, automatický token/focus, serverově odmítnuté přímé URL, hash odstraněn, uložený výběr a částka, update/reload/reopen, neplatný/expirující/spotřebovaný token bez session; neveřejné kalkulačky testují přístup až po serverovém read. Tyto fixtures nejsou skutečné doručení nebo vzdálený databázový test.

Finální celý browser suite prošel po footer atribuci a bezpečném návratu na existující formulář při chybě odkazu. Kontroly zahrnují přesné texty/ABC pseudo-content na 320–1440 px, neaktivní sken, automatické aktivní otevření, odmítnutí použitého odkazu po odstranění cookie, variant URL bez přístupu, obnovení/uložení a všechny původní privacy/admin/source/calculator scénáře. Prohlédnut mobilní screenshot veřejné hero/intro/cookie lišty, bez overflow a bez staré designové navigace. Následná kontrola cache opravila oddělení souběžných požadavků dvou ID: starší odpověď nesmí přepsat cache nového srovnání. Nový test potvrzuje odpovědi v opačném pořadí. Nejnovější lint/typecheck, 60/60 testů a build prošly; poslední nový test navíc odmítá nepodporovaný marketingConsent=true dříve než uloží kontakt nebo odešle mail. cílená browser kontrola kalkulačky po této změně prošla na 320/390/1440 px včetně null/outage a jediného requestu při změnách vstupů. Oficiální builder všech 10 funkcí byl také zopakován po serverových změnách. Read-only HEAD Preview skončil URLError, živé nasazení proto neprohlašujeme za ověřené. Git autor ověřen v lokální konfiguraci RostislavHanza / noreply; fetch větve odpovídal HEAD (0/0), globální nastavení se nemění. Diff --check a sken proti dostupným secret hodnotám bez shod. Migraci 007 musí samostatně aplikovat správce pro kompletní návrat přes e-mail; žádné reálné odesílání neproběhlo.

Závěrečná kontrola všech 10 oficiálních Vercel artefaktů zopakována po finálním serverovém guardu a prošla. Commit/push je autorizovaný závěrečný krok pouze na design-exploration. Žádná vzdálená migrace, skutečný e-mail, změna cloudových hodnot nebo ruční deployment.
