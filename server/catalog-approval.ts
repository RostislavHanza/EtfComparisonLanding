import { object, InputError } from '../shared/validation.js'
import { validateImport } from './import-validation.js'
import { createHash } from 'node:crypto'
export const catalogDraftDigest=(draft:unknown)=>createHash('sha256').update(JSON.stringify(draft)).digest('hex')
// Produces a file only from explicit operator attestation; never guesses approval or dates.
export function prepareApprovedCatalog(draft:unknown,approval:unknown){
 const input=object(draft)
 let review=object(approval)
 if(Array.isArray(review.approvedTickers)){
  if(review.confirmAllListedSources!==true||review.reviewedDraftSha256!==catalogDraftDigest(input))throw new InputError('Potvrďte všechny uvedené podklady a přesnou verzi návrhu.')
  if(!Array.isArray(input.records)||new Set(review.approvedTickers).size!==review.approvedTickers.length)throw new InputError('Neplatné nebo duplicitní schválení.')
  const chosen=review.approvedTickers,usage=object(review.usageReview),candidates=input.records.map(object)
  review={...review,usageReview:{...usage,reviewer:review.reviewer,reviewedAt:review.verifiedAt},records:chosen.map(ticker=>{
   const row=candidates.find(row=>row.ticker===ticker)
   if(!row||typeof row.snapshotObservedAt!=='string'||!Array.isArray(row.sources))throw new InputError('Neznámý ticker nebo nedoložený datový snímek.')
   if(!Number.isFinite(Date.parse(row.snapshotObservedAt))||!(Date.parse(row.snapshotObservedAt)<=Date.parse(String(review.verifiedAt))))throw new InputError('Kontrola musí následovat po doloženém pozorování snímku.')
   return {ticker,approved:true,dataAsOf:row.snapshotObservedAt.slice(0,10),confirmedSourceIds:row.sources.map(object).map(s=>s.evidenceId)}
  })}
 }
 if(!Array.isArray(input.records)||!Array.isArray(review.records))throw new InputError('Chybí návrhy nebo schválení fondů.')
 const decisions=new Map<string,Record<string,unknown>>()
 for(const item of review.records){const row=object(item);if(typeof row.ticker!=='string'||decisions.has(row.ticker))throw new InputError('Neplatné nebo duplicitní schválení.');decisions.set(row.ticker,row)}
 const records:(Record<string,unknown>&{sources:Record<string,unknown>[]})[]=input.records.map(object).filter(row=>decisions.get(String(row.ticker))?.approved===true).map(row=>{
  const decision=decisions.get(String(row.ticker))!
  if(!Array.isArray(row.sources)||!Array.isArray(decision.confirmedSourceIds))throw new InputError('Chybí potvrzené podklady.')
  const confirmed=decision.confirmedSourceIds
  const overrides=object(decision.sourceDateOverrides??{})
  const sources=row.sources.map(object).map(source=>{
   if(!confirmed.includes(source.evidenceId))throw new InputError(`Nepotvrzený podklad ${String(source.evidenceId)}.`)
   const checked:Record<string,unknown>={...source,as_of:overrides[String(source.evidenceId)]??source.as_of,verified_at:review.verifiedAt}
   delete checked.verificationStatus // Pending-only label; dates and source evidence remain intact.
   return checked
  })
  const record:Record<string,unknown>&{sources:Record<string,unknown>[]}={...row,verifiedAt:review.verifiedAt,verifiedBy:review.reviewer,dataAsOf:decision.dataAsOf,usageReview:decision.usageReview??review.usageReview,sources}
  delete record.reviewStatus;delete record.blockers // Draft-only notes remain in the unchanged source file.
  return record
 })
 for(const ticker of decisions.keys())if(!input.records.map(object).some(row=>row.ticker===ticker))throw new InputError('Schválení obsahuje neznámý ticker.')
 const result={records}
 validateImport(result) // Full existing publication gate, including rights and freshness.
 return result
}
