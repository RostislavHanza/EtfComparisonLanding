import {chromium} from 'playwright'
import assert from 'node:assert/strict'
const base=process.env.TEST_BASE_URL??'http://127.0.0.1:4173'
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||undefined,args:['--no-sandbox']})
try{
 for(const [width,height] of [[320,568],[360,640],[390,740],[393,852],[1440,900]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:width<700,hasTouch:width<700}),requests=[]
  page.on('request',r=>requests.push(r.url()))
  await page.goto(`${base}/add-simple`);await page.reload()
  assert.equal(await page.locator('h1').textContent(),'Americká ETF')
  assert.equal(await page.locator('#ad-subtitle').textContent(),'Vytvořte si svoje srovnání')
  assert.equal(await page.locator('h2').textContent(),'Co získáte ve svém srovnání?')
  assert.deepEqual(await page.locator('h3').allTextContents(),['Odhadovaný zisk','Historický vývoj','Detailní srovnání','Vlastní přehled na e-mail'])
  assert.deepEqual(await page.locator('.benefits-grid p').allTextContents(),['Spočítejte si výsledek podle vlastní částky, horizontu a předpokládaného výnosu.','Porovnejte historickou výkonnost vybraných ETF v grafu.','Prohlédněte si nákladovost, sledované indexy a další parametry fondů.','Získejte odkaz ke svému srovnání, ke kterému se můžete vracet.'])
  assert.equal(await page.locator('a').count(),1);assert.equal(await page.locator('button,input,form,svg,img,script').count(),0)
  assert.equal(await page.locator('a').getAttribute('href'),'/#comparator')
  assert.ok(requests.every(url=>new URL(url).origin===new URL(base).origin&&!new URL(url).pathname.startsWith('/api/')))
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=globalThis.innerHeight))
  await page.screenshot({path:`.cache/simple-ad-${width}.png`})
  await page.route('**/api/catalog',r=>r.fulfill({json:{funds:[],privacy:null}}))
  // A click on whitespace at the bottom belongs to the same single semantic anchor.
  const box=await page.locator('a').boundingBox()
  if(width<700)await page.touchscreen.tap(box.x+8,box.y+box.height-8)
  else {await page.locator('a').focus();await page.keyboard.press('Enter')}
  await page.locator('#comparator').waitFor();assert.equal(new URL(page.url()).hash,'#comparator')
  console.log(`PASS standalone simple ad ${width}×${height}, texts/height/one link/${width<700?'touch':'keyboard'}/root`)
  await page.close()
 }
}finally{await browser.close()}
