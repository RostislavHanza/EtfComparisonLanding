import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile,writeFile,mkdtemp,rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { prepareApprovedCatalog,catalogDraftDigest } from '../server/catalog-approval.js'
import { validateImport } from '../server/import-validation.js'
const draft=JSON.parse(await readFile('data/review/priority-five.pending.json','utf8'))
const example=JSON.parse(await readFile('data/review/priority-five.batch-approval.example.json','utf8'))
function approval(){return {...structuredClone(example),reviewer:'TEST ONLY',verifiedAt:new Date().toISOString(),approvedTickers:['SPY','VOO','IVV','VTI','IWM'],confirmAllListedSources:true,usageReview:{approved:true,basis:'TEST ONLY: explicit synthetic review covering both licensed API and issuer factual supplements',policyUrl:'https://tickerinside.com/api/'}}}
test('simple batch review is explicit, bound to the exact draft and never inferred from data download',()=>{
 assert.equal(example.reviewedDraftSha256,catalogDraftDigest(draft));assert.throws(()=>prepareApprovedCatalog(draft,example))
 const prepared=prepareApprovedCatalog(draft,approval());assert.equal(validateImport(prepared).length,5)
 assert.equal(prepared.records[0].expenseRatioPercent,0.0945)
 const vti=prepared.records.find(r=>r.ticker==='VTI')!;assert.equal(vti.name,'Vanguard Morningstar Total Stock Market ETF');assert.equal(vti.index,'Morningstar US Total Market Index')
 assert.ok(vti.sources.some(s=>s.field==='name'&&s.role==='origin'&&s.provider==='issuer'&&s.date_basis==='observed_state'))
 const denied=approval();denied.usageReview.approved=false;assert.throws(()=>prepareApprovedCatalog(draft,denied))
 const changed=structuredClone(draft);changed.records[0].expenseRatioPercent=0.09;assert.throws(()=>prepareApprovedCatalog(changed,approval()),/verzi/)
 const duplicate=approval();duplicate.approvedTickers=['VOO','VOO'];assert.throws(()=>prepareApprovedCatalog(draft,duplicate),/duplicitní/)
 const two=approval();two.approvedTickers=['VOO','IVV'];assert.equal(prepareApprovedCatalog(draft,two).records.length,2)
})
test('field origins cannot claim missing API fields or confuse verification with origin',()=>{
 const prepared=prepareApprovedCatalog(draft,approval()),voo=prepared.records.find(r=>r.ticker==='VOO')!
 assert.ok(voo.sources.some(s=>s.field==='ticker'&&s.provider==='tickerinside'&&s.role==='origin'))
 assert.ok(voo.sources.some(s=>s.field==='exchange'&&s.provider==='issuer'&&s.role==='verification'))
 const missing=structuredClone(voo);missing.sources=missing.sources.filter(s=>s.field!=='ticker'||s.role!=='origin');assert.throws(()=>validateImport({records:[missing]}),/původ/)
 const wrong=structuredClone(voo);wrong.sources.find(s=>s.field==='index'&&s.role==='origin')!.provider='tickerinside';assert.throws(()=>validateImport({records:[wrong]}))
 const noLicense=structuredClone(voo);noLicense.sources.find(s=>s.provider==='tickerinside')!.license='unknown';assert.throws(()=>validateImport({records:[noLicense]}),/licencovaný/)
})
test('batch preparation and valid import dry run do not write to Supabase and refuse unapproved drafts',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'etf-review-test-'))
 try{
  const input=join(dir,'draft.json'),decision=join(dir,'TEST-ONLY-approval.json'),output=join(dir,'TEST-ONLY-import.json')
  await writeFile(input,JSON.stringify(draft));await writeFile(decision,JSON.stringify(approval()))
  const run=(script:string,args:string[])=>execFileSync(process.execPath,['--import','tsx',script,...args],{encoding:'utf8',stdio:'pipe'})
  assert.match(run('scripts/prepare-etf-import.ts',[input,decision,output]),/nebyl importován/)
  assert.match(run('scripts/import-etfs.ts',[output]),/Pouze dry run/)
  assert.throws(()=>run('scripts/prepare-etf-import.ts',[input,decision,output])) // Existing reviewed output is never overwritten.
  await writeFile(decision,JSON.stringify(example));assert.throws(()=>run('scripts/prepare-etf-import.ts',[input,decision,join(dir,'denied.json')]))
 }finally{await rm(dir,{recursive:true,force:true})}
})
