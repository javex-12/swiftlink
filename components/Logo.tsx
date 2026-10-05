import * as React from "react";
import { cn } from "@/lib/utils";

export type LogoProps = {
  size?: "sm" | "md" | "lg" | number;
  showWordmark?: boolean;
  className?: string;
  imageClassName?: string;
  wordmarkClassName?: string;
};

/**
 * Shared SwiftLink Logo component.
 * Uses the canonical /logo.png asset with alt="SwiftLink".
 * Swappable in one place across dashboard, mobile headers, auth screens, and landing page.
 */
export function Logo({
  size = "md",
  showWordmark = true,
  className,
  imageClassName,
  wordmarkClassName,
}: LogoProps) {
  const pixelSize =
    typeof size === "number"
      ? size
      : size === "sm"
      ? 24
      : size === "lg"
      ? 36
      : 28;

  const textClasses =
    size === "sm"
      ? "text-sm font-semibold tracking-tight"
      : size === "lg"
      ? "text-lg font-bold tracking-tight"
      : "text-base font-semibold tracking-tight";

  return (
    <div className={cn("inline-flex items-center gap-2 select-none", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- canonical shared brand asset */}
      <img
        src="/logo.png"
        alt="SwiftLink"
        width={pixelSize}
        height={pixelSize}
        className={cn("shrink-0 object-contain", imageClassName)}
        style={{ width: `${pixelSize}px`, height: `${pixelSize}px` }}
      />
      {showWordmark && (
        <span className={cn(textClasses, "text-app-text", wordmarkClassName)}>
          SwiftLink
        </span>
      )}
    </div>
  );
}
