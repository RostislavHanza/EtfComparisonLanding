// Isolated server fixtures: no real database writes, email or financial data.
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
const base=process.env.TEST_BASE_URL??'http://127.0.0.1:4173'
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||undefined,args:['--no-sandbox']})
const funds=Array.from({length:20},(_,i)=>({ticker:`TEST${i}`,name:`TEST ONLY Fund ${i}`,exchange:'NYSE Arca',index:'TEST ONLY',expenseRatioPercent:.03+i*.01,dividends:'TEST',description:'TEST ONLY',verifiedAt:new Date().toISOString(),dataAsOf:new Date().toISOString(),sources:[]}))
const options=funds.map(({ticker,name,verifiedAt})=>({ticker,name,verifiedAt}))
const privacy={controllerName:'TEST ONLY',controllerContact:'test@example.invalid',retentionDays:90}
const id='11111111-1111-4111-8111-111111111111',token='t'.repeat(43),session='s'.repeat(43)
const context=await browser.newContext({reducedMotion:'reduce'}),page=await context.newPage()
let authorized=false,posts=[],accesses=0,failSend=false,pendingSend=false,linkRevoked=false,events=[]
let saved={id,tickers:['TEST1','TEST3','TEST4'],amountCzk:100000,funds:[funds[1],funds[3],funds[4]]}
const apiRoutes=async route=>{
 const req=route.request(),url=new URL(req.url()),data=['POST','PUT'].includes(req.method())?req.postDataJSON():null
 const validSession=authorized&&((await req.allHeaders()).cookie??'').includes(`etf_session=${session}`)
 if(url.pathname==='/api/catalog'){if(url.searchParams.has('comparison')&&!validSession){await route.fulfill({status:401,json:{error:'TEST unauthorized'}});return}await route.fulfill({json:{funds:url.searchParams.has('comparison')?funds:options,privacy}})}
 else if(url.pathname==='/api/access'){accesses++;if(data.token!==token||linkRevoked){await route.fulfill({status:410,json:{error:'TEST invalid or expired token'}});return}authorized=true;await route.fulfill({headers:{'Set-Cookie':`etf_session=${session}; HttpOnly; SameSite=Lax; Path=/`},json:{id}})}
 else if(url.pathname==='/api/comparison'){if(!validSession){await route.fulfill({status:401,json:{error:'TEST unauthorized'}});return}if(req.method()==='PUT')saved={...saved,...data,funds:data.tickers.map(t=>funds.find(f=>f.ticker===t))};await route.fulfill({json:saved})}
 else if(url.pathname==='/api/comparisons'){if(pendingSend){await route.fulfill({status:202,json:{status:'pending'}});return}if(failSend){await route.fulfill({status:503,json:{error:'TEST mail failed'}});return}posts.push(data);await route.fulfill({json:{status:'sent'}})}
 else if(url.pathname==='/api/events'){events.push(data);await route.fulfill({json:{ok:true}})}
 else throw Error('Unexpected route')
}
await page.route('**/api/**',apiRoutes)
try{
 for(const width of [320,360,390,393,768,1100,1440]){
  await page.setViewportSize({width,height:900});await page.goto(base);await page.locator('.real-etf-selection input').first().waitFor()
  assert.equal(await page.locator('h1').innerText(),'Americká ETF\nKalkulačka výnosů')
  if(width<700)assert.ok(await page.locator('.hero h1').evaluate(h=>{
   const first=document.createRange(),second=document.createRange();first.selectNodeContents(h.querySelector('span'));second.selectNodeContents(h.querySelector('em'))
   const bounds=second.getBoundingClientRect(),headingSize=parseFloat(getComputedStyle(h).fontSize),subheadingSize=parseFloat(getComputedStyle(h.querySelector('em')).fontSize)
   return first.getClientRects().length===1&&second.getClientRects().length===1&&h.scrollWidth<=h.clientWidth
    &&bounds.left>=20&&innerWidth-bounds.right>=32
    &&Math.abs(headingSize-Math.min(innerWidth*.12,46.4))<.01&&Math.abs(subheadingSize/headingSize-.92)<.001
  }))
  assert.equal(await page.locator('.editorial-intro').evaluate(e=>getComputedStyle(e).borderTopWidth),await page.locator('.selection-section').evaluate(e=>getComputedStyle(e).borderTopWidth))

  assert.equal(await page.locator('.editorial-intro li').count(),2)
  assert.equal(await page.locator('.editorial-intro').innerText(),'01\nVyberte ETF pro porovnání\n02\nZadejte Email pro zaslání osobní interaktivní kalkulačky')
  assert.equal(await page.locator('.hero-description,.hero-cta,.hero-footnote,.hero-art').count(),0)
  assert.equal(await page.locator('.hero').evaluate(e=>getComputedStyle(e,'::after').content),'none')
  assert.equal(await page.locator('.editorial-intro h2,.editorial-intro .risk-note').count(),0)
  assert.equal(await page.locator('footer .data-attribution a[href="https://creativecommons.org/licenses/by/4.0/"]').count(),1)
  assert.equal(await page.locator('#investment,.profit-comparison,.historical-section,.comparison-table').count(),0)
  assert.equal(await page.locator('#email').count(),1);assert.equal(await page.locator('.editorial-email form input:not([name=website])').count(),1)
  assert.equal(await page.locator('.real-etf-option').count(),6)
  assert.equal(await page.locator('.real-etf-option small').count(),6);assert.ok(!(await page.locator('.real-etf-selection').innerText()).includes('Ověřeno'))
  if(width<700){const boxes=await page.locator('.real-etf-option').evaluateAll(es=>es.slice(0,2).map(e=>e.getBoundingClientRect().toJSON()));assert.equal(boxes[0].y,boxes[1].y);assert.ok(boxes[1].x>boxes[0].x)}
  assert.equal(await page.locator('.faq h2').innerText(),'Často kladené dotazy');assert.equal(await page.locator('.faq h1,.faq h2,.faq h3,.faq .eyebrow').count(),1)
  assert.equal(await page.locator('.hero .eyebrow').count(),0)
  assert.equal(await page.locator('.editorial-intro li').last().evaluate(e=>getComputedStyle(e).borderBottomWidth),'0px');assert.equal(await page.locator('.selection-section').evaluate(e=>getComputedStyle(e).borderTopWidth),'3px')
  assert.equal(await page.locator('.selection-section .eyebrow').textContent(),'01 / Výběr ETF')
  assert.equal(await page.locator('.comparator-content').evaluate(e=>getComputedStyle(e).marginTop),'16px')
  assert.equal(await page.locator('.editorial-intro').evaluate(e=>getComputedStyle(e).paddingBottom),'0px');assert.equal(await page.locator('.hero').evaluate(e=>getComputedStyle(e).paddingBottom),'16px')
  const benefits=page.getByRole('region',{name:'Co získáte ve svém srovnání?',exact:true})
  assert.deepEqual(await benefits.locator('h3').allTextContents(),['Odhadovaný zisk','Historický vývoj','Detailní srovnání','Vlastní přehled na e-mail'])
  assert.deepEqual(await benefits.locator('p').allTextContents(),['Spočítejte si výsledek podle vlastní částky, horizontu a předpokládaného výnosu.','Porovnejte historickou výkonnost vybraných ETF v grafu.','Prohlédněte si nákladovost, sledované indexy a další parametry fondů.','Získejte odkaz ke svému srovnání, ke kterému se můžete vracet.'])
  assert.equal(await benefits.locator('button,a,input').count(),0)
  assert.equal(await page.locator('.comparison-benefits').count(),1)
  assert.ok(await page.evaluate(()=>{
   const hero=document.querySelector('.hero').getBoundingClientRect(),benefits=document.querySelector('.comparison-benefits').getBoundingClientRect(),steps=document.querySelector('.editorial-intro').getBoundingClientRect(),selection=document.querySelector('.selection-section').getBoundingClientRect()
   const style=getComputedStyle(document.querySelector('.editorial-intro'))
   if(innerWidth<700){
    const heading=document.querySelector('#benefits-title'),range=document.createRange();range.selectNodeContents(heading)
    return benefits.top-hero.bottom>=0&&benefits.top-hero.bottom<=24&&steps.top-benefits.bottom>=0&&steps.top-benefits.bottom<=24&&selection.top-steps.bottom>=0&&selection.top-steps.bottom<=24&&style.borderTopWidth===getComputedStyle(document.querySelector('.selection-section')).borderTopWidth&&range.getClientRects().length===1&&heading.scrollWidth<=heading.clientWidth
   }
   return steps.left>hero.left&&benefits.top>=hero.bottom&&benefits.top>=steps.bottom&&selection.top-benefits.bottom>=0&&selection.top-benefits.bottom<=24
  }))
  const items=await benefits.locator('.comparison-benefits-grid>div').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()))
  assert.equal(items[0].y,items[1].y);assert.equal(items[2].y,items[3].y);assert.ok(items[2].y>items[0].y)
  if(width===320||width===1440)await page.screenshot({path:`.cache/benefits-${width}.png`,fullPage:true})
  assert.equal(await page.locator('.faq details').nth(0).locator('summary').innerText(),'Věrohodnost údajů')
  assert.equal(await page.locator('.faq details').nth(0).locator('p').textContent(),'Zveřejňujeme pouze ručně ověřené fondy s primárními zdroji. Data kontrolujeme týdně. Fond s ověřením starším než 14 dní není dostupný pro nové srovnání. Uložené přehledy zachovávají datum původních údajů.')
  assert.equal(await page.locator('.faq details').nth(1).locator('p').textContent(),'Dostupnost amerických ETF může být pro retail v EU omezená kvůli PRIIPs/KID. Ověřte ji u brokera.')
  assert.equal(await page.locator('.faq details').nth(2).locator('p').textContent(),'V odkazu dostanete potvrzení o sestavení interaktivní kalkulačky a odkaz k ní. Nové odkazy platí nejvýše 90 dní od vytvoření; nepoužité žádosti mažeme po 30 dnech. Starší odkazy si zachovávají původní dobu platnosti. Odkaz nesdílejte, protože umožňuje přístup k přehledu.')
  assert.equal(await page.locator('#privacy a').getAttribute('href'),'mailto:etfsrovnani@gmail.com')
  assert.ok((await page.locator('.privacy-additional p').textContent()).includes('Supabase (úložiště), Vercel (hosting), Google/Gmail (doručení)'))
  await page.locator('#catalog-search').fill('Fund 19');assert.equal(await page.locator('.real-etf-selection input').count(),1);await page.locator('.real-etf-selection input').check();await page.locator('#catalog-search').fill('')
  assert.equal(await page.getByRole('button',{name:'Odebrat TEST19'}).getAttribute('aria-pressed'),'true');await page.getByRole('button',{name:'Odebrat TEST19'}).click()
  await page.getByRole('button',{name:'Zobrazit další',exact:true}).click();assert.equal(await page.locator('.real-etf-option').count(),12)
  await page.getByRole('button',{name:'Zobrazit další',exact:true}).click();assert.equal(await page.locator('.real-etf-option').count(),18)
  await page.getByRole('button',{name:'Zobrazit další',exact:true}).click();assert.equal(await page.locator('.real-etf-option').count(),20);assert.equal(await page.getByRole('button',{name:'Zobrazit další',exact:true}).count(),0)
  await page.locator('.real-etf-selection input').nth(0).uncheck();assert.equal(await page.locator('.real-etf-selection input:checked').count(),1)
  for(const n of [2,3,4,5,6,7])await page.locator('.real-etf-selection input').nth(n).check()
  assert.equal(await page.locator('.real-etf-selection input:checked').count(),7);assert.equal(await page.locator('.real-etf-selection input').nth(8).isDisabled(),false)
  await page.locator('#email').fill('test@example.invalid');await page.getByRole('button',{name:'Zaslat srovnání na mail',exact:true}).click();await page.getByRole('heading',{name:'Zkontrolujte svůj e-mail.'}).waitFor()
  assert.equal(posts.at(-1).tickers.length,7);assert.equal(await page.getByRole('status').filter({hasText:'Zpráva byla odeslána'}).innerText(),'Zpráva byla odeslána');assert.equal(posts.at(-1).amountCzk,100000);assert.equal(posts.at(-1).marketingConsent,false);assert.equal(posts.at(-1).attribution,null)
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  console.log(`PASS exact landing copy, email-only step and no public calculator at ${width}px`)
 }
 await page.goto(base);await page.locator('.real-etf-selection input').first().waitFor()
 await page.locator('.real-etf-selection input').nth(0).uncheck();await page.locator('.real-etf-selection input').nth(1).uncheck()
 assert.equal(await page.getByRole('button',{name:'Zaslat srovnání na mail'}).isDisabled(),true)
 await page.locator('.real-etf-selection input').nth(1).check();await page.locator('#email').fill('test@example.invalid');await page.getByRole('button',{name:'Zaslat srovnání na mail'}).click();await page.getByRole('heading',{name:'Zkontrolujte svůj e-mail.'}).waitFor();assert.equal(posts.at(-1).tickers.length,1)
 console.log('PASS one-fund email submission and rejection of an empty selection')
 assert.deepEqual(events,[])
 for(const variant of ['editorial','blue','compact','steps','editorial-demo','compact-blue','steps-green']){await page.goto(`${base}/?variant=${variant}`);await page.locator('#email').waitFor();assert.equal(await page.locator('.profit-comparison,.comparison-table,.concept-bar').count(),0)}
 await page.goto(`${base}/?comparison=${id}`);await page.getByRole('alert').filter({hasText:'unauthorized'}).waitFor();assert.equal(await page.locator('.profit-comparison,.comparison-table').count(),0)
 console.log('PASS direct URL without server session grants no calculator')
 await page.goto(`${base}/#access=${'x'.repeat(43)}`);await page.getByRole('alert').filter({hasText:'invalid or expired'}).waitFor();assert.equal(await page.locator('.comparison-table').count(),0)
 const before=accesses
 // Simulate an unfocused scan; focus/visibility gates postpone redemption without a button.
 await page.addInitScript(()=>{Object.defineProperty(document,'hasFocus',{configurable:true,value:()=>false})})
 await page.goto(`${base}/?scan=test#access=${token}`);await page.getByText('Odkaz se zpracuje v aktivním okně prohlížeče.',{exact:true}).waitFor();assert.equal(accesses,before)
 await page.evaluate(()=>{Object.defineProperty(document,'hasFocus',{configurable:true,value:()=>true});globalThis.dispatchEvent(new globalThis.Event('focus'))})
 await page.locator('.preview-heading').waitFor();assert.equal(accesses,before+1);assert.equal(new URL(page.url()).hash,'')
 assert.equal(await page.getByRole('button',{name:'Potvrdit a otevřít srovnání →'}).count(),0)
 assert.equal(await page.locator('.concept-bar,.desktop-switch,.mobile-switch').count(),0)
 assert.equal(await page.locator('.real-etf-selection input:checked').count(),3);assert.equal(await page.locator('#investment').inputValue(),'100000')
 assert.ok((await context.cookies()).some(c=>c.name==='etf_session'&&c.httpOnly))
 await page.locator('#investment').fill('123456.78');await page.getByRole('button',{name:'Uložit změny →'}).click();await page.getByText('Změny jsou uložené.',{exact:false}).waitFor()
 await page.reload();await page.locator('.preview-heading').waitFor();assert.equal(await page.locator('#investment').inputValue(),'123456.78')
 // The init script keeps scans unfocused; explicitly activate again for a repeated email link.
 await page.goto(`${base}/#access=${token}`);await page.evaluate(()=>{Object.defineProperty(document,'hasFocus',{configurable:true,value:()=>true});globalThis.dispatchEvent(new globalThis.Event('focus'))});await page.locator('.preview-heading').waitFor()
 for(const variant of ['editorial','blue','compact','steps','editorial-blue','editorial-green','compact-green','steps-blue','terminal','guide','editorial-demo']){
  await page.goto(`${base}/?comparison=${id}&variant=${variant}`);await page.locator('.preview-heading').waitFor()
  assert.equal(await page.locator('.original-editorial').count(),1);assert.equal(await page.locator('.concept-bar,.desktop-switch,.mobile-switch').count(),0)
  assert.equal(await page.locator('#investment').inputValue(),'123456.78')
 }
 console.log('PASS retired variant URLs retain Editorial and saved comparison access')
 console.log('PASS automatic link access, focused-page scanner gate, stored selection, session/reopen and updates')
 await context.clearCookies();await page.goto(`${base}/?lost=session#access=${token}`);await page.evaluate(()=>{Object.defineProperty(document,'hasFocus',{configurable:true,value:()=>true});globalThis.dispatchEvent(new globalThis.Event('focus'))});await page.locator('.preview-heading').waitFor();assert.equal(await page.locator('#investment').inputValue(),'123456.78');assert.equal(await page.locator('.real-etf-selection input:checked').count(),3)
 const fresh=await browser.newContext(),returned=await fresh.newPage();await returned.route('**/api/**',apiRoutes);await returned.goto(`${base}/#access=${token}`);await returned.locator('.preview-heading').waitFor();assert.equal(await returned.locator('#investment').inputValue(),'123456.78');assert.equal(new URL(returned.url()).hash,'');await fresh.close()
 console.log('PASS reusable email link after lost cookie and in a fresh browser context restores saved edits')
 linkRevoked=true;await context.clearCookies();await page.goto(`${base}/#access=${token}`);await page.evaluate(()=>{Object.defineProperty(document,'hasFocus',{configurable:true,value:()=>true});globalThis.dispatchEvent(new globalThis.Event('focus'))});await page.getByRole('alert').filter({hasText:'invalid or expired'}).waitFor();assert.equal(await page.locator('.comparison-table').count(),0)
 console.log('PASS expired/revoked link does not restore access')
 failSend=true;await page.goto(base);await page.locator('#email').fill('test@example.invalid');await page.getByRole('button',{name:'Zaslat srovnání na mail'}).click();await page.getByRole('alert').filter({hasText:'TEST mail failed'}).waitFor();assert.equal(await page.getByRole('heading',{name:'Zkontrolujte svůj e-mail.'}).count(),0)
 console.log('PASS failed mail never shows sent success')
 failSend=false;pendingSend=true;await page.getByRole('button',{name:'Zaslat srovnání na mail'}).click();await page.getByRole('alert').filter({hasText:'Server nepotvrdil odeslání'}).waitFor();assert.equal(await page.getByRole('heading',{name:'Zkontrolujte svůj e-mail.'}).count(),0);pendingSend=false
 console.log('PASS queued response never shows completed sending')
 await page.unroute('**/api/**');await page.route('**/api/catalog',r=>r.fulfill({json:{funds:[],privacy:null}}));await page.goto(base);await page.getByText('V katalogu zatím nejsou zveřejněné ověřené fondy.',{exact:false}).waitFor();assert.equal(await page.getByRole('button',{name:'Zaslat srovnání na mail'}).isDisabled(),true)
 await page.unroute('**/api/catalog');await page.route('**/api/catalog',r=>r.fulfill({json:{funds:options,privacy:null}}));await page.goto(base);await page.locator('.real-etf-selection input').first().waitFor();assert.equal(await page.getByRole('button',{name:'Zaslat srovnání na mail'}).isDisabled(),true)
 await page.unroute('**/api/catalog');await page.route('**/api/catalog',r=>r.fulfill({status:503,json:{error:'TEST service unavailable'}}));await page.goto(base);await page.getByRole('button',{name:'Zkusit načíst katalog znovu'}).waitFor();assert.equal(await page.locator('.comparison-table').count(),0)
 console.log('PASS empty catalog, missing operator and API outage stay safe')
}finally{await browser.close()}
