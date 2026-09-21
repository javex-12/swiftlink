"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Input, Field } from "./field";

/**
 * Dialog, plus the two dialog *tasks* the console actually performs.
 *
 * Replaces `window.customPrompt` / `window.customConfirm`, which the old shell
 * monkey-patched onto `window` as untyped globals (docs/00-AUDIT.md F-22). Those
 * were unreachable by keyboard, unthemed, and impossible to test.
 *
 * `ConfirmDialog` and `PromptDialog` exist because a generic dialog is the wrong
 * abstraction for "are you sure?" — the behaviour that matters (focus lands on
 * the safe action, Escape cancels, Enter confirms, the label says exactly what
 * will happen) should be written once.
 */

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { hideClose?: boolean }
>(function DialogContent({ className, children, hideClose, ...props }, ref) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          "fixed inset-0 z-overlay bg-app-overlay",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0",
        )}
      />
      <DialogPrimitive.Content
        ref={ref}
        /* The canvas behind a modal must not be reachable by assistive tech. */
        aria-modal="true"
        className={cn(
          // Full-bleed with a 1rem gutter on phones, centred at `sm` and up. Written
          // with the spacing scale rather than `w-[calc(100vw-2rem)]` so there is no
          // arbitrary value in the kit.
          "fixed inset-x-4 top-1/2 z-modal mx-auto max-w-lg -translate-y-1/2",
          "sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2",
          "max-h-screen overflow-y-auto",
          "rounded-xl border border-app-border bg-app-surface p-5 shadow-lg",
          "focus:outline-none",
          className,
        )}
        {...props}
      >
        {children}
        {hideClose ? null : (
          <DialogPrimitive.Close
            className={cn(
              "absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-md",
              "text-app-text-subtle transition-colors duration-fast hover:bg-app-surface-2 hover:text-app-text",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring",
            )}
          >
            <X className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

export const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-1.5 pr-8", className)} {...props} />
);

export const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
    {...props}
  />
);

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn("text-lg font-semibold tracking-tight text-app-text", className)}
      {...props}
    />
  );
});

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn("text-sm text-app-text-muted", className)}
      {...props}
    />
  );
});

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Say what happens, not "OK" — e.g. "Delete product", "Remove store". */
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  loading?: boolean;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "default",
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent role="alertdialog" hideClose>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type PromptDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  required?: boolean;
  loading?: boolean;
  onConfirm: (value: string) => void;
};

export function PromptDialog({
  open,
  onOpenChange,
  title,
  description,
  label,
  placeholder,
  defaultValue = "",
  confirmLabel = "Save",
  required = true,
  loading = false,
  onConfirm,
}: PromptDialogProps) {
  const [value, setValue] = React.useState(defaultValue);

  // Reset when reopened, so a cancelled prompt never leaks the previous answer.
  React.useEffect(() => {
    if (open) setValue(defaultValue);
  }, [open, defaultValue]);

  const invalid = required && value.trim().length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (invalid) return;
            onConfirm(value.trim());
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>

          <div className="mt-4">
            <Field label={label} required={required}>
              {/* eslint-disable-next-line jsx-a11y/no-autofocus -- a prompt exists to be typed into */}
              <Input
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={placeholder}
                autoFocus
              />
            </Field>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading} disabled={invalid}>
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
