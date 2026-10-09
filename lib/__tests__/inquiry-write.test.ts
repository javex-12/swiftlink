import { describe, expect, it } from "vitest";
import { recordOrderIntent, toMinorUnits } from "../inquiry-write";
import { DEVICE_HASH_STORAGE_KEY, getDeviceHash } from "../inquiries";

describe("inquiry write path", () => {
  it("converts major prices to integer minor units without float drift", () => {
    // 18500.10 * 100 is 1850009.9999999998 in IEEE-754.
    expect(toMinorUnits(18500.1)).toBe(1850010);
    expect(toMinorUnits(0.1)).toBe(10);
    expect(toMinorUnits(19.99)).toBe(1999);
    expect(toMinorUnits(0)).toBe(0);
  });

  it("never returns a non-integer or NaN for unusable input", () => {
    for (const bad of [NaN, Infinity, -Infinity]) {
      expect(toMinorUnits(bad)).toBe(0);
    }
    expect(Number.isInteger(toMinorUnits(1234.567))).toBe(true);
  });

  it("is a silent no-op with no store (demo mode) or an empty order", async () => {
    expect(await recordOrderIntent({ storeId: null, currency: "NGN", items: [] })).toBe(0);
    expect(await recordOrderIntent({ storeId: undefined, currency: "NGN", items: [] })).toBe(0);
    expect(
      await recordOrderIntent({
        storeId: "11111111-1111-1111-1111-111111111111",
        currency: "NGN",
        items: [],
      }),
    ).toBe(0);
  });

  it("resolves a device hash without touching a browser environment", () => {
    // Non-browser callers get a constant instead of a throw.
    expect(getDeviceHash()).toBe("server");
    expect(DEVICE_HASH_STORAGE_KEY).toBe("swiftlink_device_hash");
  });
});
