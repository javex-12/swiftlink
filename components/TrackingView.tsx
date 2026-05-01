"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { supabase } from "@/lib/supabase-client";
import "leaflet/dist/leaflet.css";

// Dynamic imports for Leaflet to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

export function TrackingView() {
  const { trackingDisplay, confirmDelivery, currentTrackId } = useSwiftLink();
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    // Load Leaflet on client side
    import("leaflet").then((leaflet) => {
      setL(leaflet);
    });
  }, []);

  useEffect(() => {
    if (!currentTrackId) return;

    // Initial fetch
    supabase
      .from("dispatch_tracking")
      .select("lat, lng")
      .eq("tracking_code", currentTrackId)
      .single()
      .then(({ data }) => {
        if (data?.lat && data?.lng) {
          setDriverLocation({ lat: data.lat, lng: data.lng });
        }
      });

    // Realtime subscribe
    const channel = supabase
      .channel(`tracking-${currentTrackId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "dispatch_tracking",
          filter: `tracking_code=eq.${currentTrackId}`,
        },
        (payload) => {
          if (payload.new.lat && payload.new.lng) {
            setDriverLocation({ lat: payload.new.lat, lng: payload.new.lng });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentTrackId]);

  const d = trackingDisplay;

  if (!d) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100">
          <h1 className="text-3xl font-black text-slate-900 mb-2" id="track-status-text">
            Not Found
          </h1>
          <p className="text-slate-500 font-bold mb-8" id="track-desc">
            Tracking ID not found on this device.
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

  const dispatched = d.status === "dispatched";
  const customIcon = L ? L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }) : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 text-center">
      <div className="max-w-2xl w-full bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 mt-10">
        <div
          id="track-status-icon"
          className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6 shadow-xl ${dispatched ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`}
        >
          <i className={`fas ${dispatched ? "fa-truck-fast" : "fa-check"} text-2xl text-white`} />
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 mb-2" id="track-status-text">
          {dispatched ? "Dispatched" : "Delivered"}
        </h1>
        <p className="text-slate-500 font-bold mb-8" id="track-desc">
          {dispatched ? "On its way to you." : "Item Received."}
        </p>

        {dispatched && driverLocation && MapContainer && (
          <div className="w-full h-64 rounded-3xl overflow-hidden mb-8 shadow-inner border border-slate-100 relative z-0">
            <MapContainer
              center={[driverLocation.lat, driverLocation.lng]}
              zoom={13}
              scrollWheelZoom={false}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[driverLocation.lat, driverLocation.lng]} icon={customIcon}>
                <Popup>Driver is here</Popup>
              </Marker>
            </MapContainer>
          </div>
        )}

        <div className="bg-slate-50 rounded-3xl p-6 text-left space-y-4 mb-8">
          <div className="flex justify-between border-b border-slate-200 pb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase">
              Item
            </span>
            <span className="font-bold text-slate-900" id="track-item">
              {d.item}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase">
              Sent Via
            </span>
            <span className="font-bold text-slate-900" id="track-via">
              {d.driver}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase">
              Ref No.
            </span>
            <span className="font-bold text-slate-900 font-mono" id="track-ref">
              {d.ref}
            </span>
          </div>
        </div>

        <button
          type="button"
          id="btn-confirm-delivery"
          onClick={confirmDelivery}
          className={`w-full bg-emerald-500 text-white py-5 rounded-2xl font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all ${d.status === "delivered" ? "hidden" : ""}`}
        >
          I HAVE RECEIVED IT
        </button>
        
        <div
          id="delivery-confirmed-msg"
          className={`${d.status === "dispatched" ? "hidden" : ""} bg-emerald-50 text-emerald-600 font-bold py-4 rounded-2xl border border-emerald-100`}
        >
          Delivery Confirmed
        </div>
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

