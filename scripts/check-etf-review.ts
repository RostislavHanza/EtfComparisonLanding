// Read-only review report using the existing publication validator. Never creates approval.
import { readFile } from 'node:fs/promises'
import { validateImport } from '../server/import-validation.js'
import { object } from '../shared/validation.ts'
const file=process.argv[2]
if(!file||process.argv.includes('--apply'))throw new Error('Použití: npm run review:etfs -- soubor.pending.json (bez --apply).')
const draft=object(JSON.parse(await readFile(file,'utf8')))
if(!Array.isArray(draft.records)||!draft.records.length)throw new Error('Chybí návrhy záznamů.')
let ready=0
for(const item of draft.records){
 const record=object(item)
 try{validateImport({records:[record]});ready++;console.log(`${record.ticker}: struktura splňuje publikační validátor; stále vyžaduje kontrolu skutečných podkladů člověkem.`)}
 catch(error){console.log(`${record.ticker}: ČEKÁ NA KONTROLU – ${error instanceof Error?error.message:'Validace neprošla.'}`)}
 if(Array.isArray(record.blockers))for(const blocker of record.blockers)console.log(`  ${String(blocker)}`)
}
console.log(`Publikačním validátorem prošlo ${ready}/${draft.records.length}. Žádné schválení, datum ani databázový zápis nebyly vytvořeny.`)
