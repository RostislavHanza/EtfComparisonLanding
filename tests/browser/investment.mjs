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
const cost=ticker=>funds.find(f=>f.ticker===ticker).expenseRatioPercent
const prefill=(ticker,years)=>{const r=observed.find(r=>r.ticker===ticker)[`r${years}`];return (((1+r/100)**(1/years)/(1-cost(ticker)/100)-1)*100).toFixed(2)}
const expected=(ticker,investment,gross,years)=>investment*((1+gross/100)*(1-cost(ticker)/100))**years-investment
const formattedProfit=value=>(`${value>0?'+':''}${new Intl.NumberFormat('cs-CZ',{style:'currency',currency:'CZK',maximumFractionDigits:2}).format(value)}`).replace(/\s/g,'')

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
  const periodButton=year=>page.getByRole('group',{name:'Historické referenční období odhadu'}).getByRole('button',{name:year===1?'1 rok':year===3?'3 roky':'5 let',exact:true})
  const graphButton=year=>page.getByRole('group',{name:'Období historického grafu'}).getByRole('button',{name:year===1?'1 rok':year===3?'3 roky':'5 let',exact:true})
  const profit=async ticker=>(await page.getByTestId(`profit-${ticker}`).innerText()).replace(/\s/g,'')
  assert.equal(await page.locator('#assumed-SPY').inputValue(),prefill('SPY',5))
  assert.equal(await page.locator('#assumed-VOO').inputValue(),prefill('VOO',5))
  assert.equal(await page.getByText('02 / Odhadovaný výnos',{exact:true}).count(),1)
  assert.ok(await page.evaluate(()=>{const a=document.querySelector('#investment'),b=document.querySelector('#investment-horizon'),c=document.querySelector('.profit-comparison');return (a.compareDocumentPosition(b)&4)&&(b.compareDocumentPosition(c)&4)}))
  assert.equal(await page.locator('.investment-card').count(),0)
  assert.equal(await page.getByRole('table',{name:'Srovnání odhadovaných zisků'}).count(),1)
  assert.equal(await page.getByRole('columnheader',{name:'Předpokládaný výnos ročně (%)',exact:true}).count(),1)
  assert.equal(await page.getByRole('button',{name:'Obnovit podle historie',exact:true}).count(),1)
  assert.equal(await page.locator('#profit-history-note').count(),1);assert.equal(await page.locator('#profit-history-note').innerText(),'Procenta jsou předvyplněna podle historické výkonnosti.');assert.equal(await page.getByRole('columnheader',{name:'Odhadovaný zisk',exact:true}).count(),1)
  assert.equal(await page.locator('.profit-comparison tbody tr').last().getAttribute('class'),'profit-controls-row')
  assert.equal(await page.locator('.profit-controls-row #profit-history-note,.profit-controls-row .restore-history,.profit-controls-row [role=group]').count(),3)
  assert.equal(await page.getByRole('heading',{name:'Detailní přehled.',exact:true}).count(),1)
  assert.equal(await page.locator('.comparison-section .eyebrow').textContent(),'04 / Srovnání')
  assert.equal(await page.locator('.profit-row label,.profit-row button,.profit-row small').count(),0)
  for(const ticker of ['SPY','VOO'])await page.locator(`#assumed-${ticker}`).fill('0')
  for(const horizon of [1,3,5,10,20]){await page.getByLabel('Investiční horizont',{exact:true}).selectOption(String(horizon));for(const ticker of ['SPY','VOO'])assert.equal(await profit(ticker),formattedProfit(expected(ticker,100000,0,horizon)))}
  assert.notEqual(await profit('SPY'),await profit('VOO'));assert.equal(await page.locator('.profit-bar.negative').count(),2)
  // Display profit, not future value; edit immediately, preserve independent assumptions.
  await page.getByLabel('Investiční horizont',{exact:true}).selectOption('1');await page.locator('#assumed-SPY').fill('62')
  assert.equal(await profit('SPY'),formattedProfit(expected('SPY',100000,62,1)))
  await page.locator('#assumed-VOO').fill('1')
  const trackWidths=await page.locator('.profit-track').evaluateAll(tracks=>tracks.map(el=>el.getBoundingClientRect().width));assert.equal(trackWidths[0],trackWidths[1])
  await page.locator('#assumed-SPY').fill('6');await page.locator('#assumed-VOO').fill('-10')
  await page.locator('#investment').fill('200000');await page.getByLabel('Investiční horizont',{exact:true}).selectOption('3')
  assert.equal(await page.locator('#assumed-SPY').inputValue(),'6');assert.equal(await page.locator('#assumed-VOO').inputValue(),'-10')
  assert.equal(await profit('VOO'),formattedProfit(expected('VOO',200000,-10,3)))
  const bars=await page.locator('.profit-row').evaluateAll(rows=>rows.map(r=>{const bar=r.querySelector('.profit-bar');return{start:parseFloat(bar.style.left),width:parseFloat(bar.style.width),zero:parseFloat(r.querySelector('.profit-zero').style.left),negative:bar.classList.contains('negative'),trackWidth:r.querySelector('.profit-track').getBoundingClientRect().width}}))
  assert.equal(bars[0].trackWidth,bars[1].trackWidth);assert.equal(bars[0].zero,bars[1].zero);assert.ok(bars[0].start>0);assert.equal(bars[1].start,0);assert.equal(bars[1].negative,true)
  assert.ok(Math.abs(bars[0].width/bars[1].width-expected('SPY',200000,6,3)/Math.abs(expected('VOO',200000,-10,3)))<1e-5)
  // Explicit historical switch resets BOTH manual rates and profits, while horizon remains.
  await periodButton(1).click()
  assert.equal(await page.locator('#assumed-SPY').inputValue(),prefill('SPY',1));assert.equal(await page.locator('#assumed-VOO').inputValue(),prefill('VOO',1))
  assert.equal(await page.getByLabel('Investiční horizont',{exact:true}).inputValue(),'3')
  assert.notEqual(await profit('VOO'),'-54200,00Kč');assert.ok((await page.locator('.history-coverage').innerText()).includes('156 týdnů'))
  const initialModel={spy:await profit('SPY'),voo:await profit('VOO'),bars:await page.locator('.profit-bar').evaluateAll(es=>es.map(e=>e.getAttribute('style')))}
  await graphButton(1).click();assert.ok((await page.locator('.history-coverage').innerText()).includes('52 týdnů'))
  assert.equal(await profit('SPY'),initialModel.spy);assert.equal(await profit('VOO'),initialModel.voo);assert.deepEqual(await page.locator('.profit-bar').evaluateAll(es=>es.map(e=>e.getAttribute('style'))),initialModel.bars)
  await page.locator('#assumed-SPY').fill('6');await page.locator('#assumed-VOO').fill('-10')
  await page.getByRole('button',{name:'Obnovit podle historie',exact:true}).click()
  assert.equal(await page.locator('#assumed-SPY').inputValue(),prefill('SPY',1));assert.equal(await page.locator('#assumed-VOO').inputValue(),prefill('VOO',1))
  await periodButton(3).click()
  for(const ticker of ['SPY','VOO']){assert.equal(await page.locator(`#assumed-${ticker}`).inputValue(),prefill(ticker,3))}
  assert.ok((await page.locator('.history-coverage').innerText()).includes('52 týdnů'))
  await graphButton(3).click();assert.ok((await page.locator('.history-coverage').innerText()).includes('156 týdnů'))
  // A single fund remains usable, with its own full-scale profit.
  await page.locator('.real-etf-option').filter({hasText:'VOO'}).locator('input').uncheck()
  assert.equal(await page.locator('.profit-row').count(),1);assert.equal(await page.locator('.historical-chart svg polyline').count(),1);assert.equal(await page.locator('.comparison-table thead th').count(),2)
  assert.equal(await page.locator('.profit-bar').evaluate(el=>el.style.width),'100%')
  await page.locator('.real-etf-option').filter({hasText:'VOO'}).locator('input').check()
  for(const ticker of ['IVV','VTI','IWM'])await page.locator('.real-etf-option').filter({hasText:ticker}).locator('input').check()
  assert.equal(await page.locator('.profit-row').count(),5);assert.equal(await page.locator('.history-legend li').count(),5)
  assert.equal(await page.locator('.historical-chart svg polyline').count(),5)
  await periodButton(5).click();assert.ok(!(await page.locator('.history-coverage').innerText()).includes('Pětiletý výnos je souhrnný'))
  await graphButton(5).click()
  assert.ok((await page.locator('.history-coverage').innerText()).includes('Pětiletý výnos je souhrnný'))
  for(const ticker of ['SPY','VOO','IVV','VTI','IWM']){assert.equal(await page.locator(`#assumed-${ticker}`).inputValue(),prefill(ticker,5))}
  for(const ticker of ['SPY','VOO','IVV','VTI','IWM'])await page.locator(`#assumed-${ticker}`).fill('1')
  assert.equal(await page.getByRole('button',{name:'Obnovit podle historie',exact:true}).count(),1)
  await page.getByRole('button',{name:'Obnovit podle historie',exact:true}).click()
  for(const ticker of ['SPY','VOO','IVV','VTI','IWM']){assert.equal(await page.locator(`#assumed-${ticker}`).inputValue(),prefill(ticker,5))}
  await page.getByLabel('Prohlédnout historický týden').fill('0');assert.ok((await page.locator('.history-tooltip').innerText()).includes('100.00'))
  await page.getByLabel('Prohlédnout historický týden').fill('156');assert.ok((await page.locator('.history-tooltip').innerText()).includes('9. 10. 2026'))
  await page.locator('.historical-chart svg').hover({position:{x:80,y:80}});assert.ok(!(await page.locator('.history-tooltip strong').innerText()).includes('9. 10. 2026'))
  await page.locator('#assumed-SPY').fill('6');await page.locator('#assumed-VOO').fill('-10')
  const manualProfit=await profit('VOO');await graphButton(1).click();assert.equal(await page.locator('#assumed-VOO').inputValue(),'-10');assert.equal(await profit('VOO'),manualProfit);await graphButton(5).click()
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
  console.log(`PASS profit-only bars/shared zero, direct rates, reset/reference/graph, single and five funds, form return and responsiveness at ${width}px`);
  // Synthetic sixth fund stays isolated in test responses; no invented production history.
  const extra={ticker:'TESTEXTRA',name:'TEST ONLY EXTRA FUND',exchange:'NYSE Arca',index:'TEST ONLY',expenseRatioPercent:.03,dividends:'TEST ONLY',description:'TEST ONLY',verifiedAt:new Date().toISOString(),dataAsOf:new Date().toISOString(),sources:[]}
  const expanded=[...funds,extra];await page.unroute('**/api/**')
  await page.route('**/api/**',async route=>{const path=new URL(route.request().url()).pathname;await route.fulfill({json:path==='/api/catalog'?{funds:expanded,privacy:null}:path==='/api/comparison'?{...saved,tickers:expanded.map(f=>f.ticker),funds:expanded}:{funds:performance,unavailable:[]}})})
  await page.reload();await page.locator('#assumed-TESTEXTRA').waitFor();assert.equal(await page.locator('.profit-row').count(),6)
  assert.equal(await page.locator('#assumed-TESTEXTRA').inputValue(),'');await page.locator('#assumed-TESTEXTRA').fill('4');assert.ok(!(await profit('TESTEXTRA')).includes('Zadejte'))
  assert.equal(await page.locator('.comparison-table thead th').count(),7)
  await page.getByRole('group',{name:'Období historického grafu'}).getByRole('button',{name:'1 rok',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.historical-chart svg polyline').length===5)
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  console.log(`PASS six-fund calculator/table and honest missing history at ${width}px`);await page.close()
 }
 // Actual expanded metadata and licensed observations, mocked API only; no remote services.
 const remaining=JSON.parse(await readFile('data/remaining-twelve.approved.json','utf8')).records
 const remainingHistory=JSON.parse(await readFile('data/review/remaining-fifteen.performance.json','utf8')).funds
 const expandedMetadata=[...funds,...remaining],expandedHistory=[...performance,...remainingHistory.map(r=>({...r,asOf:r.as_of,attributionUrl:`https://tickerinside.com/etf/${r.ticker.toLowerCase()}/`,currency:'USD',weeklyReturns:r.weekly.map((value,i)=>({weekEnd:new Date(Date.parse(r.weeks_end)-(155-i)*7*86400000).toISOString().slice(0,10),returnFraction:value}))}))]
 for(const width of [320,1440]){
  const page=await browser.newPage({viewport:{width,height:900}})
  await page.route('**/api/**',async route=>{const path=new URL(route.request().url()).pathname;await route.fulfill({json:path==='/api/catalog'?{funds:expandedMetadata,privacy:null}:path==='/api/comparison'?{...saved,tickers:expandedMetadata.map(f=>f.ticker),funds:expandedMetadata}:{funds:expandedHistory,unavailable:[]}})})
  await page.goto(`${base}/?comparison=${id}`);await page.getByRole('button',{name:'Odmítnout',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#assumed-ITOT')?.value!=='')
  assert.equal(await page.locator('.profit-row').count(),17);assert.equal(await page.locator('.historical-chart svg polyline').count(),17)
  await page.locator('#catalog-search').fill('ITOT');assert.equal(await page.locator('.real-etf-option').count(),1);assert.equal(await page.locator('.real-etf-option input').isChecked(),true)
  await page.getByLabel('Investiční horizont',{exact:true}).selectOption('1');await page.locator('#assumed-ITOT').fill('0')
  assert.equal((await page.getByTestId('profit-ITOT').innerText()).replace(/\s/g,''),'-30,00Kč')
  assert.ok((await page.locator('.comparison-table').innerText()).includes('Morningstar US Large Cap Growth Index'))
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  console.log(`PASS actual 17-fund catalog, ITOT selection/cost, new history and Morningstar metadata at ${width}px`);await page.close()
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
  await page.locator('#assumed-SPY').fill('0');assert.equal((await page.getByTestId('profit-SPY').innerText()).replace(/\s/g,''),formattedProfit(expected('SPY',100000,0,10)))
  assert.equal(await page.locator('.historical-chart svg').count(),0)
  await page.getByRole('group',{name:'Období historického grafu'}).getByRole('button',{name:'1 rok',exact:true}).click();assert.equal(await page.locator('#assumed-SPY').inputValue(),'0')
  await page.getByRole('group',{name:'Historické referenční období odhadu'}).getByRole('button',{name:'3 roky',exact:true}).click();assert.equal(await page.locator('#assumed-SPY').inputValue(),'')
  console.log(`PASS ${unavailable} history leaves assumptions empty and manual model functional`);await page.close()
 }
}finally{await browser.close()}
