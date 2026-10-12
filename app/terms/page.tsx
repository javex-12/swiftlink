import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The SwiftLink Pro terms of service: accounts, plan limits, billing and the 7-day grace period, your storefront content, acceptable use, and liability.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0A1210] text-[#E8F1EC]">
      {/* Sticky Top Nav */}
      <header className="sticky top-0 z-30 border-b border-[#1E2D27] bg-[#111C18]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="flex items-center gap-2">
            <Logo size="sm" showWordmark={true} />
          </Link>
          <div className="flex items-center gap-4 text-xs font-medium text-[#9DB3A8]">
            <Link href="/privacy" className="transition hover:text-[#E8F1EC]">
              Privacy &amp; Cookies
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-[#1E2D27] bg-[#14231D] px-3.5 py-1.5 text-xs font-semibold text-[#E8F1EC] transition hover:border-[#19C37D] hover:text-[#19C37D]"
            >
              Back to App
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-5 py-16">
        <div className="mb-12">
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#19C37D]">
            Legal Agreement
          </p>
          <h1 className="text-5xl font-black uppercase italic tracking-tighter text-[#E8F1EC] md:text-7xl">
            Terms of <span className="text-[#19C37D] underline decoration-[#19C37D]/30 underline-offset-8">Service</span>
          </h1>
          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#9DB3A8]">
            Effective October 8, 2026
          </p>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-[#1E2D27] bg-[#111C18] p-6 md:p-8">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#19C37D]/10 text-xs font-black text-[#19C37D]">
                01
              </span>
              <h2 className="text-sm font-black uppercase tracking-widest text-[#E8F1EC]">
                Introduction
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-[#9DB3A8]">
              Welcome to SwiftLink Pro. These terms are an agreement between you and SwiftLink Pro
              covering your use of the platform. By creating an account or using the service, you
              accept them. If you are agreeing on behalf of a business, you confirm you are
              authorised to do so.
            </p>
          </section>

          <section className="rounded-2xl border border-[#1E2D27] bg-[#111C18] p-6 md:p-8">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#19C37D]/10 text-xs font-black text-[#19C37D]">
                02
              </span>
              <h2 className="text-sm font-black uppercase tracking-widest text-[#E8F1EC]">
                Accounts
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-[#9DB3A8]">
              You must provide accurate registration details and keep your credentials secure. The
              WhatsApp number you register is published on your storefront so customers can reach
              you, and you are responsible for keeping it current. You are responsible for all
              activity under your account. You must be old enough to form a binding contract in
              your jurisdiction to use the service.
            </p>
          </section>

          <section className="rounded-2xl border border-[#1E2D27] bg-[#111C18] p-6 md:p-8">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#19C37D]/10 text-xs font-black text-[#19C37D]">
                03
              </span>
              <h2 className="text-sm font-black uppercase tracking-widest text-[#E8F1EC]">
                Plans and Limits
              </h2>
            </div>
            <div className="space-y-4 text-sm leading-relaxed text-[#9DB3A8]">
              <p>
                SwiftLink Pro is offered on a free plan and on paid tiers. The limits in force today
                are:
              </p>
              <ul className="space-y-2">
                <li className="flex gap-3">
                  <span className="shrink-0 font-black text-[#19C37D]">&mdash;</span>
                  <span>
                    <strong className="text-[#E8F1EC]">Free:</strong> up to 6 published products in a
                    single store.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 font-black text-[#19C37D]">&mdash;</span>
                  <span>
                    <strong className="text-[#E8F1EC]">Pro:</strong> unlimited published products in a
                    single store.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 font-black text-[#19C37D]">&mdash;</span>
                  <span>
                    <strong className="text-[#E8F1EC]">Business:</strong> unlimited published products
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

          <section className="rounded-2xl border border-[#1E2D27] bg-[#111C18] p-6 md:p-8">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#19C37D]/10 text-xs font-black text-[#19C37D]">
                04
              </span>
              <h2 className="text-sm font-black uppercase tracking-widest text-[#E8F1EC]">
                Billing, Grace Period and Downgrades
              </h2>
            </div>
            <div className="space-y-4 text-sm leading-relaxed text-[#9DB3A8]">
              <p>
                Paid plans are billed in advance through our payment provider and renew until
                cancelled. Fees are non-refundable except where the law requires otherwise. You can
                cancel at any time and keep access until the end of the period you have paid for.
              </p>
              <p>
                <strong className="text-[#E8F1EC]">
                  We do not delete your data if a payment fails or you downgrade.
                </strong>{" "}
                If a charge fails, your plan enters a 7-day grace period and we email you before
                anything changes. If it is not resolved, your account moves to the applicable lower
                plan and:
              </p>
              <ul className="space-y-2">
                <li className="flex gap-3">
                  <span className="shrink-0 font-black text-[#19C37D]">&mdash;</span>
                  <span>
                    Products beyond your new limit are <em>hidden from your storefront</em>, not
                    deleted. You choose which products stay visible, and you can change that choice
                    at any time.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 font-black text-[#19C37D]">&mdash;</span>
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

          <section className="rounded-2xl border border-[#1E2D27] bg-[#111C18] p-6 md:p-8">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#19C37D]/10 text-xs font-black text-[#19C37D]">
                05
              </span>
              <h2 className="text-sm font-black uppercase tracking-widest text-[#E8F1EC]">
                Your Storefront and Customer Orders
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-[#9DB3A8]">
              Orders are completed in WhatsApp directly between you and your customer. SwiftLink Pro
              is not a party to that sale, does not charge or refund your customers, and does not
              hold or process funds on your behalf &mdash; it is not an escrow or payment processor. You
              are solely responsible for your products, pricing, delivery, taxes, customer service
              and compliance with the law that applies to your business.
            </p>
          </section>

          <section className="rounded-2xl border border-[#1E2D27] bg-[#111C18] p-6 md:p-8">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#19C37D]/10 text-xs font-black text-[#19C37D]">
                06
              </span>
              <h2 className="text-sm font-black uppercase tracking-widest text-[#E8F1EC]">
                Your Content and Acceptable Use
              </h2>
            </div>
            <div className="space-y-4 text-sm leading-relaxed text-[#9DB3A8]">
              <p>
                You keep ownership of the text, images and product data you upload. You grant us the
                licence needed to host, cache and display that content in order to run your
                storefront.
              </p>
              <p>You agree not to use SwiftLink Pro to:</p>
              <ul className="space-y-2">
                <li className="flex gap-3">
                  <span className="shrink-0 font-black text-[#19C37D]">&mdash;</span>
                  <span>offer illegal, stolen, counterfeit or prohibited goods or services;</span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 font-black text-[#19C37D]">&mdash;</span>
                  <span>mislead customers, or impersonate another business or person;</span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 font-black text-[#19C37D]">&mdash;</span>
                  <span>
                    send unsolicited bulk messages, or upload content you do not have the rights to;
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 font-black text-[#19C37D]">&mdash;</span>
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

          <section className="rounded-2xl border border-[#1E2D27] bg-[#111C18] p-6 md:p-8">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#19C37D]/10 text-xs font-black text-[#19C37D]">
                07
              </span>
              <h2 className="text-sm font-black uppercase tracking-widest text-[#E8F1EC]">
                Availability and Offline Access
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-[#9DB3A8]">
              We aim to keep SwiftLink Pro available but do not guarantee uninterrupted service. As
              a progressive web app it caches pages for offline use, so a page you open without a
              connection may show content that is out of date. We may modify, add or discontinue
              features; we will give reasonable notice of changes that materially reduce what you
              have paid for.
            </p>
          </section>

          <section className="rounded-2xl border border-[#1E2D27] bg-[#111C18] p-6 md:p-8">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#19C37D]/10 text-xs font-black text-[#19C37D]">
                08
              </span>
              <h2 className="text-sm font-black uppercase tracking-widest text-[#E8F1EC]">
                Suspension and Termination
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-[#9DB3A8]">
              You may stop using the service at any time. We may suspend or terminate your access
              for a material breach of these terms, for non-payment after the grace period, or where
              we are required to by law. Where termination is not for fraud or illegality, we will
              give you a reasonable window to export your product and customer data.
            </p>
          </section>

          <section className="rounded-2xl border border-[#1E2D27] bg-[#111C18] p-6 md:p-8">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#19C37D]/10 text-xs font-black text-[#19C37D]">
                09
              </span>
              <h2 className="text-sm font-black uppercase tracking-widest text-[#E8F1EC]">
                Disclaimers and Liability
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-[#9DB3A8]">
              The service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis
              without warranties of any kind, to the fullest extent permitted by law. We are not
              liable for lost profits, lost sales, or indirect or consequential losses, and our
              total liability for any claim is limited to the greater of the fees you paid us in the
              three months before the claim or the minimum amount the law allows. Nothing here
              excludes liability that cannot lawfully be excluded, or any statutory consumer rights.
            </p>
          </section>

          <section className="rounded-2xl border border-[#1E2D27] bg-[#111C18] p-6 md:p-8">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#19C37D]/10 text-xs font-black text-[#19C37D]">
                10
              </span>
              <h2 className="text-sm font-black uppercase tracking-widest text-[#E8F1EC]">
                Privacy and Changes to These Terms
              </h2>
            </div>
            <div className="space-y-4 text-sm leading-relaxed text-[#9DB3A8]">
              <p>
                How we handle your data is described in our{" "}
                <Link href="/privacy" className="font-semibold text-[#19C37D] underline decoration-[#19C37D]/40 underline-offset-2 transition hover:text-[#22E595]">
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
                  className="font-semibold text-[#19C37D] underline decoration-[#19C37D]/40 underline-offset-2 transition hover:text-[#22E595]"
                >
                  support@swiftlink.pro
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-[#1E2D27] pt-8 text-xs text-[#9DB3A8] sm:flex-row">
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="transition hover:text-[#E8F1EC]">
              Privacy &amp; Cookie Policy
            </Link>
            <Link href="/" className="transition hover:text-[#E8F1EC]">
              Back to SwiftLink Pro
            </Link>
          </div>
          <p className="text-[11px] uppercase tracking-widest text-[#9DB3A8]">
            Effective October 8, 2026
          </p>
        </footer>
      </main>
    </div>
  );
}
