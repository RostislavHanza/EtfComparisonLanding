import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { validateImport } from '../server/import-validation.js'
const pending=JSON.parse(await readFile(new URL('../data/review/priority-five.pending.json',import.meta.url),'utf8'))
const evidence=JSON.parse(await readFile(new URL('../data/review/priority-five.evidence.json',import.meta.url),'utf8'))
test('research drafts cannot publish any priority fund or fabricate human approval',()=>{
 assert.deepEqual(pending.records.map((row:{ticker:string})=>row.ticker),['SPY','VOO','IVV','VTI','IWM'])
 assert.throws(()=>validateImport(pending))
 for(const row of pending.records){
  assert.equal(row.usageReview.approved,false);assert.equal(row.verifiedAt,null);assert.equal(row.verifiedBy,null)
  assert.equal(row.usageReview.reviewer,null);assert.equal(row.usageReview.reviewedAt,null)
  assert.throws(()=>validateImport({records:[row]}))
  for(const source of row.sources){assert.equal(source.verified_at,null);assert.ok(source.retrievedAt)}
 }
})
test('each proposal source has actually retrieved evidence; known primary/API discrepancies remain explicit',()=>{
 const urls=new Set(evidence.sources.filter((source:{httpStatus:number})=>source.httpStatus===200).map((source:{url:string})=>source.url))
 for(const row of pending.records)for(const source of row.sources){if(source.provider==='project'){assert.equal(source.role,'authored');assert.equal(source.field,'description')}else assert.ok(urls.has(source.url),`Missing retrieved evidence for ${source.url}`)}
 assert.equal(pending.records.find((r:{ticker:string})=>r.ticker==='SPY').expenseRatioPercent,0.0945)
 assert.equal(evidence.tickerInsideObservations.SPY.expense_ratio,0.09)
 assert.equal(pending.records.find((r:{ticker:string})=>r.ticker==='VTI').index,'Morningstar US Total Market Index')
 assert.notEqual(pending.records.find((r:{ticker:string})=>r.ticker==='VTI').name,evidence.tickerInsideObservations.VTI.name)
 for(const check of evidence.nyseChecks)assert.equal(check.listingVerified,false)
})
test('review command is read-only and rejects apply; ordinary import dry run refuses unapproved batch',()=>{
 const path='data/review/priority-five.pending.json'
 const options={encoding:'utf8' as const,stdio:'pipe' as const,env:{PATH:process.env.PATH},timeout:15000}
 const output=execFileSync(process.execPath,['--import','tsx','scripts/check-etf-review.ts',path],options)
 assert.match(output,/prošlo 0\/5/)
 assert.throws(()=>execFileSync(process.execPath,['--import','tsx','scripts/check-etf-review.ts',path,'--apply'],options))
 assert.throws(()=>execFileSync(process.execPath,['--import','tsx','scripts/import-etfs.ts',path],options))
})
