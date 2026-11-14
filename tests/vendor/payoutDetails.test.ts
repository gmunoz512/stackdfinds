import { describe, expect, it } from "vitest";
import {
  clabeCheckDigit,
  isValidClabe,
  isValidIban,
  isValidRoutingNumber,
  maskAccountNumber,
  validatePayoutDetails,
  type PayoutDraft,
} from "@/lib/payoutDetails";

const base: PayoutDraft = {
  payoutMethod: "bank_transfer_mx_clabe",
  accountHolderName: "Ada Host",
  country: "MX",
  currency: "MXN",
  bankName: "Example",
  clabe: "",
  routingNumber: "",
  accountNumber: "",
  iban: "",
  swift: "",
  payoutEmail: "",
};

describe("CLABE", () => {
  const body = "03218000011835971";
  const clabe = `${body}${clabeCheckDigit(body)}`;

  it("accepts the weighted check digit and rejects a changed one", () => {
    expect(isValidClabe(clabe)).toBe(true);
    const bad = `${body}${String((Number(clabe[17]) + 1) % 10)}`;
    expect(isValidClabe(bad)).toBe(false);
    expect(isValidClabe("123")).toBe(false);
  });

  it("keeps only a CLABE on that payout method", () => {
    const result = validatePayoutDetails({ ...base, clabe });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row.clabe).toBe(clabe);
    expect(result.row.account_number).toBeNull();
    expect(result.row.iban).toBeNull();
  });
});

describe("IBAN and routing", () => {
  it("accepts a known IBAN and rejects a bad check digit", () => {
    expect(isValidIban("GB82 WEST 1234 5698 7654 32")).toBe(true);
    expect(isValidIban("GB82WEST12345698765433")).toBe(false);
    expect(isValidIban("DE89370400440532013000")).toBe(true);
  });

  it("accepts an ABA routing number and rejects all zeros", () => {
    expect(isValidRoutingNumber("111000025")).toBe(true);
    expect(isValidRoutingNumber("000000000")).toBe(false);
    expect(isValidRoutingNumber("111000026")).toBe(false);
  });
});

describe("masking", () => {
  it("shows the last 4 digits only", () => {
    const masked = maskAccountNumber("032180000118359719");
    expect(masked?.endsWith("9719")).toBe(true);
    expect(masked).not.toContain("032180");
    expect(maskAccountNumber("  GB82WEST12345698765432  ")?.endsWith("5432")).toBe(true);
  });
});
