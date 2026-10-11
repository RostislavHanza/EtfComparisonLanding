import { useEffect, useRef, useState } from 'react'
import { hasPendingWithdrawal, initialConsent, setAnalyticsConsent, track } from './analytics'
import './privacy-settings.css'
export default function PrivacySettings(){
 const [choice,setChoice]=useState<boolean|null>(initialConsent),[open,setOpen]=useState(()=>initialConsent()===null||hasPendingWithdrawal())
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('')
 const panel=useRef<HTMLElement>(null),trigger=useRef<HTMLButtonElement>(null),initializing=useRef(false)
 useEffect(()=>{
  if(initializing.current)return;initializing.current=true
  const initial=initialConsent()
  if(initial!==null){setBusy(true);void setAnalyticsConsent(initial).then(ok=>{if(!ok){setError('Měření je vypnuté, ale odstranění údajů na serveru selhalo. Zkuste odvolání znovu.');setOpen(true)}else if(initial)track('landing_view')}).finally(()=>setBusy(false))}
 },[])
 useEffect(()=>{
  const changed=(event:StorageEvent)=>{if(event.key==='etf_analytics_consent'&&event.newValue==='denied'){setChoice(false);void setAnalyticsConsent(false).then(ok=>{if(!ok){setError('Měření je vypnuté, ale odstranění údajů na serveru selhalo.');setOpen(true)}})}}
  window.addEventListener('storage',changed);return()=>window.removeEventListener('storage',changed)
 },[])
 async function choose(allowed:boolean){
  setBusy(true);setError('');setMessage('');if(!allowed)setChoice(false)
  const ok=await setAnalyticsConsent(allowed)
  if(ok){setChoice(allowed);setOpen(false);setMessage(allowed?'Analytika je povolená.':'Analytika je vypnutá. Případné přiřazené analytické údaje byly odstraněny.');if(allowed)track('landing_view');trigger.current?.focus()}
  else{setChoice(false);setError('Měření je vypnuté, ale odstranění údajů na serveru selhalo. Zkuste odvolání znovu.');setOpen(true)}
  setBusy(false)
 }
 function reopen(){setOpen(true);setMessage('');requestAnimationFrame(()=>{panel.current?.focus();panel.current?.scrollIntoView({block:'nearest'})})}
 return <div className="privacy-settings"><button ref={trigger} className="privacy-reopen" onClick={reopen} aria-expanded={open} aria-controls="privacy-settings-panel">Nastavení soukromí</button>
 {open&&<section ref={panel} tabIndex={-1} id="privacy-settings-panel" aria-labelledby="privacy-settings-title"><h2 id="privacy-settings-title">Vaše soukromí</h2><p>Používáme nezbytné technologie pro fungování webu. S vaším souhlasem také měříme návštěvnost a používání ETF srovnávače, abychom jej mohli zlepšovat.</p><p className="privacy-detail">Volbu ukládáme v prohlížeči. Měříme vlastní události s náhodným identifikátorem návštěvy, bez analytických cookies a externích sledovacích skriptů. Marketingový souhlas je samostatný.</p>{choice!==null&&<p>Aktuální volba: {choice?'analytika povolená':'analytika vypnutá'}.</p>}<div className="privacy-actions"><button disabled={busy} onClick={()=>void choose(false)}>Odmítnout</button><button disabled={busy} onClick={()=>void choose(true)}>Přijmout analytiku</button></div>{error&&<><p role="alert">{error}</p><button className="privacy-retry" disabled={busy} onClick={()=>void choose(false)}>Zkusit odvolání znovu</button></>}</section>}
 <p role="status" className="privacy-status">{busy?'Ukládám volbu…':message}</p></div>
}
