import { object, InputError } from '../shared/validation.js'
import { validateImport } from './import-validation.js'
// Produces a file only from explicit operator attestation; never guesses approval or dates.
export function prepareApprovedCatalog(draft:unknown,approval:unknown){
 const input=object(draft),review=object(approval)
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
   return {...source,as_of:overrides[String(source.evidenceId)]??source.as_of,verified_at:review.verifiedAt}
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
