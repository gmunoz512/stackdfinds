/**
 * A listing is vetted only after an admin approves it.
 * vendor-review writes verification_status = "approved" and sets verified_at
 * (and verified_by) at that moment. Both fields must be present.
 * Published-but-unapproved rows, mock listings, and missing timestamps are not vetted.
 */
export function isVettedListing(input: {
  verificationStatus?: string | null;
  verifiedAt?: string | null;
} | null | undefined): boolean {
  if (!input?.verifiedAt) return false;
  return input.verificationStatus === "approved";
}
