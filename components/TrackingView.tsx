"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { supabase } from "@/lib/supabase-client";
import { MapPin, Wifi, WifiOff, Navigation } from "lucide-react";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(m => m.Popup), { ssr: false });

// ─── Driver Location Beacon ───────────────────────────────────────────────────
// Renders when URL has ?driver=1. Driver clicks "Share Location" to start GPS.
function DriverLocationBeacon({ trackingCode }: { trackingCode: string }) {
  const [status, setStatus] = useState<"idle" | "active" | "denied">("idle");
  const watchId = useRef<number | null>(null);

  const start = () => {
    if (!navigator.geolocation) { setStatus("denied"); return; }
    setStatus("active");
    watchId.current = navigator.geolocation.watchPosition(
      async (pos) => {
        await supabase.from("dispatch_tracking").upsert({
          tracking_code: trackingCode,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          updated_at: new Date().toISOString(),
        }, { onConflict: "tracking_code" });
      },
      () => setStatus("denied"),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  };

  useEffect(() => {
    return () => { if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current); };
  }, []);

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-[2rem] shadow-2xl border flex items-center gap-4 transition-all ${
      status === "active"
        ? "bg-emerald-500 border-emerald-600 text-white"
        : status === "denied"
        ? "bg-red-50 border-red-100 text-red-600"
        : "bg-white border-slate-200 text-slate-900"
    }`}>
      {status === "active" ? (
        <><Wifi size={20} className="animate-pulse" /><div><p className="text-xs font-black uppercase tracking-widest">Live Location ON</p><p className="text-[10px] opacity-70">Customer can see your position</p></div></>
      ) : status === "denied" ? (
        <><WifiOff size={20} /><p className="text-xs font-black">Location access denied</p></>
      ) : (
        <><Navigation size={20} className="text-emerald-500" /><div><p className="text-xs font-black uppercase tracking-widest text-slate-900">Driver Mode</p><p className="text-[10px] text-slate-400">Share your live location with customer</p></div>
        <button onClick={start} className="ml-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20">
          Share Location
        </button></>
      )}
    </div>
  );
}

export function TrackingView() {
  const { trackingDisplay, confirmDelivery, currentTrackId } = useSwiftLink();
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [L, setL] = useState<any>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // detect driver mode from URL
  const [isDriverMode, setIsDriverMode] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsDriverMode(new URLSearchParams(window.location.search).has("driver"));
    }
  }, []);

  useEffect(() => { import("leaflet").then(setL); }, []);

  useEffect(() => {
    if (!currentTrackId) return;

    supabase.from("dispatch_tracking").select("lat, lng").eq("tracking_code", currentTrackId).single()
      .then(({ data }) => { if (data?.lat && data?.lng) setDriverLocation({ lat: data.lat, lng: data.lng }); });

    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }

    const ch = supabase
      .channel(`tracking-${currentTrackId}-${Date.now()}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "dispatch_tracking", filter: `tracking_code=eq.${currentTrackId}` },
        (payload) => {
          if (payload.new.lat && payload.new.lng) {
            setDriverLocation({ lat: payload.new.lat, lng: payload.new.lng });
            setIsLive(true);
          }
        })
      .subscribe();

    channelRef.current = ch;
    return () => { if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; } };
  }, [currentTrackId]);

  const d = trackingDisplay;

  if (!d) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Not Found</h1>
          <p className="text-slate-500 font-bold mb-8">Tracking ID not found on this device.</p>
        </div>
        <div className="mt-8 opacity-30 flex items-center justify-center space-x-2">
          <img src="/logo.png" className="w-6 h-6 grayscale" alt="" width={24} height={24} />
          <span className="font-black text-slate-900 tracking-tight text-xl">SwiftLink<span className="text-emerald-500">Pro</span></span>
        </div>
      </div>
    );
  }

  const dispatched = d.status === "dispatched";
  const customIcon = L ? L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41], iconAnchor: [12, 41],
  }) : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 text-center">
      <div className="max-w-2xl w-full bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 mt-10">
        <div id="track-status-icon" className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6 shadow-xl ${dispatched ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`}>
          <i className={`fas ${dispatched ? "fa-truck-fast" : "fa-check"} text-2xl text-white`} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">{dispatched ? "Dispatched" : "Delivered"}</h1>
        <p className="text-slate-500 font-bold mb-8">{dispatched ? "On its way to you." : "Item Received."}</p>

        {dispatched && driverLocation && MapContainer && (
          <div className="w-full h-64 rounded-3xl overflow-hidden mb-4 shadow-inner border border-slate-100 relative z-0">
            <MapContainer center={[driverLocation.lat, driverLocation.lng]} zoom={14} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[driverLocation.lat, driverLocation.lng]} icon={customIcon}>
                <Popup>Driver is here</Popup>
              </Marker>
            </MapContainer>
            {isLive && (
              <div className="absolute top-3 right-3 z-[500] flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />Live GPS
              </div>
            )}
          </div>
        )}

        {dispatched && !driverLocation && (
          <div className="w-full h-32 rounded-3xl mb-4 bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
            <MapPin size={24} className="text-slate-300" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Waiting for driver location...</p>
          </div>
        )}

        <div className="bg-slate-50 rounded-3xl p-6 text-left space-y-4 mb-8">
          <div className="flex justify-between border-b border-slate-200 pb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase">Item</span>
            <span className="font-bold text-slate-900">{d.item}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase">Sent Via</span>
            <span className="font-bold text-slate-900">{d.driver}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase">Ref No.</span>
            <span className="font-bold text-slate-900 font-mono">{d.ref}</span>
          </div>
        </div>

        <button type="button" onClick={confirmDelivery}
          className={`w-full bg-emerald-500 text-white py-5 rounded-2xl font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all ${d.status === "delivered" ? "hidden" : ""}`}>
          I HAVE RECEIVED IT
        </button>
        <div className={`${d.status === "dispatched" ? "hidden" : ""} bg-emerald-50 text-emerald-600 font-bold py-4 rounded-2xl border border-emerald-100`}>
          Delivery Confirmed ✓
        </div>
      </div>

      <div className="mt-8 opacity-30 flex items-center justify-center space-x-2">
        <img src="/logo.png" className="w-6 h-6 grayscale" alt="" width={24} height={24} />
        <span className="font-black text-slate-900 tracking-tight text-xl">SwiftLink<span className="text-emerald-500">Pro</span></span>
      </div>

      {isDriverMode && currentTrackId && <DriverLocationBeacon trackingCode={currentTrackId} />}
    </div>
  );
}
