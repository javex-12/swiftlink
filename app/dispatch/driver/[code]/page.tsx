"use client";

import { useEffect, useRef, useState, use } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase-client";
import {
  appendPathPoint,
  haversineMeters,
  NEARBY_RADIUS_M,
  formatLastSeen,
  type DispatchTrackRow,
  type PathPoint,
} from "@/lib/dispatch";
import {
  Navigation,
  Wifi,
  WifiOff,
  MapPin,
  Package,
  ShieldCheck,
  BatteryWarning,
} from "lucide-react";

type ShareStatus = "idle" | "sharing" | "denied" | "error" | "done";

export default function DriverPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const [status, setStatus] = useState<ShareStatus>("idle");
  const [message, setMessage] = useState("Ready to share live GPS");
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{
    customer?: string;
    item?: string;
    destination?: string;
    pin?: string;
    dispatchStatus?: string;
  } | null>(null);
  const [lastFix, setLastFix] = useState<{
    lat: number;
    lng: number;
    accuracy?: number;
    at: string;
  } | null>(null);
  const [pingCount, setPingCount] = useState(0);
  const watchId = useRef<number | null>(null);
  const pathRef = useRef<PathPoint[]>([]);
  const destRef = useRef<{ lat: number; lng: number } | null>(null);
  const wakeLock = useRef<WakeLockSentinel | null>(null);

  // Load delivery meta so driver knows who/what they're delivering
  useEffect(() => {
    if (!code || !isSupabaseConfigured()) return;
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("dispatch_tracking")
        .select("*")
        .eq("tracking_code", code)
        .maybeSingle();
      if (cancelled || !data) return;
      const row = data as DispatchTrackRow;
      pathRef.current = Array.isArray(row.path) ? row.path : [];
      if (
        typeof row.dest_lat === "number" &&
        typeof row.dest_lng === "number"
      ) {
        destRef.current = { lat: row.dest_lat, lng: row.dest_lng };
      }
      setMeta({
        customer: row.customer_name || undefined,
        item: row.item_name || undefined,
        destination: row.destination || undefined,
        pin: row.delivery_pin || undefined,
        dispatchStatus: row.status || undefined,
      });
      if (row.status === "delivered") {
        setStatus("done");
        setMessage("This delivery is already marked delivered");
      }
      if (typeof row.lat === "number" && typeof row.lng === "number") {
        setLastFix({
          lat: row.lat,
          lng: row.lng,
          at: row.last_ping_at || row.updated_at || new Date().toISOString(),
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  // Cleanup watch + wake lock
  useEffect(() => {
    return () => {
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
      void wakeLock.current?.release().catch(() => undefined);
    };
  }, []);

  const requestWakeLock = async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLock.current = await navigator.wakeLock.request("screen");
      }
    } catch {
      // optional
    }
  };

  const pushLocation = async (pos: GeolocationPosition) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const accuracy = pos.coords.accuracy;
    const heading =
      pos.coords.heading != null && !Number.isNaN(pos.coords.heading)
        ? pos.coords.heading
        : null;
    const speed =
      pos.coords.speed != null && !Number.isNaN(pos.coords.speed)
        ? pos.coords.speed
        : null;
    const now = new Date().toISOString();

    pathRef.current = appendPathPoint(pathRef.current, { lat, lng });

    let nextStatus: string = "en_route";
    if (destRef.current) {
      const dist = haversineMeters({ lat, lng }, destRef.current);
      if (dist <= NEARBY_RADIUS_M) nextStatus = "nearby";
    }

    setLastFix({ lat, lng, accuracy, at: now });
    setPingCount((c) => c + 1);
    setMessage(
      nextStatus === "nearby"
        ? "You're near the customer — ask for their PIN"
        : "Live · customer can see you",
    );

    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured — location stays on this device only.");
      return;
    }

    const { error: upsertError } = await supabase
      .from("dispatch_tracking")
      .upsert(
        {
          tracking_code: code,
          lat,
          lng,
          heading,
          speed,
          accuracy,
          status: nextStatus,
          path: pathRef.current,
          last_ping_at: now,
          updated_at: now,
        },
        { onConflict: "tracking_code" },
      );

    if (upsertError) {
      console.error("Driver location upsert failed:", upsertError);
      setError(`Sync error: ${upsertError.message}`);
    } else {
      setError(null);
      setMeta((m) => (m ? { ...m, dispatchStatus: nextStatus } : m));
    }
  };

  const startSharing = () => {
    if (!navigator.geolocation) {
      setStatus("denied");
      setError("This browser does not support location sharing");
      return;
    }

    setStatus("sharing");
    setError(null);
    setMessage("Acquiring GPS fix…");
    void requestWakeLock();

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        void pushLocation(pos);
      },
      (err) => {
        setStatus("denied");
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Enable GPS for this site."
            : `Location error: ${err.message}`,
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 4000,
        timeout: 20000,
      },
    );
  };

  const stopSharing = () => {
    if (watchId.current != null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    void wakeLock.current?.release().catch(() => undefined);
    wakeLock.current = null;
    setStatus("idle");
    setMessage("Sharing stopped");
  };

  const markDelivered = async () => {
    if (!isSupabaseConfigured()) return;
    const now = new Date().toISOString();
    const { error: upErr } = await supabase
      .from("dispatch_tracking")
      .update({ status: "delivered", updated_at: now })
      .eq("tracking_code", code);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    stopSharing();
    setStatus("done");
    setMessage("Marked as delivered");
    setMeta((m) => (m ? { ...m, dispatchStatus: "delivered" } : m));
  };

  const isSharing = status === "sharing";

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-5 text-center">
      <div className="max-w-md w-full bg-slate-900 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl border border-slate-800">
        <div
          className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 shadow-xl ${
            isSharing
              ? "bg-emerald-500 animate-pulse shadow-emerald-500/30"
              : status === "done"
                ? "bg-emerald-600"
                : status === "denied" || status === "error"
                  ? "bg-red-500/80"
                  : "bg-slate-800"
          }`}
        >
          {status === "done" ? (
            <ShieldCheck size={32} />
          ) : isSharing ? (
            <Wifi size={32} />
          ) : status === "denied" ? (
            <WifiOff size={32} />
          ) : (
            <Navigation size={32} />
          )}
        </div>

        <h1 className="text-3xl font-black mb-1">Driver Portal</h1>
        <p className="text-slate-400 font-bold mb-1">
          Code:{" "}
          <span className="text-emerald-400 font-mono tracking-wide">{code}</span>
        </p>
        <p className="text-sm text-slate-500 font-medium mb-6">{message}</p>

        {/* Job card */}
        {(meta?.customer || meta?.item || meta?.destination) && (
          <div className="text-left bg-slate-950/60 rounded-2xl border border-slate-800 p-4 mb-5 space-y-2">
            {meta.item && (
              <div className="flex items-center gap-2 text-sm">
                <Package size={14} className="text-emerald-400 shrink-0" />
                <span className="font-bold text-slate-200">{meta.item}</span>
              </div>
            )}
            {meta.customer && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-widest w-16 shrink-0">
                  To
                </span>
                <span className="font-bold text-slate-200">{meta.customer}</span>
              </div>
            )}
            {meta.destination && (
              <div className="flex items-start gap-2 text-sm text-slate-400">
                <MapPin size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <span className="font-medium text-slate-300">{meta.destination}</span>
              </div>
            )}
            {meta.pin && (
              <div className="mt-2 pt-2 border-t border-slate-800">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  Ask customer for PIN
                </p>
                <p className="text-2xl font-black font-mono tracking-[0.3em] text-emerald-400">
                  {meta.pin}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Confirm this matches before handing over the package.
                </p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-300 p-4 rounded-2xl mb-5 font-bold text-sm flex items-start gap-2 text-left">
            <BatteryWarning size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {lastFix && (
          <div className="grid grid-cols-2 gap-2 mb-5 text-left">
            <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                Last fix
              </p>
              <p className="text-sm font-bold text-slate-200 mt-0.5">
                {formatLastSeen(lastFix.at)}
              </p>
            </div>
            <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                Pings sent
              </p>
              <p className="text-sm font-bold text-slate-200 mt-0.5">{pingCount}</p>
            </div>
            {lastFix.accuracy != null && (
              <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800 col-span-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  GPS accuracy
                </p>
                <p className="text-sm font-bold text-slate-200 mt-0.5">
                  ±{Math.round(lastFix.accuracy)} m · {lastFix.lat.toFixed(5)},{" "}
                  {lastFix.lng.toFixed(5)}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          {status === "done" ? (
            <div className="p-5 bg-emerald-500/10 rounded-2xl border border-emerald-500/30">
              <p className="text-emerald-400 font-black text-lg">Delivered ✓</p>
              <p className="text-slate-500 text-sm mt-1">You can close this page</p>
            </div>
          ) : !isSharing ? (
            <button
              type="button"
              onClick={startSharing}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-emerald-500/20 transition-all active:scale-95 text-base uppercase tracking-widest"
            >
              Start sharing location
            </button>
          ) : (
            <>
              <div className="p-5 bg-slate-950/50 rounded-2xl border border-emerald-500/30">
                <p className="text-emerald-400 font-black text-lg flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live broadcasting
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  Keep this page open while driving
                </p>
              </div>
              <button
                type="button"
                onClick={() => void markDelivered()}
                className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black transition-all active:scale-95 text-sm uppercase tracking-widest"
              >
                Mark delivered
              </button>
              <button
                type="button"
                onClick={stopSharing}
                className="w-full bg-transparent text-slate-400 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:text-white transition-colors"
              >
                Stop sharing
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-10 flex items-center justify-center space-x-2 opacity-40">
        <span className="font-black text-white tracking-tight text-xl">
          SwiftLink<span className="text-emerald-500">Pro</span>
        </span>
      </div>
    </div>
  );
}
