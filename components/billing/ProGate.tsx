"use client";

import { Lock } from "lucide-react";
import { useSwiftLink } from "@/context/SwiftLinkContext";

/**
 * The locked state of a paid feature.
 *
 * Clicking "Upgrade to Pro / Business" pops open the UpgradeModal directly,
 * allowing the merchant to review the tier benefits, toggle billing interval,
 * and proceed directly to Paystack checkout without losing their context.
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
  const { openUpgradeModal } = useSwiftLink();

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
      <button
        type="button"
        onClick={() => openUpgradeModal(planLabel.toLowerCase() as "pro" | "business")}
        className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-[12px] bg-[#19C37D] px-5 text-sm font-semibold text-[#04120C] transition hover:bg-[#16a86e] active:scale-[0.98] shadow-md shadow-[#19C37D]/10 cursor-pointer"
      >
        Upgrade to {planLabel}
      </button>
    </div>
  );
}
