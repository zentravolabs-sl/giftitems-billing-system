export const DEFAULT_CURRENCY = "Rs.";

/**
 * Format an amount with currency symbol.
 * Handles "Rs." (with space), "Rs", or any custom symbol from store settings.
 * Examples:
 *   formatPrice(25) => "Rs. 25.00"
 *   formatPrice(25, "Rs.") => "Rs. 25.00"
 *   formatPrice(25, "Rs") => "Rs 25.00"
 *   formatPrice(25, "$") => "$25.00"
 */
export function formatPrice(
  amount: number | string | { toString(): string } | null | undefined | any,
  symbol: string = DEFAULT_CURRENCY
): string {
  const num = typeof amount === "number" ? amount : Number(amount?.toString?.() ?? amount) || 0;
  const formatted = num.toFixed(2);
  if (!symbol) return formatted;
  const trimmed = symbol.trim();
  const needsSpace = trimmed.length > 1;
  return `${trimmed}${needsSpace ? " " : ""}${formatted}`;
}
