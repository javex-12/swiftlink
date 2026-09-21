import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Badge — status and metadata only.
 *
 * `docs/01-DESIGN-SYSTEM.md` §2.1: the old product used
 * `font-black uppercase tracking-widest` on nearly every label, which destroys
 * hierarchy. Small caps are reserved for metadata, which is what this is.
 */

export const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-app-surface-2 text-app-text-muted",
        accent: "bg-app-accent-subtle text-app-accent-text",
        success: "bg-app-success-subtle text-app-success",
        warning: "bg-app-warning-subtle text-app-warning",
        danger: "bg-app-danger-subtle text-app-danger",
        info: "bg-app-info-subtle text-app-info",
        outline: "border border-app-border text-app-text-muted",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
