/** Public site origin. Set VITE_SITE_URL in the client (no trailing slash). */
export const SITE_URL = (import.meta.env.VITE_SITE_URL || "").replace(/\/$/, "");

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return SITE_URL ? `${SITE_URL}${normalized}` : normalized;
}
