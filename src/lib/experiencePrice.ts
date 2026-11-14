import type { AirbnbPrice } from "./airbnbListingFacts.ts";
import { formatUsd, priceSummary } from "./guestBooking.ts";

export const PRICE_ON_REQUEST = "Price on request";

export function formatListingMoney(amount: number, price: AirbnbPrice): string {
  const body = Number.isInteger(amount)
    ? amount.toLocaleString("en-US")
    : amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price.currency === "USD") return formatUsd(amount);
  const symbol = price.display.match(/^(US\$|MX\$|CA\$|AU\$|A\$|NZ\$|€|£|\$)/)?.[1];
  if (symbol) return `${symbol}${body}`;
  if (price.currency) return `${price.currency} ${body}`;
  return body;
}

/** Guest-facing per-person price, or "Price on request" when the listing has none. */
export function guestPriceLine(price: AirbnbPrice | null): string {
  if (!price) return PRICE_ON_REQUEST;
  const amount = price.currency === "USD" ? formatUsd(price.amount) : price.display;
  return price.from ? `From ${amount}` : amount;
}

/** Same guest total as vendor booking: listed price × guests, service fee $0. */
export function listingPriceBreakdown(price: AirbnbPrice, guests: number) {
  const summary = priceSummary(price.amount, guests);
  const prefix = price.from ? "From " : "";
  const minimumApplies = price.minimumAmount != null && price.minimumAmount > summary.total;
  const totalAmount = minimumApplies ? (price.minimumAmount as number) : summary.total;
  return {
    guests: summary.guests,
    subtotal: `${prefix}${formatListingMoney(summary.subtotal, price)}`,
    fees: formatListingMoney(0, price),
    total: `${minimumApplies ? "" : prefix}${formatListingMoney(totalAmount, price)}`,
    minimum: minimumApplies ? (price.minimumDisplay ?? formatListingMoney(totalAmount, price)) : null,
  };
}
