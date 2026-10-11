import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loadPerformance } from '../src/performance-client.js'
test('private performance requests retain their comparison cache when responses arrive out of order',async t=>{
 const first='11111111-1111-4111-8111-111111111111',second='22222222-2222-4222-8222-222222222222'
 const release=new Map<string,(response:Response)=>void>();let calls=0
 t.mock.method(globalThis,'fetch',(input:string|URL|Request)=>{calls++;return new Promise<Response>(resolve=>release.set(new URL(String(input),'https://test.invalid').searchParams.get('comparison')!,resolve))})
 const a=loadPerformance(first),b=loadPerformance(second)
 release.get(second)!(Response.json({funds:[],unavailable:['SECOND TEST']}));assert.deepEqual((await b).unavailable,['SECOND TEST'])
 release.get(first)!(Response.json({funds:[],unavailable:['FIRST TEST']}));assert.deepEqual((await a).unavailable,['FIRST TEST'])
 assert.deepEqual((await loadPerformance(second)).unavailable,['SECOND TEST']);assert.equal(calls,2)
})
