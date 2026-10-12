import { useEffect, useState } from 'react'
import './preview-admin.css'
type Result={state:string;previousState?:string;candidates?:number;updated?:number;failed?:number}
async function request(path:string,input?:unknown){
 const response=await fetch(path,{credentials:'same-origin',cache:'no-store',...(input?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)}:{})})
 const data=await response.json()
 if(!response.ok)throw new Error(data.error||'Požadavek se nepodařilo dokončit.')
 return data
}
export default function PreviewAdmin(){
 const [token]=useState(()=>new URLSearchParams(window.location.hash.slice(1)).get('admin-access')??'')
 const [ready,setReady]=useState(false),[authenticated,setAuthenticated]=useState(false),[enabled,setEnabled]=useState(false)
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[result,setResult]=useState<Result|null>(null)
 useEffect(()=>{
  window.history.replaceState({},'',window.location.pathname+window.location.search)
  let active=true
  request('/api/preview-admin').then(data=>{if(active){setEnabled(true);setAuthenticated(data.authenticated)}}).catch(()=>{if(active)setMessage('Diagnostika není dostupná. Ověřte Preview konfiguraci a administrátorskou migraci.')}).finally(()=>{if(active)setReady(true)})
  return ()=>{active=false}
 },[])
 async function action(kind:'request'|'confirm'|'sync'|'logout'){
  setBusy(true);setMessage('')
  try{
   const data=await request(kind==='sync'?'/api/etf-sync':'/api/preview-admin',kind==='sync'?{}:{action:kind,...(kind==='confirm'?{token}:{})})
   if(kind==='sync')setResult(data)
   else if(kind==='request')setMessage('SMTP server přijal přihlašovací zprávu pro administrátorskou schránku. Zkontrolujte Gmail i spam; přijetí serverem ještě nezaručuje doručení.')
   else {setAuthenticated(Boolean(data.authenticated));if(kind==='logout')setResult(null)}
  }catch(error){setMessage(error instanceof Error?error.message:'Požadavek se nepodařilo dokončit.')}
  finally{setBusy(false)}
 }
 const states:Record<string,string>={ok:'Dokončeno',partial:'Dokončeno s chybami',failed:'Synchronizace selhala',already_attempted:'Dnes již proběhl pokus – zobrazen uložený výsledek',busy:'Synchronizace již probíhá'}
 return <main id="main" className="preview-admin"><a href="/">← Zpět ke srovnávači</a><p className="eyebrow">Dočasná diagnostika · pouze Preview</p><h1>Synchronizace ETF</h1><p>Import připraví kandidáty a aktualizuje jen schválené fondy s povolenou synchronizací. Žádný fond automaticky nezveřejní.</p>
 {!ready?<p role="status">Ověřuji dostupnost…</p>:enabled&&<>
 {!authenticated?<section><h2>Administrátorský přístup</h2><p>Přihlašovací odkaz odešleme pouze do schránky nastavené na serveru jako SMTP_USER. Platí 10 minut a vyžaduje vědomé potvrzení. Přihlášení poté platí 30 minut.</p>{token?<button className="primary" disabled={busy} onClick={()=>action('confirm')}>Potvrdit přihlášení</button>:null}<button className="primary" disabled={busy} onClick={()=>action('request')}>Poslat přihlašovací odkaz administrátorovi</button></section>:<section><h2>Spuštění importu</h2><p>Jste přihlášeni. Je povolen jeden pokus za den (UTC). Opakované kliknutí neobnoví import; vrátí uložený výsledek.</p><button className="primary" disabled={busy} onClick={()=>action('sync')}>Otestovat synchronizaci ETF</button><button className="back-button" disabled={busy} onClick={()=>action('logout')}>Odhlásit se</button></section>}
 {result&&<section aria-label="Výsledek synchronizace"><h2>{states[result.state]??'Neznámý stav'}</h2>{result.previousState&&<p>Předchozí stav: {states[result.previousState]??'Neznámý stav'}</p>}<dl><div><dt>Načtení kandidáti</dt><dd>{result.candidates??'—'}</dd></div><div><dt>Aktualizovaná ETF v katalogu</dt><dd>{result.updated??'—'}</dd></div><div><dt>Chyby zdroje</dt><dd>{result.failed??'—'}</dd></div></dl><p>Nula aktualizovaných ETF může být správný výsledek: nepublikované nebo neschválené záznamy zůstávají beze změny.</p></section>}
 </>}
 <p role="status" aria-live="polite">{busy?'Zpracovávám požadavek…':message}</p></main>
}
