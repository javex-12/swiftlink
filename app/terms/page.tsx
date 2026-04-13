import Link from "next/link";
import { ArrowLeft, ShieldCheck, FileText, Lock } from "lucide-react";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 py-12 md:py-24 px-6 relative overflow-hidden font-sans">
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] -ml-48 -mb-48" />

      <div className="max-w-4xl mx-auto relative z-10">
        <Link href="/signup" className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-500 font-black text-[10px] uppercase tracking-widest transition-colors mb-12 group">
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-all">
            <ArrowLeft size={14} />
          </div>
          Back to Registration
        </Link>

        <div className="bg-white rounded-[3rem] p-8 md:p-16 shadow-xl border border-slate-100 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-5">
              <FileText size={120} />
           </div>

           <header className="mb-16">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest mb-6">
                 <ShieldCheck size={10} /> Verified Legal Policy
              </span>
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">Terms of <br/><span className="text-emerald-500">Service</span></h1>
              <p className="mt-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Effective April 11, 2026</p>
           </header>
           
           <div className="space-y-12 selection:bg-emerald-200">
             <section className="group">
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center font-black group-hover:bg-emerald-500 group-hover:text-white transition-all">01</div>
                  <h2 className="text-xl font-black italic uppercase tracking-tight">Introduction</h2>
               </div>
               <p className="text-slate-500 leading-relaxed font-medium md:pl-14">
                 Welcome to SwiftLink Pro. By accessing our platform, you agree to these terms. SwiftLink Pro provides software that facilitates WhatsApp-based commerce and operational logistics for growing businesses.
               </p>
             </section>

             <section className="group">
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center font-black group-hover:bg-emerald-500 group-hover:text-white transition-all">02</div>
                  <h2 className="text-xl font-black italic uppercase tracking-tight">Account Integrity</h2>
               </div>
               <p className="text-slate-500 leading-relaxed font-medium md:pl-14">
                 You must provide accurate information when registering your business, including verifying your phone number. You are responsible for all activity that occurs under your account. A mobile number is actively required to register and verify SMS functionality to your storefront.
               </p>
             </section>

             <section className="group">
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center font-black group-hover:bg-emerald-500 group-hover:text-white transition-all">03</div>
                  <h2 className="text-xl font-black italic uppercase tracking-tight">Commerce Liability</h2>
               </div>
               <p className="text-slate-500 leading-relaxed font-medium md:pl-14">
                 Store owners are solely liable for the items they upload and market using SwiftLink Pro. Illegal, explicitly fraudulent, or prohibited items will result in immediate termination of access without prior notice.
               </p>
             </section>

             <section className="group">
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center font-black group-hover:bg-emerald-500 group-hover:text-white transition-all">04</div>
                  <h2 className="text-xl font-black italic uppercase tracking-tight">Financial Flow</h2>
               </div>
               <p className="text-slate-500 leading-relaxed font-medium md:pl-14">
                 SwiftLink Pro offers a basic trial experience and premium tiers. Payments for the service are non-refundable. All checkout flows initiated by your customers are between you and the customer; SwiftLink does not process transaction funds on your behalf unless explicitly enrolled in SwiftLink Escrow.
               </p>
             </section>

             <section className="group">
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center font-black group-hover:bg-emerald-500 group-hover:text-white transition-all">05</div>
                  <h2 className="text-xl font-black italic uppercase tracking-tight">Service Evolution</h2>
               </div>
               <p className="text-slate-500 leading-relaxed font-medium md:pl-14">
                 We reserve the right to modify or discontinue any part of our service. As a PWA platform, your offline access is limited to cached catalog views.
               </p>
             </section>
           </div>
           
           <footer className="mt-20 pt-10 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                 <Lock className="text-emerald-500" size={16} />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Secure Protocol v4.2</span>
              </div>
              <p className="text-[10px] font-bold text-slate-300">© 2026 SwiftLink Technologies Ltd.</p>
           </footer>
        </div>
      </div>
    </main>
  );
}