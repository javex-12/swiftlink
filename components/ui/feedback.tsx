import * as React from "react";
import { Loader2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";

/**
 * Loading and empty states.
 *
 * `docs/01-DESIGN-SYSTEM.md` §2.4: "ship-empty looks finished". The old build
 * seeded new stores with `aboutUs: "Store launched on SwiftLink."` and a
 * "Welcome to our Store" hero (docs/00-AUDIT.md F-21) — placeholder copy shown to
 * real customers. A designed empty state is the replacement, and it is why
 * these live in the kit rather than being improvised per screen.
 */

export function Spinner({
  className,
  size = 16,
  label = "Loading",
}: {
  className?: string;
  size?: number;
  label?: string;
}) {
  return (
    <Loader2
      width={size}
      height={size}
      role="status"
      aria-label={label}
      className={cn("animate-spin text-app-text-muted", className)}
    />
  );
}

/** Centred spinner for a whole panel that has no shape yet. */
export function PanelLoader({ label = "Loading", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex min-h-40 flex-col items-center justify-center gap-3", className)}>
      <Spinner size={24} />
      <p className="text-sm text-app-text-muted">{label}</p>
    </div>
  );
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-app-surface-2", className)}
      {...props}
    />
  );
}

/** Placeholder rows for a data table or product list. */
export function SkeletonRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3", className)} role="status" aria-label="Loading content">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-1/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export type EmptyStateProps = {
  icon?: LucideIcon;
  /** Short and factual: "No orders yet". */
  title: string;
  /** One sentence on what to do next. Never placeholder marketing copy. */
  description?: string;
  action?: React.ReactNode;
  /** Optional illustration — an SVG or a themed image. */
  illustration?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  illustration,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-app-border px-6 py-12 text-center",
        className,
      )}
    >
      {illustration ?? (icon ? <Icon icon={icon} size="xl" className="text-app-text-subtle" /> : null)}
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold text-app-text">{title}</p>
        {description ? (
          <p className="mx-auto max-w-sm text-sm text-app-text-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
