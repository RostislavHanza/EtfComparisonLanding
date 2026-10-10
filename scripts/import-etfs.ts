import { readFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'
import { validateImport } from '../server/import-validation.ts'
const file=process.argv[2]
if(!file)throw new Error('Použití: npm run import:etfs -- ověřená-data.json [--apply]')
const rows=validateImport(JSON.parse(await readFile(file,'utf8')))
console.log(`Ověřena struktura ${rows.length} záznamů. Tato validace nenahrazuje kontrolu dokumentů člověkem.`)
if(process.argv.includes('--apply')){
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY
 if(!url||!key)throw new Error('Chybí serverové nastavení Supabase.')
 const {error}=await createClient(url,key,{auth:{persistSession:false}}).from('etfs').upsert(rows,{onConflict:'ticker'})
 if(error)throw new Error('Import do databáze selhal; ověřte migraci a oprávnění. Žádné tajné údaje nejsou v tomto výpisu.')
 console.log('Import dokončen. Existující fondy mimo import zůstaly zachované.')
}else console.log('Pouze dry run. Databáze nebyla změněna.')
