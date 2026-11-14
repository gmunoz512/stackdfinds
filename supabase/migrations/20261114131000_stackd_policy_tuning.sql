-- Stackd (lryeshzwwhcdtzemeyzk): policy tuning after the security hardening.
-- Applied to Stackd on 2026-11-14. Safe to re-run.
BEGIN;

-- 1. Policies that call has_role / is_itinerary_* only make sense for signed-in
--    users. Scope them to authenticated so signed-out visitors never need
--    EXECUTE on those SECURITY DEFINER helpers, then revoke it from anon.
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT schemaname, tablename, policyname FROM pg_policies
           WHERE schemaname IN ('public', 'storage')
             AND roles = '{public}'
             AND (coalesce(qual, '') || coalesce(with_check, '')) ~ '(has_role|is_itinerary_owner|is_itinerary_collaborator)\('
  LOOP
    EXECUTE format('ALTER POLICY %I ON %I.%I TO authenticated', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END $$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_itinerary_owner(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_itinerary_collaborator(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_itinerary_owner(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_itinerary_collaborator(uuid, text) TO authenticated, service_role;

-- 2. Evaluate auth.uid() / auth.email() / auth.role() once per query instead of
--    once per row (performance advisor auth_rls_initplan). Same logic.
DO $$
DECLARE
  p record;
  q text;
  w text;
  sql text;
BEGIN
  FOR p IN SELECT schemaname, tablename, policyname, qual, with_check FROM pg_policies
           WHERE schemaname = 'public'
             AND (coalesce(qual, '') || coalesce(with_check, '')) ~ 'auth\.(uid|email|role|jwt)\(\)'
  LOOP
    q := p.qual;
    w := p.with_check;
    IF q IS NOT NULL THEN
      q := regexp_replace(q, '\( SELECT auth\.(uid|email|role|jwt)\(\) AS (uid|email|role|jwt)\)', '@@\1@@', 'g');
      q := regexp_replace(q, 'auth\.(uid|email|role|jwt)\(\)', '( SELECT auth.\1() )', 'g');
      q := regexp_replace(q, '@@(uid|email|role|jwt)@@', '( SELECT auth.\1() )', 'g');
    END IF;
    IF w IS NOT NULL THEN
      w := regexp_replace(w, '\( SELECT auth\.(uid|email|role|jwt)\(\) AS (uid|email|role|jwt)\)', '@@\1@@', 'g');
      w := regexp_replace(w, 'auth\.(uid|email|role|jwt)\(\)', '( SELECT auth.\1() )', 'g');
      w := regexp_replace(w, '@@(uid|email|role|jwt)@@', '( SELECT auth.\1() )', 'g');
    END IF;
    sql := format('ALTER POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
    IF q IS NOT NULL THEN sql := sql || ' USING (' || q || ')'; END IF;
    IF w IS NOT NULL THEN sql := sql || ' WITH CHECK (' || w || ')'; END IF;
    EXECUTE sql;
  END LOOP;
END $$;

COMMIT;
