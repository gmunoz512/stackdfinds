import assert from 'node:assert/strict';
import { guardPaidApi, normalizeAirbnbUrl } from '../../supabase/functions/_shared/paidApiGuard.ts';

async function runPaidApiGuardChecks() {
const env: Record<string,string> = { SUPABASE_URL: 'https://example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'test-service-key' };
(globalThis as any).Deno = {env:{get:(key:string)=>env[key]}};
const originalFetch = globalThis.fetch;
let calls: string[] = [];
let responses: (Response | Error)[] = [];
globalThis.fetch = (async (url: string, options: RequestInit) => {
 calls.push(url);
 if (url.includes('/rpc/')) assert.equal(new Headers(options.headers).get('authorization'),'Bearer test-service-key');
 const next = responses.shift();
 if (next instanceof Error) throw next;
 assert.ok(next, 'Unexpected network request');
 return next;
}) as typeof fetch;
const json = (value: unknown,status=200)=>new Response(JSON.stringify(value),{status});
const req = (token?:string,method='POST')=>new Request('https://app.invalid', {method,body:method==='POST'?'{}':undefined,headers:token?{authorization:`Bearer ${token}`}:{}});
const headers = {'Access-Control-Allow-Origin':'*'};
try {
 assert.equal((await guardPaidApi(req(),'scrape-airbnb-reviews',headers,true))?.status,401);
 assert.equal(calls.length,0);
 responses=[json({error:'bad'},401)];
 assert.equal((await guardPaidApi(req('invalid'),'scrape-airbnb-reviews',headers,true))?.status,401);
 responses=[json({id:'user',is_anonymous:true})];
 assert.equal((await guardPaidApi(req('anon'),'scrape-airbnb-reviews',headers,true))?.status,401);
 responses=[json({id:'user'}),json({allowed:true})];
 assert.equal(await guardPaidApi(req('valid'),'scrape-airbnb-reviews',headers,true),null);
 responses=[json({allowed:true})];
 assert.equal(await guardPaidApi(req(),'google-places',headers),null);
 responses=[json({allowed:false,retry_after:32})];
 const limited=await guardPaidApi(req(),'price-comparison',headers);
 assert.equal(limited?.status,429); assert.equal(limited?.headers.get('Retry-After'),'32');
 assert.ok(limited?.headers.get('Access-Control-Expose-Headers')?.includes('Retry-After'));
 const beforeInvalid = calls.length;
 for (const body of ['', '{', 'null', '[]', '42', '"hello"']) {
  const invalid = new Request('https://app.invalid', {method:'POST',body});
  assert.equal((await guardPaidApi(invalid,'google-places',headers))?.status,400);
 }
 assert.equal(calls.length,beforeInvalid, 'Invalid JSON must not consume quota');
 const intact = new Request('https://app.invalid', {method:'POST',body:'{"query":"café"}'});
 responses=[json({allowed:true})];
 assert.equal(await guardPaidApi(intact,'google-places',headers),null);
 assert.deepEqual(await intact.json(),{query:'café'}, 'Endpoint must still be able to read the original body');
 for (const bad of [json({},500),json({}),new Error('timeout')]) {
  responses=[bad]; assert.equal((await guardPaidApi(req(),'google-places',headers))?.status,503);
 }
 responses=[json({},503)];
 assert.equal((await guardPaidApi(req('valid'),'generate-vendor-description',headers,true))?.status,503);
 assert.equal((await guardPaidApi(req(undefined,'GET'),'google-places',headers))?.status,405);
 const beforeOversize = calls.length;
 const oversized = new Request('https://app.invalid', {method:'POST',body:'x'.repeat(16385)});
 assert.equal((await guardPaidApi(oversized,'google-places',headers))?.status,413);
 assert.equal(calls.length,beforeOversize);
 delete env.SUPABASE_SERVICE_ROLE_KEY;
 assert.equal((await guardPaidApi(req(),'google-places',headers))?.status,503);
 for (const bad of ['http://airbnb.com/rooms/1','https://airbnb.com.evil.test/rooms/1','https://evil.test/rooms/1','https://airbnb.com@evil.test/rooms/1','https://user@airbnb.com/rooms/1','https://airbnb.com:444/rooms/1','https://airbnb.com/redirect?url=https://evil.test','https://airbnb.com/rooms/../redirect','javascript:alert(1)',{},null,'a'.repeat(2049)]) assert.equal(normalizeAirbnbUrl(bad),null,String(bad));
 assert.equal(normalizeAirbnbUrl('www.airbnb.com/experiences/123?tracking=1#x'),'https://www.airbnb.com/experiences/123');
 assert.equal(normalizeAirbnbUrl('https://airbnb.com/rooms/123'),'https://airbnb.com/rooms/123');
 console.log('PASS: paid API authentication, public access, quota rejection, fail-closed behavior, and URL validation. All network calls mocked.');
} finally {globalThis.fetch=originalFetch;}
}

if (process.env.VITEST) {
  const { test } = await import('vitest');
  test('paid API authentication, public access, quota rejection, fail-closed behavior, and URL validation', runPaidApiGuardChecks);
} else {
  await runPaidApiGuardChecks();
}
