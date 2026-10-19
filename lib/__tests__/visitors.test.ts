import { describe, expect, it } from "vitest";
import {
  groupVisitors,
  visitorActionLabel,
  visitorLabel,
  visitorTotals,
  type VisitorEventRow,
  type VisitorOrderRow,
} from "../visitors";

/**
 * Visitor grouping contracts.
 *
 * The console shows one row per visitor built from raw storefront events, so
 * these tests pin the two things that would make that row wrong in a way a
 * merchant could not see: a visitor silently split into two (because the id was
 * read from the wrong place) and a browser someone hand-edits becoming a name.
 */

const at = (minutesAgo: number) => new Date(Date.UTC(2026, 9, 17, 12, 0, 0) - minutesAgo * 60_000).toISOString();

const event = (
  visitor: string | null,
  event_type: string,
  minutesAgo: number,
  extra: Partial<VisitorEventRow> = {},
): VisitorEventRow => ({
  event_type,
  created_at: at(minutesAgo),
  metadata: visitor && visitor !== "none" ? { visitor_id: visitor } : {},
  ...extra,
});

describe("visitorLabel", () => {
  it("shortens the anonymous id and never prints the whole thing", () => {
    const id = "9f2c1d4e-5a6b-7c8d-9e0f-112233445566";
    const label = visitorLabel(id);
    expect(label).toBe("Visitor 9f2c1d4e");
    expect(label).not.toContain(id);
  });

  it("says so when the id is missing rather than printing a blank", () => {
    expect(visitorLabel("")).toBe("Unknown visitor");
    expect(visitorLabel("unknown")).toBe("Unknown visitor");
  });
});

describe("visitorActionLabel", () => {
  it("names known events in the merchant's language", () => {
    expect(visitorActionLabel("view")).toBe("Viewed the store");
    expect(visitorActionLabel("product_click")).toBe("Clicked a product");
    expect(visitorActionLabel("checkout")).toBe("Started checkout");
  });

  it("covers the legacy checkout spelling instead of inventing a second meaning", () => {
    expect(visitorActionLabel("whatsapp_checkout")).toBe("Started checkout");
  });

  it("falls back to the raw type for events it does not know", () => {
    expect(visitorActionLabel("store_transferred")).toBe("store transferred");
  });
});

describe("groupVisitors", () => {
  it("makes one session per browser, not one per event", () => {
    const sessions = groupVisitors([
      event("a", "view", 30),
      event("a", "product_click", 29, { product_id: 7 }),
      event("a", "checkout", 25, { metadata: { visitor_id: "a", channel: "whatsapp" } }),
      event("b", "view", 10),
    ]);

    expect(sessions).toHaveLength(2);
    const a = sessions.find((s) => s.id === "a")!;
    expect(a.views).toBe(1);
    expect(a.productClicks).toBe(1);
    expect(a.checkouts).toBe(1);
    expect(a.channels).toEqual(["whatsapp"]);
    expect(a.firstSeen).toBe(at(30));
    expect(a.lastSeen).toBe(at(25));
  });

  it("sorts by most recent activity, so a returning visitor is not buried", () => {
    const sessions = groupVisitors([
      event("early", "view", 600),
      event("returns", "view", 500),
      event("returns", "view", 5),
    ]);
    expect(sessions.map((s) => s.id)).toEqual(["returns", "early"]);
  });

  it("keeps the most-clicked products per visitor and drops the long tail", () => {
    const clicks = [
      event("a", "product_click", 40, { product_id: 1 }),
      event("a", "product_click", 39, { product_id: 2 }),
      event("a", "product_click", 38, { product_id: 2 }),
      event("a", "product_click", 37, { product_id: 3 }),
      event("a", "product_click", 36, { product_id: 4 }),
    ];

    // Default keeps three: the list is a summary of one visitor, not a report.
    const sessions = groupVisitors(clicks, {
      productName: (id) => (id === null ? null : `Product ${id}`),
    });
    expect(sessions[0].products.map((p) => [p.id, p.clicks])).toEqual([
      [2, 2],
      [1, 1],
      [3, 1],
    ]);
    expect(sessions[0].products[0].name).toBe("Product 2");

    // And the cap is the caller's to set.
    const one = groupVisitors(clicks, { productsPerVisitor: 1 });
    expect(one[0].products.map((p) => p.id)).toEqual([2]);
  });

  it("identifies a visitor only from an order, never from behaviour", () => {
    const orders: VisitorOrderRow[] = [
      { device_hash: "buyer", buyer_name: "Ada", buyer_phone: "+2348000000000", created_at: at(20), status: "sold" },
    ];
    const sessions = groupVisitors([event("buyer", "checkout", 21), event("browser", "view", 19)], { orders });

    const buyer = sessions.find((s) => s.id === "buyer")!;
    expect(buyer.ordered).toBe(true);
    expect(buyer.orders).toBe(1);
    expect(buyer.name).toBe("Ada");
    expect(buyer.phone).toBe("+2348000000000");

    const browser = sessions.find((s) => s.id === "browser")!;
    expect(browser.ordered).toBe(false);
    expect(browser.name).toBeNull();
    expect(browser.phone).toBeNull();
  });

  it("keeps events whose visitor id is missing in one bucket instead of losing them", () => {
    const sessions = groupVisitors([event("none", "view", 3), event(null, "product_click", 2, { product_id: 9 })]);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe("unknown");
    expect(sessions[0].views).toBe(1);
    expect(sessions[0].productClicks).toBe(1);
  });

  it("reports the last thing the visitor did", () => {
    const sessions = groupVisitors([
      event("a", "view", 30),
      event("a", "checkout", 1, { metadata: { visitor_id: "a", channel: "whatsapp" } }),
    ]);
    expect(sessions[0].lastAction).toBe("Started checkout");
  });

  it("caps the list at the limit, keeping the freshest", () => {
    const events = Array.from({ length: 5 }, (_, index) => event(`v${index}`, "view", index));
    const sessions = groupVisitors(events, { limit: 2 });
    expect(sessions.map((s) => s.id)).toEqual(["v0", "v1"]);
  });

  it("returns nothing for an empty stream rather than a phantom visitor", () => {
    expect(groupVisitors([])).toEqual([]);
  });
});

describe("visitorTotals", () => {
  it("adds the sessions up for the header and the tab badge", () => {
    const sessions = groupVisitors([
      event("a", "view", 30),
      event("a", "product_click", 29, { product_id: 1 }),
      event("a", "checkout", 28, { metadata: { visitor_id: "a", channel: "whatsapp" } }),
      event("b", "view", 10),
    ]);
    const orders: VisitorOrderRow[] = [
      { device_hash: "a", buyer_name: "Ada", created_at: at(28), status: "sold" },
    ];
    const withOrders = groupVisitors(
      [
        event("a", "view", 30),
        event("a", "checkout", 28, { metadata: { visitor_id: "a", channel: "whatsapp" } }),
        event("b", "view", 10),
      ],
      { orders },
    );

    expect(visitorTotals(sessions)).toEqual({
      visitors: 2,
      views: 2,
      productClicks: 1,
      checkouts: 1,
      ordered: 0,
    });
    expect(visitorTotals(withOrders).ordered).toBe(1);
    expect(visitorTotals([]).visitors).toBe(0);
  });
});
