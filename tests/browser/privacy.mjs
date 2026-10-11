// Isolated UI fixtures; no real mail, Supabase or provider calls.
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||undefined,args:['--no-sandbox']})
const base=process.env.TEST_BASE_URL??'http://127.0.0.1:4173'
const date=new Date().toISOString(),funds=Array.from({length:5},(_,i)=>({ticker:`TEST${i}`,name:'TEST ONLY',exchange:'NYSE Arca',index:'TEST ONLY',expenseRatioPercent:0.03,dividends:'TEST ONLY',description:'TEST ONLY',verifiedAt:date,dataAsOf:date,sources:[]}))
try{
 for(const width of [320,390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),events=[],submits=[]
  let failWithdrawal=false
  await context.addCookies([{name:'etf_session',value:'TEST-FUNCTIONAL-COOKIE',url:base,httpOnly:true}])
  await page.route('**/api/**',async route=>{
   const req=route.request(),path=new URL(req.url()).pathname,data=req.method()==='POST'?req.postDataJSON():null
   if(path==='/api/catalog')await route.fulfill({json:{funds,privacy:{controllerName:'TEST ONLY',controllerContact:'test@example.invalid',retentionDays:90}}})
   else if(path==='/api/events'){
    if(data.withdraw&&failWithdrawal){await route.fulfill({status:503,json:{error:'TEST ONLY failed withdrawal'}});return}
    events.push(data);await route.fulfill({json:{ok:true}})
   }else if(path==='/api/comparisons'){submits.push(data);await route.fulfill({json:{status:'sent'}})}
   else throw Error('Unexpected test route')
  })
  await page.goto(base);await page.getByRole('button',{name:'Odmítnout',exact:true}).waitFor();await page.locator('.real-etf-selection input').first().waitFor()
  assert.equal(events.length,0);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  assert.equal(await page.locator('#privacy-settings-panel').evaluate(e=>getComputedStyle(e).position),'fixed')
  assert.equal(await page.locator('footer .privacy-reopen').count(),1)
  const heroTop=await page.locator('.hero').evaluate(e=>e.getBoundingClientRect().top)
  const panelBox=await page.locator('#privacy-settings-panel').boundingBox();assert.ok(panelBox.x>=0&&panelBox.x+panelBox.width<=width&&panelBox.y>=0&&panelBox.y+panelBox.height<=900)
  await page.screenshot({path:`.cache/privacy-${width}.png`})
  if(width===320){
   await page.setViewportSize({width,height:480});await page.getByText('Jak měříme návštěvnost',{exact:true}).click()
   const small=await page.locator('#privacy-settings-panel').boundingBox();assert.ok(small.y>=0&&small.y+small.height<=480)
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
   await page.getByRole('button',{name:'Zavřít panel soukromí'}).click();assert.equal(events.length,0)
   assert.equal(await page.evaluate(()=>localStorage.getItem('etf_analytics_consent')),null)
   await page.setViewportSize({width,height:900});await page.reload();await page.getByRole('button',{name:'Odmítnout',exact:true}).waitFor()
  }
  const reject=page.getByRole('button',{name:'Odmítnout',exact:true}),accept=page.getByRole('button',{name:'Přijmout analytiku',exact:true})
  assert.deepEqual(await reject.evaluate(e=>[getComputedStyle(e).backgroundColor,getComputedStyle(e).color]),await accept.evaluate(e=>[getComputedStyle(e).backgroundColor,getComputedStyle(e).color]))
  await reject.focus();await page.keyboard.press('Enter');await page.locator('#privacy-settings-panel').waitFor({state:'detached'});assert.equal(await page.locator('.hero').evaluate(e=>e.getBoundingClientRect().top),heroTop);await page.reload();await page.locator('.real-etf-selection input').first().waitFor()
  assert.equal(await page.getByRole('button',{name:'Odmítnout',exact:true}).count(),0)
  await page.locator('#investment').fill('123000');await page.getByRole('button',{name:'Pokračovat k e-mailu →'}).click();await page.locator('#email').fill('test@example.invalid')
  assert.equal(await page.locator('form input[type=checkbox]').count(),1)
  await page.getByRole('button',{name:'Poslat odkaz na moje srovnání →'}).click();await page.getByRole('heading',{name:'Zkontrolujte svůj e-mail.'}).waitFor()
  assert.equal(submits[0].attribution,null);assert.equal(submits[0].marketingConsent,false);assert.equal(events.length,0)
  await page.getByRole('button',{name:'Nastavení soukromí',exact:true}).click();await Promise.all([page.waitForResponse(r=>r.url().endsWith('/api/events')),accept.click()])
  const id=await page.evaluate(()=>globalThis.sessionStorage.getItem('etf_visit_id'));assert.ok(id)
  assert.ok(events.some(e=>e.name==='landing_view'));assert.equal(await page.locator('#privacy-settings-panel').count(),0)
  await page.reload();await page.locator('.real-etf-selection input').first().waitFor();assert.equal(await page.locator('#privacy-settings-panel').count(),0);assert.equal(await page.evaluate(()=>globalThis.sessionStorage.getItem('etf_visit_id')),id)
  await page.locator('#investment').fill('222000');await page.getByRole('button',{name:'Nastavení soukromí',exact:true}).click();failWithdrawal=true
  await reject.click();await page.getByRole('alert').filter({hasText:'odstranění údajů na serveru selhalo'}).waitFor()
  assert.equal(await page.evaluate(()=>localStorage.getItem('etf_analytics_consent')),'denied');assert.ok(await page.evaluate(()=>localStorage.getItem('etf_pending_withdrawal')))
  assert.ok(!(await page.locator('.privacy-status').innerText()).includes('byly odstraněny'))
  const count=events.length;await page.locator('#investment').fill('333000');assert.equal(events.length,count)
  await page.reload();await page.getByRole('alert').filter({hasText:'odstranění údajů na serveru selhalo'}).waitFor();failWithdrawal=false
  await page.getByRole('button',{name:'Zkusit odvolání znovu'}).click();await page.getByRole('status').filter({hasText:'byly odstraněny'}).waitFor()
  assert.equal(await page.evaluate(()=>localStorage.getItem('etf_pending_withdrawal')),null)
  assert.ok((await context.cookies()).some(c=>c.name==='etf_session'&&c.value==='TEST-FUNCTIONAL-COOKIE'))
  assert.ok(events.some(e=>e.withdraw&&e.attribution.visitId===id))
  console.log(`PASS privacy acceptance/refusal/reload/withdrawal failure/retry/form/cookie preservation at ${width}px`)
  await context.close()
 }
}finally{await browser.close()}
