// The prepared operator-approved batch in isolated API fixtures; this does not prove a remote DB import.
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
const funds=JSON.parse(await readFile('data/priority-five.approved.json','utf8')).records
const observed=JSON.parse(await readFile('data/review/performance-observations.json','utf8')).funds
const performance=observed.map(r=>({...r,asOf:r.as_of,attributionUrl:`https://tickerinside.com/etf/${r.ticker.toLowerCase()}/`,currency:'USD'}))
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||undefined,args:['--no-sandbox']})
const base=process.env.TEST_BASE_URL??'http://127.0.0.1:4173'
try{
 for(const width of [320,1440]){
  const page=await browser.newPage({viewport:{width,height:900}})
  await page.route('**/api/**',async route=>{const path=new URL(route.request().url()).pathname;assert.ok(['/api/catalog','/api/performance'].includes(path));await route.fulfill({json:path==='/api/catalog'?{funds,privacy:null}:{funds:performance,unavailable:[]}})})
  await page.goto(base);await page.getByRole('button',{name:'Odmítnout',exact:true}).click()
  await page.locator('.comparison-table').waitFor()
  const credit=page.locator('.data-attribution');assert.equal(await credit.getByRole('link',{name:'TickerInside',exact:true}).getAttribute('href'),'https://tickerinside.com/api/')
  assert.equal(await credit.getByRole('link',{name:'CC BY 4.0',exact:true}).getAttribute('href'),'https://creativecommons.org/licenses/by/4.0/')
  assert.ok((await page.locator('.comparison-table').innerText()).includes('0,0945 %'))
  const spy=page.locator('.field-sources').filter({hasText:'Původ a ověření údajů · SPY'});await spy.locator('summary').click()
  assert.ok((await spy.innerText()).includes('Nákladovost · původ: Emitent'));assert.ok((await spy.innerText()).includes('Ticker · původ: TickerInside'))
  assert.equal(await spy.getByRole('link',{name:'TickerInside · stránka fondu SPY →'}).getAttribute('href'),'https://tickerinside.com/etf/spy/')
  await page.locator('.real-etf-option').filter({hasText:'VTI'}).locator('input').check()
  assert.ok((await page.locator('.comparison-table').innerText()).includes('Morningstar US Total Market Index'))
  const vti=page.locator('.field-sources').filter({hasText:'Původ a ověření údajů · VTI'});await vti.locator('summary').click();assert.ok((await vti.innerText()).includes('Název · původ: Emitent'))
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  console.log(`PASS accurate SPY/VTI, per-field origins/verification and TickerInside attribution at ${width}px`);await page.close()
 }
}finally{await browser.close()}
