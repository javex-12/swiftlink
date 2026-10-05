import { describe, expect, it } from "vitest";
import {
  toMinorUnits,
  toMajorUnits,
  formatMoney,
  formatMajorMoney,
  isSupportedCurrency,
  convertProductPriceToMinor,
} from "../currency";

describe("Multi-Currency and Minor Units", () => {
  it("converts product price to minor units via Intl exponent: 1500 NGN -> 150000, 12.5 GBP -> 1250", () => {
    expect(convertProductPriceToMinor(1500, "NGN")).toBe(150000);
    expect(convertProductPriceToMinor(12.5, "GBP")).toBe(1250);
    expect(convertProductPriceToMinor(99.99, "USD")).toBe(9999);
  });

  it("converts whole Naira to integer minor units (kobo)", () => {
    expect(toMinorUnits(1500, "NGN")).toBe(150000);
    expect(toMinorUnits(0, "NGN")).toBe(0);
    expect(toMinorUnits(250.5, "NGN")).toBe(25050);
  });

  it("converts minor units back to major units", () => {
    expect(toMajorUnits(150000, "NGN")).toBe(1500);
    expect(toMajorUnits(25050, "NGN")).toBe(250.5);
  });

  it("formats integer minor units using Intl.NumberFormat without hardcoded symbols", () => {
    const ngnFormatted = formatMoney(150000, "NGN");
    // Should format as currency with proper grouping
    expect(ngnFormatted).toContain("1,500");

    const usdFormatted = formatMoney(2500, "USD");
    expect(usdFormatted).toContain("25");

    const gbpFormatted = formatMoney(5000, "GBP");
    expect(gbpFormatted).toContain("50");
  });

  it("formats major money directly", () => {
    const res = formatMajorMoney(5000, "NGN");
    expect(res).toContain("5,000");
  });

  it("identifies supported currencies", () => {
    expect(isSupportedCurrency("NGN")).toBe(true);
    expect(isSupportedCurrency("GHS")).toBe(true);
    expect(isSupportedCurrency("USD")).toBe(true);
    expect(isSupportedCurrency("XYZ")).toBe(false);
  });
});
