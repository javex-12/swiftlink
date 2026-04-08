"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSwiftLink } from "@/context/SwiftLinkContext";

export function DispatchView() {
  const router = useRouter();
  const { state, handleDispatchSubmit, removeDelivery, copyTrackLink } =
    useSwiftLink();

  const [sender, setSender] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [item, setItem] = useState("Package");
  const [driver, setDriver] = useState("");
  const [ref, setRef] = useState("");

  const activeCount = state.deliveries.filter(
    (d) => d.status === "dispatched",
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-slate-100">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label="Go back"
        >
          <i className="fas fa-arrow-left" />
        </button>
        <span className="font-black text-slate-900 uppercase tracking-widest text-[10px]">
          Logistics Console
        </span>
        <div className="w-10" />
      </nav>
      <main className="max-w-lg mx-auto px-4 py-6 space-y-8">
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 space-y-4">
          <input
            type="text"
            id="disp-sender"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            placeholder="Sender Name"
            className="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none text-sm"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              id="disp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Customer Name"
              className="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none text-sm"
            />
            <input
              type="tel"
              id="disp-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone"
              className="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none text-sm"
            />
          </div>
          <input
            type="text"
            id="disp-item"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="Item"
            className="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none text-sm"
          />
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-3">
            <input
              type="text"
              id="disp-driver"
              value={driver}
              onChange={(e) => setDriver(e.target.value)}
              placeholder="Logistics/Driver"
              className="w-full bg-white p-3 rounded-xl font-bold outline-none text-sm"
            />
            <input
              type="text"
              id="disp-ref"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="Waybill No"
              className="w-full bg-white p-3 rounded-xl font-bold outline-none text-sm"
            />
          </div>
          <button
            type="button"
            data-dispatch-submit
            onClick={() =>
              handleDispatchSubmit({
                sender,
                name,
                phone,
                item,
                driver,
                ref,
              })
            }
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black shadow-lg"
          >
            GENERATE TRACKING
          </button>
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900 px-2 mb-4">
            Active Deliveries (<span id="delivery-count">{activeCount}</span>)
          </h2>
          <div id="delivery-list" className="space-y-3">
            {state.deliveries.length === 0 ? (
              <div className="text-center py-12 text-slate-300 font-bold bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
                No deliveries.
              </div>
            ) : (
              state.deliveries.map((d) => (
                <div
                  key={d.id}
                  className={`bg-white p-5 rounded-[2rem] border ${d.status === "delivered" ? "opacity-60 border-slate-100" : "border-slate-100 shadow-sm"} flex justify-between items-center group`}
                >
                  <div className="text-left">
                    <div className="flex items-center space-x-2">
                      <span className="font-black">{d.customer}</span>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${d.status === "delivered" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}
                      >
                        {d.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase">
                      {d.item} • {d.driver}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => removeDelivery(d.id)}
                      className="w-10 h-10 rounded-full bg-red-50 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <i className="fas fa-trash-can text-xs" />
                    </button>
                    <button
                      type="button"
                      onClick={() => copyTrackLink(d.id)}
                      className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-500 transition-all"
                    >
                      <i className="fas fa-link text-xs" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
