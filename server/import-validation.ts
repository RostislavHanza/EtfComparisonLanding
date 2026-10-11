import { object, InputError } from '../shared/validation.js'
const fields=['name','exchange','index','expenseRatioPercent','dividends','description']
const hosts=['nyse.com','ssga.com','investor.vanguard.com','fund-docs.vanguard.com','ishares.com','tickerinside.com','sec.gov']
function text(value:unknown,label:string){if(typeof value!=='string'||!value.trim()||value.length>4000)throw new InputError(`Chybí ${label}.`);return value.trim()}
function date(value:unknown,label:string){const v=text(value,label);if(!Number.isFinite(Date.parse(v))||Date.parse(v)>Date.now())throw new InputError(`Neplatné datum ${label}.`);return v}
const issuers:Record<string,string[]>={}
for(const ticker of ['SPY','SPYD','MDY','DIA'])issuers[ticker]=['ssga.com']
for(const ticker of ['VOO','VTI','VYM','VTV','VUG','VT','VEA','VWO'])issuers[ticker]=['investor.vanguard.com','fund-docs.vanguard.com']
for(const ticker of ['IVV','ITOT','IWM','IJH','IJR'])issuers[ticker]=['ishares.com']
const onHost=(hostname:string,host:string)=>hostname===host||hostname.endsWith('.'+host)
function approvedUrl(value:unknown,policy=false){const u=new URL(text(value,'URL'));if(u.protocol!=='https:'||u.username||u.password||![...hosts,...(policy?['blackrock.com','ice.com']:[])].some(h=>u.hostname===h||u.hostname.endsWith('.'+h)))throw new InputError('Zdroj není na schválené HTTPS doméně.');return u.toString()}
export function validateImport(input:unknown){
 const root=object(input)
 if(!Array.isArray(root.records)||root.records.length===0||root.records.length>100)throw new InputError('Import vyžaduje 1–100 ověřených záznamů.')
 const seen=new Set<string>()
 return root.records.map(item=>{
  const r=object(item),ticker=text(r.ticker,'ticker')
  if(r.methodology!==undefined&&r.methodology!=='tickerinside-primary-v1')throw new InputError('Neznámá datová metodika.')
  if(!/^[A-Z0-9.-]{1,10}$/.test(ticker)||seen.has(ticker))throw new InputError('Neplatný nebo duplicitní ticker.');seen.add(ticker)
  if(r.exchange!=='NYSE Arca')throw new InputError('Fond není ověřený na NYSE Arca.')
  if(typeof r.expenseRatioPercent!=='number'||!Number.isFinite(r.expenseRatioPercent)||r.expenseRatioPercent<0||r.expenseRatioPercent>10)throw new InputError('Neplatná nákladovost.')
  const verifiedAt=date(r.verifiedAt,'ověření'),asOf=date(r.dataAsOf,'platnosti')
  if(Date.parse(verifiedAt)<Date.now()-14*86400000||Date.parse(asOf)>Date.parse(verifiedAt))throw new InputError('Ověření je starší než 14 dní nebo předchází platnosti údaje.')
  if(!Array.isArray(r.sources))throw new InputError('Chybí zdroje po jednotlivých polích.')
  const sources=r.sources.map(s=>{
   const v=object(s),field=text(v.field,'pole zdroje')
   if(![...fields,'ticker'].includes(field))throw new InputError('Neznámé pole zdroje.')
   const checked=date(v.verified_at,'zdroje'),asof=date(v.as_of,'údaje')
   if(Date.parse(checked)<Date.parse(verifiedAt)||Date.parse(asof)>Date.parse(checked))throw new InputError('Nesouhlasí data ověření zdroje.')
   const retrieved=v.retrievedAt?date(v.retrievedAt,'stažení'):undefined
   if(retrieved&&Date.parse(retrieved)>Date.parse(checked))throw new InputError('Kontrola předchází získání podkladu.')
   const role=v.role,provider=v.provider
   if(role!==undefined&&!['origin','verification','authored'].includes(String(role)))throw new InputError('Neplatná role zdroje.')
   if(provider!==undefined&&!['tickerinside','issuer','project','sec'].includes(String(provider)))throw new InputError('Neplatný původ údaje.')
   const authored=provider==='project'&&role==='authored'&&field==='description'
   const url=authored?text(v.url,'URL vlastního textu'):approvedUrl(v.url)
   if(authored){const own=new URL(url);if(own.protocol!=='https:'||own.hostname!=='github.com'||own.username||own.password||own.search||own.hash||!/^\/RostislavHanza\/EtfComparisonLanding\/blob\/design-exploration\/data\/review\/[A-Za-z0-9._-]+\.json$/.test(own.pathname))throw new InputError('Neznámý podklad vlastního popisu.')}
   if(provider==='tickerinside'&&(url!==`https://tickerinside.com/api/v1/fund/${ticker.toLowerCase()}.json`||v.license!=='CC BY 4.0'))throw new InputError('Chybí konkrétní licencovaný API zdroj.')
   if(v.date_basis!==undefined&&!['observed_state','provider_filing_date'].includes(String(v.date_basis)))throw new InputError('Neplatný význam data.')
   return{field,url,verified_at:checked,as_of:asof,evidence:text(v.evidence,'doklad kontroly'),...(role?{role:String(role)}:{}),...(provider?{provider:String(provider)}:{}),...(v.license?{license:text(v.license,'licence')}:{}),...(v.date_basis?{date_basis:String(v.date_basis)}:{}),...(retrieved?{retrieved_at:retrieved}: {})}
  })
  if(!fields.every(f=>sources.some(s=>s.field===f)))throw new InputError('Každé publikované pole musí mít primární zdroj.')
  if(r.methodology==='tickerinside-primary-v1'){
   if(![...fields,'ticker'].every(f=>sources.some(s=>s.field===f&&(s.role==='origin'||s.role==='authored'))))throw new InputError('Každý údaj musí mít odlišený původ, nejen ověřovací odkaz.')
   for(const s of sources){
    if(!s.role||!s.provider)throw new InputError('Chybí původ nebo role zdroje.')
    if(s.provider==='tickerinside'&&!['ticker','name','exchange','expenseRatioPercent'].includes(s.field))throw new InputError('TickerInside neposkytuje toto pole.')
    if(s.provider==='issuer'&&!(issuers[ticker]??[]).some(host=>onHost(new URL(s.url).hostname,host)))throw new InputError('Neodpovídá emitent fondu.')
    if(s.provider==='project'&&(s.role!=='authored'||s.field!=='description'))throw new InputError('Projekt nemůže být původem finančního údaje.')
    if(s.role==='authored'&&(s.provider!=='project'||s.field!=='description'))throw new InputError('Vlastní autorství není zdroj finančního parametru.')
   }
  }
  if(!sources.some(s=>{
   if(s.field!=='exchange')return false
   const hostname=new URL(s.url).hostname
   if(onHost(hostname,'nyse.com'))return true
   return (issuers[ticker]??[]).some(host=>onHost(hostname,host))&&/NYSE\s+Arca/i.test(s.evidence)&&s.evidence.split(/[^A-Za-z0-9.-]+/).includes(ticker)
  }))throw new InputError('Burzu doložte na NYSE nebo u příslušného emitenta s výslovným tickerem a NYSE Arca.')
  const review=object(r.usageReview)
  if(review.approved!==true)throw new InputError('Podmínky použití nejsou schválené.')
  const usage={approved:true,reviewedAt:date(review.reviewedAt,'práv použití'),reviewer:text(review.reviewer,'kontrolor práv'),basis:text(review.basis,'oprávnění k použití'),policyUrl:approvedUrl(review.policyUrl,true)}
  return{ticker,name:text(r.name,'název'),exchange:r.exchange,tracked_index:text(r.index,'index'),expense_ratio_percent:r.expenseRatioPercent,dividends:text(r.dividends,'dividendy'),description:text(r.description,'charakteristika'),verified_at:verifiedAt,data_as_of:asOf.slice(0,10),sources,verified_by:text(r.verifiedBy,'kontrolor dat'),usage_review:usage,published:true}
 })
}
