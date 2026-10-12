import { readFile, writeFile } from 'node:fs/promises'
import { prepareApprovedCatalog } from '../server/catalog-approval.js'
const [draft,approval,output]=process.argv.slice(2)
if(!draft||!approval||!output||process.argv.includes('--apply'))throw new Error('Použití: npm run prepare:etfs -- návrhy.json schválení.json výstup.json (bez --apply).')
const result=prepareApprovedCatalog(JSON.parse(await readFile(draft,'utf8')),JSON.parse(await readFile(approval,'utf8')))
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'})
console.log(`Připraveno ${result.records.length} schválených záznamů. Soubor nebyl importován do databáze.`)
