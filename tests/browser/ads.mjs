import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const snapshots = JSON.parse(await readFile('data/review/performance-observations.json', 'utf8')).funds
const gross = (ticker, years, fee) => {
  const cumulative = snapshots.find(f => f.ticker === ticker)[`r${years}`]
  return (((1 + cumulative / 100) ** (1 / years)) / (1 - fee / 100) - 1) * 100
}
const numberValue=async locator=>Number((await locator.inputValue()).replace(/\s/g,'').replace(',','.'))
const shown=value=>new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:2}).format(value)
const spyDefault = gross('SPY', 5, .0945), vooDefault = gross('VOO', 5, .03)
const base = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:4173'
const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || undefined, args: ['--no-sandbox'] })
const format = value => `${value > 0 ? '+' : ''}${new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 2 }).format(value)}`
const expected = (amount, rate, years, fee) => format(amount * ((1 + rate / 100) * (1 - fee / 100)) ** years - amount)
try {
  for (const width of [320, 390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: width < 700, isMobile: width < 700 })
    const requests = [], errors = []
    page.on('request', request => requests.push(request.url()))
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${base}/add`)
    await page.locator('#profit-SPY').waitFor()
    assert.equal(await page.title(), 'Ukázka ETF kalkulačky · SPY a VOO')
    assert.equal(await page.getByRole('heading', { level: 1 }).textContent(), 'Kalkulačka výnosů')
    assert.equal(await page.locator('.eyebrow').count(),0)
    assert.equal(await page.locator('.intro').textContent(), 'Vyzkoušejte, jak částka, čas a průběžné náklady mění odhadovaný zisk.')
    assert.deepEqual(await page.locator('.disclaimer').allTextContents(), ['Hypotetický model zahrnuje roční nákladovost ETF. Nezahrnuje měnové změny, daně ani poplatky brokera. Investování může vést ke ztrátě.'])
    const check = async (amount, spy, voo, years) => {
      assert.equal(await page.locator('#profit-SPY').textContent(), expected(amount, spy, years, .0945))
      assert.equal(await page.locator('#profit-VOO').textContent(), expected(amount, voo, years, .03))
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    }
    assert.equal(await page.locator('tfoot .history-row').count(),1)
    assert.equal(await page.locator('tfoot [data-period]').count(),3)
    assert.equal(await page.locator('tfoot #restore').count(),1)
    assert.equal(await page.locator('tfoot #reference').count(),1)
    assert.ok(await page.locator('tfoot').evaluate(footer=>footer.getBoundingClientRect().top>=document.querySelector('#funds').getBoundingClientRect().bottom))
    const slider=page.locator('#investment-range')
    assert.equal(await slider.getAttribute('min'),'0')
    assert.equal(await slider.getAttribute('max'),'10000000')
    assert.equal(await slider.getAttribute('step'),'1000')
    assert.ok(await slider.evaluate(e=>e.getBoundingClientRect().top>=document.querySelector('#investment').getBoundingClientRect().bottom))
    await check(100000, spyDefault, vooDefault, 10)
    await page.reload(); await check(100000, spyDefault, vooDefault, 10)
    for (const years of [1, 3, 5]) {
      await page.getByRole('button', { name: years === 1 ? '1 rok' : years === 3 ? '3 roky' : '5 let', exact: true }).click()
      assert.equal(await page.locator('#rate-SPY').inputValue(), shown(gross('SPY', years, .0945)))
      assert.equal(await page.locator('#rate-VOO').inputValue(), shown(gross('VOO', years, .03)))
      assert.equal(await page.locator('#reference').textContent(),'Historické referenční období.')
      await check(100000, gross('SPY', years, .0945), gross('VOO', years, .03), 10)
      await page.locator('#rate-SPY').fill('2')
      await page.locator('#rate-VOO').fill('4')
      await page.getByRole('button', { name: 'Obnovit podle historie', exact: true }).click()
      await check(100000, gross('SPY', years, .0945), gross('VOO', years, .03), 10)
    }
    await page.locator('#investment').fill('200000'); await check(200000, spyDefault, vooDefault, 10)
    await page.locator('#horizon').fill('3'); await check(200000, spyDefault, vooDefault, 3)
    await page.locator('#rate-SPY').fill('0'); await check(200000, 0, vooDefault, 3)
    assert.equal(await page.locator('#rate-VOO').inputValue(), shown(vooDefault))
    assert.equal(await page.locator('tr:has(#rate-SPY) .bar.negative').count(), 1)
    await page.locator('#rate-VOO').fill('-4'); await check(200000, 0, -4, 3)
    for(const amount of [0,10000000,300000]){
      await slider.fill(String(amount))
      assert.equal(await numberValue(page.locator('#investment')),amount)
      await check(amount,0,-4,3)
      if(amount===0)assert.ok((await page.locator('.bar').evaluateAll(es=>es.map(e=>parseFloat(e.style.width)))).every(w=>w===0))
    }
    if(width<700){
      await slider.scrollIntoViewIfNeeded()
      const bounds=await slider.boundingBox()
      await page.touchscreen.tap(bounds.x+bounds.width*.65,bounds.y+bounds.height/2)
      const amount=Number(await slider.inputValue())
      assert.ok(amount>0&&amount<10000000)
      assert.equal(await numberValue(page.locator('#investment')),amount)
      await check(amount,0,-4,3)
      await slider.fill('300000')
    }
    await slider.focus();await page.keyboard.press('ArrowRight')
    assert.equal(await numberValue(page.locator('#investment')),301000)
    await check(301000,0,-4,3)
    await page.locator('#investment').fill('200000')
    assert.equal(await slider.inputValue(),'200000')
    assert.equal(await slider.getAttribute('aria-valuetext'),new Intl.NumberFormat('cs-CZ',{style:'currency',currency:'CZK',maximumFractionDigits:2}).format(200000))
    await check(200000,0,-4,3)

    await page.locator('#investment').fill('100000'); assert.equal(await slider.inputValue(),'100000'); await check(100000, 0, -4, 3)
    await page.locator('#investment').fill('200000'); await check(200000, 0, -4, 3)
    await page.locator('#horizon').fill('1')
    await page.locator('#rate-VOO').fill('0'); await check(200000, 0, 0, 1)
    assert.equal(await page.locator('.bar.negative').count(), 2)
    const widths = await page.locator('.bar').evaluateAll(bars => bars.map(b => parseFloat(b.style.width)))
    // CSSOM serializes percentage styles with fewer digits than the numeric model.
    assert.ok(Math.abs(widths[1] / widths[0] - .03 / .0945) < 1e-6)
    await page.locator('#rate-SPY').fill('')
    assert.equal(await page.locator('#profit-SPY').textContent(), '—')
    assert.equal(await page.locator('#error').isVisible(), true)
    await page.locator('#rate-SPY').fill('6'); assert.equal(await page.locator('#error').isVisible(), false)
    await page.getByRole('button', { name: '3 roky', exact: true }).click()
    await check(200000, gross('SPY', 3, .0945), gross('VOO', 3, .03), 1)
    assert.equal(await numberValue(page.locator('#investment')), 200000)
    assert.equal(await page.locator('#horizon').inputValue(), '1')
    const hs=page.locator('#horizon-range')
    assert.equal(await hs.getAttribute('min'),'1');assert.equal(await hs.getAttribute('max'),'30');assert.equal(await hs.getAttribute('step'),'1')
    for(const years of [1,10,30]){await hs.fill(String(years));assert.equal(await page.locator('#horizon').inputValue(),String(years));await check(200000,gross('SPY',3,.0945),gross('VOO',3,.03),years)}
    await page.locator('#horizon').fill('5');assert.equal(await hs.inputValue(),'5')
    await page.locator('#rate-SPY').fill('1,2345');assert.equal(await page.locator('#rate-SPY').inputValue(),'1,2345')
    await page.locator('#rate-SPY').blur();assert.equal(await page.locator('#rate-SPY').inputValue(),'1,23')
    await check(200000,1.2345,gross('VOO',3,.03),5)
    await page.locator('#investment').fill('123456,789');await page.locator('#investment').blur()
    assert.equal(await page.locator('#investment').inputValue(),shown(123456.789));await check(123456.789,1.2345,gross('VOO',3,.03),5)
    if(width<700){
      await hs.scrollIntoViewIfNeeded();const box=await hs.boundingBox()
      await page.touchscreen.tap(box.x+box.width*.7,box.y+box.height/2)
      const years=Number(await hs.inputValue())
      assert.ok(Number.isInteger(years)&&years>=1&&years<=30)
      assert.equal(Number(await page.locator('#horizon').inputValue()),years)
      await check(123456.789,1.2345,gross('VOO',3,.03),years)
    }
    assert.ok(await page.locator('h1 em').evaluate(e=>getComputedStyle(e).color==='rgb(40, 76, 57)'&&getComputedStyle(e).fontStyle==='normal'))
    if(width<700)assert.ok(await page.locator('h1 em').evaluate(e=>Math.abs(e.getBoundingClientRect().x+e.getBoundingClientRect().width/2-innerWidth/2)<1))
    for(const fee of await page.locator('.fee-label').all())assert.ok(await fee.evaluate(e=>{const r=document.createRange();r.selectNodeContents(e);return r.getClientRects().length===1}))

    assert.equal(await page.getByRole('button', { name: '3 roky', exact: true }).getAttribute('aria-pressed'), 'true')
    for (const input of await page.locator('input').all()) assert.ok((await input.boundingBox()).height >= 44)
    assert.equal(await page.getByRole('link', { name: 'Vytvořit vlastní srovnání →' }).getAttribute('href'), '/?utm_campaign=ad-a#comparator')
    assert.equal(await page.locator('#root').count(), 0)
    assert.equal(requests.some(url => new URL(url).origin !== new URL(base).origin || new URL(url).pathname.startsWith('/api/')), false)
    assert.deepEqual(errors, [])
    if (width === 320) await page.screenshot({ path: '.cache/ads-320.png', fullPage: true })
    // Root remains the separate React app with its normal public selection and email gate.
    await page.route('**/api/catalog', route => route.fulfill({ json: { funds: [], privacy: null } }))
    await page.getByRole('link', { name: 'Vytvořit vlastní srovnání →' }).click()
    await page.locator('#comparator').waitFor()
    assert.equal(new URL(page.url()).pathname, '/')
    assert.equal(new URL(page.url()).hash, '#comparator');assert.equal(new URL(page.url()).searchParams.get('utm_campaign'),'ad-a')
    assert.equal(await page.locator('#rate-SPY').count(), 0)
    console.log(`PASS /add direct/reload, standalone requests, inputs/costs/common bars, CTA and root at ${width}px`)
    await page.close()
  }
  for(const [width,height] of [[390,844],[393,852],[360,800],[390,740],[320,568]]){
    const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true})
    await page.goto(`${base}/add`)
    const measured=await page.evaluate(()=>({height:document.documentElement.scrollHeight,width:document.documentElement.scrollWidth}))
    assert.ok(measured.width<=width)
    if(width>=360)assert.ok(measured.height<=height,`Content ${measured.height}px exceeds ${width}×${height}`)
    else {await page.getByRole('link',{name:'Vytvořit vlastní srovnání →'}).scrollIntoViewIfNeeded();assert.ok(await page.getByRole('link',{name:'Vytvořit vlastní srovnání →'}).isVisible())}
    console.log(`PASS compact ad ${width}×${height}, document height ${measured.height}px`)
    await page.close()
  }
} finally { await browser.close() }
