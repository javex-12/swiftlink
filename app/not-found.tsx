import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#07110d] px-6">
      <div className="max-w-md w-full text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">
          404
        </p>
        <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-3 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
          The link may be broken, or the store may have been moved to a new
          address.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-2xl px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-black uppercase tracking-widest"
        >
          Back to SwiftLink
        </Link>
      </div>
    </main>
  );
}
