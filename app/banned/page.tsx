import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Account suspended",
  robots: { index: false, follow: false },
};

/**
 * Target of the suspended-account redirect in SwiftLinkContext.fetchStores.
 * Previously missing, so suspended merchants hit a 404 (docs/00-AUDIT.md F-08).
 */
export default function BannedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#07110d] px-6">
      <div className="max-w-lg w-full text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center text-2xl font-black">
          !
        </div>
        <h1 className="mt-6 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          This account is suspended
        </h1>
        <p className="mt-3 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
          Access to the storefront workspace has been temporarily disabled. If you
          believe this is a mistake, contact SwiftLink support and we will review
          the account.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="mailto:support@swiftlink.so"
            className="inline-flex items-center justify-center rounded-2xl px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-black uppercase tracking-widest"
          >
            Contact support
          </a>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl px-6 py-3 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-[11px] font-black uppercase tracking-widest"
          >
            Back to SwiftLink
          </Link>
        </div>
      </div>
    </main>
  );
}
