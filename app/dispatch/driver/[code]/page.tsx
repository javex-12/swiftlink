"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase-client";

export default function DriverPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [sharing, setSharing] = useState(false);
  const [status, setStatus] = useState("Ready to start");
  const [error, setError] = useState<string | null>(null);

  const startSharing = () => {
    if (!navigator.geolocation) {
      setError("Your browser does not support location sharing");
      return;
    }

    setSharing(true);
    setStatus("Active: Sharing location...");

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { error: upsertError } = await supabase
          .from("dispatch_tracking")
          .update({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            status: "en_route",
            updated_at: new Date().toISOString(),
          })
          .eq("tracking_code", code);
          
        if (upsertError) {
            console.error("Update error:", upsertError);
            // If the table doesn't exist yet, we'll see it here in console
        }
      },
      (err) => {
        setError(`Location error: ${err.message}`);
        setSharing(false);
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-slate-800 rounded-[2.5rem] p-10 shadow-2xl border border-slate-700">
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-8 shadow-xl ${sharing ? "bg-emerald-500 animate-pulse" : "bg-slate-700"}`}>
          <i className={`fas ${sharing ? "fa-satellite-dish" : "fa-location-dot"} text-3xl`} />
        </div>
        
        <h1 className="text-3xl font-black mb-2">Driver Portal</h1>
        <p className="text-slate-400 font-bold mb-8">
          Code: <span className="text-emerald-400 font-mono">{code}</span>
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-2xl mb-8 font-bold">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {!sharing ? (
            <button
              onClick={startSharing}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-6 rounded-2xl font-black shadow-xl transition-all active:scale-95 text-lg"
            >
              START SHARING LOCATION
            </button>
          ) : (
            <div className="p-6 bg-slate-900/50 rounded-2xl border border-emerald-500/30">
              <p className="text-emerald-400 font-black text-xl mb-1">{status}</p>
              <p className="text-slate-500 text-sm">Keep this page open while driving</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 flex items-center justify-center space-x-2 opacity-40">
        <span className="font-black text-white tracking-tight text-xl">
          SwiftLink<span className="text-emerald-500">Pro</span>
        </span>
      </div>
    </div>
  );
}
