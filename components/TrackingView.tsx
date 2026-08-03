"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useMap } from "react-leaflet";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase-client";
import {
  MapPin,
  Wifi,
  WifiOff,
  Navigation,
  Phone,
  ShieldCheck,
  Clock,
  Route,
  Package,
} from "lucide-react";
import {
  trackRowToDelivery,
  formatDistance,
  formatEta,
  estimateEtaMinutes,
  formatLastSeen,
  liveHealth,
  statusLabel,
  type DispatchTrackRow,
  type DispatchStatus,
  type LivePoint,
  type PathPoint,
  NEARBY_RADIUS_M,
} from "@/lib/dispatch";
import type { Delivery } from "@/lib/schema";
import "leaflet/dist/leaflet.css";

// useMap must run under MapContainer; keep helpers in this client module only.

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false },
);
const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false },
);
const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false },
);
const Polyline = dynamic(
  () => import("react-leaflet").then((m) => m.Polyline),
  { ssr: false },
);
const Circle = dynamic(
  () => import("react-leaflet").then((m) => m.Circle),
  { ssr: false },
);

/** Keeps map centered on the moving driver without remounting MapContainer. */
function RecenterMap({
  position,
  follow,
}: {
  position: LivePoint | null;
  follow: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (!position || !follow) return;
    map.panTo([position.lat, position.lng], { animate: true, duration: 0.6 });
  }, [position?.lat, position?.lng, follow, map]);
  return null;
}

function FitBoundsOnce({
  driver,
  dest,
}: {
  driver: LivePoint | null;
  dest: LivePoint | null;
}) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    if (driver && dest) {
      map.fitBounds(
        [
          [driver.lat, driver.lng],
          [dest.lat, dest.lng],
        ],
        { padding: [48, 48], maxZoom: 15 },
      );
      done.current = true;
    }
  }, [driver, dest, map]);
  return null;
}

const STEPS: { key: DispatchStatus; label: string }[] = [
  { key: "pending", label: "Created" },
  { key: "en_route", label: "En route" },
  { key: "nearby", label: "Nearby" },
  { key: "delivered", label: "Delivered" },
];

function stepIndex(status: DispatchStatus): number {
  if (status === "cancelled") return -1;
  const i = STEPS.findIndex((s) => s.key === status);
  return i >= 0 ? i : 0;
}

function LiveMap({
  driver,
  dest,
  path,
  accuracy,
  isLive,
}: {
  driver: LivePoint | null;
  dest: LivePoint | null;
  path: PathPoint[];
  accuracy?: number;
  isLive: boolean;
}) {
  const [L, setL] = useState<typeof import("leaflet") | null>(null);
  const [follow, setFollow] = useState(true);

  useEffect(() => {
    void import("leaflet").then(setL);
  }, []);

  const center: [number, number] = driver
    ? [driver.lat, driver.lng]
    : dest
      ? [dest.lat, dest.lng]
      : [6.5244, 3.3792]; // Lagos fallback

  const driverIcon = useMemo(() => {
    if (!L) return null;
    return L.divIcon({
      className: "",
      html: `<div style="
        width:36px;height:36px;border-radius:9999px;
        background:linear-gradient(135deg,#10b981,#059669);
        border:3px solid white;box-shadow:0 4px 14px rgba(16,185,129,.45);
        display:flex;align-items:center;justify-content:center;
      "><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  }, [L]);

  const destIcon = useMemo(() => {
    if (!L) return null;
    return L.divIcon({
      className: "",
      html: `<div style="
        width:32px;height:32px;border-radius:10px;
        background:#0f172a;border:3px solid white;
        box-shadow:0 4px 12px rgba(15,23,42,.35);
        display:flex;align-items:center;justify-content:center;
        color:white;font-size:14px;font-weight:900;
      ">🏠</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  }, [L]);

  if (!driver && !dest) {
    return (
      <div className="w-full h-72 rounded-3xl mb-4 bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
        <MapPin size={28} className="text-slate-300" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Waiting for live location…
        </p>
        <p className="text-[11px] text-slate-400 font-medium px-8">
          Driver must open their GPS link and tap Share Location.
        </p>
      </div>
    );
  }

  const pathLatLngs = path.map((p) => [p.lat, p.lng] as [number, number]);

  return (
    <div className="w-full h-96 sm:h-[26rem] rounded-3xl overflow-hidden mb-4 shadow-inner border border-slate-100 relative z-0">
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
        zoomControl
      >
        {/* ESRI World Imagery — real satellite photos, free & no API key */}
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />
        {/* OSM street labels overlay on top of satellite — transparent so aerial still shows */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          opacity={0.45}
        />
        <RecenterMap position={driver} follow={follow} />
        <FitBoundsOnce driver={driver} dest={dest} />

        {pathLatLngs.length > 1 && (
          <Polyline
            positions={pathLatLngs}
            pathOptions={{
              color: "#10b981",
              weight: 5,
              opacity: 0.85,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        )}

        {driver && driverIcon && (
          <Marker position={[driver.lat, driver.lng]} icon={driverIcon}>
            <Popup>Driver is here</Popup>
          </Marker>
        )}

        {driver && accuracy && accuracy > 0 && accuracy < 200 && (
          <Circle
            center={[driver.lat, driver.lng]}
            radius={accuracy}
            pathOptions={{
              color: "#10b981",
              fillColor: "#10b981",
              fillOpacity: 0.1,
              weight: 1.5,
            }}
          />
        )}

        {dest && destIcon && (
          <Marker position={[dest.lat, dest.lng]} icon={destIcon}>
            <Popup>Delivery destination</Popup>
          </Marker>
        )}
      </MapContainer>

      <div className="absolute top-3 left-3 right-3 z-[500] flex items-center justify-between gap-2 pointer-events-none">
        <div
          className={`pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${
            isLive
              ? "bg-emerald-500 text-white"
              : "bg-white/95 text-slate-600 border border-slate-200"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${isLive ? "bg-white animate-pulse" : "bg-slate-400"}`}
          />
          {isLive ? "Live GPS" : "Map"}
        </div>
        <button
          type="button"
          onClick={() => setFollow((f) => !f)}
          className={`pointer-events-auto px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg border transition-all ${
            follow
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white/95 text-slate-600 border-slate-200"
          }`}
        >
          {follow ? "Following" : "Free pan"}
        </button>
      </div>
    </div>
  );
}

export function TrackingView() {
  const { trackingDisplay, confirmDelivery, currentTrackId } = useSwiftLink();

  const [row, setRow] = useState<Delivery | null>(trackingDisplay);
  const [loading, setLoading] = useState(!trackingDisplay && !!currentTrackId);
  const [tick, setTick] = useState(0);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Sync from context when it loads
  useEffect(() => {
    if (trackingDisplay) {
      setRow(trackingDisplay);
      setLoading(false);
    }
  }, [trackingDisplay]);

  // Clock for "updated Xs ago"
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 5000);
    return () => window.clearInterval(id);
  }, []);

  const applyRow = useCallback((data: DispatchTrackRow) => {
    setRow(trackRowToDelivery(data));
    setLoading(false);
  }, []);

  // Initial fetch + realtime
  useEffect(() => {
    if (!currentTrackId) return;

    let cancelled = false;

    const fetchOnce = async () => {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("dispatch_tracking")
        .select("*")
        .eq("tracking_code", currentTrackId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.warn(error);
        setLoading(false);
        return;
      }
      if (data) applyRow(data as DispatchTrackRow);
      else setLoading(false);
    };

    void fetchOnce();

    // Poll fallback every 12s (in case realtime is off)
    const poll = window.setInterval(() => void fetchOnce(), 12_000);

    if (channelRef.current) {
      void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (isSupabaseConfigured()) {
      const ch = supabase
        .channel(`tracking-${currentTrackId}-${Date.now()}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "dispatch_tracking",
            filter: `tracking_code=eq.${currentTrackId}`,
          },
          (payload) => {
            const next = (payload.new || payload.old) as DispatchTrackRow | undefined;
            if (next && next.tracking_code) applyRow(next);
          },
        )
        .subscribe();
      channelRef.current = ch;
    }

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [currentTrackId, applyRow]);

  // tick forces re-render so "updated Xs ago" stays fresh
  void tick;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-500">Loading live tracking…</p>
      </div>
    );
  }

  const d = row;

  if (!d) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-6">
            <Package className="text-slate-400" size={28} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Not Found</h1>
          <p className="text-slate-500 font-bold mb-2">
            Tracking ID not found.
          </p>
          <p className="text-xs text-slate-400 font-mono">
            {currentTrackId || "—"}
          </p>
          <p className="text-sm text-slate-400 mt-4">
            Ask the sender for a fresh tracking link, or check the code.
          </p>
        </div>
        <div className="mt-8 opacity-30 flex items-center justify-center space-x-2">
          <img src="/logo.png" className="w-6 h-6 grayscale" alt="" width={24} height={24} />
          <span className="font-black text-slate-900 tracking-tight text-xl">
            SwiftLink<span className="text-emerald-500">Pro</span>
          </span>
        </div>
      </div>
    );
  }

  const delivered = d.status === "delivered" || d.dispatchStatus === "delivered";
  const driverLoc = d.lastLocation ?? null;
  const destLoc =
    typeof d.destLat === "number" && typeof d.destLng === "number"
      ? { lat: d.destLat, lng: d.destLng }
      : null;

  const health = liveHealth(d.lastPingAt || d.updatedAt, !!driverLoc);
  const isLive = health === "live";
  const distanceM = d.distanceM;
  const etaMin = estimateEtaMinutes(distanceM ?? -1, d.speed);
  const dispatchStatus = (d.dispatchStatus ||
    (delivered ? "delivered" : driverLoc ? "en_route" : "pending")) as DispatchStatus;
  const activeStep = stepIndex(dispatchStatus);

  const handleConfirm = async () => {
    if (d.deliveryPin) {
      if (pinInput.trim() !== d.deliveryPin) {
        setPinError(true);
        return;
      }
    }
    setPinError(false);
    await confirmDelivery();
  };

  const callDriver = () => {
    // No dedicated driver phone field yet — use customer phone is wrong.
    // Merchant stores driver as name only. Skip if nothing useful.
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/80 flex flex-col items-center p-4 sm:p-6 pb-16">
      <div className="max-w-2xl w-full bg-white rounded-[2.5rem] p-5 sm:p-8 shadow-2xl border border-slate-100 mt-6 sm:mt-10">
        {/* Header status */}
        <div className="flex items-start justify-between gap-3 mb-6">
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
              Live tracking
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {delivered ? "Delivered" : statusLabel(dispatchStatus)}
            </h1>
            <p className="text-slate-500 font-bold text-sm mt-1">
              {delivered
                ? "Item received. Thanks!"
                : isLive
                  ? "Driver location updating in real time."
                  : health === "stale"
                    ? "Signal weak — last fix is a bit old."
                    : health === "offline"
                      ? "Driver GPS appears offline."
                      : "Waiting for driver to share GPS…"}
            </p>
          </div>
          <div
            className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
              delivered
                ? "bg-emerald-500"
                : isLive
                  ? "bg-amber-500 animate-pulse"
                  : "bg-slate-200"
            }`}
          >
            {delivered ? (
              <ShieldCheck className="text-white" size={26} />
            ) : isLive ? (
              <Navigation className="text-white" size={26} />
            ) : (
              <WifiOff className="text-slate-500" size={22} />
            )}
          </div>
        </div>

        {/* Trust chips */}
        {!delivered && (
          <div className="flex flex-wrap gap-2 mb-4">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                health === "live"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  : health === "stale"
                    ? "bg-amber-50 text-amber-700 border border-amber-100"
                    : health === "offline"
                      ? "bg-red-50 text-red-600 border border-red-100"
                      : "bg-slate-50 text-slate-500 border border-slate-100"
              }`}
            >
              {health === "live" ? (
                <Wifi size={12} />
              ) : health === "waiting" ? (
                <Clock size={12} />
              ) : (
                <WifiOff size={12} />
              )}
              {health === "live"
                ? "Verified live"
                : health === "stale"
                  ? "Stale signal"
                  : health === "offline"
                    ? "Offline"
                    : "No GPS yet"}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-600 border border-slate-100">
              <Clock size={12} />
              {formatLastSeen(d.lastPingAt || d.updatedAt)}
            </span>
            {distanceM != null && distanceM >= 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white">
                <Route size={12} />
                {formatDistance(distanceM)}
                {etaMin != null && distanceM > NEARBY_RADIUS_M
                  ? ` · ${formatEta(etaMin)}`
                  : distanceM <= NEARBY_RADIUS_M
                    ? " · arriving"
                    : ""}
              </span>
            )}
          </div>
        )}

        {/* Map */}
        {!delivered && (
          <LiveMap
            driver={driverLoc}
            dest={destLoc}
            path={d.path || []}
            accuracy={d.accuracy}
            isLive={isLive}
          />
        )}

        {/* Timeline */}
        <div className="flex items-center justify-between gap-1 mb-6 px-1">
          {STEPS.map((step, i) => {
            const done = activeStep >= i || delivered;
            const current = activeStep === i && !delivered;
            return (
              <div key={step.key} className="flex-1 flex flex-col items-center gap-2 relative">
                {i > 0 && (
                  <div
                    className={`absolute top-2 right-1/2 left-[-50%] h-0.5 ${
                      activeStep >= i || delivered ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  />
                )}
                <div
                  className={`relative z-10 w-4 h-4 rounded-full border-2 ${
                    done
                      ? "bg-emerald-500 border-emerald-500"
                      : current
                        ? "bg-white border-amber-500 animate-pulse"
                        : "bg-white border-slate-200"
                  }`}
                />
                <span
                  className={`text-[9px] font-black uppercase tracking-wider ${
                    done || current ? "text-slate-800" : "text-slate-300"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Details card */}
        <div className="bg-slate-50 rounded-3xl p-5 sm:p-6 text-left space-y-4 mb-5">
          <div className="flex justify-between gap-4 border-b border-slate-200/80 pb-3">
            <span className="text-[10px] font-black text-slate-400 uppercase">Item</span>
            <span className="font-bold text-slate-900 text-right">{d.item}</span>
          </div>
          <div className="flex justify-between gap-4 border-b border-slate-200/80 pb-3">
            <span className="text-[10px] font-black text-slate-400 uppercase">Driver</span>
            <span className="font-bold text-slate-900 text-right">{d.driver}</span>
          </div>
          {d.destination && (
            <div className="flex justify-between gap-4 border-b border-slate-200/80 pb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase">To</span>
              <span className="font-bold text-slate-900 text-right text-sm">{d.destination}</span>
            </div>
          )}
          <div className="flex justify-between gap-4 border-b border-slate-200/80 pb-3">
            <span className="text-[10px] font-black text-slate-400 uppercase">Ref</span>
            <span className="font-bold text-slate-900 font-mono text-right">{d.ref}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-[10px] font-black text-slate-400 uppercase">Track code</span>
            <span className="font-bold text-emerald-600 font-mono text-right text-sm">{d.id}</span>
          </div>
        </div>

        {/* Delivery PIN — trust handoff */}
        {d.deliveryPin && !delivered && (
          <div className="mb-5 rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5 text-left">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={18} className="text-emerald-600" />
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                Delivery PIN
              </p>
            </div>
            <p className="text-3xl font-black tracking-[0.35em] text-slate-900 font-mono mb-2">
              {d.deliveryPin}
            </p>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Only share this PIN with the driver when the package is in your hands.
              It proves the right person arrived.
            </p>
          </div>
        )}

        {/* Confirm receipt */}
        {!delivered ? (
          <div className="space-y-3">
            {d.deliveryPin && (
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 text-left">
                  Enter PIN to confirm receipt
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4));
                    setPinError(false);
                  }}
                  placeholder="••••"
                  className={`w-full bg-slate-50 p-4 rounded-2xl font-black text-center text-xl tracking-[0.5em] outline-none border ${
                    pinError
                      ? "border-red-300 focus:border-red-400"
                      : "border-slate-100 focus:border-emerald-300"
                  }`}
                />
                {pinError && (
                  <p className="text-xs text-red-500 font-bold mt-2 text-left">
                    Wrong PIN — check the code above or from your WhatsApp message.
                  </p>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() => void handleConfirm()}
              className="w-full bg-emerald-500 text-white py-5 rounded-2xl font-black shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              I HAVE RECEIVED IT
            </button>
          </div>
        ) : (
          <div className="bg-emerald-50 text-emerald-700 font-bold py-4 rounded-2xl border border-emerald-100 flex items-center justify-center gap-2">
            <ShieldCheck size={18} />
            Delivery confirmed
          </div>
        )}

        {/* Customer phone quick actions — merchant may have left phone on record */}
        {d.phone && !delivered && (
          <a
            href={`https://wa.me/${d.phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors"
            onClick={callDriver}
          >
            <Phone size={14} />
            Message about this delivery
          </a>
        )}
      </div>

      <div className="mt-8 opacity-30 flex items-center justify-center space-x-2">
        <img src="/logo.png" className="w-6 h-6 grayscale" alt="" width={24} height={24} />
        <span className="font-black text-slate-900 tracking-tight text-xl">
          SwiftLink<span className="text-emerald-500">Pro</span>
        </span>
      </div>
    </div>
  );
}
