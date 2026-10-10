export class ApiError extends Error { constructor(public status:number,message:string){super(message)} }
export async function api<T>(path:string,options:RequestInit={}):Promise<T>{
 const response=await fetch(path,{...options,credentials:'same-origin',headers:{'Accept':'application/json',...(options.body?{'Content-Type':'application/json'}:{}),...options.headers}})
 const result=await response.json().catch(()=>null)
 if(!response.ok)throw new ApiError(response.status,result?.error??'Serverové API nyní není dostupné.')
 if(!result)throw new ApiError(503,'Server vrátil neplatnou odpověď.')
 return result as T
}
