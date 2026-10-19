/**
 * Visitor sessions, rebuilt from the storefront's own event stream.
 *
 * The storefront has always recorded what happened — a `view` on load, a
 * `product_click` per product tap, a `checkout` per order intent — but only as a
 * flat list counted into daily totals. A merchant could see *that* 400 views
 * happened and never *who* did anything: which visitor came back four times,
 * which one tapped six products and left, which one actually opened WhatsApp.
 *
 * This module turns those rows into one row per visitor. It is deliberately a
 * pure function over plain arrays: the console passes in what the database
 * returned, the store's products (to name what was tapped) and its orders (to
 * name a visitor who actually bought), and gets back a sortable list. No
 * fetching, no React, no Supabase — so the grouping rules are unit-testable
 * without a browser.
 *
 * **Identity is anonymous by construction.** A visitor is a random per-browser
 * id (`swiftlink_device_hash`), not a person: no IP address, no user agent, no
 * location is read or stored. It is the same value the storefront already uses
 * to collapse repeat order taps into one inquiry, which is what lets a visitor
 * who *did* order be matched to the name and phone they typed themselves —
 * and only in that case does this module produce anything identifying.
 */

/** Event types the storefront writes. Unknown types still count, as activity. */
export const VISITOR_EVENT_LABELS: Record<string, string> = {
  view: "Viewed the store",
  product_click: "Clicked a product",
  checkout: "Started checkout",
  /** Legacy spelling still present in older rows. */
  whatsapp_checkout: "Started checkout",
};

export type VisitorEventRow = {
  event_type: string;
  created_at: string;
  product_id?: number | null;
  metadata?: Record<string, unknown> | null;
};

/** The part of an inquiry this module needs: who ordered, and which browser. */
export type VisitorOrderRow = {
  device_hash?: string | null;
  buyer_name?: string | null;
  buyer_phone?: string | null;
  created_at: string;
  status?: string | null;
};

export type VisitorProductTap = {
  id: number | null;
  name: string | null;
  clicks: number;
};

export type VisitorSession = {
  /** The anonymous browser id. Display goes through `visitorLabel`. */
  id: string;
  firstSeen: string;
  lastSeen: string;
  views: number;
  productClicks: number;
  checkouts: number;
  /** Most-clicked products, most first. */
  products: VisitorProductTap[];
  /** Checkout channels used, in first-seen order. */
  channels: string[];
  /** What the visitor did last, as a label the console can print. */
  lastAction: string;
  /** True when an order on this store carries the same browser id. */
  ordered: boolean;
  orders: number;
  /**
   * Only ever the name and phone the visitor typed into an order. Null for
   * everyone who merely browsed — browsing is not identity.
   */
  name: string | null;
  phone: string | null;
};

/** Oldest first, so "first seen" and "last seen" are read straight off the ends. */
function byTime(a: { created_at: string }, b: { created_at: string }): number {
  return Date.parse(a.created_at) - Date.parse(b.created_at);
}

function readVisitorId(event: VisitorEventRow): string {
  const value = event.metadata?.visitor_id;
  const id = typeof value === "string" ? value.trim() : "";
  // Rows written before the id existed (or by a client that blocked storage)
  // still belong to somebody: they are grouped under one bucket rather than
  // dropped, because a visitor list that silently loses events lies.
  return id || "unknown";
}

function readChannel(event: VisitorEventRow): string | null {
  const value = event.metadata?.channel;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * A stable, non-identifying name for a visitor.
 *
 * The raw id is a 36-character random string; printing it whole is noise and
 * printing a *person's* details here would be wrong. Eight characters are
 * enough to tell two visitors apart in one store's list and reveal nothing,
 * because the id is random and store-scoped.
 */
export function visitorLabel(id: string): string {
  if (!id || id === "unknown") return "Unknown visitor";
  return `Visitor ${id.slice(0, 8)}`;
}

/** Friendly copy for an event type, falling back to the raw type. */
export function visitorActionLabel(eventType: string): string {
  return VISITOR_EVENT_LABELS[eventType] ?? eventType.replace(/_/g, " ");
}

export type GroupVisitorsOptions = {
  /** Names a clicked product id for display. */
  productName?: (id: number | null) => string | null;
  /** Orders on the same store, used to identify a visitor who actually bought. */
  orders?: readonly VisitorOrderRow[];
  /** How many products to keep per visitor. Defaults to 3: this is a summary. */
  productsPerVisitor?: number;
  /** Cap on returned sessions, newest activity first. Defaults to 200. */
  limit?: number;
};

/**
 * One session per visitor, most recently active first.
 *
 * Ordering by *last* activity is deliberate: a merchant opening this list is
 * asking "what is happening now", and a visitor from this morning who came back
 * five minutes ago belongs at the top, not buried under the time they first
 * arrived.
 */
export function groupVisitors(
  events: readonly VisitorEventRow[],
  options: GroupVisitorsOptions = {},
): VisitorSession[] {
  const { productName, orders = [], productsPerVisitor = 3, limit = 200 } = options;

  const ordersByVisitor = new Map<string, VisitorOrderRow[]>();
  for (const order of orders) {
    const id = (order.device_hash ?? "").trim();
    if (!id) continue;
    const list = ordersByVisitor.get(id) ?? [];
    list.push(order);
    ordersByVisitor.set(id, list);
  }

  const sessions = new Map<
    string,
    VisitorSession & { productCounts: Map<number | null, number> }
  >();

  for (const event of [...events].sort(byTime)) {
    const id = readVisitorId(event);
    const at = event.created_at;
    const existing = sessions.get(id);

    if (!existing) {
      sessions.set(id, {
        id,
        firstSeen: at,
        lastSeen: at,
        views: 0,
        productClicks: 0,
        checkouts: 0,
        products: [],
        channels: [],
        lastAction: visitorActionLabel(event.event_type),
        ordered: false,
        orders: 0,
        name: null,
        phone: null,
        productCounts: new Map(),
      });
    }

    const session = sessions.get(id)!;
    session.lastSeen = at;
    session.lastAction = visitorActionLabel(event.event_type);

    if (event.event_type === "view") session.views += 1;
    if (event.event_type === "product_click") {
      session.productClicks += 1;
      const pid = event.product_id ?? null;
      session.productCounts.set(pid, (session.productCounts.get(pid) ?? 0) + 1);
    }
    if (event.event_type === "checkout" || event.event_type === "whatsapp_checkout") {
      session.checkouts += 1;
      const channel = readChannel(event);
      if (channel && !session.channels.includes(channel)) session.channels.push(channel);
    }
  }

  const result: VisitorSession[] = [];
  for (const session of sessions.values()) {
    const matched = ordersByVisitor.get(session.id) ?? [];
    // A name is only ever taken from an order row, never guessed from activity.
    const latest = [...matched].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];

    const { productCounts, ...rest } = session;
    result.push({
      ...rest,
      ordered: matched.length > 0,
      orders: matched.length,
      name: latest?.buyer_name?.trim() || null,
      phone: latest?.buyer_phone?.trim() || null,
      products: [...productCounts.entries()]
        .map(([id, clicks]) => ({ id, name: productName?.(id) ?? null, clicks }))
        .sort((a, b) => b.clicks - a.clicks || Number(a.id ?? 0) - Number(b.id ?? 0))
        .slice(0, productsPerVisitor),
    });
  }

  return result
    .sort((a, b) => Date.parse(b.lastSeen) - Date.parse(a.lastSeen))
    .slice(0, limit)
    .map(({ ...session }) => session);
}

/** Counts for the tab badge and the header line. */
export function visitorTotals(sessions: readonly VisitorSession[]): {
  visitors: number;
  views: number;
  productClicks: number;
  checkouts: number;
  ordered: number;
} {
  return sessions.reduce(
    (totals, session) => ({
      visitors: totals.visitors + 1,
      views: totals.views + session.views,
      productClicks: totals.productClicks + session.productClicks,
      checkouts: totals.checkouts + session.checkouts,
      ordered: totals.ordered + (session.ordered ? 1 : 0),
    }),
    { visitors: 0, views: 0, productClicks: 0, checkouts: 0, ordered: 0 },
  );
}
