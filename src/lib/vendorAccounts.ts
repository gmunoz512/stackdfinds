// Vendor accounts created by an admin (German) for outreach.
// The slug rule here is mirrored in supabase/functions/create-vendor-account.

export const VENDOR_EMAIL_DOMAIN = "stackdfinds.com";

/** "Tacos Número Uno!" -> "tacosnumerouno" */
export function vendorSlug(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 40);
}

/** First free address: slug@, then slug2@, slug3@ ... */
export function pickVendorEmail(name: string, taken: Set<string>): string | null {
  const slug = vendorSlug(name);
  if (!slug) return null;
  for (let n = 1; n < 1000; n++) {
    const email = `${slug}${n === 1 ? "" : n}@${VENDOR_EMAIL_DOMAIN}`;
    if (!taken.has(email)) return email;
  }
  return null;
}

export function mustChangePassword(user: { user_metadata?: Record<string, unknown> } | null | undefined): boolean {
  return user?.user_metadata?.must_change_password === true;
}

export const SET_PASSWORD_PATH = "/set-password";
