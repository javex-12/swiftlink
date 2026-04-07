"use client";

import { useSwiftLink } from "@/context/SwiftLinkContext";

export function TrackingView() {
  const { trackingDisplay, confirmDelivery } = useSwiftLink();

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
          <img src="/logo.svg" className="w-6 h-6 grayscale" alt="" width={24} height={24} />
          <span className="font-black text-slate-900 tracking-tight text-xl">
            SwiftLink<span className="text-emerald-500">Pro</span>
          </span>
        </div>
      </div>
    );
  }

  const dispatched = d.status === "dispatched";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100">
        <div
          id="track-status-icon"
          className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 shadow-xl ${dispatched ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`}
        >
          <i className="fas fa-truck-fast text-3xl text-white" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2" id="track-status-text">
          {dispatched ? "Dispatched" : "Delivered"}
        </h1>
        <p className="text-slate-500 font-bold mb-8" id="track-desc">
          {dispatched ? "On its way." : "Item Received."}
        </p>
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
          className={`w-full bg-emerald-500 text-white py-5 rounded-2xl font-black shadow-xl ${d.status === "delivered" ? "hidden" : ""}`}
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
        <img src="/logo.svg" className="w-6 h-6 grayscale" alt="" width={24} height={24} />
        <span className="font-black text-slate-900 tracking-tight text-xl">
          SwiftLink<span className="text-emerald-500">Pro</span>
        </span>
      </div>
    </div>
  );
}
