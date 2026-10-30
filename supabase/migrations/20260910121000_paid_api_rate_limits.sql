BEGIN;
-- Separate from the legacy limiter: Findings #1-#5 and other callers are unchanged.
CREATE TABLE public.paid_api_limits (
  endpoint text NOT NULL,
  bucket text NOT NULL,
  window_start timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  request_count integer NOT NULL,
  PRIMARY KEY (endpoint, bucket, window_start)
);
CREATE INDEX paid_api_limits_expiry ON public.paid_api_limits (expires_at);
ALTER TABLE public.paid_api_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.paid_api_limits FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.consume_paid_api_quota(p_endpoint text, p_subject text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  minute_limit integer;
  hour_limit integer;
  user_limit integer;
  now_at timestamptz := clock_timestamp();
  start_at timestamptz;
  end_at timestamptz;
  bucket_name text;
  quota integer;
  count_now integer;
  i integer;
BEGIN
  CASE p_endpoint
    WHEN 'scrape-airbnb-reviews' THEN minute_limit := 20; hour_limit := 100; user_limit := 5;
    WHEN 'generate-vendor-description' THEN minute_limit := 20; hour_limit := 100; user_limit := 5;
    WHEN 'price-comparison' THEN minute_limit := 30; hour_limit := 300;
    WHEN 'vendor-directions' THEN minute_limit := 60; hour_limit := 1000;
    WHEN 'mapbox-directions' THEN minute_limit := 60; hour_limit := 1000;
    WHEN 'google-places' THEN minute_limit := 120; hour_limit := 3000;
    ELSE RAISE EXCEPTION 'Unsupported endpoint' USING ERRCODE = '22023';
  END CASE;
  IF user_limit IS NOT NULL AND (p_subject IS NULL OR length(p_subject) > 128) THEN
    RAISE EXCEPTION 'Verified subject required' USING ERRCODE = '22023';
  END IF;
  DELETE FROM public.paid_api_limits WHERE expires_at < now_at - interval '1 hour';
  -- Atomic upserts serialize competing requests. Global budgets also bound
  -- anonymous abuse without trusting spoofable client IP headers.
  FOR i IN 1..CASE WHEN user_limit IS NULL THEN 2 ELSE 3 END LOOP
    IF i = 1 THEN
      bucket_name := 'global-minute'; quota := minute_limit;
      start_at := date_trunc('minute', now_at); end_at := start_at + interval '1 minute';
    ELSIF i = 2 THEN
      bucket_name := 'global-hour'; quota := hour_limit;
      start_at := date_trunc('hour', now_at); end_at := start_at + interval '1 hour';
    ELSE
      bucket_name := 'user:' || p_subject; quota := user_limit;
      start_at := date_trunc('minute', now_at); end_at := start_at + interval '1 minute';
    END IF;
    INSERT INTO public.paid_api_limits AS limits
      (endpoint, bucket, window_start, expires_at, request_count)
    VALUES (p_endpoint, bucket_name, start_at, end_at, 1)
    ON CONFLICT (endpoint, bucket, window_start) DO UPDATE
      SET request_count = LEAST(limits.request_count + 1, quota + 1)
    RETURNING request_count INTO count_now;
    IF count_now > quota THEN
      RETURN jsonb_build_object('allowed', false, 'retry_after', GREATEST(1, ceil(extract(epoch FROM end_at - now_at))));
    END IF;
  END LOOP;
  RETURN jsonb_build_object('allowed', true);
END;
$$;
REVOKE ALL ON FUNCTION public.consume_paid_api_quota(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_paid_api_quota(text, text) TO service_role;
COMMIT;
