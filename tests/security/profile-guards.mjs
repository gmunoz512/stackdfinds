// Run with node after installing @electric-sql/pglite in a test tools directory.
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const db = new PGlite();
const migration = name => readFileSync(new URL('../../supabase/migrations/' + name, import.meta.url), 'utf8');
await db.exec(`
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
CREATE SCHEMA auth;
CREATE TYPE public.app_role AS ENUM ('admin');
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('test.uid', true), '')::uuid $$;
CREATE FUNCTION public.has_role(uuid, public.app_role) RETURNS boolean LANGUAGE sql AS $$ SELECT $1 = '00000000-0000-0000-0000-000000000003'::uuid $$;
GRANT USAGE ON SCHEMA auth TO authenticated, anon, service_role;
CREATE TABLE public.profiles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid UNIQUE, full_name text,
 stripe_account_id text, stripe_onboarding_complete boolean DEFAULT false,
 host_trust_score integer NOT NULL DEFAULT 0, first_booking_completed_at timestamptz,
 is_banned boolean NOT NULL DEFAULT false,
 host_verification_status text DEFAULT 'unverified', host_verified_at timestamptz,
 host_verified_by uuid, host_verification_notes text
);
CREATE TABLE public.vendor_profiles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, name text,
 trust_score integer NOT NULL DEFAULT 0, verification_status text DEFAULT 'draft',
 verified_at timestamptz, verified_by uuid, commission_percentage numeric,
 host_commission_percentage numeric DEFAULT 15, stripe_account_id text,
 stripe_onboarding_complete boolean DEFAULT false, host_user_id uuid
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.profiles, public.vendor_profiles TO authenticated, service_role;
CREATE POLICY own_read ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY own_insert ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY own_read ON public.vendor_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY own_insert ON public.vendor_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY admin_update ON public.vendor_profiles FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY admin_read ON public.vendor_profiles FOR SELECT USING (has_role(auth.uid(), 'admin'));
`);
// Exercise the actual existing policies, not an invented permissive replacement.
await db.exec(migration('20260308173402_9043a8c6-7cb8-48ef-b47a-52e6b955cfe9.sql').split('-- Restrict self-update')[1].replace(/^ of verification fields on profiles\n/, ''));
await db.exec(migration('20260308171932_1f4d1990-2a29-4145-8012-a2faccce9bf3.sql').split('-- Fix 2:')[1].split('-- Fix 3:')[0].replace(/^ Restrict vendor self-UPDATE to safe profile columns only\n/, ''));
await db.exec(migration('20260910120000_protect_profile_system_fields.sql'));
const owner = '00000000-0000-0000-0000-000000000001';
await db.exec(`SET ROLE authenticated; SET test.uid = '${owner}'; INSERT INTO profiles(user_id) VALUES ('${owner}'); INSERT INTO vendor_profiles(user_id, name) VALUES ('${owner}', 'Original');`);
let checked = 0;
async function denied(sql) {
 await assert.rejects(db.exec(sql), e => e.code === '42501'); checked++;
}
for (const assignment of ["stripe_account_id = 'acct_fake'", 'stripe_onboarding_complete = true', 'host_trust_score = 100', "first_booking_completed_at = now()", 'is_banned = true', 'stripe_onboarding_complete = NULL']) await denied(`UPDATE profiles SET ${assignment}`);
await denied('UPDATE vendor_profiles SET trust_score = 100');
await denied(`INSERT INTO vendor_profiles(user_id, name, trust_score) VALUES ('${owner}', 'Forged', 100)`);
await db.exec("UPDATE profiles SET full_name = 'Normal edit', host_trust_score = 0; UPDATE vendor_profiles SET name = 'Normal edit', trust_score = 0;");
await db.exec("SET test.uid = '00000000-0000-0000-0000-000000000002'");
for (const [col, value] of [['stripe_account_id', "'acct_fake'"], ['stripe_onboarding_complete','true'],['host_trust_score','100'],['first_booking_completed_at','now()'],['is_banned','true']]) await denied(`INSERT INTO profiles(user_id, ${col}) VALUES (auth.uid(), ${value})`);
assert.equal((await db.query('UPDATE profiles SET full_name = \'Other user\' RETURNING *')).rows.length, 0);
await db.exec(`SET test.uid = '00000000-0000-0000-0000-000000000003'; UPDATE profiles SET is_banned = true, host_verification_status = 'verified'; UPDATE vendor_profiles SET trust_score = 20;`);
await db.exec(`SET test.uid = '${owner}'`);
await denied('UPDATE profiles SET is_banned = false');
await db.exec("RESET ROLE; CREATE FUNCTION public.test_score_refresh() RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$ UPDATE public.profiles SET host_trust_score = 45; UPDATE public.vendor_profiles SET trust_score = 40; $$; SET ROLE authenticated; SELECT public.test_score_refresh();");
assert.equal((await db.query('SELECT host_trust_score FROM profiles')).rows[0].host_trust_score,45);
await db.exec("SET ROLE service_role; UPDATE profiles SET stripe_account_id = 'acct_legitimate', stripe_onboarding_complete = true;");
assert.equal((await db.query('SELECT stripe_account_id FROM profiles')).rows[0].stripe_account_id,'acct_legitimate');
await db.exec('RESET ROLE');
await db.exec(migration('20260910121000_paid_api_rate_limits.sql'));
await db.exec('SET ROLE authenticated');
await denied("SELECT consume_paid_api_quota('price-comparison')");
await denied("SELECT * FROM paid_api_limits");
await db.exec('SET ROLE service_role');
const take = (endpoint, subject=null) => db.query('SELECT consume_paid_api_quota($1,$2) AS result',[endpoint,subject]).then(r=>r.rows[0].result);
const results = await Promise.all(Array.from({length:40},()=>take('price-comparison')));
assert.equal(results.filter(r=>r.allowed).length,30);
assert.ok(results.filter(r=>!r.allowed).every(r=>r.retry_after>0));
const userResults = await Promise.all(Array.from({length:8},()=>take('scrape-airbnb-reviews',owner)));
assert.equal(userResults.filter(r=>r.allowed).length,5);
await assert.rejects(take('scrape-airbnb-reviews'));
await assert.rejects(take('unknown'));
await db.exec('RESET ROLE');
await db.exec("UPDATE paid_api_limits SET request_count = 300 WHERE endpoint = 'price-comparison' AND bucket = 'global-hour'; DELETE FROM paid_api_limits WHERE endpoint = 'price-comparison' AND bucket = 'global-minute'");
await db.exec('SET ROLE service_role');
assert.equal((await take('price-comparison')).allowed,false);
await db.exec('RESET ROLE');
await db.exec("UPDATE paid_api_limits SET window_start = window_start - interval '2 hours', expires_at = expires_at - interval '2 hours'");
await db.exec('SET ROLE service_role');
assert.equal((await take('price-comparison')).allowed,true);
console.log(`PASS: ${checked} forbidden database operations; owner/admin/service/definer paths; quota caps, expiry and RPC privileges. PGlite queues concurrent calls; real multi-session load test remains a staging check.`);
await db.close();
