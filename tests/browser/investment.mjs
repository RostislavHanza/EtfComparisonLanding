// Isolated browser responses using actual reduced observations; never contact Supabase or send mail.
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
const funds=JSON.parse(await readFile('data/priority-five.approved.json','utf8')).records
const observed=JSON.parse(await readFile('data/review/performance-observations.json','utf8')).funds
const performance=observed.map(r=>({...r,asOf:r.as_of,attributionUrl:`https://tickerinside.com/etf/${r.ticker.toLowerCase()}/`,currency:'USD'}))
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||undefined,args:['--no-sandbox']})
const base=process.env.TEST_BASE_URL??'http://127.0.0.1:4173'
try{
 for(const width of [320,390,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});let requests=0
  await page.route('**/api/**',async route=>{
   const path=new URL(route.request().url()).pathname
   assert.ok(['/api/catalog','/api/performance'].includes(path))
   if(path==='/api/performance')requests++
   await route.fulfill({json:path==='/api/catalog'?{funds,privacy:null}:{funds:performance,unavailable:[]}})
  })
  await page.goto(base);await page.getByRole('button',{name:'Odmítnout',exact:true}).click()
  await page.getByTestId('historical-return').waitFor();assert.ok((await page.getByTestId('historical-return').innerText()).includes('20,5'))
  await page.getByLabel('Historické období',{exact:true}).selectOption('3')
  assert.ok((await page.getByTestId('historical-value').innerText()).replace(/\s/g,'').includes('187100'))
  assert.equal(await page.locator('.performance-source').getByRole('link',{name:'TickerInside · SPY API'}).getAttribute('href'),'https://tickerinside.com/api/v1/fund/spy.json')
  assert.ok((await page.locator('.performance-source').innerText()).includes('9. 10. 2026'))
  await page.locator('#investment').fill('200000');await page.locator('#investment-range').fill('100000')
  assert.equal(requests,1);assert.ok((await page.locator('.cost-value[data-ticker="SPY"]').innerText()).includes('94,5'))
  await page.locator('.real-etf-option').filter({hasText:'VTI'}).locator('input').check()
  await page.getByLabel('ETF pro historický podklad').selectOption('VTI');await page.getByLabel('Historické období',{exact:true}).selectOption('5')
  assert.ok((await page.getByTestId('historical-value').innerText()).replace(/\s/g,'').includes('177400'))
  await page.getByRole('button',{name:'Hypotetický scénář',exact:true}).click()
  assert.equal(await page.getByLabel('Vlastní předpokládaný roční výnos v %').inputValue(),'')
  await page.getByLabel('Vlastní předpokládaný roční výnos v %').fill('-10');await page.getByLabel('Investiční horizont v letech').fill('3')
  assert.ok((await page.getByTestId('scenario-value').innerText()).replace(/\s/g,'').includes('72900'))
  await page.getByRole('button',{name:/Použít anualizované historické tempo VTI/}).click()
  assert.ok(Math.abs(Number(await page.getByLabel('Vlastní předpokládaný roční výnos v %').inputValue())-((1.774**(1/5)-1)*100))<0.000001)
  assert.ok((await page.getByText('Mechanicky opakujete historické tempo.',{exact:false}).innerText()).includes('NEJDE o predikci'))
  await page.locator('.investment-section').screenshot({path:`.cache/investment-${width}.png`})
  await page.getByLabel('Investiční horizont v letech').fill('31');assert.equal(await page.getByTestId('scenario-value').count(),0)
  assert.equal(requests,1);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  console.log(`PASS cumulative history, explicit annualization, negative scenario, source/FX/cost notes and cached requests at ${width}px`)
  await page.close()
 }
 for(const unavailable of ['null','outage']){
  const page=await browser.newPage({viewport:{width:320,height:900}})
  await page.route('**/api/**',async route=>{
   const path=new URL(route.request().url()).pathname
   if(path==='/api/catalog')await route.fulfill({json:{funds,privacy:null}})
   else if(unavailable==='outage')await route.fulfill({status:503,json:{error:'Unavailable'}})
   else await route.fulfill({json:{funds:performance.map(r=>({...r,r1:null,r3:null,r5:null})),unavailable:[]}})
  })
  await page.goto(base);await page.getByRole('button',{name:'Odmítnout',exact:true}).click()
  await page.getByText(unavailable==='null'?'Data nejsou dostupná':'Historická data nyní nejsou dostupná.',{exact:false}).first().waitFor()
  assert.equal(await page.getByTestId('historical-return').count(),0)
  await page.getByRole('button',{name:'Hypotetický scénář',exact:true}).click()
  await page.getByLabel('Vlastní předpokládaný roční výnos v %').fill('0');assert.ok((await page.getByTestId('scenario-value').innerText()).replace(/\s/g,'').includes('100000'))
  assert.equal(await page.getByRole('button',{name:/Použít anualizované/}).isDisabled(),true)
  console.log(`PASS ${unavailable} history has no zero/fixed fallback and does not block own scenario`);await page.close()
 }
}finally{await browser.close()}
