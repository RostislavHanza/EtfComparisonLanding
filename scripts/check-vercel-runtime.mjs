// Local official @vercel/node build and artifact execution. No Vercel account/deployment.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { execFileSync } from 'node:child_process'
import { pipeline } from 'node:stream/promises'
import { createWriteStream } from 'node:fs'
const require=createRequire(import.meta.url)
const {build}=require('@vercel/node')
const {FileFsRef}=require('@vercel/build-utils')
const root=process.cwd(),files={}
for(const directory of ['api','server','shared']){
 for(const name of await readdir(directory))if(/\.(ts|json)$/.test(name))files[`${directory}/${name}`]=new FileFsRef({fsPath:resolve(directory,name)})
}
for(const name of ['package.json','package-lock.json','tsconfig.json','tsconfig.server.json'])files[name]=new FileFsRef({fsPath:resolve(name)})
const entries=Object.keys(files).filter(name=>name.startsWith('api/')&&name.endsWith('.ts')).sort()
const target=resolve('.cache/vercel-runtime')
await rm(target,{recursive:true,force:true});await mkdir(target,{recursive:true})
for(const entrypoint of entries){
 const {output}=await build({files,entrypoint,workPath:root,config:{projectSettings:{installCommand:'',buildCommand:'node -e ""'}},meta:{skipDownload:true},considerBuildCommand:true})
 assert.equal(output.type,'Lambda');assert.equal(output.runtime,'nodejs24.x')
 const directory=resolve(target,entrypoint.replace(/[/.]/g,'_'))
 for(const [name,file] of Object.entries(output.files)){
  const path=resolve(directory,name)
  assert.ok(path.startsWith(directory+'/'),'Artifact path escapes output directory')
  await mkdir(dirname(path),{recursive:true});await pipeline(file.toStream(),createWriteStream(path))
 }
 // Import the exact API JS emitted/traced by the official builder in its isolated artifact.
 const handler=entrypoint.replace(/\.ts$/,'.js')
 const runner=`import assert from 'node:assert/strict';
process.env.APP_ENV='preview';process.env.APP_BASE_URL='https://runtime-test.example.invalid';process.env.RATE_LIMIT_SECRET='runtime-test-only-'.repeat(3);
globalThis.fetch=async()=>{throw Error('External calls forbidden')};
const {default:handler}=await import('./${handler}');assert.equal(typeof handler,'function');
let code,result;const res={setHeader(){},status(value){code=value;return this},json(value){result=value}};
await handler({method:'TRACE',headers:{}},res);assert.equal(code,405);
${entrypoint==='api/preview-admin.ts'?"await handler({method:'GET',headers:{}},res);assert.equal(code,200);assert.deepEqual(result,{authenticated:false});":''}
`
 await writeFile(resolve(directory,'runtime-check.mjs'),runner)
 execFileSync(process.execPath,['--no-experimental-strip-types','runtime-check.mjs'],{cwd:directory,stdio:'pipe',timeout:15000,env:{PATH:process.env.PATH}})
 if(entrypoint==='api/preview-admin.ts'){
  const apiPath=resolve(directory,handler),original=await readFile(apiPath,'utf8')
  const broken=original.replace('../server/http.js','../server/http.ts')
  assert.notEqual(broken,original,'Regression fixture must change the runtime import')
  try{
   await writeFile(apiPath,broken)
   assert.throws(()=>execFileSync(process.execPath,['--no-experimental-strip-types','runtime-check.mjs'],{cwd:directory,stdio:'pipe',timeout:15000,env:{PATH:process.env.PATH}}),error=>String(error.stderr).includes('ERR_MODULE_NOT_FOUND'))
   console.log('PASS regression: missing TypeScript import in official artifact is detected')
  }finally{await writeFile(apiPath,original)}
 }
 console.log(`PASS official Vercel Node.js 24 artifact: ${entrypoint}`)
}
console.log(`PASS ${entries.length} official function artifacts; no deployment or external service calls`)
