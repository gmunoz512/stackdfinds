import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = readFileSync(new URL('../../supabase/functions/vendor-review/index.ts',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
const code = ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const id='11111111-1111-1111-1111-111111111111';
let handler, user, isAdmin, vendor, writes, emails, raced, emailFails, filters;
function reset() { user={id:'owner'}; isAdmin=false; vendor={id,user_id:'owner',name:'Saved name',verification_status:'draft',photos:['a','b','c'],about_experience:'x'.repeat(50),price_per_person:10,duration:'1 hour'}; writes=[]; emails=[]; raced=false; emailFails=false; filters=[]; }
const client={
 auth:{getUser:async()=>({data:{user}}),admin:{getUserById:async()=>({data:{user:{email:'saved@example.invalid'}}})}},
 rpc:async()=>({data:isAdmin}),
 from:()=>{let update, local=[];const q={select:()=>q,eq:(k,v)=>{local.push([k,v]);return q},update:v=>{update=v;return q},maybeSingle:async()=>{
 filters.push(local);
 if(update){writes.push(update);return {data:raced?null:{id}}}
 return {data:local.some(([k,v])=>k==='user_id'&&v!==vendor.user_id)?null:vendor};
 }};return q},
 functions:{invoke:async(name,{body})=>{emails.push(body);return {data:{success:!emailFails},error:emailFails?new Error('email failed'):null}}},
};
new Function('serve','createClient','Deno',code)(fn=>handler=fn,()=>client,{env:{get:()=> 'test'}});
const call=body=>handler(new Request('https://example.invalid',{method:'POST',headers:{authorization:'Bearer test'},body:JSON.stringify(body)}));
reset(); user=null; assert.equal((await call({action:'submit',vendorId:id})).status,401);assert.equal(writes.length,0);
reset(); user={id:'other'};assert.equal((await call({action:'submit',vendorId:id})).status,404);assert.equal(emails.length,0);
reset();assert.equal((await call({action:'review',vendorId:id,status:'approved'})).status,403);assert.equal(writes.length,0);
reset();vendor.photos=[];assert.equal((await call({action:'submit',vendorId:id})).status,400);
reset();vendor.verification_status='suspended';assert.equal((await call({action:'submit',vendorId:id})).status,409);
reset();assert.equal((await call({action:'submit',vendorId:id,status:'approved',vendorEmail:'attacker@example.invalid'})).status,200);assert.equal(writes[0].verification_status,'pending');assert.equal(emails[0].vendorEmail,undefined);assert.ok(filters[1].some(([k])=>k==='verification_status'));
reset();isAdmin=true;vendor.verification_status='pending';assert.equal((await call({action:'review',vendorId:id,status:'approved',vendorEmail:'attacker@example.invalid'})).status,200);assert.equal(writes[0].verified_by,'owner');assert.equal(emails[0].vendorEmail,'saved@example.invalid');
reset();isAdmin=true;assert.equal((await call({action:'review',vendorId:id,status:'bogus'})).status,400);
reset();raced=true;assert.equal((await call({action:'submit',vendorId:id})).status,409);assert.equal(emails.length,0);
reset();emailFails=true;const saved=await call({action:'submit',vendorId:id});assert.equal(saved.status,200);assert.equal((await saved.json()).notificationSent,false);
console.log('PASS: vendor review authentication, ownership, admin authorization, transitions, server recipients, concurrent conflict and email failures.');
