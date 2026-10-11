import { Application,HttpError } from '../server/application.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { historicalValue,annualizedReturn,scenarioSeries } from '../shared/performance.js'
import { normalizePerformance,fetchPerformance,createPerformanceCache } from '../server/performance.js'
const observations=JSON.parse(await readFile('data/review/performance-observations.json','utf8'))
const sample=observations.funds[0]
test('real observed five-fund snapshots retain cumulative values, price dates and attribution without raw histories',()=>{
 assert.equal(observations.funds.length,5)
 for(const raw of observations.funds){
  const result=normalizePerformance(raw,raw.ticker,raw.retrievedAt)
  assert.equal(result.r3,raw.r3);assert.equal(result.r5,raw.r5);assert.equal(result.asOf,'2026-10-09')
  assert.equal(result.sourceUrl,raw.sourceUrl);assert.equal(result.license,'CC BY 4.0')
  assert.equal('weekly' in result,false);assert.equal('last_close' in result,false)
 }
})
test('historical and compound calculations distinguish cumulative returns, losses, null and annualized tempo',()=>{
 assert.equal(historicalValue(100000,87.1),187100)
 assert.equal(historicalValue(100000,-20),80000);assert.equal(historicalValue(100000,-100),0)
 assert.equal(historicalValue(100000,null),null);assert.equal(annualizedReturn(null,5),null)
 assert.ok(Math.abs(annualizedReturn(33.1,3)!-10)<1e-9)
 assert.equal(annualizedReturn(-100,5),-100)
 assert.ok(Math.abs(scenarioSeries(100000,10,3).at(-1)!.value-133100)<1e-6)
 assert.equal(scenarioSeries(100000,-10,2).at(-1)!.value,81000)
 assert.equal(scenarioSeries(100000,-100,2).at(-1)!.value,0)
 assert.equal(scenarioSeries(100000,0,30).at(-1)!.value,100000)
 assert.throws(()=>historicalValue(100,-101));assert.throws(()=>scenarioSeries(100,NaN,2));assert.throws(()=>scenarioSeries(100,2,31));assert.throws(()=>scenarioSeries(100,2,1.5))
})
test('normalizer refuses wrong identity, venue, license, invalid or future source dates and malformed returns',()=>{
 assert.equal(normalizePerformance({...sample,r1:null,r3:undefined},'SPY').r1,null)
 assert.equal(normalizePerformance({...sample,r1:null,r3:undefined},'SPY').r3,null)
 for(const patch of [{ticker:'VOO'},{identifiers:{exchange:'Nasdaq',asset_type:'etf'}},{license:'unknown'},{as_of:null},{as_of:'2026-02-30'},{as_of:'2099-01-01'},{r3:'87.1'},{r5:-101}])assert.throws(()=>normalizePerformance({...sample,...patch},'SPY'))
})
test('loader is fixed, timed out safely and cache coalesces requests and preserves last valid figures on partial failure',async()=>{
 let url=''
 const loaded=await fetchPerformance('SPY',async input=>{url=String(input);return new Response(JSON.stringify(sample))})
 assert.equal(url,sample.sourceUrl);assert.equal(loaded.r1,20.5)
 await assert.rejects(fetchPerformance('UNKNOWN',async()=>{throw Error('should not fetch')}))
 await assert.rejects(fetchPerformance('SPY',async()=>new Response('{}',{status:503})))
 await assert.rejects(fetchPerformance('SPY',async(_input,options)=>new Promise((_resolve,reject)=>options?.signal?.addEventListener('abort',()=>reject(Error('timeout')))),5))
 let time=0,calls=0,fail=false
 const cache=createPerformanceCache(async ticker=>{calls++;if(fail&&ticker==='SPY')throw Error('timeout');const raw=observations.funds.find((r:{ticker:string})=>r.ticker===ticker);return normalizePerformance(raw,ticker)},()=>time)
 const [a,b]=await Promise.all([cache(),cache()]);assert.equal(a,b);assert.equal(calls,5)
 await cache();assert.equal(calls,5)
 time+=86400001;fail=true;const stale=await cache();assert.equal(stale.funds.find(f=>f.ticker==='SPY')!.r1,20.5);assert.equal(stale.funds.find(f=>f.ticker==='SPY')!.stale,true);assert.deepEqual(stale.unavailable,['SPY'])
 let failures=0
 const down=createPerformanceCache(async()=>{failures++;throw Error('unavailable')},()=>time)
 await assert.rejects(down());await assert.rejects(down());assert.equal(failures,5)
})
test('protected performance endpoint checks the session before loading data and never exposes CDN cache',async t=>{
 const endpoint=(await import('../api/performance.js')).default
 const envKeys=['APP_BASE_URL','APP_ENV','RATE_LIMIT_SECRET','SUPABASE_URL','SUPABASE_SECRET_KEY'] as const
 const previous=envKeys.map(key=>process.env[key]);t.after(()=>envKeys.forEach((key,i)=>{if(previous[i]===undefined)delete process.env[key];else process.env[key]=previous[i]}))
 Object.assign(process.env,{APP_BASE_URL:'https://example.invalid',APP_ENV:'preview',RATE_LIMIT_SECRET:'x'.repeat(32),SUPABASE_URL:'https://test.supabase.co',SUPABASE_SECRET_KEY:'test-only-key'})
 t.mock.method(Application.prototype,'read',async(_id:unknown,session:string)=>{if(session!=='s'.repeat(43))throw new HttpError(401,'Unauthorized');return{id:'test'}})
 const urls:string[]=[],headers:Record<string,string>={};let status=0,body:unknown
 t.mock.method(globalThis,'fetch',async(input:string|URL|Request)=>{
  const url=String(input);urls.push(url)
  const row=observations.funds.find((r:{sourceUrl:string})=>r.sourceUrl===url)
  assert.ok(row);return new Response(JSON.stringify({...row,holdings:['DO NOT FORWARD'],last_close:123}))
 })
 const response={setHeader(key:string,value:string){headers[key]=value},status(code:number){status=code;return this},json(value:unknown){body=value}}
 await endpoint({method:'POST',headers:{}} as unknown as Parameters<typeof endpoint>[0],response as unknown as Parameters<typeof endpoint>[1]);assert.equal(status,405);assert.equal(urls.length,0)
 await endpoint({method:'GET',headers:{},query:{}} as unknown as Parameters<typeof endpoint>[0],response as unknown as Parameters<typeof endpoint>[1]);assert.equal(status,401);assert.equal(urls.length,0)
 await endpoint({method:'GET',headers:{cookie:`etf_session=${'s'.repeat(43)}`},query:{comparison:'test'}} as unknown as Parameters<typeof endpoint>[0],response as unknown as Parameters<typeof endpoint>[1])
 assert.equal(status,200);assert.equal(urls.length,5);assert.equal(headers['Cache-Control'],'private, no-store')
 const text=JSON.stringify(body);assert.equal(text.includes('DO NOT FORWARD'),false);assert.equal(text.includes('"weekly":'),false);assert.equal(text.includes('last_close'),false)
})
