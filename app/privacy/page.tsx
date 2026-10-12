import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";

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
    <div className="min-h-screen bg-[#0A1210] text-[#E8F1EC]">
      {/* Sticky Top Nav */}
      <header className="sticky top-0 z-30 border-b border-[#1E2D27] bg-[#111C18]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="flex items-center gap-2">
            <Logo size="sm" showWordmark={true} />
          </Link>
          <div className="flex items-center gap-4 text-xs font-medium text-[#9DB3A8]">
            <Link href="/terms" className="transition hover:text-[#E8F1EC]">
              Terms of Service
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
            Data Protection Standard
          </p>
          <h1 className="text-5xl font-black uppercase italic tracking-tighter text-[#E8F1EC] md:text-7xl">
            Privacy &amp; <span className="text-[#19C37D] underline decoration-[#19C37D]/30 underline-offset-8">Cookies</span>
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
                Information We Collect
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-[#9DB3A8]">
              We collect essential business information necessary to operate your WhatsApp storefront, including store name, account email, WhatsApp contact number, catalog items and pricing. We also store the orders and customer records your storefront creates, so you can see who ordered what.
            </p>
          </section>

          <section className="rounded-2xl border border-[#1E2D27] bg-[#111C18] p-6 md:p-8">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#19C37D]/10 text-xs font-black text-[#19C37D]">
                02
              </span>
              <h2 className="text-sm font-black uppercase tracking-widest text-[#E8F1EC]">
                Customer Order Data
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-[#9DB3A8]">
              When customers place orders via your storefront, order items and buyer-provided delivery details are compiled to generate direct WhatsApp chat links. We do not sell or trade buyer personal information to third parties.
            </p>
          </section>

          <section className="rounded-2xl border border-[#1E2D27] bg-[#111C18] p-6 md:p-8">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#19C37D]/10 text-xs font-black text-[#19C37D]">
                03
              </span>
              <h2 className="text-sm font-black uppercase tracking-widest text-[#E8F1EC]">
                Cookies &amp; Local Storage
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-[#9DB3A8]">
              SwiftLink uses functional cookies and browser local storage to maintain session state, preserve cart contents, remember UI preferences (such as Dark/Light mode), and enable offline Progressive Web App (PWA) functionality. When you edit your store, an autosaved copy of your unfinished changes is kept in your browser and, once saved to your account, on our servers &mdash; your customers never see it until you publish. Your browser also remembers details you have already typed (such as your store handle and WhatsApp number) so you do not have to re-enter them; these stay on your device and can be cleared at any time by clearing your browser storage.
            </p>
          </section>

          <section className="rounded-2xl border border-[#1E2D27] bg-[#111C18] p-6 md:p-8">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#19C37D]/10 text-xs font-black text-[#19C37D]">
                04
              </span>
              <h2 className="text-sm font-black uppercase tracking-widest text-[#E8F1EC]">
                Data Security &amp; Retention
              </h2>
            </div>
            <div className="space-y-4 text-sm leading-relaxed text-[#9DB3A8]">
              <p>
                Data is transmitted over TLS and stored with our database provider with encryption
                at rest. Access to your account data is restricted by row-level security, so your
                store data is only readable by you (and, for published storefronts, the catalog you
                have chosen to display publicly).
              </p>
              <p>
                You can edit your catalog and store data at any time from the dashboard. To request
                an export or the deletion of your account and its associated catalog and customer
                records, contact us at{" "}
                <a
                  href="mailto:support@swiftlink.pro"
                  className="font-medium text-[#19C37D] underline decoration-[#19C37D]/40 underline-offset-2 transition hover:text-[#22E595]"
                >
                  support@swiftlink.pro
                </a>{" "}
                and we will action it within a reasonable period, subject to records we are required
                to retain.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-[#1E2D27] bg-[#111C18] p-6 md:p-8">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#19C37D]/10 text-xs font-black text-[#19C37D]">
                05
              </span>
              <h2 className="text-sm font-black uppercase tracking-widest text-[#E8F1EC]">
                Your Rights
              </h2>
            </div>
            <div className="space-y-4 text-sm leading-relaxed text-[#9DB3A8]">
              <p>
                Depending on your location, you hold statutory rights regarding your personal information, including:
              </p>
              <ul className="space-y-2">
                <li className="flex gap-3">
                  <span className="shrink-0 font-black text-[#19C37D]">&mdash;</span>
                  <span>
                    <strong className="text-[#E8F1EC]">Right to access:</strong> You can request a copy of the personal data we hold about you.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 font-black text-[#19C37D]">&mdash;</span>
                  <span>
                    <strong className="text-[#E8F1EC]">Right to rectification:</strong> You can update inaccurate or incomplete information directly from your dashboard or upon request.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 font-black text-[#19C37D]">&mdash;</span>
                  <span>
                    <strong className="text-[#E8F1EC]">Right to erasure:</strong> You can request deletion of your account and personal records by contacting{" "}
                    <a
                      href="mailto:support@swiftlink.pro"
                      className="font-medium text-[#19C37D] underline decoration-[#19C37D]/40 underline-offset-2 transition hover:text-[#22E595]"
                    >
                      support@swiftlink.pro
                    </a>
                    .
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 font-black text-[#19C37D]">&mdash;</span>
                  <span>
                    <strong className="text-[#E8F1EC]">Right to data portability:</strong> You can request an export of your store and catalog data in a structured format.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 font-black text-[#19C37D]">&mdash;</span>
                  <span>
                    <strong className="text-[#E8F1EC]">Right to object:</strong> You can object to processing of your information under certain statutory circumstances.
                  </span>
                </li>
              </ul>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-[#1E2D27] pt-8 text-xs text-[#9DB3A8] sm:flex-row">
          <div className="flex items-center gap-4">
            <Link href="/terms" className="transition hover:text-[#E8F1EC]">
              Terms of Service
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
