import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0A1210] px-6 text-[#E8F1EC]">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <Logo size="lg" showWordmark={true} />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#19C37D]">
          404 &bull; Page not found
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#E8F1EC]">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-2 text-sm text-[#9DB3A8] leading-relaxed">
          The link may be broken, or the store may have been moved to a new address.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-[12px] px-6 py-2.5 bg-[#19C37D] text-[#04140D] text-xs font-semibold hover:bg-[#15A86B] transition-colors"
        >
          Back to SwiftLink
        </Link>
      </div>
    </main>
  );
}
