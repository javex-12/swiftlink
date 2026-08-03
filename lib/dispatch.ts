/** Logistics / live tracking helpers — shared by dispatch, driver, and customer views. */

export type DispatchStatus =
  | "pending"
  | "en_route"
  | "nearby"
  | "delivered"
  | "cancelled";

export type DispatchTrackRow = {
  id?: string;
  tracking_code: string;
  store_id?: string | null;
  driver_name?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  item_name?: string | null;
  waybill?: string | null;
  destination?: string | null;
  dest_lat?: number | null;
  dest_lng?: number | null;
  status?: string | null;
  lat?: number | null;
  lng?: number | null;
  heading?: number | null;
  speed?: number | null;
  accuracy?: number | null;
  delivery_pin?: string | null;
  path?: Array<{ lat: number; lng: number; t?: string }> | null;
  updated_at?: string | null;
  created_at?: string | null;
  last_ping_at?: string | null;
};

export type LivePoint = { lat: number; lng: number };

export type PathPoint = LivePoint & { t?: string };

/** Earth-distance in meters (Haversine). */
export function haversineMeters(a: LivePoint, b: LivePoint): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return "—";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters < 10_000 ? 1 : 0)} km`;
}

/** Rough ETA from distance + optional GPS speed (m/s). Falls back to 25 km/h urban. */
export function estimateEtaMinutes(
  meters: number,
  speedMps?: number | null,
): number | null {
  if (!Number.isFinite(meters) || meters <= 0) return 0;
  const fallback = 25_000 / 3600; // 25 km/h in m/s
  const speed =
    speedMps && speedMps > 0.5 ? speedMps : fallback;
  const minutes = Math.ceil(meters / speed / 60);
  return Math.max(1, Math.min(minutes, 180));
}

export function formatEta(minutes: number | null): string {
  if (minutes == null) return "—";
  if (minutes <= 0) return "Arriving";
  if (minutes < 60) return `~${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `~${h}h ${m}m` : `~${h}h`;
}

export function generateDeliveryPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function generateTrackingCode(): string {
  return "TRK-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

/** Seconds since last GPS ping. null if unknown. */
export function secondsSince(iso?: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.round((Date.now() - t) / 1000));
}

export function formatLastSeen(iso?: string | null): string {
  const s = secondsSince(iso);
  if (s == null) return "No GPS yet";
  if (s < 8) return "Just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

/** Live if pinged within 45s; stale 45s–3min; offline after. */
export type LiveHealth = "live" | "stale" | "offline" | "waiting";

export function liveHealth(iso?: string | null, hasCoords = false): LiveHealth {
  if (!hasCoords) return "waiting";
  const s = secondsSince(iso);
  if (s == null) return "waiting";
  if (s <= 45) return "live";
  if (s <= 180) return "stale";
  return "offline";
}

export const NEARBY_RADIUS_M = 400;

export function normalizeDispatchStatus(
  raw?: string | null,
  distanceM?: number | null,
  hasDriverGps = false,
): DispatchStatus {
  if (raw === "delivered" || raw === "cancelled") return raw;
  if (raw === "nearby") return "nearby";
  if (
    hasDriverGps &&
    distanceM != null &&
    distanceM <= NEARBY_RADIUS_M
  ) {
    return "nearby";
  }
  if (raw === "en_route" || hasDriverGps) return "en_route";
  return "pending";
}

export function statusLabel(s: DispatchStatus): string {
  switch (s) {
    case "pending":
      return "Awaiting driver";
    case "en_route":
      return "On the way";
    case "nearby":
      return "Nearby — arriving soon";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    default:
      return "Unknown";
  }
}

/** Append a path point, keep last N, skip tiny jitter. */
export function appendPathPoint(
  path: PathPoint[] | null | undefined,
  point: LivePoint,
  maxPoints = 80,
  minDeltaM = 12,
): PathPoint[] {
  const next: PathPoint[] = Array.isArray(path) ? [...path] : [];
  const last = next[next.length - 1];
  if (last && haversineMeters(last, point) < minDeltaM) {
    // refresh timestamp on last point without growing array
    next[next.length - 1] = { ...last, t: new Date().toISOString() };
    return next;
  }
  next.push({ ...point, t: new Date().toISOString() });
  if (next.length > maxPoints) return next.slice(next.length - maxPoints);
  return next;
}

export function customerTrackUrl(code: string, origin?: string): string {
  const base =
    origin ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/?track=${encodeURIComponent(code)}`;
}

export function driverTrackUrl(code: string, origin?: string): string {
  const base =
    origin ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/dispatch/driver/${encodeURIComponent(code)}`;
}

/** Map DB row → lightweight Delivery used in shop state / TrackingView. */
export function trackRowToDelivery(row: DispatchTrackRow) {
  const hasGps =
    typeof row.lat === "number" &&
    typeof row.lng === "number" &&
    Number.isFinite(row.lat) &&
    Number.isFinite(row.lng);

  let distanceM: number | null = null;
  if (
    hasGps &&
    typeof row.dest_lat === "number" &&
    typeof row.dest_lng === "number"
  ) {
    distanceM = haversineMeters(
      { lat: row.lat!, lng: row.lng! },
      { lat: row.dest_lat, lng: row.dest_lng },
    );
  }

  const status = normalizeDispatchStatus(
    row.status,
    distanceM,
    hasGps,
  );

  // Map logistics status → Delivery.status used in UI
  const deliveryStatus: "dispatched" | "delivered" | "in-transit" =
    status === "delivered"
      ? "delivered"
      : status === "en_route" || status === "nearby"
        ? "in-transit"
        : "dispatched";

  return {
    id: row.tracking_code,
    status: deliveryStatus,
    customer: row.customer_name || "Customer",
    phone: row.customer_phone || "",
    item: row.item_name || "Package",
    driver: row.driver_name || "Driver",
    ref: row.waybill || row.tracking_code,
    lastLocation: hasGps ? { lat: row.lat!, lng: row.lng! } : undefined,
    destination: row.destination || "",
    destLat: row.dest_lat ?? undefined,
    destLng: row.dest_lng ?? undefined,
    deliveryPin: row.delivery_pin || undefined,
    dispatchStatus: status,
    heading: row.heading ?? undefined,
    speed: row.speed ?? undefined,
    accuracy: row.accuracy ?? undefined,
    path: Array.isArray(row.path) ? row.path : [],
    lastPingAt: row.last_ping_at || row.updated_at || undefined,
    updatedAt: row.updated_at || undefined,
    createdAt: row.created_at || undefined,
    distanceM: distanceM ?? undefined,
  };
}

export type TrackedDelivery = ReturnType<typeof trackRowToDelivery>;
