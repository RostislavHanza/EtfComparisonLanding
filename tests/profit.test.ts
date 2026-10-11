import { test } from 'node:test'
import assert from 'node:assert/strict'
import { scenarioProfit,profitScale,annualizedReturn } from '../shared/performance.js'
test('estimated profit excludes principal and never deducts expense ratio twice',()=>{
 assert.equal(scenarioProfit(100000,62,1),62000)
 assert.ok(Math.abs(scenarioProfit(200000,-10,3)+54200)<1e-8)
 assert.equal(scenarioProfit(100000,0,20),0)
 assert.equal(scenarioProfit(100000,-100,10),-100000)
 assert.throws(()=>scenarioProfit(100000,-101,10))
 assert.throws(()=>scenarioProfit(100000,NaN,10))
 const rate=annualizedReturn(87.1,3)!
 assert.ok(Math.abs(scenarioProfit(100000,rate,3)-87100)<1e-8)
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
