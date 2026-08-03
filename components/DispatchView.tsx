"use client";

import { useState } from "react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import {
  Navigation,
  Copy,
  Check,
  MapPin,
  Link2,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { customerTrackUrl, driverTrackUrl } from "@/lib/dispatch";

export function DispatchView() {
  const {
    state,
    handleDispatchSubmit,
    removeDelivery,
    copyTrackLink,
    addToast,
  } = useSwiftLink();

  const [sender, setSender] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [item, setItem] = useState("Package");
  const [driver, setDriver] = useState("");
  const [ref, setRef] = useState("");
  const [destination, setDestination] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedKind, setCopiedKind] = useState<"customer" | "driver" | null>(
    null,
  );

  const flashCopy = (id: string, kind: "customer" | "driver") => {
    setCopiedId(id);
    setCopiedKind(kind);
    window.setTimeout(() => {
      setCopiedId(null);
      setCopiedKind(null);
    }, 2000);
  };

  const copyDriverLink = (id: string) => {
    void navigator.clipboard.writeText(driverTrackUrl(id)).then(() => {
      flashCopy(id, "driver");
      addToast("Driver GPS link copied!", "success");
    });
  };

  const copyCustomer = (id: string) => {
    copyTrackLink(id);
    flashCopy(id, "customer");
  };

  const shareWhatsApp = (id: string, phoneNum: string, pin?: string) => {
    const track = customerTrackUrl(id);
    const msg =
      `📦 Your package is on the way!\n` +
      (pin ? `Delivery PIN: *${pin}*\n` : "") +
      `Track live: ${track}`;
    const wa = phoneNum.replace(/\D/g, "");
    if (!wa) {
      void navigator.clipboard.writeText(track);
      addToast("No phone on record — track link copied.", "info");
      return;
    }
    window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`);
  };

  const onSubmit = () => {
    handleDispatchSubmit({
      sender,
      name,
      phone,
      item,
      driver,
      ref,
      destination,
    });
    // keep form mostly filled for rapid multi-dispatch; clear identity fields
    setName("");
    setPhone("");
    setRef("");
    setDestination("");
  };

  const activeCount = state.deliveries.filter(
    (d) => d.status === "dispatched" || d.status === "in-transit",
  ).length;

  return (
    <div className="pb-20 w-full">
      <main className="max-w-4xl mx-auto space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ── New Dispatch ── */}
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-white px-2 uppercase italic tracking-tight flex items-center gap-3">
              <div className="w-2 h-8 bg-slate-900 dark:bg-white rounded-full" />
              New Dispatch
            </h2>
            <div className="bg-white dark:bg-black rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-white/10 space-y-4">
              <input
                type="text"
                id="disp-sender"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="Sender / Store name"
                className="w-full bg-slate-50 dark:bg-zinc-900 p-4 rounded-2xl font-bold outline-none text-sm dark:text-white dark:placeholder:text-zinc-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  id="disp-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Customer name *"
                  className="w-full bg-slate-50 dark:bg-zinc-900 p-4 rounded-2xl font-bold outline-none text-sm dark:text-white dark:placeholder:text-zinc-500"
                />
                <input
                  type="tel"
                  id="disp-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone (WA)"
                  className="w-full bg-slate-50 dark:bg-zinc-900 p-4 rounded-2xl font-bold outline-none text-sm dark:text-white dark:placeholder:text-zinc-500"
                />
              </div>
              <input
                type="text"
                id="disp-item"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                placeholder="Item"
                className="w-full bg-slate-50 dark:bg-zinc-900 p-4 rounded-2xl font-bold outline-none text-sm dark:text-white dark:placeholder:text-zinc-500"
              />

              <div className="relative">
                <MapPin
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  id="disp-destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Delivery address / landmark"
                  className="w-full bg-slate-50 dark:bg-zinc-900 pl-10 pr-4 py-4 rounded-2xl font-bold outline-none text-sm dark:text-white dark:placeholder:text-zinc-500"
                />
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/30 space-y-3">
                <input
                  type="text"
                  id="disp-driver"
                  value={driver}
                  onChange={(e) => setDriver(e.target.value)}
                  placeholder="Logistics / Driver name *"
                  className="w-full bg-white dark:bg-zinc-900 p-3 rounded-xl font-bold outline-none text-sm dark:text-white dark:placeholder:text-zinc-500"
                />
                <input
                  type="text"
                  id="disp-ref"
                  value={ref}
                  onChange={(e) => setRef(e.target.value)}
                  placeholder="Waybill No (auto-generated if blank)"
                  className="w-full bg-white dark:bg-zinc-900 p-3 rounded-xl font-bold outline-none text-sm dark:text-white dark:placeholder:text-zinc-500"
                />
                <p className="text-[10px] font-bold text-amber-700/70 dark:text-amber-400/60 leading-relaxed">
                  A 4-digit delivery PIN is auto-generated and sent <strong>only</strong> to the customer via WhatsApp. You will never see it here — this keeps the handoff tamper-proof.
                </p>
              </div>

              <button
                type="button"
                data-dispatch-submit
                onClick={onSubmit}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-black py-5 rounded-2xl font-black shadow-lg hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-[11px]"
              >
                Generate tracking
              </button>
            </div>
          </div>

          {/* ── Live Queue ── */}
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-white px-2 uppercase italic tracking-tight flex items-center gap-3">
              <div className="w-2 h-8 bg-emerald-500 rounded-full" />
              Live Queue (<span id="delivery-count">{activeCount}</span>)
            </h2>
            <div id="delivery-list" className="space-y-4">
              {state.deliveries.length === 0 ? (
                <div className="text-center py-12 text-slate-300 dark:text-zinc-700 font-bold bg-white dark:bg-black rounded-[2rem] border-2 border-dashed border-slate-100 dark:border-zinc-800">
                  No deliveries yet.
                  <p className="text-xs font-medium mt-2 text-slate-400 dark:text-zinc-600 normal-case tracking-normal">
                    Create a dispatch to get customer + driver live-track links.
                  </p>
                </div>
              ) : (
                state.deliveries.map((d) => {
                  const isDone = d.status === "delivered";
                  const pin = d.deliveryPin;
                  return (
                    <div
                      key={d.id}
                      className={`bg-white dark:bg-black p-5 rounded-[2rem] border ${
                        isDone
                          ? "opacity-60 border-slate-100 dark:border-white/5"
                          : "border-slate-100 dark:border-white/10 shadow-sm"
                      } group`}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="text-left min-w-0">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="font-black dark:text-white truncate">
                              {d.customer}
                            </span>
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${
                                isDone
                                  ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                  : d.status === "in-transit"
                                    ? "bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400"
                                    : "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              {d.dispatchStatus || d.status}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold mt-1 uppercase truncate">
                            {d.item} · {d.driver}
                            {d.destination ? ` · ${d.destination}` : ""}
                          </div>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {d.id}
                            </span>
                            {pin && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-900 px-2 py-0.5 rounded-lg" title="PIN is secret — visible only to your customer">
                                <ShieldCheck size={10} className="text-emerald-500" />
                                PIN ••••
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-50 dark:border-white/5">
                        <button
                          type="button"
                          onClick={() => void removeDelivery(d.id)}
                          title="Delete"
                          className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-100 transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => copyCustomer(d.id)}
                          title="Copy customer track link"
                          className="w-9 h-9 rounded-full bg-slate-50 dark:bg-zinc-900 text-slate-400 flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-500 transition-all"
                        >
                          {copiedId === d.id && copiedKind === "customer" ? (
                            <Check size={14} className="text-emerald-500" />
                          ) : (
                            <Link2 size={14} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyDriverLink(d.id)}
                          title="Copy driver GPS link"
                          className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center hover:bg-amber-100 transition-all"
                        >
                          {copiedId === d.id && copiedKind === "driver" ? (
                            <Check size={14} />
                          ) : (
                            <Navigation size={14} />
                          )}
                        </button>
                        {d.phone && !isDone && (
                          <button
                            type="button"
                            onClick={() => shareWhatsApp(d.id, d.phone, pin)}
                            className="ml-auto px-3 h-9 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-1.5"
                          >
                            <Copy size={12} />
                            Notify Customer
                          </button>
                        )}
                        {!d.phone && !isDone && (
                          <a
                            href={`/?track=${d.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-auto px-3 h-9 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-widest flex items-center"
                          >
                            Open track
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
