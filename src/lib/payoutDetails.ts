/** Vendor payout details. Guests and hosts never see these fields. */

export const PAYOUT_METHODS = [
  "bank_transfer_mx_clabe",
  "bank_transfer_us_ach",
  "bank_transfer_iban",
  "other",
] as const;

export type PayoutMethod = (typeof PAYOUT_METHODS)[number];

const CLABE_WEIGHTS = [3, 7, 1];

const IBAN_LENGTHS: Record<string, number> = {
  AT: 20,
  BE: 16,
  CH: 21,
  DE: 22,
  ES: 24,
  FR: 27,
  GB: 22,
  IT: 27,
  MX: 18,
  NL: 18,
};

export function isPayoutMethod(value: unknown): value is PayoutMethod {
  return typeof value === "string" && (PAYOUT_METHODS as readonly string[]).includes(value);
}

export function clabeCheckDigit(first17: string): number {
  let sum = 0;
  for (let i = 0; i < 17; i += 1) {
    sum += (Number(first17[i]) * CLABE_WEIGHTS[i % 3]) % 10;
  }
  return (10 - (sum % 10)) % 10;
}

/** 18 digits and the Banxico weighted check digit. */
export function isValidClabe(value: string): boolean {
  if (!/^[0-9]{18}$/.test(value)) return false;
  return Number(value[17]) === clabeCheckDigit(value.slice(0, 17));
}

/** ISO 13616: country length when we know it, then MOD 97-10 equals 1. */
export function isValidIban(value: string): boolean {
  const iban = value.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban) || iban.length > 34) return false;
  const expected = IBAN_LENGTHS[iban.slice(0, 2)];
  if (expected && iban.length !== expected) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const char of rearranged) {
    const chunk = char >= "A" && char <= "Z" ? String(char.charCodeAt(0) - 55) : char;
    for (const digit of chunk) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}

/** ABA routing checksum. All zeros is not a routing number. */
export function isValidRoutingNumber(value: string): boolean {
  if (!/^\d{9}$/.test(value)) return false;
  const d = value.split("").map(Number);
  const sum = 3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5] + d[8]);
  return sum !== 0 && sum % 10 === 0;
}

/** Last 4 digits stay visible. The rest is hidden. */
export function maskAccountNumber(value: string | null | undefined): string | null {
  if (!value) return null;
  const compact = value.replace(/\s+/g, "");
  if (!compact) return null;
  if (compact.length <= 4) return compact;
  const hidden = Math.min(6, compact.length - 4);
  return `${"•".repeat(hidden)}${compact.slice(-4)}`;
}

export interface PayoutDraft {
  payoutMethod: PayoutMethod | "";
  accountHolderName: string;
  country: string;
  currency: string;
  bankName: string;
  clabe: string;
  routingNumber: string;
  accountNumber: string;
  iban: string;
  swift: string;
  payoutEmail: string;
}

export interface PayoutRecord {
  payout_method: PayoutMethod;
  account_holder_name: string;
  country: string | null;
  currency: string | null;
  bank_name: string | null;
  clabe: string | null;
  routing_number: string | null;
  account_number: string | null;
  iban: string | null;
  swift: string | null;
  payout_email: string | null;
}

export function validatePayoutDetails(draft: PayoutDraft): { ok: true; row: PayoutRecord } | { ok: false; error: string } {
  if (!isPayoutMethod(draft.payoutMethod)) return { ok: false, error: "Choose how you want to be paid." };
  const holder = draft.accountHolderName.trim();
  if (holder.length < 2 || holder.length > 120) return { ok: false, error: "Add the name on the account." };
  const country = draft.country.trim().toUpperCase();
  if (country && !/^[A-Z]{2}$/.test(country)) return { ok: false, error: "Use a two-letter country code." };
  const currency = draft.currency.trim().toUpperCase();
  if (currency && !/^[A-Z]{3}$/.test(currency)) return { ok: false, error: "Use a three-letter currency code." };
  const email = draft.payoutEmail.trim();
  if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200)) {
    return { ok: false, error: "That payout email doesn't look right." };
  }
  const bank = draft.bankName.trim();
  if (bank.length > 120) return { ok: false, error: "That bank name is too long." };
  const swift = draft.swift.trim().toUpperCase();
  if (swift && !/^[A-Z0-9]{8}([A-Z0-9]{3})?$/.test(swift)) return { ok: false, error: "That SWIFT code doesn't look right." };

  const clabe = draft.clabe.replace(/\s+/g, "");
  const routing = draft.routingNumber.replace(/\s+/g, "");
  const account = draft.accountNumber.replace(/\s+/g, "");
  const iban = draft.iban.replace(/\s+/g, "").toUpperCase();

  const row: PayoutRecord = {
    payout_method: draft.payoutMethod,
    account_holder_name: holder,
    country: country || null,
    currency: currency || null,
    bank_name: bank || null,
    clabe: null,
    routing_number: null,
    account_number: null,
    iban: null,
    swift: swift || null,
    payout_email: email || null,
  };

  if (draft.payoutMethod === "bank_transfer_mx_clabe") {
    if (!isValidClabe(clabe)) return { ok: false, error: "Enter an 18-digit CLABE with a valid check digit." };
    row.clabe = clabe;
    row.swift = null;
    return { ok: true, row };
  }
  if (draft.payoutMethod === "bank_transfer_us_ach") {
    if (!isValidRoutingNumber(routing)) return { ok: false, error: "Enter a 9-digit routing number with a valid check digit." };
    if (!/^[0-9]{4,17}$/.test(account)) return { ok: false, error: "Enter the account number, 4 to 17 digits." };
    row.routing_number = routing;
    row.account_number = account;
    return { ok: true, row };
  }
  if (draft.payoutMethod === "bank_transfer_iban") {
    if (!isValidIban(iban)) return { ok: false, error: "That IBAN doesn't look right." };
    row.iban = iban;
    return { ok: true, row };
  }
  return { ok: true, row };
}
