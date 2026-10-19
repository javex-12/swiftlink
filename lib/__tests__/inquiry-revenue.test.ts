import { describe, expect, it } from "vitest";
import { confirmedSalesMinor } from "../inquiry-revenue";

/**
 * `final_amount_minor` is an order total written on the first line only. The
 * home dashboard used to sum every row's price, which over-counted multi-product
 * orders and showed a total higher than the merchant was actually paid.
 */

describe("confirmedSalesMinor", () => {
  it("counts a single-product order once", () => {
    expect(
      confirmedSalesMinor([
        { order_ref: "SL-A", final_amount_minor: 500000, product_price_minor: 500000 },
      ]),
    ).toBe(500000);
  });

  it("does not add the other lines of the same order on top of its total", () => {
    expect(
      confirmedSalesMinor([
        { order_ref: "SL-B", final_amount_minor: 900000, product_price_minor: 500000 },
        { order_ref: "SL-B", final_amount_minor: null, product_price_minor: 450000 },
      ]),
    ).toBe(900000);
  });

  it("keeps separate orders separate", () => {
    expect(
      confirmedSalesMinor([
        { order_ref: "SL-C", final_amount_minor: 300000, product_price_minor: 300000 },
        { order_ref: "SL-D", final_amount_minor: 100000, product_price_minor: 100000 },
      ]),
    ).toBe(400000);
  });

  it("falls back to the row price for legacy rows with no order total", () => {
    expect(
      confirmedSalesMinor([{ product_price_minor: 250000 }, { product_price_minor: 0 }]),
    ).toBe(250000);
  });

  it("does not treat a quote inquiry's zero as revenue", () => {
    expect(confirmedSalesMinor([{ order_ref: "SL-E", final_amount_minor: null, product_price_minor: 0 }])).toBe(0);
  });

  it("ignores missing and non-numeric amounts", () => {
    expect(
      confirmedSalesMinor([
        { product_price_minor: null },
        { product_price_minor: Number.NaN },
        { order_ref: "SL-F", final_amount_minor: 100000 },
      ]),
    ).toBe(100000);
  });

  it("counts nothing for an empty list", () => {
    expect(confirmedSalesMinor([])).toBe(0);
  });
});
