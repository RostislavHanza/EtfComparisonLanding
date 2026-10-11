// Isolated licensed observations. No Supabase writes or real email; historical dates are calendar week boundaries.
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
const funds=JSON.parse(await readFile('data/priority-five.approved.json','utf8')).records
const observed=JSON.parse(await readFile('data/review/performance-observations.json','utf8')).funds
const performance=observed.map(r=>({...r,asOf:r.as_of,attributionUrl:`https://tickerinside.com/etf/${r.ticker.toLowerCase()}/`,currency:'USD',weeklyReturns:r.weekly.map((value,i)=>({weekEnd:new Date(Date.parse(r.weeks_end)-(155-i)*7*86400000).toISOString().slice(0,10),returnFraction:value}))}))
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||undefined,args:['--no-sandbox']})
const id='11111111-1111-4111-8111-111111111111'
const saved={id,tickers:['SPY','VOO'],amountCzk:100000,funds:funds.slice(0,2)}
const base=process.env.TEST_BASE_URL??'http://127.0.0.1:4173'
try{
 for(const width of [320,390,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});let requests=0
  await page.route('**/api/**',async route=>{
   const path=new URL(route.request().url()).pathname;assert.ok(['/api/catalog','/api/performance','/api/comparison'].includes(path))
   if(path==='/api/performance')requests++
   await route.fulfill({json:path==='/api/catalog'?{funds,privacy:null}:path==='/api/comparison'?saved:{funds:performance,unavailable:[]}})
  })
  await page.goto(`${base}/?comparison=${id}`);await page.getByRole('button',{name:'Odmítnout',exact:true}).click()
  await page.locator('#assumed-SPY').waitFor();await page.waitForFunction(()=>document.querySelector('#assumed-SPY').value!=='')
  const periodButton=year=>page.getByRole('group',{name:'Historické referenční období'}).getByRole('button',{name:year===1?'1 rok':year===3?'3 roky':'5 let',exact:true})
  const profit=async ticker=>(await page.getByTestId(`profit-${ticker}`).innerText()).replace(/\s/g,'')
  assert.equal(await page.locator('#assumed-SPY').inputValue(),((1.867**.2-1)*100).toFixed(2))
  assert.equal(await page.locator('#assumed-VOO').inputValue(),((1.872**.2-1)*100).toFixed(2))
  assert.equal(await page.getByText('02 / Odhadovaný výnos',{exact:true}).count(),1)
  assert.ok(await page.evaluate(()=>{const a=document.querySelector('#investment'),b=document.querySelector('#investment-horizon'),c=document.querySelector('.profit-comparison');return (a.compareDocumentPosition(b)&4)&&(b.compareDocumentPosition(c)&4)}))
  assert.equal(await page.locator('.investment-card').count(),0)
  assert.equal(await page.getByRole('table',{name:'Srovnání odhadovaných zisků'}).count(),1)
  assert.equal(await page.getByRole('columnheader',{name:'Předpokládaný výnos ročně (%)',exact:true}).count(),1)
  assert.equal(await page.getByRole('button',{name:'Obnovit podle historie',exact:true}).count(),1)
  assert.equal(await page.locator('#profit-history-note').count(),1)
  assert.equal(await page.locator('.profit-row label,.profit-row button,.profit-row small').count(),0)
  // Display profit, not future value; edit immediately, preserve independent assumptions.
  await page.getByLabel('Investiční horizont',{exact:true}).selectOption('1');await page.locator('#assumed-SPY').fill('62')
  assert.equal(await profit('SPY'),'+62000,00Kč')
  await page.locator('#assumed-VOO').fill('1')
  const trackWidths=await page.locator('.profit-track').evaluateAll(tracks=>tracks.map(el=>el.getBoundingClientRect().width));assert.equal(trackWidths[0],trackWidths[1])
  await page.locator('#assumed-SPY').fill('6');await page.locator('#assumed-VOO').fill('-10')
  await page.locator('#investment').fill('200000');await page.getByLabel('Investiční horizont',{exact:true}).selectOption('3')
  assert.equal(await page.locator('#assumed-SPY').inputValue(),'6');assert.equal(await page.locator('#assumed-VOO').inputValue(),'-10')
  assert.equal(await profit('VOO'),'-54200,00Kč')
  const bars=await page.locator('.profit-row').evaluateAll(rows=>rows.map(r=>{const bar=r.querySelector('.profit-bar');return{start:parseFloat(bar.style.left),width:parseFloat(bar.style.width),zero:parseFloat(r.querySelector('.profit-zero').style.left),negative:bar.classList.contains('negative'),trackWidth:r.querySelector('.profit-track').getBoundingClientRect().width}}))
  assert.equal(bars[0].trackWidth,bars[1].trackWidth);assert.equal(bars[0].zero,bars[1].zero);assert.ok(bars[0].start>0);assert.equal(bars[1].start,0);assert.equal(bars[1].negative,true)
  assert.ok(Math.abs(bars[0].width/bars[1].width-(200000*1.06**3-200000)/54200)<1e-5)
  // Explicit historical switch resets BOTH manual rates and profits, while horizon remains.
  await periodButton(1).click()
  assert.equal(await page.locator('#assumed-SPY').inputValue(),'20.50');assert.equal(await page.locator('#assumed-VOO').inputValue(),'20.50')
  assert.equal(await page.getByLabel('Investiční horizont',{exact:true}).inputValue(),'3')
  assert.notEqual(await profit('VOO'),'-54200,00Kč');assert.ok((await page.locator('.history-coverage').innerText()).includes('52 týdnů'))
  await page.locator('#assumed-SPY').fill('6');await page.locator('#assumed-VOO').fill('-10')
  await page.getByRole('button',{name:'Obnovit podle historie',exact:true}).click()
  assert.equal(await page.locator('#assumed-SPY').inputValue(),'20.50');assert.equal(await page.locator('#assumed-VOO').inputValue(),'20.50')
  await periodButton(3).click()
  for(const ticker of ['SPY','VOO']){const r=observed.find(r=>r.ticker===ticker);assert.equal(await page.locator(`#assumed-${ticker}`).inputValue(),((Math.pow(1+r.r3/100,1/3)-1)*100).toFixed(2))}
  assert.ok((await page.locator('.history-coverage').innerText()).includes('156 týdnů'))
  // A single fund remains usable, with its own full-scale profit.
  await page.locator('.real-etf-option').filter({hasText:'VOO'}).locator('input').uncheck()
  assert.equal(await page.locator('.profit-row').count(),1);assert.equal(await page.locator('.historical-chart svg polyline').count(),1)
  assert.equal(await page.locator('.profit-bar').evaluate(el=>el.style.width),'100%')
  await page.locator('.real-etf-option').filter({hasText:'VOO'}).locator('input').check()
  for(const ticker of ['IVV','VTI','IWM'])await page.locator('.real-etf-option').filter({hasText:ticker}).locator('input').check()
  assert.equal(await page.locator('.profit-row').count(),5);assert.equal(await page.locator('.history-legend li').count(),5)
  assert.equal(await page.locator('.historical-chart svg polyline').count(),5)
  await periodButton(5).click()
  assert.ok((await page.locator('.history-coverage').innerText()).includes('Pětiletý výnos je souhrnný'))
  for(const ticker of ['SPY','VOO','IVV','VTI','IWM']){const r=observed.find(r=>r.ticker===ticker);assert.equal(await page.locator(`#assumed-${ticker}`).inputValue(),((Math.pow(1+r.r5/100,1/5)-1)*100).toFixed(2))}
  for(const ticker of ['SPY','VOO','IVV','VTI','IWM'])await page.locator(`#assumed-${ticker}`).fill('1')
  assert.equal(await page.getByRole('button',{name:'Obnovit podle historie',exact:true}).count(),1)
  await page.getByRole('button',{name:'Obnovit podle historie',exact:true}).click()
  for(const ticker of ['SPY','VOO','IVV','VTI','IWM']){const r=observed.find(r=>r.ticker===ticker);assert.equal(await page.locator(`#assumed-${ticker}`).inputValue(),((Math.pow(1+r.r5/100,1/5)-1)*100).toFixed(2))}
  await page.getByLabel('Prohlédnout historický týden').fill('0');assert.ok((await page.locator('.history-tooltip').innerText()).includes('100.00'))
  await page.getByLabel('Prohlédnout historický týden').fill('156');assert.ok((await page.locator('.history-tooltip').innerText()).includes('9. 10. 2026'))
  await page.locator('.historical-chart svg').hover({position:{x:80,y:80}});assert.ok(!(await page.locator('.history-tooltip strong').innerText()).includes('9. 10. 2026'))
  await page.locator('#assumed-SPY').fill('6');await page.locator('#assumed-VOO').fill('-10')
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  await page.locator('.investment-section').screenshot({path:`.cache/profit-${width}.png`})
  await page.locator('#assumed-SPY').fill('-101');assert.ok((await profit('SPY')).includes('Zadejte'));assert.equal(await page.locator('.profit-row').filter({has:page.locator('#assumed-SPY')}).locator('.profit-bar').count(),0)
  await page.locator('#assumed-SPY').fill('-100');assert.equal(await profit('SPY'),'-200000,00Kč')
  assert.equal(await page.locator('.cost-chart').count(),0);assert.equal(await page.getByRole('button',{name:'Hypotetický scénář',exact:true}).count(),0)
  assert.ok(await page.evaluate(()=>document.querySelector('.historical-section').compareDocumentPosition(document.querySelector('.comparison-section'))&4))
  // Protected calculators no longer navigate to an email form.
  assert.equal(await page.locator('#email').count(),0)
  assert.equal(await page.locator('#assumed-SPY').inputValue(),'-100');assert.equal(await page.locator('#assumed-VOO').inputValue(),'-10');assert.equal(await page.locator('#investment').inputValue(),'200000')
  await page.locator('#investment-range').fill('100000');assert.equal(await page.locator('#investment').inputValue(),'100000')
  // Extreme valid amounts remain readable on narrow screens.
  await page.locator('#investment').fill('10000000');await page.getByLabel('Investiční horizont',{exact:true}).selectOption('20');await page.locator('#assumed-SPY').fill('100')
  assert.equal(requests,1);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  console.log(`PASS profit-only bars/shared zero, direct rates, reset/reference/graph, single and five funds, form return and responsiveness at ${width}px`);await page.close()
 }
 for(const unavailable of ['null','outage']){
  const page=await browser.newPage({viewport:{width:320,height:900}})
  await page.route('**/api/**',async route=>{
   if(new URL(route.request().url()).pathname==='/api/comparison')await route.fulfill({json:saved})
   else if(new URL(route.request().url()).pathname==='/api/catalog')await route.fulfill({json:{funds,privacy:null}})
   else if(unavailable==='outage')await route.fulfill({status:503,json:{error:'Unavailable'}})
   else await route.fulfill({json:{funds:performance.map(r=>({...r,r1:null,r3:null,r5:null,weeklyReturns:[]})),unavailable:[]}})
  })
  await page.goto(`${base}/?comparison=${id}`);await page.getByRole('button',{name:'Odmítnout',exact:true}).click()
  await page.locator('#assumed-SPY').waitFor();if(unavailable==='outage')await page.getByText('Historická data nyní nejsou dostupná.',{exact:false}).first().waitFor()
  assert.equal(await page.locator('#assumed-SPY').inputValue(),'')
  await page.locator('#assumed-SPY').fill('0');assert.ok((await page.getByTestId('profit-SPY').innerText()).replace(/\s/g,'').includes('0,00'))
  assert.equal(await page.locator('.historical-chart svg').count(),0)
  console.log(`PASS ${unavailable} history leaves assumptions empty and manual model functional`);await page.close()
 }
}finally{await browser.close()}
