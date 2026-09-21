"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Button.
 *
 * Every color comes from a token, so dark mode and (later) white-labelling are
 * swaps rather than forks. Tap targets are 44px at `md` and above because most
 * merchants run this console from a phone (`docs/03-DECISIONS.md` D5).
 */

export const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold",
    "transition-colors duration-fast ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring focus-visible:ring-offset-2 focus-visible:ring-offset-app-surface",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ),
  {
    variants: {
      variant: {
        primary: "bg-app-accent text-app-accent-fg shadow-xs hover:bg-app-accent-hover active:shadow-none",
        secondary: "bg-app-surface-2 text-app-text hover:bg-app-border",
        outline: "border border-app-border-strong bg-app-surface text-app-text hover:bg-app-surface-2",
        ghost: "text-app-text-muted hover:bg-app-surface-2 hover:text-app-text",
        danger: "bg-app-danger text-app-danger-fg hover:brightness-95",
        link: "h-auto p-0 text-app-accent-text underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 rounded-md px-3 text-sm",
        md: "h-11 rounded-lg px-4 text-sm",
        lg: "h-12 rounded-lg px-6 text-base",
        icon: "h-11 w-11 rounded-lg",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: { variant: "primary", size: "md", block: false },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    /** Render as the child element (typically a `next/link`). */
    asChild?: boolean;
    /** Shows a spinner and blocks interaction — never swap the label to "Loading…". */
    loading?: boolean;
  };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, block, asChild = false, loading = false, disabled, children, ...props },
  ref,
) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size, block }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {children}
        </>
      ) : (
        children
      )}
    </Comp>
  );
});
