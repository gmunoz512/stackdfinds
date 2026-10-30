import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const ts = await import(process.env.TYPESCRIPT_MODULE || 'typescript');
for (const endpoint of ['scrape-airbnb-reviews','generate-vendor-description','price-comparison','vendor-directions','mapbox-directions','google-places']) {
 let handler, guardCalls=0, paidCalls=0;
 const text=readFileSync(new URL(`../../supabase/functions/${endpoint}/index.ts`,import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
 const code=ts.transpileModule(text,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
 const register=fn=>{handler=fn};
 const guard=async(req,name,headers,auth)=>{
  guardCalls++;
  assert.equal(name,endpoint);
  assert.equal(auth,['scrape-airbnb-reviews','generate-vendor-description'].includes(endpoint));
  return new Response('blocked',{status:429});
 };
 new Function('guardPaidApi','normalizeAirbnbUrl','serve','Deno','fetch',code)(guard,()=>null,register,{serve:register,env:{get:()=> 'fake'}},()=>{paidCalls++;throw Error('Provider must not run')});
 assert.ok(handler);
 assert.equal((await handler(new Request('https://example.invalid',{method:'OPTIONS'}))).status,200);
 assert.equal(guardCalls,0);
 assert.equal((await handler(new Request('https://example.invalid',{method:'POST',body:'{}'}))).status,429);
 assert.equal(guardCalls,1); assert.equal(paidCalls,0);
}
console.log('PASS: all six actual handlers short-circuit quota rejection before provider calls and preserve OPTIONS.');
