// Exercise emitted Node.js ESM, not tsx or Node's native TypeScript loader.
// No real credentials, database, email or external data calls are needed.
import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
process.env.APP_ENV='preview'
process.env.APP_BASE_URL='https://runtime-test.example.invalid'
process.env.RATE_LIMIT_SECRET='runtime-test-only-'.repeat(3)
globalThis.fetch=async()=>{throw new Error('Runtime check must not access external services')}
const entries=(await readdir('api')).filter(name=>name.endsWith('.ts')).sort()
assert.ok(entries.length>0,'No API endpoints found')
for(const name of entries){
 const path=resolve('.cache/server-runtime/api',name.replace(/\.ts$/,'.js'))
 const source=await readFile(path,'utf8')
 assert.doesNotMatch(source,/(?:from\s*|import\s*\()(['"])\.{1,2}\/[^'"]+\.tsx?\1/,'Emitted API must never import TypeScript')
 const {default:handler}=await import(pathToFileURL(path).href)
 assert.equal(typeof handler,'function',`${name} must export a handler`)
 let status=0,result
 const response={setHeader(){},status(code){status=code;return this},json(value){result=value}}
 await handler({method:'TRACE',headers:{}},response)
 assert.equal(status,405,`${name}: invalid method must safely respond rather than fail loading`)
 assert.equal(typeof result.error,'string')
 if(name==='preview-admin.ts'){
  await handler({method:'GET',headers:{}},response)
  assert.equal(status,200);assert.deepEqual(result,{authenticated:false})
 }
 console.log(`PASS emitted Node.js endpoint: ${name}`)
}
console.log(`PASS ${entries.length} API endpoints loaded and executed without a TypeScript loader`)
