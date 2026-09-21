"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Switch and Checkbox.
 *
 * Radix gives us the keyboard and screen-reader behaviour (space toggles, correct
 * `role`, focus never lost on click). The old console shipped raw
 * `<div onClick>` toggles and a `window.customConfirm` dialog, so nothing was
 * operable without a mouse (docs/00-AUDIT.md F-22).
 *
 * Touch targets are the full 44px row, not the 24px visual track.
 */

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(function Switch({ className, ...props }, ref) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
        "transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring focus-visible:ring-offset-2 focus-visible:ring-offset-app-surface",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=unchecked]:bg-app-border data-[state=checked]:bg-app-accent",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-xs ring-0",
          "transition-transform duration-fast ease-out",
          "data-[state=unchecked]:translate-x-0 data-[state=checked]:translate-x-5",
        )}
      />
    </SwitchPrimitive.Root>
  );
});

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(function Checkbox({ className, ...props }, ref) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "peer h-5 w-5 shrink-0 rounded-xs border border-app-border-strong bg-app-surface",
        "transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring focus-visible:ring-offset-2 focus-visible:ring-offset-app-surface",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:border-app-accent data-[state=checked]:bg-app-accent data-[state=checked]:text-app-accent-fg",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});

export type SwitchFieldProps = {
  label: React.ReactNode;
  description?: React.ReactNode;
} & React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>;

/** A switch with a label and description — the shape editor settings always need. */
export function SwitchField({ label, description, id, className, ...props }: SwitchFieldProps) {
  const reactId = React.useId();
  const fieldId = id ?? `switch-${reactId}`;
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex flex-col gap-0.5">
        <label htmlFor={fieldId} className="text-sm font-medium text-app-text">
          {label}
        </label>
        {description ? <p className="text-xs text-app-text-muted">{description}</p> : null}
      </div>
      <Switch id={fieldId} {...props} />
    </div>
  );
}
