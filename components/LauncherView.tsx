"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSwiftLink } from "@/context/SwiftLinkContext";

export function LauncherView() {
  const { copyShopLink, copyTrackingPortalLink, handleSignOut } = useSwiftLink();
  const [toast, setToast] = useState<string | null>(null);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [range, setRange] = useState<"7d" | "30d">("7d");

  const statusChips = [
    { label: "Store", value: "Live" },
    { label: "Portal", value: "Ready" },
    { label: "Mode", value: "Pro" },
  ];

  const chartData7d = [420, 690, 610, 980, 860, 1240, 1160];
  const chartData30d = [320, 430, 500, 610, 720, 690, 760, 810, 940, 1020, 980, 1110];
  const chartData = range === "7d" ? chartData7d : chartData30d;

  const chartPath = useMemo(() => {
    const width = 600;
    const height = 220;
    const padding = 20;
    const max = Math.max(...chartData, 1);
    const stepX = (width - padding * 2) / Math.max(chartData.length - 1, 1);
    return chartData
      .map((value, index) => {
        const x = padding + index * stepX;
        const y = height - padding - (value / max) * (height - padding * 2);
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [chartData]);

  const pieSegments = [
    { name: "Lagos", value: 42, color: "#22d3ee" },
    { name: "Abuja", value: 28, color: "#3b82f6" },
    { name: "Port Harcourt", value: 18, color: "#6366f1" },
    { name: "Others", value: 12, color: "#475569" },
  ];

  const topProducts = [
    { name: "Premium Gift Box", revenue: "NGN 542k", share: 37 },
    { name: "Deluxe Bundle", revenue: "NGN 394k", share: 27 },
    { name: "Express Pack", revenue: "NGN 256k", share: 18 },
    { name: "Starter Pack", revenue: "NGN 182k", share: 12 },
  ];

  const pushToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };

  const handleCopyShop = () => {
    copyShopLink();
    pushToast("Shop link copied");
  };

  const handleCopyPortal = () => {
    copyTrackingPortalLink();
    pushToast("Tracking portal copied");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 p-4 text-slate-100 sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:34px_34px]" />
      <div className="pointer-events-none absolute -left-28 top-16 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-44 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1440px] animate-fade-in-up">
        <header className="rounded-3xl border border-white/15 bg-white/10 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <img
                src="/logo.png"
                className="h-12 w-12 rounded-xl ring-1 ring-cyan-400/40"
                alt="Logo"
                width={48}
                height={48}
              />
              <div>
                <h1 className="text-2xl font-black tracking-tight leading-none text-white sm:text-3xl">
                  SwiftLink<span className="text-cyan-400">Pro</span>
                </h1>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-100/70 sm:text-[11px]">
                  Business Command Center
                </p>
              </div>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setSessionOpen((prev) => !prev)}
                className="rounded-2xl border border-cyan-300/30 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-cyan-100 transition hover:bg-white/20"
              >
                Session <i className="fas fa-chevron-down ml-2 text-[10px]" />
              </button>
              {sessionOpen && (
                <div className="absolute right-0 z-30 mt-2 w-52 rounded-2xl border border-white/15 bg-slate-900/95 p-2 shadow-2xl backdrop-blur">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/10 hover:text-white"
                  >
                    <span>Sign Out / Reset</span>
                    <i className="fas fa-arrow-right-from-bracket text-xs" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="mt-4 flex flex-wrap gap-2">
          {statusChips.map((chip) => (
            <button
              type="button"
              key={chip.label}
              className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.2)] transition hover:bg-cyan-300/20"
            >
              {chip.label} <span className="text-cyan-300">{chip.value}</span>
            </button>
          ))}
        </div>

        <section className="mt-6 grid gap-6 xl:grid-cols-[280px,1fr,320px]">
          <aside className="space-y-6">
            <Link
              href="/business"
              id="tour-business"
              className="group block rounded-3xl border border-white/15 bg-white/10 p-5 shadow-xl shadow-black/20 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-cyan-300/50"
            >
              <div className="mb-4 flex items-center justify-between">
                <i className="fas fa-store text-2xl text-cyan-300" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleCopyShop();
                  }}
                  className="rounded-full border border-cyan-300/30 bg-white/10 p-2 text-cyan-100 transition hover:bg-cyan-300/20"
                  aria-label="Copy shop link"
                >
                  <i className="fas fa-link text-xs" />
                </button>
              </div>
              <h2 className="text-lg font-black tracking-tight text-white">Set up Business</h2>
              <p className="mt-2 text-sm text-slate-300">
                Configure storefront profile, products, and settings.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-cyan-300" /> Storefront profile
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-cyan-300" /> Product catalog
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-cyan-300" /> Pricing and settings
                </li>
              </ul>
            </Link>

            <Link
              href="/dispatch"
              id="tour-dispatch"
              className="group block rounded-3xl border border-white/15 bg-white/10 p-5 shadow-xl shadow-black/20 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-cyan-300/50"
            >
              <div className="mb-4 flex items-center justify-between">
                <i className="fas fa-truck-fast text-2xl text-cyan-300" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleCopyPortal();
                  }}
                  className="rounded-full border border-cyan-300/30 bg-white/10 p-2 text-cyan-100 transition hover:bg-cyan-300/20"
                  aria-label="Copy portal link"
                >
                  <i className="fas fa-link text-xs" />
                </button>
              </div>
              <h2 className="text-lg font-black tracking-tight text-white">Dispatch Item</h2>
              <p className="mt-2 text-sm text-slate-300">
                Process orders and send tracking updates in real time.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-cyan-300" /> Queue management
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-cyan-300" /> Tracking updates
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-cyan-300" /> Delivery status sync
                </li>
              </ul>
            </Link>

            <div className="rounded-3xl border border-white/15 bg-white/10 p-4 shadow-xl shadow-black/20 backdrop-blur-xl">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">Quick Actions</h3>
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={handleCopyShop}
                  className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 transition hover:bg-cyan-300/20"
                >
                  <span>Copy Shop Link</span>
                  <i className="fas fa-copy text-xs" />
                </button>
                <button
                  type="button"
                  onClick={handleCopyPortal}
                  className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 transition hover:bg-cyan-300/20"
                >
                  <span>Copy Tracking Portal</span>
                  <i className="fas fa-copy text-xs" />
                </button>
                <a
                  href="https://wa.me/2348085741430?text=Hi, I have a feedback about SwiftLink..."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 transition hover:bg-cyan-300/20"
                >
                  <span>Send Feedback</span>
                  <i className="fas fa-comment-dots text-xs" />
                </a>
              </div>
            </div>
          </aside>

          <main className="space-y-6">
            <section className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-black text-white">Sales Tracking</h3>
                <div className="inline-flex rounded-xl border border-white/15 bg-black/20 p-1">
                  <button
                    type="button"
                    onClick={() => setRange("7d")}
                    className={`rounded-lg px-3 py-1 text-xs font-bold uppercase tracking-wider transition ${range === "7d" ? "bg-cyan-400/20 text-cyan-200" : "text-slate-300 hover:bg-white/10"}`}
                  >
                    Last 7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setRange("30d")}
                    className={`rounded-lg px-3 py-1 text-xs font-bold uppercase tracking-wider transition ${range === "30d" ? "bg-cyan-400/20 text-cyan-200" : "text-slate-300 hover:bg-white/10"}`}
                  >
                    Last Month
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Total Sales", value: "NGN 1.46M", delta: "+18.2%" },
                  { label: "Orders Today", value: "43", delta: "+6.0%" },
                  { label: "Conversion Rate", value: "5.8%", delta: "+0.9%" },
                  { label: "Average Order Value", value: "NGN 34,200", delta: "+3.5%" },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-300/40"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{metric.label}</p>
                    <p className="mt-2 text-xl font-black text-white">{metric.value}</p>
                    <p className="mt-1 text-xs font-semibold text-cyan-300">{metric.delta}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-3">
                <svg viewBox="0 0 600 220" className="h-56 w-full">
                  <defs>
                    <linearGradient id="lineGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  <path d={chartPath} fill="none" stroke="url(#lineGlow)" strokeWidth="4" strokeLinecap="round" />
                  <path d={`${chartPath} L 580 200 L 20 200 Z`} fill="url(#lineGlow)" opacity="0.08" />
                </svg>
              </div>
            </section>

            <section className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-xl shadow-black/20 backdrop-blur-xl">
              <h3 className="text-base font-black text-white">Recent Transactions</h3>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="pb-2">Customer</th>
                      <th className="pb-2">Amount</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-100">
                    {[
                      { customer: "Amaka N.", amount: "NGN 68,000", status: "Paid" },
                      { customer: "Tunde O.", amount: "NGN 24,500", status: "Pending" },
                      { customer: "Ruth E.", amount: "NGN 94,200", status: "Paid" },
                    ].map((tx) => (
                      <tr key={tx.customer} className="border-t border-white/10">
                        <td className="py-3">{tx.customer}</td>
                        <td className="py-3">{tx.amount}</td>
                        <td className="py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-bold ${tx.status === "Paid" ? "bg-cyan-400/20 text-cyan-200" : "bg-amber-400/20 text-amber-200"}`}
                          >
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </main>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-xl shadow-black/20 backdrop-blur-xl">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Inventory Alerts</h3>
              <div className="mt-3 space-y-2">
                {["Premium Gift Box (4 left)", "Express Pack (7 left)", "Branded Sleeve (2 left)"].map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm text-amber-100"
                  >
                    <i className="fas fa-triangle-exclamation mr-2 text-amber-300" />
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-xl shadow-black/20 backdrop-blur-xl">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Sales by Region</h3>
              <div className="mt-3 flex items-center gap-4">
                <div className="h-28 w-28 rounded-full" style={{ background: "conic-gradient(#22d3ee 0 42%, #3b82f6 42% 70%, #6366f1 70% 88%, #475569 88% 100%)" }} />
                <div className="space-y-1 text-xs">
                  {pieSegments.map((segment) => (
                    <div key={segment.name} className="flex items-center gap-2 text-slate-200">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
                      {segment.name} ({segment.value}%)
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-xl shadow-black/20 backdrop-blur-xl">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Top Products</h3>
              <div className="mt-3 space-y-3">
                {topProducts.map((product) => (
                  <div key={product.name}>
                    <div className="mb-1 flex items-center justify-between text-sm text-slate-200">
                      <span>{product.name}</span>
                      <span>{product.revenue}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-cyan-400/80" style={{ width: `${product.share}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-xl shadow-black/20 backdrop-blur-xl">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Customer Activity Feed</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                <li className="rounded-xl border border-white/10 bg-white/5 p-3">New review from Chika: "Fast delivery."</li>
                <li className="rounded-xl border border-white/10 bg-white/5 p-3">Support ticket #104 marked resolved.</li>
                <li className="rounded-xl border border-white/10 bg-white/5 p-3">Returning customer placed 3rd order.</li>
              </ul>
            </section>

            <section className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-xl shadow-black/20 backdrop-blur-xl">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Announcements / Tips</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                <li className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-3">
                  Add banner images to increase conversion on mobile storefront.
                </li>
                <li className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-3">
                  Enable auto-dispatch templates for faster updates.
                </li>
              </ul>
            </section>
          </aside>
        </section>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-cyan-300/30 bg-slate-900/90 px-4 py-2 text-sm font-semibold text-cyan-200 shadow-2xl backdrop-blur">
          <i className="fas fa-circle-check mr-2 text-cyan-300" />
          {toast}
        </div>
      )}
    </div>
  );
}
