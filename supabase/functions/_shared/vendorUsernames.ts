// Shared by create-vendor-account and vendor-username-sign-in.
// Mirrors src/lib/vendorAccounts.ts.
// deno-lint-ignore-file no-explicit-any
export const VENDOR_LOGIN_DOMAIN = "vendors.stackdfinds.com";
const USERNAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeUsername(input: unknown): string {
  return String(input ?? "").trim().toLowerCase();
}
export function isValidUsername(u: string): boolean {
  return u.length >= 3 && u.length <= 30 && USERNAME_RE.test(u);
}
export function usernameLoginEmail(u: string): string {
  return `${u}@${VENDOR_LOGIN_DOMAIN}`;
}

/**
 * Finds the auth user that owns a vendor username. Reads app_metadata (only the
 * server can write it), so a user editing their own user_metadata can't claim
 * someone else's username. Pages through auth users; fine for a few thousand.
 */
export async function findUserByUsername(admin: any, username: string): Promise<any | null> {
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const users = data?.users ?? [];
    const hit = users.find((u: any) =>
      u.app_metadata?.vendor_username === username || u.email?.toLowerCase() === usernameLoginEmail(username));
    if (hit) return hit;
    if (users.length < 1000) return null;
  }
  return null;
}
