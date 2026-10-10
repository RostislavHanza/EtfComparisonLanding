import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { VercelRequest } from '@vercel/node'
import { comparisonInput, leadInput, attribution } from '../shared/validation.ts'
import { validateImport } from '../server/import-validation.ts'
import { guard, body, sessionCookie } from '../server/http.ts'
const input={tickers:['TESTA','TESTB'],amountCzk:100000,email:'test@example.invalid',marketingConsent:false}
test('server rejects malformed selections, amounts, consent, honeypot and attribution',()=>{
 assert.equal(comparisonInput({tickers:['A','B','C','D','E'],amountCzk:1.23}).tickers.length,5)
 for(const patch of [{tickers:['A']},{tickers:['A','A']},{tickers:['A','B','C','D','E','F']},{tickers:['a','B']},{amountCzk:NaN},{amountCzk:-1},{amountCzk:0.001},{amountCzk:10000001}])assert.throws(()=>comparisonInput({...input,...patch}))
 for(const patch of [{email:'bad'},{email:'a@b.com\r\nBcc: a@b.com'},{marketingConsent:'true'},{website:'bot'}])assert.throws(()=>leadInput({...input,...patch}))
 assert.equal(leadInput(input).marketingConsent,false);assert.equal(attribution({consent:false}),null);assert.throws(()=>attribution({consent:true,visitId:'-'.repeat(36)}))
})
function fixture(){const date=new Date().toISOString();return{ticker:'TESTONLY',name:'TEST ONLY, NOT A REAL FUND',exchange:'NYSE Arca',index:'TEST ONLY',expenseRatioPercent:0.03,dividends:'TEST ONLY',description:'TEST ONLY',verifiedAt:date,dataAsOf:date,verifiedBy:'TEST ONLY',sources:['name','exchange','index','expenseRatioPercent','dividends','description'].map(field=>({field,url:field==='exchange'?'https://nyse.com/test':'https://ssga.com/test',verified_at:date,as_of:date,evidence:'TEST ONLY'})),usageReview:{approved:true,reviewedAt:date,reviewer:'TEST ONLY',basis:'TEST ONLY',policyUrl:'https://ssga.com/test'}}}
test('import requires primary evidence for every field, freshness, exact venue and usage review',()=>{
 assert.equal(validateImport({records:[fixture()]})[0].published,true)
 for(const patch of [{exchange:'Nasdaq'},{verifiedAt:'2000-01-01'},{sources:[]},{usageReview:{approved:false}},{expenseRatioPercent:-1}])assert.throws(()=>validateImport({records:[{...fixture(),...patch}]}))
 const malicious=fixture();malicious.sources[0].url='https://ssga.com.attacker.invalid/source';assert.throws(()=>validateImport({records:[malicious]}))
 const duplicate=fixture();assert.throws(()=>validateImport({records:[duplicate,duplicate]}))
})
test('HTTP rejects cross-site changes, oversized JSON and wrong methods; sessions are HttpOnly and Secure',()=>{
 const old=process.env.APP_BASE_URL;process.env.APP_BASE_URL='https://example.invalid'
 try{
 const req={method:'POST',headers:{origin:'https://example.invalid','content-type':'application/json'},body:JSON.stringify(input)} as unknown as VercelRequest
 guard(req,['POST']);assert.deepEqual(body(req),input)
 assert.throws(()=>guard({...req,headers:{...req.headers,origin:'https://attacker.invalid'}} as VercelRequest,['POST']))
 assert.throws(()=>guard({...req,method:'DELETE'} as VercelRequest,['POST']))
 assert.throws(()=>body({...req,body:'x'.repeat(8193)} as VercelRequest));assert.throws(()=>body({...req,body:'invalid json'} as VercelRequest))
 assert.match(sessionCookie('x'.repeat(43)),/HttpOnly; SameSite=Lax.*; Secure$/)
 }finally{if(old===undefined)delete process.env.APP_BASE_URL;else process.env.APP_BASE_URL=old}
})
