/**
 * Currency utilities for multi-currency support and integer minor units.
 *
 * All database money columns store integer minor units (kobo, cents, pesewas, pence).
 * All formatting uses Intl.NumberFormat based on the store currency.
 */

export const SUPPORTED_CURRENCIES = [
  "NGN",
  "GHS",
  "KES",
  "ZAR",
  "GBP",
  "USD",
  "EUR",
  "CAD",
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export function isSupportedCurrency(code: string): code is SupportedCurrency {
  return SUPPORTED_CURRENCIES.includes(code.toUpperCase() as SupportedCurrency);
}

/**
 * Returns the minor unit exponent (number of decimal places) for a currency
 * dynamically derived from Intl.NumberFormat.
 */
export function getCurrencyExponent(currency: string = "NGN"): number {
  try {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    });
    return formatter.resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

/**
 * Converts stored product major units (e.g. 1500 for ₦1,500, or 12.5 for £12.50)
 * into integer minor units using the currency's Intl exponent.
 * Used strictly server-side in inquiry creation.
 */
export function convertProductPriceToMinor(price: number, currency: string = "NGN"): number {
  const exponent = getCurrencyExponent(currency);
  const multiplier = Math.pow(10, exponent);
  return Math.round(Number(price || 0) * multiplier);
}

/**
 * Currency config for locale formatting.
 */
const CURRENCY_LOCALES: Record<SupportedCurrency, string> = {
  NGN: "en-NG",
  GHS: "en-GH",
  KES: "en-KE",
  ZAR: "en-ZA",
  GBP: "en-GB",
  USD: "en-US",
  EUR: "de-DE",
  CAD: "en-CA",
};

/**
 * Convert user-entered major unit integer/decimal (e.g. 1500) into integer minor units (150000).
 */
export function toMinorUnits(majorAmount: number, currency: string = "NGN"): number {
  return convertProductPriceToMinor(majorAmount, currency);
}

/**
 * Convert minor units (e.g. 150000) into major units (1500).
 */
export function toMajorUnits(minorAmount: number, currency: string = "NGN"): number {
  const exponent = getCurrencyExponent(currency);
  const divisor = Math.pow(10, exponent);
  return Number(minorAmount || 0) / divisor;
}

/**
 * Format money from integer minor units using standard Intl.NumberFormat.
 * e.g. 150000 minor in NGN -> "₦1,500" or "NGN 1,500"
 */
export function formatMoney(
  minorAmount: number | null | undefined,
  currency: string = "NGN",
  options: { showDecimalsIfZero?: boolean } = {},
): string {
  if (minorAmount === null || minorAmount === undefined || Number.isNaN(minorAmount)) {
    return formatMoney(0, currency, options);
  }

  const code = (currency || "NGN").toUpperCase() as SupportedCurrency;
  const locale = CURRENCY_LOCALES[code] || "en-US";
  const majorValue = toMajorUnits(minorAmount, code);

  const hasFractions = majorValue % 1 !== 0;
  const fractionDigits = hasFractions || options.showDecimalsIfZero ? 2 : 0;

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: 2,
    }).format(majorValue);
  } catch {
    return `${code} ${majorValue.toLocaleString()}`;
  }
}

/**
 * Format money when the input is already in major units.
 */
export function formatMajorMoney(
  majorAmount: number | null | undefined,
  currency: string = "NGN",
): string {
  return formatMoney(toMinorUnits(majorAmount || 0, currency), currency);
}
