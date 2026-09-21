"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Form primitives.
 *
 * `docs/01-DESIGN-SYSTEM.md` §11: every input is labelled, and error text is tied
 * to the control through `aria-describedby` rather than floated next to it as
 * decorative red text. `Field` does that wiring once so no screen has to
 * remember — the old console hand-rolled `useState` per field with no
 * accessibility wiring at all.
 */

export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(function Label({ className, ...props }, ref) {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn("text-sm font-medium text-app-text", className)}
      {...props}
    />
  );
});

const controlBase =
  "w-full rounded-lg border border-app-border-strong bg-app-surface text-sm text-app-text " +
  "placeholder:text-app-text-subtle transition-colors duration-fast " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring focus-visible:ring-offset-2 focus-visible:ring-offset-app-surface " +
  "disabled:cursor-not-allowed disabled:opacity-50 " +
  "aria-[invalid=true]:border-app-danger";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(controlBase, "h-11 px-3", className)} {...props} />;
});

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, rows = 4, ...props },
  ref,
) {
  return (
    <textarea ref={ref} rows={rows} className={cn(controlBase, "min-h-24 p-3", className)} {...props} />
  );
});

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

/**
 * Native `<select>`, deliberately.
 *
 * Radix's Select is excellent on desktop but replaces the platform picker, and
 * `docs/03-DECISIONS.md` D5 puts most merchants on a phone. The OS picker is
 * faster, larger and familiar, so we keep it and only style the closed control.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(controlBase, "h-11 appearance-none pl-3 pr-9", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-text-subtle"
      />
    </div>
  );
});

export type FieldProps = {
  label: React.ReactNode;
  /** Exactly one child; `Field` injects `id`, `aria-describedby` and `aria-invalid`. */
  children: React.ReactElement<Record<string, unknown>>;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  className?: string;
};

export function Field({ label, children, hint, error, required, className }: FieldProps) {
  const reactId = React.useId();
  const controlId = (children.props.id as string | undefined) ?? `field-${reactId}`;
  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;

  const describedBy =
    (children.props["aria-describedby"] as string | undefined) ??
    ([error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined);

  const control = React.cloneElement(children, {
    id: controlId,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : (children.props["aria-invalid"] as boolean | undefined),
  });

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={controlId} className="text-app-text-muted">
        {label}
        {required ? (
          <span className="ml-0.5 text-app-danger" aria-hidden="true">
            *
          </span>
        ) : null}
      </Label>
      {control}
      {hint && !error ? (
        <p id={hintId} className="text-xs text-app-text-subtle">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs font-medium text-app-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
