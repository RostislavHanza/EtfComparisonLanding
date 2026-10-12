import {chromium} from 'playwright'
import assert from 'node:assert/strict'
const base=process.env.TEST_BASE_URL??'http://127.0.0.1:4173'
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||undefined,args:['--no-sandbox']})
try{
 for(const campaign of ['ad-a','ad-b','direct']){
  const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),events=[],leads=[]
  await page.route('**/api/**',async route=>{
   const path=new URL(route.request().url()).pathname,data=route.request().method()==='POST'?route.request().postDataJSON():null
   if(path==='/api/catalog')await route.fulfill({json:{funds:[{ticker:'TEST',name:'TEST ONLY',verifiedAt:new Date().toISOString()}],privacy:{controllerName:'TEST',controllerContact:'test@example.invalid',retentionDays:90}}})
   else if(path==='/api/events'){events.push(data);await route.fulfill({json:{ok:true}})}
   else if(path==='/api/comparisons'){leads.push(data);await route.fulfill({json:{status:'sent'}})}
   else throw Error('Unexpected fixture endpoint')
  })
  if(campaign==='direct')await page.goto(base)
  else {await page.goto(`${base}/${campaign==='ad-a'?'add':'add-simple'}`);await page.locator(campaign==='ad-a'?'.cta a':'a.ad').click()}
  await page.locator('#email').waitFor()
  assert.equal(events.length,0)
  assert.equal(await page.evaluate(()=>globalThis.sessionStorage.getItem('etf_visit_id')),null)
  assert.equal(await page.evaluate(()=>globalThis.sessionStorage.getItem('etf_campaign')),null)
  await page.getByRole('button',{name:'Přijmout analytiku',exact:true}).click()
  await page.waitForFunction(()=>globalThis.sessionStorage.getItem('etf_campaign')!==null)
  await page.locator('#email').fill('test@example.invalid')
  await page.getByRole('button',{name:'Zaslat srovnání na mail',exact:true}).click()
  await page.getByRole('heading',{name:'Zkontrolujte svůj e-mail.'}).waitFor()
  assert.equal(leads[0].attribution.campaign,campaign)
  for(const name of ['landing_view','form_started','lead_submit_attempt']){
   const matching=events.filter(e=>e.name===name);assert.equal(matching.length,1);assert.equal(matching[0].attribution.campaign,campaign)
  }
  // Same consented visit continues even when a later page has no UTM parameter.
  await page.goto(base);await page.locator('#email').waitFor();await page.locator('#email').fill('test@example.invalid')
  await page.getByRole('button',{name:'Zaslat srovnání na mail',exact:true}).click();await page.getByRole('heading',{name:'Zkontrolujte svůj e-mail.'}).waitFor()
  assert.equal(leads.at(-1).attribution.campaign,campaign)
  await page.getByRole('button',{name:'Nastavení soukromí',exact:true}).click();await page.getByRole('button',{name:'Odmítnout',exact:true}).click()
  await page.locator('#privacy-settings-panel').waitFor({state:'detached'})
  assert.equal(await page.evaluate(()=>globalThis.sessionStorage.getItem('etf_visit_id')),null)
  assert.equal(await page.evaluate(()=>globalThis.sessionStorage.getItem('etf_campaign')),null)
  const count=events.length
  await page.goto(`${base}/?utm_campaign=ad-b`);await page.locator('#email').waitFor();await page.locator('#email').fill('test@example.invalid')
  await page.getByRole('button',{name:'Zaslat srovnání na mail',exact:true}).click();await page.getByRole('heading',{name:'Zkontrolujte svůj e-mail.'}).waitFor()
  assert.equal(leads.at(-1).attribution,null);assert.equal(events.length,count)
  assert.equal(await page.evaluate(()=>globalThis.sessionStorage.getItem('etf_visit_id')),null)
  assert.equal(await page.evaluate(()=>globalThis.sessionStorage.getItem('etf_campaign')),null)
  await page.goto(`${base}/?utm_campaign=arbitrary-text-not-allowed`);await page.locator('#email').waitFor()
  await page.getByRole('button',{name:'Nastavení soukromí',exact:true}).click();await page.getByRole('button',{name:'Přijmout analytiku',exact:true}).click()
  await page.waitForFunction(()=>globalThis.sessionStorage.getItem('etf_campaign')==='direct')
  assert.ok(events.filter(e=>e.name==='landing_view').at(-1).attribution.campaign==='direct')
  console.log(`PASS ${campaign}: no pre-consent identifiers/events, full client funnel, persisted attribution and withdrawal`)
  await context.close()
 }
}finally{await browser.close()}
