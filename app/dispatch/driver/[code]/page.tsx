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
    pin?: string;         // fetched from Supabase, kept in memory ONLY, never rendered
    dispatchStatus?: string;
    storeId?: string;
    driverName?: string;
    waybill?: string;
    storeName?: string;
    path?: Array<{ lat: number; lng: number }>;
  } | null>(null);
  const [lastFix, setLastFix] = useState<{
    lat: number;
    lng: number;
    accuracy?: number;
    at: string;
  } | null>(null);
  const [pingCount, setPingCount] = useState(0);
  // PIN entry state for mark-delivered flow
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [pinEntry, setPinEntry] = useState("");
  const [pinErr, setPinErr] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
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
        pin: row.delivery_pin || undefined,     // kept in JS memory only — NEVER rendered
        dispatchStatus: row.status || undefined,
        storeId: (row as any).store_id || undefined,
        driverName: row.driver_name || undefined,
        waybill: (row as any).waybill || undefined,
        path: Array.isArray(row.path) ? row.path : [],
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

  /** Driver taps 'Mark Delivered' — opens PIN entry form */
  const requestMarkDelivered = () => {
    setShowPinEntry(true);
    setPinEntry("");
    setPinErr(null);
  };

  /**
   * Verify PIN entered by driver (what customer told them verbally).
   * On match: write immutable delivery_receipt, stamp handoff coords, set status=delivered.
   * On mismatch: block and show error — driver CANNOT complete without customer saying the PIN.
   */
  const verifyAndComplete = async () => {
    if (!meta?.pin) {
      // No PIN set — allow force-complete but flag it
      await finaliseDelivery("FORCE_COMPLETED");
      return;
    }
    if (pinEntry.trim() !== meta.pin) {
      setPinErr("Wrong PIN. Ask the customer to check their WhatsApp for the correct 4-digit code.");
      return;
    }
    setPinErr(null);
    await finaliseDelivery("PIN_VERIFIED");
  };

  /** Write receipt + update tracking — called after PIN is verified */
  const finaliseDelivery = async (method: "PIN_VERIFIED" | "FORCE_COMPLETED") => {
    if (!isSupabaseConfigured()) return;
    setVerifying(true);
    const now = new Date().toISOString();
    const driverLat = lastFix?.lat ?? null;
    const driverLng = lastFix?.lng ?? null;

    // Compute driver-to-destination distance for audit
    let distM: number | null = null;
    let withinRadius: boolean | null = null;
    if (driverLat && driverLng && destRef.current) {
      distM = haversineMeters({ lat: driverLat, lng: driverLng }, destRef.current);
      withinRadius = distM <= 300;
    }

    // 1. Generate a human-readable receipt reference
    const receiptRef = `RC-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;

    // 2. Write immutable receipt to delivery_receipts (append-only table)
    const { error: receiptErr } = await supabase.from("delivery_receipts").insert({
      receipt_ref: receiptRef,
      tracking_code: code,
      store_id: meta?.storeId ?? null,
      merchant_name: meta?.storeName ?? null,
      driver_name: meta?.driverName ?? null,
      customer_name: meta?.customer ?? null,
      item_name: meta?.item ?? null,
      waybill: meta?.waybill ?? null,
      destination: meta?.destination ?? null,
      verification_method: method,
      handoff_lat: driverLat,
      handoff_lng: driverLng,
      handoff_accuracy_m: lastFix?.accuracy ?? null,
      handoff_at: now,
      driver_final_lat: driverLat,
      driver_final_lng: driverLng,
      driver_handoff_distance_m: distM,
      gps_within_radius: withinRadius,
      full_path_snapshot: pathRef.current,
    });

    if (receiptErr) {
      console.error("Receipt write failed:", receiptErr);
      // Don't block delivery — log the failure and continue
    }

    // 3. Mark dispatch_tracking as delivered + stamp handoff coordinates
    const { error: upErr } = await supabase
      .from("dispatch_tracking")
      .update({
        status: "delivered",
        handoff_lat: driverLat,
        handoff_lng: driverLng,
        handoff_accuracy: lastFix?.accuracy ?? null,
        handoff_at: now,
        updated_at: now,
      })
      .eq("tracking_code", code);

    if (upErr) {
      setError(upErr.message);
      setVerifying(false);
      return;
    }

    stopSharing();
    setStatus("done");
    setMessage(`Delivered — Receipt ${receiptRef}`);
    setMeta((m) => (m ? { ...m, dispatchStatus: "delivered" } : m));
    setShowPinEntry(false);
    setVerifying(false);
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
          {meta?.destination && (
              <div className="flex items-start gap-2 text-sm text-slate-400">
                <MapPin size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <span className="font-medium text-slate-300">{meta.destination}</span>
              </div>
            )}
            {/* PIN is NEVER displayed to the driver — they must ask the customer verbally */}
            <div className="mt-2 pt-2 border-t border-slate-800">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                Verification PIN
              </p>
              <p className="text-[11px] text-slate-400">
                Ask the customer for their 4-digit PIN when you hand over the package.
                You will enter it to confirm delivery.
              </p>
            </div>
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
              {showPinEntry && (
                <div className="bg-slate-950 rounded-2xl border border-emerald-500/40 p-5 space-y-4 text-left">
                  <p className="text-sm font-black text-white">
                    Enter the PIN the customer just gave you
                  </p>
                  <p className="text-[11px] text-slate-400">
                    The customer received a private 4-digit code on WhatsApp.
                    Ask them to read it to you now — this proves they got the package.
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={pinEntry}
                    onChange={(e) => {
                      setPinEntry(e.target.value.replace(/\D/g, "").slice(0, 4));
                      setPinErr(null);
                    }}
                    placeholder="••••"
                    className="w-full bg-slate-900 border border-slate-700 text-white font-black text-center text-2xl tracking-[0.5em] p-4 rounded-xl outline-none focus:border-emerald-500"
                  />
                  {pinErr && (
                    <p className="text-xs text-red-400 font-bold">{pinErr}</p>
                  )}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowPinEntry(false)}
                      className="flex-1 bg-slate-800 text-slate-300 py-3 rounded-xl font-bold text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void verifyAndComplete()}
                      disabled={verifying || pinEntry.length < 4}
                      className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-black text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {verifying ? "Verifying…" : "Confirm Delivery"}
                    </button>
                  </div>
                </div>
              )}
              {!showPinEntry && (
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
                    onClick={requestMarkDelivered}
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
