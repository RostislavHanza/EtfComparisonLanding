# Plán landing page

## Cíl a rozsah MVP

Získat e-mail českého retailového investora přicházejícího z mobilní reklamy výměnou za stručné, srozumitelné srovnání ETF obchodovaných na NYSE Arca. Primární metrika: počet úspěšně potvrzených kontaktů vůči návštěvám stránky. Sekundárně sledovat odeslání formuláře, chyby a dokončení potvrzení e-mailu.

Jedna česká landing page, jeden hlavní formulář a jedna nabídka. Bez účtů, plateb, personalizovaných doporučení, živých cen a komplexního screeneru. Před implementací ověřit konkrétní ETF, licenci a zdroje dat, podobu srovnání a poskytovatele e-mailů.

## Struktura stránky a mobilní UX

1. **Úvod:** konkrétní příslib („Porovnejte vybraná americká ETF na jednom místě“), krátké vysvětlení, co návštěvník získá, a CTA „Získat srovnání zdarma“. Úvodní CTA posouvá na interaktivní výběr a navazující formulář. Jasně slíbit doručení až po potvrzení e-mailu. Text sladit s reklamou.
2. **Interaktivní výběr:** nabídnout 3–5 ověřených ETF a umožnit vybrat 2–3 k porovnání; zobrazit pouze název, ticker a zaměření. Volitelně zvolit pořadí podle nákladů nebo dividend. Průběžně ukázat souhrn výběru a CTA „Poslat mé srovnání“. Nezobrazovat vlastní srovnávací údaje ani pořadí před potvrzením. Výchozí dvojice a možnost přeskočit výběr zabrání zbytečné překážce na mobilu.
3. **Co je ve srovnání:** náklady, diverzifikace, distribuce dividend a praktická omezení pro českého investora. Stručně vysvětlit TER a měnové riziko. U dat uvést zdroj a datum aktualizace.
4. **Důvěryhodnost a FAQ:** skutečný provozovatel, metodika, dostupnost ETF v EU, co přijde e-mailem a jak se odhlásit. Bez smyšlených referencí a garancí výnosu.
5. **Závěrečné CTA a patička:** odkaz na hlavní formulář, kontakt, ochrana osobních údajů a upozornění, že jde o vzdělávací obsah, nikoli investiční doporučení.

Použít jednu hlavní konverzní akci, čitelné písmo, výrazný kontrast a dotykové cíle alespoň 44 × 44 px. Opakované CTA posouvá na stejný formulář. Vyhnout se vyskakovacím oknům, automatickým videím a rušivým animacím.

## Konverzní cesta

Reklama → úvod → výběr ETF → zadání e-mailu → zpráva „Zkontrolujte svou schránku“ → potvrzení adresy → zpřístupnění užitečného srovnání vybraných ETF. Výběr uložit s kontaktem; potvrzení funguje i na jiném zařízení. Lead magnet je mobilní HTML srovnání s náklady, zaměřením, dividendami, riziky a zdroji. PDF odložit. Potvrzovací e-mail neobsahuje samotné srovnání. Server vydá přístup až po potvrzení; chráněná data nesmí být v předem staženém klientském bundle ani veřejném statickém souboru.

Formulář má pouze e-mail (`type=email`, autocomplete), vysvětlení doručení a odkaz na informace o zpracování údajů. Další marketing vyžaduje samostatný, nepředvyplněný a nepovinný souhlas; jeho odmítnutí nebrání doručení srovnání. Provozovatel před spuštěním určí právní základ, retenční dobu a finální znění informačních textů. Potvrzení adresy není náhradou marketingového souhlasu.

Zobrazit průběh odesílání, srozumitelnou chybu s možností opakovat pokus a bezpečnou stejnou odpověď pro nové i již evidované adresy. Neukazovat stav registrace cizí adresy. Úspěch vykázat až po přijetí požadavku serverem; potvrzený kontakt měřit samostatně.

## Obsahová omezení

Ověřit burzu každého instrumentu: mnoho amerických ETF je obchodováno na NYSE Arca, nikoli přímo na NYSE. Používat přesné označení. Americká ETF mohou být českému retailu nedostupná kvůli požadavkům PRIIPs/KID; tuto informaci uvést viditelně před formulářem. Případné UCITS alternativy jasně oddělit od srovnávaných amerických ETF. Nezaměňovat „nejlepší“ s vhodností pro konkrétního investora a neslibovat budoucí výnosy.

## Technické řešení

- **Frontend:** React, Vite, TypeScript v strict režimu a Tailwind. Staticky sestavitelná stránka na Vercelu; minimum knihoven, lokální optimalizované obrázky a fonty. Veřejný seznam ETF v typovaných datech; úplné srovnání v serverovém datovém souboru se zdroji a datem ověření. Bez závislosti na placeném burzovním API v MVP.
- **Příjem kontaktů:** serverová Vercel Function `/api/leads` validuje e-mail a souhlas, omezuje frekvenci požadavků a velikost těla, kontroluje původ a honeypot. Limiter musí fungovat napříč instancemi, nikoli jen v paměti procesu. CAPTCHA přidat až při prokázaném zneužívání.
- **Supabase:** tabulka kontaktů s interním ID, normalizovaným unikátním e-mailem, stavem potvrzení, časy vytvoření a potvrzení, verzí informačního textu a případným marketingovým souhlasem s časem a verzí. Minimální retenční data; neukládat IP dlouhodobě bez konkrétního důvodu. Zapnout RLS, nepovolit veřejné čtení ani zápis. Privilegovaný klíč pouze na serveru, nikdy ve frontendových `VITE_*` proměnných.
- **E-mail:** zvolená transakční služba doručí potvrzení a srovnání; Supabase samo nezajišťuje marketingové doručování. Token potvrzení je náhodný, časově omezený a jednorázový; v databázi pouze hash. Navrhnout idempotentní odesílání a obnovu při selhání e-mailové služby, aby uložený kontakt nezůstal bez zprávy. Doména musí mít SPF/DKIM a vhodné DMARC.
- **Nasazení:** oddělit lokální, preview a produkční konfiguraci; preview nesmí zapisovat do produkce ani rozesílat skutečné kampaně. Tajné klíče ve Vercel/Supabase nastavení, v repozitáři pouze `.env.example` s názvy. Doménu, poskytovatele e-mailů a region ukládání potvrdit před produkční integrací.
- **Měření:** nejprve jednoduché anonymní události bez e-mailů v analytice, URL a logách. Reklamní pixely a nepovinné cookies načítat až po odpovídajícím souhlasu. Ověřit SEO metadata, český jazyk a náhled při sdílení; konverzní obsah nesmí záviset na externím sledování.

## Postup a ověření

1. Schválit nabídku, ověřené ETF a české texty včetně dostupnosti pro retail.
2. Vytvořit statickou mobilní stránku a formulář s jasnými stavy.
3. Přidat serverový endpoint, databázi, potvrzení adresy a doručení srovnání.
4. Ověřit mobilní šířky od 320 px, klávesnici, čtečku obrazovky, kontrast a slabší připojení. Cílit na LCP ≤ 2,5 s, INP ≤ 200 ms a CLS ≤ 0,1; laboratorní měření před spuštěním, reálná data až po získání provozu.
5. Spustit build a typecheck, otestovat validaci, souhlasy, duplicity, expiraci tokenů, omezení frekvence a selhání doručování. V testovacím prostředí ověřit celou cestu od formuláře po e-mail a srovnání.
6. Před publikací ověřit kontaktní a právní texty, retenční pravidla, produkční tajné proměnné a odesílací doménu. Spuštění reklam a produkční nasazení vyžaduje samostatné zadání.

## Ověření skutečných údajů ETF

Před tvorbou obsahu vybrat 3–5 skutečných ETF a ověřit burzu v oficiálním burzovním seznamu a údaje ve factsheetu, prospektu nebo na produktové stránce emitenta. Ke každému poli uchovat URL zdroje, datum platnosti údaje a datum kontroly. Nákladovost přebírat s přesným názvem z dokumentace emitenta; nezaměňovat ji automaticky s evropským TER. U proměnlivých údajů používat stejné rozhodné datum nebo rozdíl výslovně vysvětlit. Výnosová data v MVP vynechat, pokud nelze ověřit srovnatelnou metodiku.

AI výstup není zdroj. Druhá kontrola musí porovnat publikované hodnoty s primárním dokumentem. Neověřené pole vynechat a uvést omezení, nikoli doplnit odhad. Tento plán zatím neobsahuje ověřený dataset a netvrdí, že konkrétní ETF již byla prověřena.

## Dvě varianty reklamních textů

- **A — přehlednost:** „Ztrácíte se v amerických ETF? Vyberte si fondy a získejte přehled nákladů, zaměření a rizik v češtině. Srovnání zdarma po potvrzení e-mailu.“ CTA: „Vybrat ETF“.
- **B — praktické rozdíly:** „Podobné ETF, různé náklady a dividendy. Porovnejte vybraná ETF z NYSE Arca a zjistěte, na co si dát pozor jako český investor. Srovnání zdarma po potvrzení e-mailu.“ CTA: „Získat srovnání“.

Použít až po ověření obsahu nabídky a burzy. Doprovodný text upozorní, že dostupnost amerických ETF pro český retail může být omezená. Obě reklamy vedou na stejnou stránku s odpovídajícím příslibem; původ rozlišit povolenými UTM hodnotami. Bez slibů výnosu a bez tvrzení o vhodnosti investice.

## Měření konverzní cesty

| Událost | Kdy vzniká | Vyhodnocení |
| --- | --- | --- |
| `landing_view` | První zobrazení v měřené návštěvě | Výchozí počet návštěv podle kampaně |
| `comparison_interacted` | První změna výběru ETF nebo řazení | Podíl návštěv s interakcí |
| `form_started` | První práce s e-mailovým polem | Přechod k formuláři |
| `lead_submit_attempt` | Pokus o odeslání | Diagnostika tření a validace |
| `lead_accepted` | Server přijme platnou žádost | Přijaté kontakty; oddělit duplicity |
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

Rozsah do termínu: jedna landing page, jednoduchý výběr 2–3 ETF, ověřená serverová data, jeden formulář, potvrzení e-mailu, chráněné srovnání a základní funnel. Bez vlastního screeneru, účtů, PDF generátoru, živých cen a vlastní platformy A/B testů. Pro omezení frekvence využít Supabase nebo podporované řešení poskytovatele; nepřidávat samostatnou infrastrukturu bez potřeby.

- **9.–10. října:** dokončit plán, vybrat a ověřit data; určit provozovatele, doménu a e-mailovou službu. Vývoj začne až po samostatném zadání.
- **11.–12. října:** mobilní stránka, interaktivní výběr a obsah.
- **13.–14. října:** Supabase, serverové endpointy, potvrzení, chráněný přístup a měření.
- **15. října:** test celé cesty, mobilní a přístupnostní kontrola, opravy; ověření dat a doručování.
- **16. října:** kontrola dokumentace a předání; publikace jen při autorizaci a splnění kontrol.

Harmonogram předpokládá včasné zadání implementace a přístupy ke službám. Chybějící ověřená data, funkční potvrzování nebo ochrana srovnání blokují produkční spuštění; nezkracovat je kvůli termínu. A/B experimenty a kalibrace konverzního odhadu proběhnou až s reálnou návštěvností.

**README:** při implementaci nahradit současný nadpis vysvětlením pořadí sekcí (příslib → vlastní výběr → hodnota nabídky → důvěra → CTA), strategie potvrzeného kontaktu, technického toku a místního spuštění. Uvést konfiguraci bez tajných hodnot, zdroje ETF, provedené testy a aktuální nedostatky: omezení dostupnosti ETF, ruční aktualizace dat, závislost na doručování, mezery měření a dosud neověřené konverzní předpoklady. Důsledně rozlišit plánované a hotové funkce.

**`ai-log/`:** vést datované Markdown záznamy od plánování po implementaci. Uchovat skutečné použité prompty a jejich pořadí, stručný popis výsledku, provedené kontroly se zdroji/příkazy, nalezené chyby, opravy a neověřené části. Citlivé údaje redigovat. Nezaměňovat plán kontrol za jejich provedení ani zpětně nevymýšlet prompty. Evidovat zejména ověření finančních dat člověkem či kontrolou primárního zdroje a opravu původního návrhu veřejné ukázky na zpřístupnění až po potvrzení e-mailu. README i logy jsou součástí předání, nikoli volitelný dodatek.
