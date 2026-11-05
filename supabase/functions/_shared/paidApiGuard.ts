/** Guard only the six paid endpoints in Finding #8; no legacy callers change. */
export async function guardPaidApi(
  req: Request,
  endpoint: string,
  corsHeaders: Record<string, string>,
  requireUser = false,
): Promise<Response | null> {
  const reject = (status: number, error: string, extra = {}) => new Response(
    JSON.stringify({ success: false, error }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json',
      'Access-Control-Expose-Headers': [corsHeaders['Access-Control-Expose-Headers'], 'Retry-After'].filter(Boolean).join(', '), ...extra } },
  );
  if (req.method !== 'POST') return reject(405, 'POST required', { Allow: 'POST, OPTIONS' });
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return reject(503, 'Service temporarily unavailable');
  try {
    // Bound paid prompt/request size even when Content-Length is absent or false.
    const reader = req.clone().body?.getReader();
    const decoder = new TextDecoder();
    let body = '';
    if (reader) {
      let bytes = 0;
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > 16_384) {
          void reader.cancel().catch(() => {});
          return reject(413, 'Request is too large');
        }
        body += decoder.decode(chunk.value, { stream: true });
      }
    }
    body += decoder.decode();
    // Reject malformed input before it consumes the shared quota. Leave the
    // original request body available to the endpoint's field validation.
    try {
      const payload = JSON.parse(body);
      if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
        return reject(400, 'A JSON object is required');
      }
    } catch {
      return reject(400, 'A JSON object is required');
    }
    let subject: string | null = null;
    if (requireUser) {
      const authorization = req.headers.get('authorization');
      if (!authorization || !/^Bearer \S+$/i.test(authorization)) return reject(401, 'Sign in required');
      // Ask Auth to validate the token; never trust a decoded JWT or anon API key.
      const authResponse = await fetch(`${url}/auth/v1/user`, {
        headers: { apikey: key, Authorization: authorization },
        signal: AbortSignal.timeout(5000),
      });
      if (authResponse.status >= 500 || authResponse.status === 429) return reject(503, 'Authentication temporarily unavailable');
      if (!authResponse.ok) return reject(401, 'Sign in required');
      const user = await authResponse.json();
      if (typeof user.id !== 'string' || !user.id || user.is_anonymous === true) return reject(401, 'Sign in required');
      subject = user.id;
    }
    const quotaResponse = await fetch(`${url}/rest/v1/rpc/consume_paid_api_quota`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_endpoint: endpoint, p_subject: subject }),
      signal: AbortSignal.timeout(5000),
    });
    if (!quotaResponse.ok) return reject(503, 'Service temporarily unavailable');
    const quota = await quotaResponse.json();
    if (quota.allowed === true) return null;
    if (quota.allowed === false && Number.isFinite(quota.retry_after)) {
      return reject(429, 'Too many requests. Please try again later.', {
        'Retry-After': String(Math.max(1, Math.ceil(quota.retry_after))),
      });
    }
    return reject(503, 'Service temporarily unavailable');
  } catch {
    // No third-party work is allowed if Auth or the quota service fails.
    return reject(503, 'Service temporarily unavailable');
  }
}

export function normalizeAirbnbUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const input = value.trim();
    const url = new URL(input.includes('://') ? input : `https://${input}`);
    if (url.protocol !== 'https:' || url.username || url.password || url.port ||
        !['airbnb.com', 'www.airbnb.com'].includes(url.hostname) ||
        !/^\/(experiences|rooms)\/[0-9]+\/?$/.test(url.pathname)) return null;
    // Canonical listing URLs only: no short links, redirects or arbitrary paths.
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}
