import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { weeklyGrid,historicalLines } from '../shared/history.js'
import { normalizePerformance } from '../server/performance.js'
const audit=JSON.parse(await readFile('data/review/performance-observations.json','utf8'))
const records=audit.funds.map((r:{ticker:string})=>normalizePerformance(r,r.ticker))
test('licensed weekly decimal returns produce observed ETF history, never an invented five-year curve',()=>{
 const one=historicalLines(records,1),three=historicalLines(records,3),five=historicalLines(records,5)
 assert.equal(one.length,5);assert.equal(one[0].points.length,53);assert.equal(three[0].points.length,157)
 assert.deepEqual(five,three);assert.equal(three[0].points[0].value,100)
 assert.equal(three[0].points.at(-1)!.date,'2026-10-09');assert.equal(three[0].points[0].date,'2023-10-13')
 assert.ok(Math.abs(three[0].points[1].value-97.61)<1e-8) // −0.0239 is −2.39%, not −0.0239%.
 assert.ok(Math.abs(three[0].points.at(-1)!.value-187.171)<.01)
 assert.notDeepEqual(three[0].points,three[4].points)
 assert.equal(historicalLines([records[4]],1)[0].ticker,'IWM')
})
test('null weeks are never zero-filled or interpolated; comparison uses a shared contiguous suffix',()=>{
 const missing=structuredClone(records[0]);missing.weeklyReturns![140].returnFraction=null
 const lines=historicalLines([missing,records[1]],3)
 assert.equal(lines[0].points.length,16);assert.equal(lines[1].points.length,16)
 assert.deepEqual(lines[0].points.map(p=>p.date),lines[1].points.map(p=>p.date))
 missing.weeklyReturns![155].returnFraction=null;assert.equal(historicalLines([missing],3).length,0)
 assert.deepEqual(weeklyGrid(null,null,'2026-10-09'),[])
 assert.throws(()=>weeklyGrid([1,2],'2026-10-09','2026-10-09'))
 const bad=structuredClone(audit.funds[0]);bad.weekly[0]=-1.1
 assert.equal(normalizePerformance(bad,'SPY').historyUnavailable,true);assert.equal(normalizePerformance(bad,'SPY').r1,20.5)
 assert.throws(()=>weeklyGrid(audit.funds[0].weekly,'2026-10-08','2026-10-09'))
})
test('documented week grid distinguishes calendar ends and the last partial week from raw trading dates',()=>{
 const points=weeklyGrid(audit.funds[0].weekly,'2026-10-08','2026-10-08')
 assert.equal(points.at(-1)!.weekEnd,'2026-10-08');assert.equal(points.at(-2)!.weekEnd,'2026-10-02')
 const onlyLast={...records[0],weeklyReturns:points.map((p,i)=>({...p,returnFraction:i===155?p.returnFraction:null}))}
 assert.equal(historicalLines([onlyLast],3)[0].points[0].date,'2026-10-02')
})
