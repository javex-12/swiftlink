"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

/**
 * The locked state of a paid feature.
 *
 * Three features were advertised on the pricing page as Pro and shipped to
 * everyone: discount codes, detailed analytics and the CSV export. A merchant
 * had no reason to pay for a plan whose only limits were catalogue size, and the
 * pricing page was describing a product that did not exist. This is the other
 * half of that fix — one component, so the three gates look and read the same
 * and a fourth one is a two-line change rather than a new design.
 *
 * The call to action is an ordinary link to the billing section of the account
 * page, which is where the Paystack checkout lives. The gate deliberately does
 * not start a checkout itself: an upgrade is a deliberate act, and a locked
 * panel that immediately opens a payment page reads as a dark pattern.
 */
export function ProGate({
  feature,
  description,
  planLabel = "Pro",
}: {
  /** The feature name, as the pricing page writes it. */
  feature: string;
  /** What unlocking it gives the merchant, in one sentence. */
  description: string;
  /** Which tier unlocks it. `Pro` today; `Business` is supported for future gates. */
  planLabel?: "Pro" | "Business";
}) {
  return (
    <div className="rounded-[18px] border border-[#E8B93A]/30 bg-[#E8B93A]/5 p-6 text-center sm:p-8">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8B93A]/10 text-[#E8B93A]">
        <Lock className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-[#E8F1EC]">
        {feature} is a {planLabel} feature
      </h3>
      <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[#9DB3A8] sm:text-sm">
        {description}
      </p>
      <Link
        href="/account#plans"
        className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-[12px] bg-[#19C37D] px-5 text-sm font-semibold text-[#04120C] transition hover:bg-[#16a86e]"
      >
        Upgrade to {planLabel}
      </Link>
    </div>
  );
}
