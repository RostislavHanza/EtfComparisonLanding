import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { scenarioProfit,profitScale,annualizedReturn,grossReturnFromNet } from '../shared/performance.js'
const close=(actual:number|null,expected:number)=>assert.ok(actual!==null&&Math.abs(actual-expected)<1e-7,`${actual} != ${expected}`)
test('gross return model includes annual fund expenses, losses and distinct actual costs',()=>{
 close(scenarioProfit(100000,0,1,.03),-30)
 close(scenarioProfit(100000,0,1,.0945),-94.5)
 close(scenarioProfit(100000,0,1,.19),-190)
 for(const years of [1,3,5,10,20]){
  close(scenarioProfit(100000,0,years,.03),100000*.9997**years-100000)
  close(scenarioProfit(200000,-10,years,.03),200000*(.9*.9997)**years-200000)
  close(scenarioProfit(100000,6,years,.19),100000*(1.06*.9981)**years-100000)
 }
 close(scenarioProfit(100000,0,20,0),0);close(scenarioProfit(0,6,20,.03),0)
 close(scenarioProfit(100000,-100,10,.03),-100000)
 assert.throws(()=>scenarioProfit(100000,-101,10,.03));assert.throws(()=>scenarioProfit(100000,NaN,10,.03))
 assert.throws(()=>scenarioProfit(100000,6,0,.03));assert.throws(()=>scenarioProfit(100000,6,31,.03))
 for(const cost of [null,NaN,-1,100,Infinity]){assert.equal(scenarioProfit(100000,0,10,cost),null);assert.equal(grossReturnFromNet(10,cost),null)}
 assert.equal(grossReturnFromNet(null,.03),null)
})
test('inverse historical prefill restores cumulative net returns without deducting expenses twice',async()=>{
 const funds=JSON.parse(await readFile('data/priority-five.approved.json','utf8')).records
 const history=JSON.parse(await readFile('data/review/performance-observations.json','utf8')).funds
 for(const fund of funds)for(const period of [1,3,5] as const){
  const cumulative=history.find((h:{ticker:string})=>h.ticker===fund.ticker)[`r${period}`]
  const net=annualizedReturn(cumulative,period),gross=grossReturnFromNet(net,fund.expenseRatioPercent)!
  assert.ok(gross>net!)
  close(scenarioProfit(100000,gross,period,fund.expenseRatioPercent),100000*cumulative/100)
 }
 for(const period of [1,3,5] as const)for(const cumulative of [-100,-20,0,33.1]){
  const gross=grossReturnFromNet(annualizedReturn(cumulative,period),.19)!
  close(scenarioProfit(100000,gross,period,.19),100000*cumulative/100)
 }
})
test('bars share a linear scale and zero for gains and losses; missing profit has no bar',()=>{
 assert.deepEqual(profitScale([100,200,null]),{zero:0,bars:[{start:0,width:50},{start:0,width:100},null]})
 const mixed=profitScale([-100,0,200,null]);assert.ok(Math.abs(mixed.zero-100/3)<1e-8)
 assert.equal(mixed.bars[0]!.start,0);assert.equal(mixed.bars[1]!.width,0)
 assert.ok(Math.abs(mixed.bars[2]!.width-200/3)<1e-8)
 assert.deepEqual(profitScale([-100,-200]),{zero:100,bars:[{start:50,width:50},{start:0,width:100}]})
 assert.deepEqual(profitScale([0,null]),{zero:0,bars:[{start:0,width:0},null]})
 assert.deepEqual(profitScale([null]),{zero:0,bars:[null]})
})
