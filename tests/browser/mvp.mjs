// Isolated browser fixtures: NOT real ETF data; never imported into Supabase.
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
const base=process.env.TEST_BASE_URL??'http://127.0.0.1:4173'
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||undefined,args:['--no-sandbox']})
const funds=Array.from({length:20},(_,i)=>({ticker:`TEST${i}`,name:`TEST ONLY Fund ${i}`,exchange:'NYSE Arca',index:'TEST ONLY INDEX',expenseRatioPercent:0.03+i*0.01,dividends:'TEST ONLY',description:'TEST ONLY, NOT A REAL FUND',verifiedAt:new Date().toISOString(),dataAsOf:new Date().toISOString(),sources:[{url:'https://nyse.com/test',field:'exchange',verified_at:new Date().toISOString(),as_of:new Date().toISOString(),evidence:'TEST ONLY'}]}))
const privacy={controllerName:'TEST ONLY',controllerContact:'test@example.invalid',retentionDays:90}
const id='11111111-1111-4111-8111-111111111111',token='t'.repeat(43),errors=[]
let saved={id,tickers:['TEST1','TEST3','TEST4'],amountCzk:250000,funds:[funds[1],funds[3],funds[4]],createdAt:'test',updatedAt:'test'}
const context=await browser.newContext({reducedMotion:'reduce'}),p=await context.newPage()
let posts=[],events=[],failSend=false
p.on('pageerror',e=>errors.push(e.message))
await p.route('**/api/**',async route=>{
 const req=route.request(),url=new URL(req.url()),data=req.method()==='POST'||req.method()==='PUT'?req.postDataJSON():null
 let response
 if(url.pathname==='/api/catalog')response={funds,privacy}
 else if(url.pathname==='/api/comparisons'){if(failSend){await route.fulfill({status:503,json:{error:'TEST ONLY mail failed'}});return}posts.push(data);response={status:'sent'}}
 else if(url.pathname==='/api/access'){assert.equal(data.token,token);response={id}}
 else if(url.pathname==='/api/comparison'){
  if(req.method()==='PUT')saved={...saved,...data,funds:data.tickers.map(t=>funds.find(f=>f.ticker===t))}
  response=saved
 }else if(url.pathname==='/api/events'){events.push(data.withdraw?'withdraw':data.name);response={ok:true}}
 else throw Error('Unexpected API route')
 await route.fulfill({json:response})
})
try{
 for(const width of [320,390,768,1100,1440]){
  await p.setViewportSize({width,height:900});await p.goto(base);await p.locator('.real-etf-selection input').first().waitFor()
  assert.equal(await p.locator('.real-etf-selection input').count(),20);assert.equal(await p.locator('.real-etf-selection input:checked').count(),2)
  assert.equal(await p.locator('#email').count(),0);assert.equal(await p.locator('.landing').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(246, 243, 234)')
  await p.locator('#catalog-search').fill('Fund 19');assert.equal(await p.locator('.real-etf-selection input').count(),1)
  await p.locator('#catalog-search').fill('');for(const n of [2,3,4])await p.locator('.real-etf-selection input').nth(n).check()
  assert.equal(await p.locator('.real-etf-selection input:checked').count(),5);assert.equal(await p.locator('.real-etf-selection input').nth(5).isDisabled(),true)
  assert.equal(await p.locator('.comparison-table thead th').count(),6)
  await p.locator('#investment').fill('250000');assert.equal(await p.locator('.comparison-table tr').filter({has:p.getByRole('rowheader',{name:'Náklady za rok',exact:true})}).locator('td').first().locator('span').last().innerText(),'75,00 Kč')
  await p.locator('#investment').fill('-1');assert.equal(await p.locator('.comparison-next button').isDisabled(),true)
  await p.locator('#investment').fill('250000')
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`)
  await p.getByRole('button',{name:'Pokračovat k e-mailu →'}).click();await p.locator('#email').fill('test@example.invalid')
  assert.equal(await p.locator('.marketing-consent input').isChecked(),false)
  await p.getByRole('button',{name:'Poslat odkaz na moje srovnání →'}).click();await p.getByRole('heading',{name:'Zkontrolujte svůj e-mail.'}).waitFor()
  assert.equal(posts.at(-1).tickers.length,5);assert.equal(posts.at(-1).amountCzk,250000);assert.equal(posts.at(-1).marketingConsent,false);assert.equal(posts.at(-1).attribution,null)
  console.log(`PASS responsive catalog/table/chart/form at ${width}px`)
 }
 assert.deepEqual(events,[])
 await p.goto(`${base}/#access=${token}`);await p.getByRole('button',{name:'Potvrdit a otevřít srovnání →'}).waitFor();assert.equal(new URL(p.url()).hash,'')
 await p.getByRole('button',{name:'Potvrdit a otevřít srovnání →'}).click();await p.locator('.preview-heading').waitFor()
 assert.equal(await p.locator('#investment').inputValue(),'250000');assert.equal(await p.locator('.real-etf-selection input:checked').count(),3)
 await p.locator('#investment').fill('123456.78');await p.getByRole('button',{name:'Uložit změny →'}).click();await p.getByText('Změny jsou uložené.',{exact:false}).waitFor()
 await p.reload();await p.locator('.preview-heading').waitFor();assert.equal(await p.locator('#investment').inputValue(),'123456.78')
 await Promise.all([p.waitForResponse(r=>r.url().includes('/api/events')),p.getByRole('button',{name:'Přijmout analytiku',exact:true}).click()]);assert.ok(events.includes('landing_view'))
 await p.getByRole('button',{name:'Nastavení soukromí',exact:true}).click();
 await Promise.all([p.waitForResponse(r=>r.url().includes('/api/events')&&r.request().postDataJSON().withdraw===true),p.getByRole('button',{name:'Odmítnout',exact:true}).click()]);assert.ok(events.includes('withdraw'));assert.equal(await p.evaluate(()=>localStorage.getItem('etf_analytics_consent')),'denied')
 console.log('PASS explicit access, restored selection/amount, update/reload, opt-in and withdrawal')
 for(const variant of ['editorial-demo','editorial-blue','editorial-green','compact-blue','compact-green','steps-blue','steps-green','terminal','guide']){
  await p.goto(`${base}/?variant=${variant}`);await p.locator('h1').waitFor();assert.equal(await p.locator('.catalog-search').count(),0)
 }
 console.log('PASS retained demo variants')
 failSend=true;await p.goto(base);await p.locator('.comparison-next button').waitFor();await p.locator('.comparison-next button').click();await p.locator('#email').fill('test@example.invalid');await p.getByRole('button',{name:'Poslat odkaz na moje srovnání →'}).click();await p.getByRole('alert').filter({hasText:'TEST ONLY mail failed'}).waitFor();assert.equal(await p.getByRole('heading',{name:'Zkontrolujte svůj e-mail.'}).count(),0);assert.equal(await p.locator('#email').isVisible(),true);failSend=false
 console.log('PASS failed mail shows error without false success')
 await p.unroute('**/api/**');await p.route('**/api/catalog',r=>r.fulfill({json:{funds:[],privacy:null}}));await p.goto(base)
 await p.getByText('V katalogu zatím nejsou zveřejněné ověřené fondy.',{exact:false}).waitFor();assert.equal(await p.locator('.comparison-table').count(),0)
 console.log('PASS empty catalog has no invented financial data')
 await p.unroute('**/api/catalog');await p.route('**/api/catalog',r=>r.fulfill({json:{funds,privacy:null}}));await p.goto(base);await p.locator('.comparison-next button').waitFor();await p.locator('.comparison-next button').click();assert.equal(await p.getByRole('button',{name:'Poslat odkaz na moje srovnání →'}).isDisabled(),true)
 console.log('PASS missing controller blocks personal-data form')
 await p.unroute('**/api/catalog');await p.route('**/api/catalog',r=>r.fulfill({status:503,json:{error:'TEST ONLY service unavailable'}}));await p.goto(base);await p.getByRole('button',{name:'Zkusit načíst katalog znovu'}).waitFor();assert.equal(await p.locator('.comparison-table').count(),0)
 console.log('PASS API outage has retry and no demo fallback')
 assert.deepEqual(errors,[])
}finally{await browser.close()}
