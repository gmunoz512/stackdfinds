// Vendor accounts created by an admin (German) for outreach. Vendors sign in
// with a username; Supabase Auth still needs an email, so each username maps to
// a hidden address that never receives mail and is never shown to vendors.
// The username rules here are mirrored in supabase/functions/create-vendor-account.

export const VENDOR_LOGIN_DOMAIN = "vendors.stackdfinds.com";
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;
const USERNAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** "Tacos Número Uno!" -> "tacos-numero-uno" */
export function suggestUsername(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, USERNAME_MAX)
    .replace(/-+$/g, "");
}

/** Lowercases and trims what a person typed; doesn't fix invalid characters. */
export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

export function usernameError(username: string): string | null {
  if (username.length < USERNAME_MIN) return `At least ${USERNAME_MIN} characters`;
  if (username.length > USERNAME_MAX) return `At most ${USERNAME_MAX} characters`;
  if (!USERNAME_RE.test(username)) return "Only lowercase letters, numbers and single dashes";
  return null;
}

export function usernameLoginEmail(username: string): string {
  return `${normalizeUsername(username)}@${VENDOR_LOGIN_DOMAIN}`;
}

export function isHiddenLoginEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase().endsWith(`@${VENDOR_LOGIN_DOMAIN}`);
}

/** What the sign-in box holds: an email (has "@") or a username. */
export function parseLoginIdentifier(input: string):
  | { kind: "email"; email: string }
  | { kind: "username"; username: string; email: string }
  | { kind: "invalid"; message: string } {
  const value = input.trim();
  if (!value) return { kind: "invalid", message: "Enter your email or username" };
  if (value.includes("@")) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ? { kind: "email", email: value }
      : { kind: "invalid", message: "That email doesn't look right" };
  }
  const username = normalizeUsername(value);
  const err = usernameError(username);
  return err ? { kind: "invalid", message: "That username doesn't look right" } : { kind: "username", username, email: usernameLoginEmail(username) };
}

/** The email a vendor actually reads, or null if they still only have the hidden one. */
export function preferredEmail(user: { email?: string | null; new_email?: string | null } | null | undefined): string | null {
  if (!user?.email || isHiddenLoginEmail(user.email)) return null;
  return user.email;
}

export function mustChangePassword(user: { user_metadata?: Record<string, unknown> } | null | undefined): boolean {
  return user?.user_metadata?.must_change_password === true;
}

export const SET_PASSWORD_PATH = "/set-password";
export const ACCOUNT_EMAIL_PATH = "/vendor/account-email";
