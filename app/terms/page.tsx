import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 py-20 px-6 sm:px-12 max-w-4xl mx-auto">
      <h1 className="text-4xl font-black mb-8 italic">Terms and Conditions</h1>
      <p className="text-sm text-slate-500 mb-8 font-bold uppercase tracking-widest">Last updated: April 2026</p>
      
      <div className="space-y-10 selection:bg-emerald-200">
        <section>
          <h2 className="text-2xl font-black mb-4">1. Introduction</h2>
          <p className="text-slate-600 leading-relaxed font-medium">
            Welcome to SwiftLink Pro. By accessing our platform, you agree to these terms. SwiftLink Pro provides software that facilitates WhatsApp-based commerce.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black mb-4">2. Account Registration</h2>
          <p className="text-slate-600 leading-relaxed font-medium">
            You must provide accurate information when registering your business, including verifying your phone number. You are responsible for all activity that occurs under your account. A mobile number is actively required to register and verify SMS functionality to your storefront.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black mb-4">3. Content and Use</h2>
          <p className="text-slate-600 leading-relaxed font-medium">
            Store owners are solely liable for the items they upload and market using SwiftLink Pro. Illegal, explicitly fraudulent, or prohibited items will result in immediate termination of access without prior notice.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black mb-4">4. Fees and Payments</h2>
          <p className="text-slate-600 leading-relaxed font-medium">
            SwiftLink Pro offers a basic trial experience and premium tiers. Payments for the service are non-refundable. All checkout flows initiated by your customers are between you and the customer; SwiftLink does not process transaction funds on your behalf unless explicitly enrolled in SwiftLink Escrow.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black mb-4">5. Modifications to Service</h2>
          <p className="text-slate-600 leading-relaxed font-medium">
            We reserve the right to modify or discontinue any part of our service. As a PWA platform, your offline access is limited to cached catalog views.
          </p>
        </section>
        
        <div className="pt-10 border-t border-slate-100 mt-12">
          <Link href="/signup" className="text-emerald-500 font-bold hover:underline">← Back to Registration</Link>
        </div>
      </div>
    </main>
  );
}
