// Browser fixtures only: no SMTP, Supabase or TickerInside requests.
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||undefined,args:['--no-sandbox']})
const base=process.env.TEST_BASE_URL??'http://127.0.0.1:4173'
try{
 for(const width of [320,390,768]){
  const page=await browser.newPage({viewport:{width,height:900}})
  let authenticated=false,confirmations=0,syncs=0,enabled=true
  await page.route('**/api/**',async route=>{
   const request=route.request(),path=new URL(request.url()).pathname,input=request.method()==='POST'?request.postDataJSON():null
   assert.equal(request.headers().authorization,undefined)
   if(!enabled){await route.fulfill({status:404,json:{error:'Stránka není dostupná.'}});return}
   if(path==='/api/preview-admin'){
    if(input?.action==='confirm'){confirmations++;authenticated=true;assert.equal(input.token,'t'.repeat(43))}
    if(input?.action==='logout')authenticated=false
    await route.fulfill({json:{authenticated}})
   }else if(path==='/api/etf-sync'){syncs++;await route.fulfill({json:{state:'partial',candidates:19,updated:0,failed:1}})}
   else throw Error('Unexpected route')
  })
  await page.goto(`${base}/?admin=etf-sync#admin-access=${'t'.repeat(43)}`)
  await page.getByRole('button',{name:'Potvrdit přihlášení',exact:true}).waitFor()
  assert.equal(confirmations,0);assert.equal(syncs,0);assert.ok(!page.url().includes('#'))
  assert.equal(await page.getByRole('button',{name:'Otestovat synchronizaci ETF'}).count(),0)
  await page.getByRole('button',{name:'Potvrdit přihlášení',exact:true}).click()
  await page.getByRole('button',{name:'Otestovat synchronizaci ETF'}).click()
  await page.getByRole('heading',{name:'Dokončeno s chybami'}).waitFor()
  assert.deepEqual(await page.locator('dd').allTextContents(),['19','0','1'])
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  await page.getByRole('button',{name:'Odhlásit se',exact:true}).click()
  await page.getByRole('button',{name:'Poslat přihlašovací odkaz administrátorovi'}).waitFor()
  enabled=false;await page.reload();await page.getByRole('status').filter({hasText:'Diagnostika není dostupná'}).waitFor()
  assert.equal(await page.locator('button').count(),0)
  console.log(`PASS Preview admin confirmation, sync counts, logout and disabled controls at ${width}px`)
  await page.close()
 }
}finally{await browser.close()}
