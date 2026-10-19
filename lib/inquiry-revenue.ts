/**
 * Confirmed revenue from sold inquiries.
 *
 * An inquiry is one product line. `final_amount_minor` — the order total after
 * a discount — is written once, on the first line of an order, so summing it
 * across rows would count the total once per product only if every line carried
 * it (they do not). Summing `product_price_minor` instead would ignore the
 * discount and use the *unit* price rather than the line total.
 *
 * This helper reads the rows the way `create_or_update_inquiry` writes them:
 * an order's total is counted once, identified by `order_ref`, and lines of that
 * order do not add their unit price on top. A row from before `order_ref`
 * existed (or a standalone quote inquiry) falls back to its own price, which is
 * the best number available rather than a zero.
 *
 * Exported and pure so the arithmetic is testable without a database.
 */

export type SoldInquiryRow = {
  order_ref?: string | null;
  final_amount_minor?: number | null;
  product_price_minor?: number | null;
};

function amount(value: number | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function confirmedSalesMinor(rows: readonly SoldInquiryRow[]): number {
  const ordersWithTotal = new Set(
    rows
      .filter((row) => row.order_ref && row.final_amount_minor !== null && row.final_amount_minor !== undefined)
      .map((row) => row.order_ref as string),
  );

  return rows.reduce((sum, row) => {
    if (row.final_amount_minor !== null && row.final_amount_minor !== undefined) {
      return sum + amount(row.final_amount_minor);
    }
    if (row.order_ref && ordersWithTotal.has(row.order_ref)) {
      // The order total already includes this line.
      return sum;
    }
    return sum + amount(row.product_price_minor);
  }, 0);
}
