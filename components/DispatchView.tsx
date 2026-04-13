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
    <div className="pb-20 w-full">
      <main className="max-w-4xl mx-auto space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 px-2 uppercase italic tracking-tight flex items-center gap-3">
               <div className="w-2 h-8 bg-slate-900 rounded-full" />
               New Dispatch
            </h2>
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-5">
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
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
          >
                        GENERATE TRACKING
                      </button>
                    </div>
                  </div>
            
                    <div className="space-y-6">          <h2 className="text-xl font-black text-slate-900 px-2 uppercase italic tracking-tight flex items-center gap-3">
            <div className="w-2 h-8 bg-emerald-500 rounded-full" />
            Live Queue (<span id="delivery-count">{activeCount}</span>)
          </h2>
          <div id="delivery-list" className="space-y-4">
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
      </div>
    </main>
  </div>
);
}
