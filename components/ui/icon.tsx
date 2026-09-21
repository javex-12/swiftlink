import * as React from "react";
import type { LucideIcon, LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The one way to render an icon.
 *
 * `docs/01-DESIGN-SYSTEM.md` §7 decides Lucide and only Lucide: it is already in
 * the tree, it is tree-shakeable per icon, and it replaces the ad-hoc mix of
 * Lucide + Font Awesome CDN + raw emoji that made the product look inconsistent
 * (docs/00-AUDIT.md F-20).
 *
 * Size and stroke are decided here rather than per call site, which is what the
 * old code lacked — the same icon rendered at four sizes with three strokes
 * depending on which file you were in.
 */

const SIZES = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export type IconSize = keyof typeof SIZES;

export type IconProps = Omit<LucideProps, "size" | "ref"> & {
  icon: LucideIcon;
  size?: IconSize;
  /** Set when the icon is the only content of a control with no visible label. */
  label?: string;
};

export function Icon({ icon: Glyph, size = "md", label, className, strokeWidth, ...props }: IconProps) {
  const px = SIZES[size];
  return (
    <Glyph
      width={px}
      height={px}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable={false}
      /*
       * Lucide's optical default is 2; 1.5 (the figure in the design doc) reads
       * too faint at 12–16px against our muted text tokens, so the shared default
       * sits at 1.75 and individual call sites can still override.
       */
      strokeWidth={strokeWidth ?? 1.75}
      className={cn("shrink-0", className)}
      {...props}
    />
  );
}

/** For the ~120 tagged icons a merchant can pick for categories and badges. */
export type IconName = string;

export const ICON_SIZES = SIZES;
