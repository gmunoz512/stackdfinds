export type SignInAction = "book" | "save" | "pay";

export const SIGN_IN_COPY: Record<SignInAction, string> = {
  book: "Sign in to book this.",
  save: "Sign in to save this.",
  pay: "Sign in to pay.",
};

/** Same return path for every book, save, and pay gate. */
export function signInPath(returnTo?: string): string {
  const target =
    returnTo ||
    (typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/appview");
  return `/auth?returnTo=${encodeURIComponent(target)}`;
}
