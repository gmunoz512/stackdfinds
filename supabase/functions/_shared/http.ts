const LOCAL_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:4173",
];

// Live site. SITE_URL (a Supabase function secret) overrides it.
const PRODUCTION_SITE = "https://stackdfinds.com";

export function siteUrl(): string {
  return (Deno.env.get("SITE_URL") || PRODUCTION_SITE).replace(/\/$/, "");
}

export function corsHeadersFor(req: Request, extraHeaders?: string) {
  const origin = req.headers.get("origin");
  const site = siteUrl();
  const allowed = new Set(LOCAL_ORIGINS);
  if (site) allowed.add(site);
  allowed.add(PRODUCTION_SITE);
  allowed.add("https://www.stackdfinds.com");
  const allowOrigin = origin && allowed.has(origin) ? origin : site || LOCAL_ORIGINS[1];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      extraHeaders || "authorization, x-client-info, apikey, content-type",
  };
}

export function redirectBase(req: Request): string {
  return req.headers.get("origin") || siteUrl() || LOCAL_ORIGINS[1];
}
