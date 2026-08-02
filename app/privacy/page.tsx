import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy & Cookie Policy",
  description:
    "Learn how SwiftLink Pro handles your personal data, store information, customer order metadata, and cookies.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 py-12 md:py-24 px-6 relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] -ml-48 -mb-48" />

      <div className="max-w-4xl mx-auto relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-500 font-black text-[10px] uppercase tracking-widest transition-colors mb-12 group">
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-all">
            <ArrowLeft size={14} />
          </div>
          Back to Home
        </Link>

        <div className="bg-white rounded-[3rem] p-8 md:p-16 shadow-xl border border-slate-100 relative overflow-hidden">
          <header className="mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest mb-6">
              <ShieldCheck size={10} /> Data Privacy Standard
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">
              Privacy &amp; <br/><span className="text-emerald-500">Cookies</span>
            </h1>
            <p className="mt-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Effective April 11, 2026</p>
          </header>
          
          <div className="space-y-12 selection:bg-emerald-200">
            <section className="group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center font-black group-hover:bg-emerald-500 group-hover:text-white transition-all">01</div>
                <h2 className="text-xl font-black italic uppercase tracking-tight">Information We Collect</h2>
              </div>
              <p className="text-slate-500 leading-relaxed font-medium md:pl-14">
                We collect essential business information necessary to operate your WhatsApp storefront, including store name, account email, WhatsApp contact number, catalog items, pricing, and order dispatch status.
              </p>
            </section>

            <section className="group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center font-black group-hover:bg-emerald-500 group-hover:text-white transition-all">02</div>
                <h2 className="text-xl font-black italic uppercase tracking-tight">Customer Order Data</h2>
              </div>
              <p className="text-slate-500 leading-relaxed font-medium md:pl-14">
                When customers place orders via your storefront, order items and buyer-provided delivery details are compiled to generate direct WhatsApp chat links. We do not sell or trade buyer personal information to third parties.
              </p>
            </section>

            <section className="group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center font-black group-hover:bg-emerald-500 group-hover:text-white transition-all">03</div>
                <h2 className="text-xl font-black italic uppercase tracking-tight">Cookies &amp; Local Storage</h2>
              </div>
              <p className="text-slate-500 leading-relaxed font-medium md:pl-14">
                SwiftLink uses functional cookies and browser local storage to maintain session state, preserve cart contents, remember UI preferences (such as Dark/Light mode), and enable offline Progressive Web App (PWA) functionality.
              </p>
            </section>

            <section className="group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center font-black group-hover:bg-emerald-500 group-hover:text-white transition-all">04</div>
                <h2 className="text-xl font-black italic uppercase tracking-tight">Data Security &amp; Rights</h2>
              </div>
              <p className="text-slate-500 leading-relaxed font-medium md:pl-14">
                We implement industry-standard encryption and security protocols to safeguard account data. You reserve the right to modify, export, or request deletion of your store account and associated catalog data at any time.
              </p>
            </section>
          </div>
          
          <footer className="mt-20 pt-10 border-t border-slate-100 flex justify-end">
            <p className="text-[10px] font-bold text-slate-300">© 2026 SwiftLink Workspace.</p>
          </footer>
        </div>
      </div>
    </main>
  );
}
