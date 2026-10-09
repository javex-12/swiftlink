import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The SwiftLink Pro terms of service: accounts, plan limits, billing and the 7-day grace period, your storefront content, acceptable use, and liability.",
  alternates: {
    canonical: "/terms",
  },
};

/**
 * Terms of Service.
 *
 * Rewritten to describe the product that actually exists:
 *
 *  - The old text promised "SwiftLink Escrow". No escrow exists, and no code
 *    path processes funds — orders finish in WhatsApp between the merchant and
 *    their customer. Promising escrow in a contract is a liability, not a
 *    feature.
 *  - It claimed a phone number was required to "verify SMS functionality". No
 *    SMS verification is implemented; the number is the storefront's WhatsApp
 *    contact.
 *  - It said nothing about plan limits, or about what happens when a payment
 *    fails — which is exactly where merchant expectations matter. Those are now
 *    spelled out from `lib/plans.ts`, the single source of truth for the caps.
 */
export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 py-12 md:py-24 px-6 relative overflow-hidden font-sans">
      {/* Background Accents */}
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
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <FileText size={120} />
          </div>

          <header className="mb-16">
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">
              Terms of <br />
              <span className="text-emerald-500">Service</span>
            </h1>
            <p className="mt-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Effective October 8, 2026
            </p>
          </header>

          <div className="space-y-12 selection:bg-emerald-200">
            <section className="group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center font-black group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  01
                </div>
                <h2 className="text-xl font-black italic uppercase tracking-tight">Introduction</h2>
              </div>
              <p className="text-slate-500 leading-relaxed font-medium md:pl-14">
                Welcome to SwiftLink Pro. These terms are an agreement between you and SwiftLink Pro
                covering your use of the platform. By creating an account or using the service, you
                accept them. If you are agreeing on behalf of a business, you confirm you are
                authorised to do so.
              </p>
            </section>

            <section className="group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center font-black group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  02
                </div>
                <h2 className="text-xl font-black italic uppercase tracking-tight">Accounts</h2>
              </div>
              <p className="text-slate-500 leading-relaxed font-medium md:pl-14">
                You must provide accurate registration details and keep your credentials secure. The
                WhatsApp number you register is published on your storefront so customers can reach
                you, and you are responsible for keeping it current. You are responsible for all
                activity under your account. You must be old enough to form a binding contract in
                your jurisdiction to use the service.
              </p>
            </section>

            <section className="group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center font-black group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  03
                </div>
                <h2 className="text-xl font-black italic uppercase tracking-tight">Plans and Limits</h2>
              </div>
              <div className="text-slate-500 leading-relaxed font-medium md:pl-14 space-y-4">
                <p>
                  SwiftLink Pro is offered on a free plan and on paid tiers. The limits in force today
                  are:
                </p>
                <ul className="space-y-2 md:pl-2">
                  <li className="flex gap-3">
                    <span className="text-emerald-500 font-black">—</span>
                    <span>
                      <strong className="text-slate-700">Free:</strong> up to 6 published products in a
                      single store.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-emerald-500 font-black">—</span>
                    <span>
                      <strong className="text-slate-700">Pro:</strong> unlimited published products in a
                      single store.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-emerald-500 font-black">—</span>
                    <span>
                      <strong className="text-slate-700">Business:</strong> unlimited published products
                      plus multiple stores.
                    </span>
                  </li>
                </ul>
                <p>
                  Paid tiers are subject to a fair-use ceiling so that one account cannot consume
                  shared capacity: up to 1,000 products per store and up to 10 stores per account.
                  Store handles are allocated on a first-come basis and must not impersonate another
                  business or a public figure.
                </p>
              </div>
            </section>

            <section className="group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center font-black group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  04
                </div>
                <h2 className="text-xl font-black italic uppercase tracking-tight">
                  Billing, Grace Period and Downgrades
                </h2>
              </div>
              <div className="text-slate-500 leading-relaxed font-medium md:pl-14 space-y-4">
                <p>
                  Paid plans are billed in advance through our payment provider and renew until
                  cancelled. Fees are non-refundable except where the law requires otherwise. You can
                  cancel at any time and keep access until the end of the period you have paid for.
                </p>
                <p>
                  <strong className="text-slate-700">
                    We do not delete your data if a payment fails or you downgrade.
                  </strong>{" "}
                  If a charge fails, your plan enters a 7-day grace period and we email you before
                  anything changes. If it is not resolved, your account moves to the applicable lower
                  plan and:
                </p>
                <ul className="space-y-2 md:pl-2">
                  <li className="flex gap-3">
                    <span className="text-emerald-500 font-black">—</span>
                    <span>
                      Products beyond your new limit are <em>hidden from your storefront</em>, not
                      deleted. You choose which products stay visible, and you can change that choice
                      at any time.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-emerald-500 font-black">—</span>
                    <span>
                      Stores beyond your new limit are <em>unpublished</em>. Their products, branding
                      and order history are retained.
                    </span>
                  </li>
                </ul>
                <p>
                  Restoring your plan restores visibility, subject to handle availability. Stores and
                  products on a lapsed plan are excluded from our dormant-data cleanup.
                </p>
              </div>
            </section>

            <section className="group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center font-black group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  05
                </div>
                <h2 className="text-xl font-black italic uppercase tracking-tight">
                  Your Storefront and Customer Orders
                </h2>
              </div>
              <p className="text-slate-500 leading-relaxed font-medium md:pl-14">
                Orders are completed in WhatsApp directly between you and your customer. SwiftLink Pro
                is not a party to that sale, does not charge or refund your customers, and does not
                hold or process funds on your behalf — it is not an escrow or payment processor. You
                are solely responsible for your products, pricing, delivery, taxes, customer service
                and compliance with the law that applies to your business.
              </p>
            </section>

            <section className="group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center font-black group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  06
                </div>
                <h2 className="text-xl font-black italic uppercase tracking-tight">
                  Your Content and Acceptable Use
                </h2>
              </div>
              <div className="text-slate-500 leading-relaxed font-medium md:pl-14 space-y-4">
                <p>
                  You keep ownership of the text, images and product data you upload. You grant us the
                  licence needed to host, cache and display that content in order to run your
                  storefront.
                </p>
                <p>You agree not to use SwiftLink Pro to:</p>
                <ul className="space-y-2 md:pl-2">
                  <li className="flex gap-3">
                    <span className="text-emerald-500 font-black">—</span>
                    <span>offer illegal, stolen, counterfeit or prohibited goods or services;</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-emerald-500 font-black">—</span>
                    <span>mislead customers, or impersonate another business or person;</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-emerald-500 font-black">—</span>
                    <span>
                      send unsolicited bulk messages, or upload content you do not have the rights to;
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-emerald-500 font-black">—</span>
                    <span>
                      probe, scrape, overload or resell the service, or work around plan limits.
                    </span>
                  </li>
                </ul>
                <p>
                  We may remove content or suspend an account that breaks these rules, and will do so
                  immediately for clearly fraudulent or illegal activity.
                </p>
              </div>
            </section>

            <section className="group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center font-black group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  07
                </div>
                <h2 className="text-xl font-black italic uppercase tracking-tight">
                  Availability and Offline Access
                </h2>
              </div>
              <p className="text-slate-500 leading-relaxed font-medium md:pl-14">
                We aim to keep SwiftLink Pro available but do not guarantee uninterrupted service. As
                a progressive web app it caches pages for offline use, so a page you open without a
                connection may show content that is out of date. We may modify, add or discontinue
                features; we will give reasonable notice of changes that materially reduce what you
                have paid for.
              </p>
            </section>

            <section className="group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center font-black group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  08
                </div>
                <h2 className="text-xl font-black italic uppercase tracking-tight">
                  Suspension and Termination
                </h2>
              </div>
              <p className="text-slate-500 leading-relaxed font-medium md:pl-14">
                You may stop using the service at any time. We may suspend or terminate your access
                for a material breach of these terms, for non-payment after the grace period, or where
                we are required to by law. Where termination is not for fraud or illegality, we will
                give you a reasonable window to export your product and customer data.
              </p>
            </section>

            <section className="group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center font-black group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  09
                </div>
                <h2 className="text-xl font-black italic uppercase tracking-tight">
                  Disclaimers and Liability
                </h2>
              </div>
              <p className="text-slate-500 leading-relaxed font-medium md:pl-14">
                The service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis
                without warranties of any kind, to the fullest extent permitted by law. We are not
                liable for lost profits, lost sales, or indirect or consequential losses, and our
                total liability for any claim is limited to the greater of the fees you paid us in the
                three months before the claim or the minimum amount the law allows. Nothing here
                excludes liability that cannot lawfully be excluded, or any statutory consumer rights.
              </p>
            </section>

            <section className="group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center font-black group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  10
                </div>
                <h2 className="text-xl font-black italic uppercase tracking-tight">
                  Privacy and Changes to These Terms
                </h2>
              </div>
              <div className="text-slate-500 leading-relaxed font-medium md:pl-14 space-y-4">
                <p>
                  How we handle your data is described in our{" "}
                  <Link href="/privacy" className="font-semibold text-emerald-600 hover:underline">
                    Privacy &amp; Cookie Policy
                  </Link>
                  .
                </p>
                <p>
                  We may update these terms. We will change the effective date above and, for a
                  material change, notify you by email or in the app before it takes effect.
                  Continuing to use the service after that means you accept the updated terms.
                </p>
                <p>
                  Questions about these terms?{" "}
                  <a
                    href="mailto:support@swiftlink.pro"
                    className="font-semibold text-emerald-600 hover:underline"
                  >
                    support@swiftlink.pro
                  </a>
                </p>
              </div>
            </section>
          </div>

          <footer className="mt-20 pt-10 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-[10px] font-bold text-slate-300">© 2026 SwiftLink Workspace.</p>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
              Effective October 8, 2026
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}
