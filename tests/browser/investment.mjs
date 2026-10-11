// Isolated licensed observations. No Supabase writes or real email; historical dates are calendar week boundaries.
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
const funds=JSON.parse(await readFile('data/priority-five.approved.json','utf8')).records
const observed=JSON.parse(await readFile('data/review/performance-observations.json','utf8')).funds
const performance=observed.map(r=>({...r,asOf:r.as_of,attributionUrl:`https://tickerinside.com/etf/${r.ticker.toLowerCase()}/`,currency:'USD',weeklyReturns:r.weekly.map((value,i)=>({weekEnd:new Date(Date.parse(r.weeks_end)-(155-i)*7*86400000).toISOString().slice(0,10),returnFraction:value}))}))
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||undefined,args:['--no-sandbox']})
const base=process.env.TEST_BASE_URL??'http://127.0.0.1:4173'
try{
 for(const width of [320,390,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});let requests=0
  await page.route('**/api/**',async route=>{
   const path=new URL(route.request().url()).pathname;assert.ok(['/api/catalog','/api/performance'].includes(path))
   if(path==='/api/performance')requests++
   await route.fulfill({json:path==='/api/catalog'?{funds,privacy:null}:{funds:performance,unavailable:[]}})
  })
  await page.goto(base);await page.getByRole('button',{name:'Odmítnout',exact:true}).click()
  await page.locator('#assumed-SPY').waitFor();await page.waitForFunction(()=>document.querySelector('#assumed-SPY').value!=='')
  assert.equal(await page.locator('#assumed-SPY').inputValue(),((1.867**.2-1)*100).toFixed(2))
  assert.equal(await page.locator('#assumed-VOO').inputValue(),((1.872**.2-1)*100).toFixed(2))
  await page.locator('#assumed-SPY').fill('6');await page.locator('#assumed-VOO').fill('-10')
  await page.locator('#investment').fill('200000');await page.getByLabel('Investiční horizont',{exact:true}).selectOption('3')
  assert.equal(await page.locator('#assumed-SPY').inputValue(),'6');assert.equal(await page.locator('#assumed-VOO').inputValue(),'-10')
  assert.ok((await page.getByTestId('future-VOO').innerText()).replace(/\s/g,'').includes('145800'))
  await page.getByLabel('Historické referenční období').selectOption('1')
  assert.equal(await page.locator('#assumed-SPY').inputValue(),'6');assert.equal(await page.locator('#assumed-VOO').inputValue(),'-10')
  await page.getByRole('article',{name:'Model SPY'}).getByRole('button',{name:'Obnovit podle historie',exact:true}).click()
  assert.equal(await page.locator('#assumed-SPY').inputValue(),'20.50')
  await page.locator('.real-etf-option').filter({hasText:'IVV'}).locator('input').check()
  assert.equal(await page.locator('#assumed-IVV').inputValue(),'20.60')
  await page.locator('.real-etf-option').filter({hasText:'VTI'}).locator('input').check()
  await page.locator('.real-etf-option').filter({hasText:'IWM'}).locator('input').check()
  assert.equal(await page.locator('.investment-card').count(),5);assert.equal(await page.locator('.history-legend li').count(),5)
  assert.equal(await page.locator('.historical-chart svg polyline').count(),5)
  assert.ok((await page.locator('.history-coverage').innerText()).includes('52 týdnů'))
  await page.getByLabel('Historické referenční období').selectOption('5')
  assert.ok((await page.locator('.history-coverage').innerText()).includes('156 týdnů'));assert.ok((await page.locator('.history-coverage').innerText()).includes('Pětiletý výnos je souhrnný'))
  for(const ticker of ['SPY','IVV','VTI','IWM']){const r=observed.find(r=>r.ticker===ticker);assert.equal(await page.locator(`#assumed-${ticker}`).inputValue(),((Math.pow(1+r.r5/100,1/5)-1)*100).toFixed(2))}
  await page.getByLabel('Prohlédnout historický týden').fill('0');assert.ok((await page.locator('.history-tooltip').innerText()).includes('100.00'))
  await page.getByLabel('Prohlédnout historický týden').fill('156');assert.ok((await page.locator('.history-tooltip').innerText()).includes('9. 10. 2026'))
  await page.locator('.historical-chart svg').hover({position:{x:80,y:80}});assert.ok(!(await page.locator('.history-tooltip strong').innerText()).includes('9. 10. 2026'))
  await page.locator('#assumed-SPY').fill('-101');assert.ok((await page.getByTestId('future-SPY').innerText()).includes('Zadejte'))
  await page.locator('#assumed-SPY').fill('-100');assert.ok((await page.getByTestId('future-SPY').innerText()).includes('0,00'))
  assert.equal(await page.locator('.cost-chart').count(),0);assert.equal(await page.getByRole('button',{name:'Hypotetický scénář',exact:true}).count(),0)
  assert.ok(await page.evaluate(()=>document.querySelector('.historical-section').compareDocumentPosition(document.querySelector('.comparison-section'))&4 /* DOCUMENT_POSITION_FOLLOWING */))
  await page.getByRole('button',{name:'Pokračovat k e-mailu →',exact:true}).click();await page.getByRole('button',{name:'← Upravit výběr',exact:true}).click()
  assert.equal(await page.locator('#assumed-SPY').inputValue(),'-100');assert.equal(await page.locator('#assumed-VOO').inputValue(),'-10');assert.equal(await page.locator('#investment').inputValue(),'200000')
  assert.equal(requests,1);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  await page.locator('.historical-section').screenshot({path:`.cache/historical-${width}.png`})
  console.log(`PASS five editable cards, independent overrides, history reset, actual chart/tooltip/range, section order and no cost graph at ${width}px`);await page.close()
 }
 for(const unavailable of ['null','outage']){
  const page=await browser.newPage({viewport:{width:320,height:900}})
  await page.route('**/api/**',async route=>{
   if(new URL(route.request().url()).pathname==='/api/catalog')await route.fulfill({json:{funds,privacy:null}})
   else if(unavailable==='outage')await route.fulfill({status:503,json:{error:'Unavailable'}})
   else await route.fulfill({json:{funds:performance.map(r=>({...r,r1:null,r3:null,r5:null,weeklyReturns:[]})),unavailable:[]}})
  })
  await page.goto(base);await page.getByRole('button',{name:'Odmítnout',exact:true}).click()
  await page.locator('#assumed-SPY').waitFor();if(unavailable==='outage')await page.getByText('Historická data nyní nejsou dostupná.',{exact:false}).first().waitFor()
  assert.equal(await page.locator('#assumed-SPY').inputValue(),'')
  await page.locator('#assumed-SPY').fill('0');assert.ok((await page.getByTestId('future-SPY').innerText()).replace(/\s/g,'').includes('100000'))
  assert.equal(await page.locator('.historical-chart svg').count(),0)
  console.log(`PASS ${unavailable} history leaves assumptions empty and manual model functional`);await page.close()
 }
}finally{await browser.close()}
