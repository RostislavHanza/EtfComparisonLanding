# Plán landing page

Aktualizace 10. října 2026 podle schváleného funkčního MVP a následné změny poskytovatele na Gmail SMTP. Nahrazuje původní omezení na 2–3 ETF a uzamčené porovnání před e-mailem. Termín předání: 16. října 2026.

## Cíl a rozsah MVP

Český mobilní návštěvník z reklamy sestaví užitečné srovnání ETF a získá e-mailem odkaz na uložený interaktivní přehled. Primární metrika je potvrzený přístup ke schránce vůči měřeným návštěvám. Bez účtů, plateb, živých cen, výnosových predikcí, PDF a složitého screeneru.

Rozšiřitelný katalog přibližně 15–20 skutečných ETF na NYSE Arca, hledání tickeru/názvu, porovnání 2–5. Neověřené fondy se nezveřejňují. Aktuální implementace neobsahuje produkční seed; ověřený katalog musí být doplněn validovaným importem. Původní Editorial zůstává výchozí, archivní návrhy jsou jasně označená dema.

## Pořadí sekcí a konverzní cesta

1. **Redakční úvod:** příslib porovnání a CTA ke srovnávači; e-mailový formulář není v úvodní obrazovce.
2. **Výběr a hledání:** předvybrané dvě dostupné ETF, možnost změnit výběr na 2–5, jasný souhrn a datum ověření.
3. **Porovnání:** index, expense ratio, dividendy, charakteristika, data kontroly/platnosti a primární zdroje. Veřejná ověřená metadata pocházejí z API, nikoli demonstračního seed souboru.
4. **Kalkulačka:** číselné pole/posuvník Kč, orientační roční náklady v tabulce a jednoduchém grafu. Částka × expense ratio / 100. Bez brokera, konverzí, daní a změn hodnoty; nejde o výnos ani samostatnou fakturu fondu.
5. **E-mail až po nastavení:** „Vaše srovnání je připravené“, samostatný nepovinný marketingový souhlas, informace o správci/retenci; odeslání odlišené od doručení.
6. **Potvrzení a návrat:** e-mail obsahuje pouze unikátní odkaz. Tlačítko potvrdí přístup ke schránce, server vydá session a obnoví výběr i částku. Úpravy lze uložit. Samotný GET náhledu zprávy nespotřebuje token.
7. **FAQ, souvislosti a patička:** PRIIPs/KID, investiční rizika, zdroje, ochrana údajů a volitelné měření.

Mobil od 320 px, bez horizontálního přetékání, čitelné labely, klávesnice, focus, 44px dotykové cíle, srozumitelné stavy načítání/chyb. Upozornění na omezenou dostupnost amerických ETF pro retail v EU před formulářem; nejde o UCITS alternativy ani doporučení.

Reklama → výběr → kalkulačka → e-mail → odeslání odkazu → explicitní potvrzení → uložený přehled. Marketing není podmínkou vyžádaného doručení. Přístupový odkaz neobsahuje osobní údaje. Jednorázové potvrzení platí 7 dní, session v potvrzujícím prohlížeči 30 dní. První potvrzení může být na jiném zařízení; po použití odkazu/ztrátě session MVP nabídne novou žádost, bez automatické obnovy starého přehledu.

## Technické řešení

- React, Vite, TypeScript strict, Tailwind; minimální doplnění současného redakčního frontendu.
- Vercel Functions: katalog `GET /api/catalog`, vytvoření `POST /api/comparisons`, potvrzení `POST /api/access`, chráněné čtení/úpravy `GET/PUT /api/comparison?id=…`, měření `POST /api/events`, chráněné ověření SMTP a denní údržba.
- Supabase: ověřená ETF, kontakty, srovnání/snapshot, oddělené consent records, session, e-mailové stavy, funnel a atomický rate limiter. Migrace, RLS, zákaz anon/authenticated přímých operací i privilegovaných RPC. Secret/service_role pouze na serveru.
- Server ověřuje 2–5 jedinečných tickerů, publikaci/čerstvost dat, částku, e-mail, typ souhlasu, honeypot, Origin a velikost JSON. HMAC klíče limiteru neobsahují čitelnou IP/adresu.
- 256bitové tokeny a session: v DB pouze hash; cookie HttpOnly, Secure na HTTPS, SameSite=Lax. Osobní uložená srovnání nejsou přístupná jen se znalostí ID.
- Gmail SMTP přes Nodemailer na serveru: TLS, validované environment variables, HTML/text zpráva, časové limity. Stav sent znamená přijetí SMTP serverem, nikoli doručení; Gmail neposkytuje spolehlivý delivery webhook a doručení zůstává neověřené do kontroly schránky. confirmed_at samostatně po vědomém tlačítku. Při chybě bezpečný log a pravdivá odpověď. Globálně nejvýše 100 pokusů o odeslání denně pro malé MVP, dále IP/adresní limity. SMTP nemá provider idempotency key: po síťové nejistotě může nový pokus vytvořit další zprávu. Fronta/retry odloženy.
- Oddělené preview prostředí a testovací adresy; žádné tajné klíče ve VITE_* nebo Gitu. `.env.example` a přesný postup v [SETUP.md](SETUP.md).
- Retence: nepotvrzené srovnání 30 dní, potvrzené 90 dní od úpravy + následující denní cleanup. Kaskádově odstranit závislá data a osiřelé kontakty. Provozovatel schválí informační texty a zajistí funkční úklid i žádosti subjektů údajů.

## ETF a aktualizace

Primární zdroje: nyse.com, ssga.com, investor.vanguard.com, ishares.com a oficiální Vanguard dokumenty. Pro každé pole URL, platnost, datum kontroly a doklad lidského ověření; kontrolor a schválené podmínky použití. [DATA_SOURCES.md](DATA_SOURCES.md) popisuje validovaný dry-run a atomický import. Schválená doména sama nepotvrzuje údaje ani licenci.

Týdenní ruční kontrola je vhodná pro index/nákladovost/dividendovou politiku. Nová srovnání nezahrnují fond s ověřením starším než 14 dní. Uložená srovnání zachovávají snapshot a datum; uložením změn přijmou aktuální data. Denní aktualizace má smysl až pro budoucí dynamické údaje, které MVP nesbírá.

Předchozí ověřování primárních zdrojů blokovala HTTP 403; nově je ověřené dokumentované TickerInside API a jeho podmínky. Nevymýšlet data ani dostupnost API. Původní MVP automatický import odložilo. Po následném schválení TickerInside je připravený chráněný import jeho dostupných polí do kandidátní vrstvy a aktualizace nákladovosti pouze výslovně schválených publikovaných fondů. Index/dividendy/popis nadále doplnit z primárních zdrojů. Týdenní ETF Cron je připraven pro budoucí Production; v Preview se spouští ručně. Denní retenční Cron zůstává. Stav a omezení viz DATA_SOURCES.md.

## Implementační kroky a ověření

1. Datový model, schválené zdroje, validovaný ruční import.
2. Vercel API a Supabase transakce, RLS, bezpečný přístup a rate limiting.
3. Gmail SMTP HTML/text zpráva, bezpečné chybové stavy, oddělené přijetí SMTP a potvrzení; skutečné doručení ověřit ve schránce.
4. API frontend: hledání, 2–5 ETF, tabulka/graf, e-mail, obnovení a uložení.
5. Volitelné consented měření, testy SQL/validace/mail chyb/tokenů, mobilní browser testy, dokumentace.

Build a typecheck průběžně. PostgreSQL testy skutečných migrací na PGlite; browser fixtures nejsou produkční data. Živý Supabase, skutečné e-mailové doručení a Vercel nasazení vyžadují nastavení a test podle SETUP.md. Bez tohoto testu ani ověřeného katalogu nepovažovat produkci za hotovou. Cílit na LCP ≤2,5 s, INP ≤200 ms, CLS ≤0,1; plný WCAG/performance audit je samostatná předspouštěcí kontrola.

## Dvě varianty reklamních textů

- **A — přehlednost:** „Ztrácíte se v amerických ETF? Vyberte si fondy a získejte přehled nákladů, zaměření a rizik v češtině. Uložte si vlastní přehled přes odkaz e-mailem.“ CTA: „Vybrat ETF“.
- **B — praktické rozdíly:** „Podobné ETF, různé náklady a dividendy. Porovnejte vybraná ETF z NYSE Arca a zjistěte, na co si dát pozor jako český investor. Uložte si vlastní přehled přes odkaz e-mailem.“ CTA: „Získat srovnání“.

Použít až po ověření obsahu nabídky a burzy. Doprovodný text upozorní, že dostupnost amerických ETF pro český retail může být omezená. Obě reklamy vedou na stejnou stránku s odpovídajícím příslibem; původ rozlišit povolenými UTM hodnotami. Bez slibů výnosu a bez tvrzení o vhodnosti investice.

## Měření konverzní cesty

| Událost | Kdy vzniká | Vyhodnocení |
| --- | --- | --- |
| `landing_view` | První zobrazení v měřené návštěvě | Výchozí počet návštěv podle kampaně |
| `comparison_interacted` | První změna výběru ETF nebo řazení | Podíl návštěv s interakcí |
| `comparison_configured` | Pokračování od kalkulačky k e-mailu | Dokončené nastavení |
| `form_started` | První práce s e-mailovým polem | Přechod k formuláři |
| `lead_submit_attempt` | Pokus o odeslání | Diagnostika tření a validace |
| `lead_accepted` | Server přijme platnou žádost | Přijaté kontakty; oddělit duplicity |
| `email_sent` | Gmail SMTP přijme příjemce/zprávu a server uloží stav | Odeslání, nikoli doručení |
| `email_confirmed` | Server poprvé platně potvrdí adresu | Hlavní konverze |
| `comparison_opened` | Server úspěšně zpřístupní srovnání | Skutečné převzetí hodnoty |

Měřit rovněž agregované chyby validace a doručování. Pokus o odeslání není kontakt a kontakt není potvrzená adresa. Konfirmaci a přijetí zaznamenává server idempotentně; refresh je nesmí započítat znovu. Návštěvník může formulář odeslat bez interakce, proto ji nevyžadovat pro vstup do funnelu.

Pro propojení použít náhodné ID návštěvy a pevně povolené hodnoty kampaně/varianty, uložené s kontaktem; bez e-mailů, tokenů a volného textu v analytice. Potvrzení na jiném zařízení přiřadit podle uloženého kontaktu. Vybrat jediný měřicí nástroj; nepovinné sledování spouštět jen s odpovídajícím souhlasem. Pseudonymní ID není automaticky anonymní údaj. U neměřených návštěv vykázat mezeru v atribuci a nepočítat všechny serverové konfirmace proti pouze souhlasícím návštěvám.

Report: návštěva → interakce, návštěva → přijatý kontakt, přijatý kontakt → potvrzení a návštěva → potvrzení. Počítat podle kohorty návštěv s oknem 7 dní na potvrzení; výsledky mladších kohort jsou předběžné. Odlišit testovací provoz, roboty a opakované kontakty.

## Pracovní odhad konverze

Pro studenou mobilní reklamu plánovat **3–7 % návštěv na přijatý kontakt** a **60–80 % přijatých kontaktů na potvrzení**, tedy přibližně **1,8–5,6 % návštěv na potvrzený kontakt**. Základní scénář: 1 000 měřených návštěv → 50 kontaktů → 35 potvrzení (3,5 %).

Jde o pracovní předpoklad pro plánování, nikoli naměřený výsledek nebo doložený oborový benchmark. Podporuje jej konkrétní nabídka, krátký formulář a vlastní výběr ETF; snižuje jej studená návštěvnost, další krok ve schránce a omezená dostupnost amerických ETF. Odhad aktualizovat po první kampani a dozrání potvrzovacího okna. Bez ceny za návštěvu nelze odhadnout cenu kontaktu; orientačně cena potvrzeného kontaktu = cena návštěvy / konverze na potvrzení.

## A/B hypotézy podle priority

1. **Příslib v úvodu:** konkrétní „Náklady, dividendy a rizika vybraných ETF“ zvýší potvrzení oproti obecnému „Srovnání ETF zdarma“, protože lépe vysvětluje hodnotu. Měnit pouze titulek; ostatní prvky držet stejné.
2. **Výchozí výběr:** předvybraná dvojice ETF zvýší konverzi oproti prázdnému výběru, protože usnadní začátek. V obou variantách lze výběr změnit a pokračovat bez další interakce.
3. **Očekávání u formuláře:** explicitní vysvětlení „Potvrďte adresu a otevřete své srovnání“ zvýší podíl potvrzení oproti stručnému vysvětlení doručení. Obě varianty musí pravdivě uvádět nutnost potvrzení; přijaté kontakty sledovat jako vedlejší metriku.

Testovat postupně po spuštění, jednu změnu najednou, s náhodným stabilním rozdělením 50/50. Primární metrika všech testů: potvrzené kontakty / měřené návštěvy; ochranné metriky: chyby, doručitelnost a rychlost stránky. Před testem určit minimální relevantní efekt a potřebný vzorek podle skutečné výchozí konverze. Bez dostatku návštěv a dokončeného potvrzovacího okna nevyhlašovat vítěze; termín dodání není termín statistického závěru.

## Dokumentace a termín 16. října 2026

Rozsah do termínu: jedna landing page, vyhledávání v ověřeném katalogu a výběr 2–5 ETF, ověřená serverová data, jeden formulář, potvrzení e-mailu, chráněné srovnání a základní funnel. Bez vlastního screeneru, účtů, PDF generátoru, živých cen a vlastní platformy A/B testů. Pro omezení frekvence využít Supabase nebo podporované řešení poskytovatele; nepřidávat samostatnou infrastrukturu bez potřeby.

- **9.–10. října:** dokončit plán, vybrat a ověřit data; určit provozovatele, doménu a e-mailovou službu. Implementace byla schválena; chybějící služby a data zůstávají podmínkou spuštění.
- **11.–12. října:** mobilní stránka, interaktivní výběr a obsah.
- **13.–14. října:** Supabase, serverové endpointy, potvrzení, chráněný přístup a měření.
- **15. října:** test celé cesty, mobilní a přístupnostní kontrola, opravy; ověření dat a doručování.
- **16. října:** kontrola dokumentace a předání; publikace jen při autorizaci a splnění kontrol.

Harmonogram předpokládá včasné zadání implementace a přístupy ke službám. Chybějící ověřená data, funkční potvrzování nebo ochrana srovnání blokují produkční spuštění; nezkracovat je kvůli termínu. A/B experimenty a kalibrace konverzního odhadu proběhnou až s reálnou návštěvností.

**README:** při implementaci nahradit současný nadpis vysvětlením pořadí sekcí (příslib → vlastní výběr → hodnota nabídky → důvěra → CTA), strategie potvrzeného kontaktu, technického toku a místního spuštění. Uvést konfiguraci bez tajných hodnot, zdroje ETF, provedené testy a aktuální nedostatky: omezení dostupnosti ETF, ruční aktualizace dat, závislost na doručování, mezery měření a dosud neověřené konverzní předpoklady. Důsledně rozlišit plánované a hotové funkce.

**`ai-log/`:** vést datované Markdown záznamy od plánování po implementaci. Uchovat skutečné použité prompty a jejich pořadí, stručný popis výsledku, provedené kontroly se zdroji/příkazy, nalezené chyby, opravy a neověřené části. Citlivé údaje redigovat. Nezaměňovat plán kontrol za jejich provedení ani zpětně nevymýšlet prompty. Evidovat zejména ověření finančních dat a schválené změny rozsahu: veřejné porovnání a chráněné uložené srovnání. README i logy jsou součástí předání, nikoli volitelný dodatek.

Souhlas s nepovinnou analytikou řeší lišta Nastavení soukromí, nikoli e-mailový formulář. Stejně dostupné přijetí/odmítnutí, opětovné otevření a bezpečné odvolání; marketing zůstává samostatný. Implementovaná měření a interpretace souhlasících kohort jsou v `docs/ANALYTICS.md`.
