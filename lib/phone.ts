/**
 * Phone number validation and normalization powered by libphonenumber-js.
 *
 * Rules:
 * - Default country: NG (Nigeria).
 * - Format stored: strictly E.164 (+234..., +44..., +1...).
 * - Nigerian numbers: 10 digits after +234, no leading 0 in local portion.
 * - Country-neutral error messages unless country = NG.
 */

import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string;
  countryCode: string;
  error?: string;
  formattedInternational?: string;
}

export function normalizePhoneNumber(
  raw: string,
  defaultCountry: CountryCode = "NG",
): PhoneValidationResult {
  const trimmed = (raw || "").trim();
  if (!trimmed) {
    return {
      isValid: false,
      normalized: "",
      countryCode: defaultCountry,
      error: "Phone number is required",
    };
  }

  // Pre-process local Nigerian patterns (e.g. 0808... or 808... or 234808...)
  let input = trimmed;
  if (defaultCountry === "NG") {
    const digitsOnly = trimmed.replace(/\D/g, "");
    if (trimmed.startsWith("0") && digitsOnly.length === 11) {
      input = `+234${digitsOnly.slice(1)}`;
    } else if (trimmed.startsWith("234") && !trimmed.startsWith("+") && digitsOnly.length === 13) {
      input = `+${digitsOnly}`;
    } else if (!trimmed.startsWith("+") && digitsOnly.length === 10 && /^[789]/.test(digitsOnly)) {
      input = `+234${digitsOnly}`;
    }
  }

  try {
    const phoneNumber = parsePhoneNumberFromString(input, defaultCountry);

    if (!phoneNumber || !phoneNumber.isValid()) {
      if (defaultCountry === "NG" || input.startsWith("+234")) {
        const digits = trimmed.replace(/\D/g, "");
        if (digits.length < 10) {
          return {
            isValid: false,
            normalized: input,
            countryCode: "NG",
            error: "That number looks too short. Nigerian numbers have 10 digits after +234.",
          };
        }
        return {
          isValid: false,
          normalized: input,
          countryCode: "NG",
          error: "Please enter a valid 10-digit Nigerian WhatsApp number (e.g. 0808 000 0000).",
        };
      }

      return {
        isValid: false,
        normalized: input,
        countryCode: defaultCountry,
        error: "Please enter a valid phone number with country code.",
      };
    }

    const country = (phoneNumber.country || defaultCountry) as string;

    // Strict Nigerian length enforcement
    if (country === "NG") {
      const nationalNumber = phoneNumber.nationalNumber;
      if (nationalNumber.length !== 10) {
        return {
          isValid: false,
          normalized: phoneNumber.number,
          countryCode: "NG",
          error: "That number looks too short. Nigerian numbers have 10 digits after +234.",
        };
      }
    }

    return {
      isValid: true,
      normalized: phoneNumber.number, // E.164 format: e.g. +2348081234567
      countryCode: country,
      formattedInternational: phoneNumber.formatInternational(),
    };
  } catch {
    return {
      isValid: false,
      normalized: input,
      countryCode: defaultCountry,
      error: defaultCountry === "NG"
        ? "Please enter a valid 10-digit Nigerian WhatsApp number."
        : "Please enter a valid phone number with country code.",
    };
  }
}

export interface SupportedCountry {
  code: CountryCode;
  name: string;
  callingCode: string;
  defaultCurrency: string;
}

export const SUPPORTED_COUNTRIES: SupportedCountry[] = [
  { code: "NG", name: "Nigeria", callingCode: "+234", defaultCurrency: "NGN" },
  { code: "GH", name: "Ghana", callingCode: "+233", defaultCurrency: "GHS" },
  { code: "KE", name: "Kenya", callingCode: "+254", defaultCurrency: "KES" },
  { code: "ZA", name: "South Africa", callingCode: "+27", defaultCurrency: "ZAR" },
  { code: "GB", name: "United Kingdom", callingCode: "+44", defaultCurrency: "GBP" },
  { code: "US", name: "United States", callingCode: "+1", defaultCurrency: "USD" },
  { code: "CA", name: "Canada", callingCode: "+1", defaultCurrency: "CAD" },
];

export function getDefaultCurrencyForCountry(countryCode: string): string {
  const match = SUPPORTED_COUNTRIES.find((c) => c.code === countryCode.toUpperCase());
  return match ? match.defaultCurrency : "NGN";
}

/**
 * Splits an E.164 or raw phone string into its country code and national number.
 * Guarantees the national number NEVER duplicates the dial code.
 */
export function splitPhoneNumber(
  raw: string = "",
  fallbackCountry: CountryCode = "NG",
): {
  countryCode: CountryCode;
  callingCode: string;
  nationalNumber: string;
} {
  const trimmed = (raw || "").trim();
  const defaultEntry =
    SUPPORTED_COUNTRIES.find((c) => c.code === fallbackCountry) || SUPPORTED_COUNTRIES[0];

  if (!trimmed) {
    return {
      countryCode: defaultEntry.code,
      callingCode: defaultEntry.callingCode,
      nationalNumber: "",
    };
  }

  try {
    // If it starts with +, parse directly
    if (trimmed.startsWith("+")) {
      const parsed = parsePhoneNumberFromString(trimmed);
      if (parsed && parsed.country) {
        const entry = SUPPORTED_COUNTRIES.find((c) => c.code === parsed.country);
        const calling = entry ? entry.callingCode : `+${parsed.countryCallingCode}`;
        return {
          countryCode: parsed.country,
          callingCode: calling,
          nationalNumber: parsed.nationalNumber,
        };
      }
    }

    // Try parsing with fallback country
    const parsedWithFallback = parsePhoneNumberFromString(trimmed, fallbackCountry);
    if (parsedWithFallback && parsedWithFallback.country) {
      const entry = SUPPORTED_COUNTRIES.find((c) => c.code === parsedWithFallback.country);
      const calling = entry ? entry.callingCode : `+${parsedWithFallback.countryCallingCode}`;
      return {
        countryCode: parsedWithFallback.country,
        callingCode: calling,
        nationalNumber: parsedWithFallback.nationalNumber,
      };
    }
  } catch {
    // Fall back to regex stripping
  }

  // Fallback stripping for unparseable raw input
  const digits = trimmed.replace(/\D/g, "");
  const dialDigits = defaultEntry.callingCode.replace(/\D/g, "");

  if (digits.startsWith(dialDigits)) {
    return {
      countryCode: defaultEntry.code,
      callingCode: defaultEntry.callingCode,
      nationalNumber: digits.slice(dialDigits.length),
    };
  }

  if (digits.startsWith("0")) {
    return {
      countryCode: defaultEntry.code,
      callingCode: defaultEntry.callingCode,
      nationalNumber: digits.slice(1),
    };
  }

  return {
    countryCode: defaultEntry.code,
    callingCode: defaultEntry.callingCode,
    nationalNumber: digits,
  };
}

/**
 * Normalizes user-pasted input to strip dial codes and local leading zeros.
 */
export function cleanPastedNationalNumber(
  pastedText: string,
  callingCode: string,
): { countryCode?: CountryCode; nationalNumber: string } {
  const trimmed = pastedText.trim();
  const digitsOnly = trimmed.replace(/\D/g, "");
  const dialDigits = callingCode.replace(/\D/g, "");

  // If pasted with +, check if it matches a known country
  if (trimmed.startsWith("+")) {
    try {
      const parsed = parsePhoneNumberFromString(trimmed);
      if (parsed && parsed.country) {
        return {
          countryCode: parsed.country,
          nationalNumber: parsed.nationalNumber,
        };
      }
    } catch {
      // continue
    }
  }

  // If user pasted 234808...
  if (digitsOnly.startsWith(dialDigits) && digitsOnly.length > dialDigits.length) {
    return { nationalNumber: digitsOnly.slice(dialDigits.length) };
  }

  // If user pasted 0808...
  if (digitsOnly.startsWith("0") && digitsOnly.length > 1) {
    return { nationalNumber: digitsOnly.slice(1) };
  }

  return { nationalNumber: digitsOnly };
}
