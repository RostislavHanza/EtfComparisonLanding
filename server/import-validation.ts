import { object, InputError } from '../shared/validation.ts'
const fields=['name','exchange','index','expenseRatioPercent','dividends','description']
const hosts=['nyse.com','ssga.com','investor.vanguard.com','fund-docs.vanguard.com','ishares.com','tickerinside.com','sec.gov']
function text(value:unknown,label:string){if(typeof value!=='string'||!value.trim()||value.length>4000)throw new InputError(`Chybí ${label}.`);return value.trim()}
function date(value:unknown,label:string){const v=text(value,label);if(!Number.isFinite(Date.parse(v))||Date.parse(v)>Date.now())throw new InputError(`Neplatné datum ${label}.`);return v}
function approvedUrl(value:unknown){const u=new URL(text(value,'URL'));if(u.protocol!=='https:'||u.username||u.password||!hosts.some(h=>u.hostname===h||u.hostname.endsWith('.'+h)))throw new InputError('Zdroj není na schválené HTTPS doméně.');return u.toString()}
export function validateImport(input:unknown){
 const root=object(input)
 if(!Array.isArray(root.records)||root.records.length===0||root.records.length>100)throw new InputError('Import vyžaduje 1–100 ověřených záznamů.')
 const seen=new Set<string>()
 return root.records.map(item=>{
  const r=object(item),ticker=text(r.ticker,'ticker')
  if(!/^[A-Z0-9.-]{1,10}$/.test(ticker)||seen.has(ticker))throw new InputError('Neplatný nebo duplicitní ticker.');seen.add(ticker)
  if(r.exchange!=='NYSE Arca')throw new InputError('Fond není ověřený na NYSE Arca.')
  if(typeof r.expenseRatioPercent!=='number'||!Number.isFinite(r.expenseRatioPercent)||r.expenseRatioPercent<0||r.expenseRatioPercent>10)throw new InputError('Neplatná nákladovost.')
  const verifiedAt=date(r.verifiedAt,'ověření'),asOf=date(r.dataAsOf,'platnosti')
  if(Date.parse(verifiedAt)<Date.now()-14*86400000||Date.parse(asOf)>Date.parse(verifiedAt))throw new InputError('Ověření je starší než 14 dní nebo předchází platnosti údaje.')
  if(!Array.isArray(r.sources))throw new InputError('Chybí zdroje po jednotlivých polích.')
  const sources=r.sources.map(s=>{
   const v=object(s),field=text(v.field,'pole zdroje')
   if(!fields.includes(field))throw new InputError('Neznámé pole zdroje.')
   const checked=date(v.verified_at,'zdroje'),asof=date(v.as_of,'údaje')
   if(Date.parse(checked)<Date.parse(verifiedAt)||Date.parse(asof)>Date.parse(checked))throw new InputError('Nesouhlasí data ověření zdroje.')
   return{field,url:approvedUrl(v.url),verified_at:checked,as_of:asof,evidence:text(v.evidence,'doklad kontroly')}
  })
  if(!fields.every(f=>sources.some(s=>s.field===f)))throw new InputError('Každé publikované pole musí mít primární zdroj.')
  if(!sources.some(s=>s.field==='exchange'&&new URL(s.url).hostname.endsWith('nyse.com')))throw new InputError('Burzu ověřte na nyse.com.')
  const review=object(r.usageReview)
  if(review.approved!==true)throw new InputError('Podmínky použití nejsou schválené.')
  const usage={approved:true,reviewedAt:date(review.reviewedAt,'práv použití'),reviewer:text(review.reviewer,'kontrolor práv'),basis:text(review.basis,'oprávnění k použití'),policyUrl:approvedUrl(review.policyUrl)}
  return{ticker,name:text(r.name,'název'),exchange:r.exchange,tracked_index:text(r.index,'index'),expense_ratio_percent:r.expenseRatioPercent,dividends:text(r.dividends,'dividendy'),description:text(r.description,'charakteristika'),verified_at:verifiedAt,data_as_of:asOf.slice(0,10),sources,verified_by:text(r.verifiedBy,'kontrolor dat'),usage_review:usage,published:true}
 })
}
