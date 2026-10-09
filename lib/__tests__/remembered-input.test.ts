import { describe, expect, it } from "vitest";
import { mergeRememberedInput, prefillMerchantInput } from "../remembered-input";

/**
 * "Remember my info" saves the merchant typing the same handle and phone number
 * on every visit. The risk is the other direction: a remembered value must never
 * overwrite something the store already knows.
 */
describe("mergeRememberedInput", () => {
  it("adds new values", () => {
    expect(mergeRememberedInput(null, { phone: "+2348000000000" })).toEqual({
      phone: "+2348000000000",
    });
  });

  it("treats a blank value as 'no opinion' rather than 'forget'", () => {
    const current = { phone: "+2348000000000", countryCode: "NG" };
    expect(mergeRememberedInput(current, { phone: "   " })).toEqual(current);
  });

  it("overwrites with a newer non-empty value", () => {
    expect(mergeRememberedInput({ phone: "+2348000000000" }, { phone: "+447700900000" })).toEqual({
      phone: "+447700900000",
    });
  });

  it("trims stored values", () => {
    expect(mergeRememberedInput(null, { bizName: "  Aura Essentials " })).toEqual({
      bizName: "Aura Essentials",
    });
  });
});

describe("prefillMerchantInput", () => {
  const remembered = {
    bizName: "Aura Essentials",
    storeUsername: "aura-essentials",
    phone: "+2348000000000",
    countryCode: "NG",
    currency: "₦",
  };

  it("fills every blank field", () => {
    const prefill = prefillMerchantInput(remembered, { bizName: "", phone: "", currency: "" });
    expect(prefill.state).toEqual({
      bizName: "Aura Essentials",
      storeUsername: "aura-essentials",
      phone: "+2348000000000",
      currency: "₦",
    });
    expect(prefill.countryCode).toBe("NG");
  });

  it("never overwrites a value the store already has", () => {
    const prefill = prefillMerchantInput(remembered, {
      bizName: "My Real Store",
      phone: "+440000000000",
    });
    expect(prefill.state.bizName).toBeUndefined();
    expect(prefill.state.phone).toBeUndefined();
    expect(prefill.state.storeUsername).toBe("aura-essentials");
  });

  it("returns nothing when there is nothing remembered", () => {
    expect(prefillMerchantInput(null, {})).toEqual({ state: {} });
    expect(prefillMerchantInput(undefined, undefined)).toEqual({ state: {} });
  });
});
