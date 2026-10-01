"use client";

import Link from "next/link";
import { ArrowRight, Check, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildSetupGuide, type SetupStep } from "@/lib/setup-guide";
import type { ShopState } from "@/lib/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

/**
 * The guided setup checklist — the "what's next" surface for a merchant.
 *
 * The old dashboard dropped a new merchant on two decorative cards with no sense
 * of progress or next action. This replaces that dead end: it shows how far along
 * the store is, which step is next, and a single primary action toward it. Once
 * everything is done it becomes the "share your store" prompt.
 *
 * All copy is plain-language and all color comes from `--app-*` tokens, per
 * `docs/03-DECISIONS.md` D5.
 */
export function SetupGuide({
  state,
  onShare,
  className,
}: {
  state: ShopState;
  onShare?: () => void;
  className?: string;
}) {
  const guide = buildSetupGuide(state);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight text-app-text">
                {guide.isComplete ? "You're ready to sell" : "Get your store ready"}
              </h2>
              <Badge tone={guide.isComplete ? "success" : "accent"}>
                {guide.completed} of {guide.total}
              </Badge>
            </div>
            <p className="max-w-md text-sm text-app-text-muted">
              {guide.isComplete
                ? "Every step is done. Share your store link and start taking orders."
                : "A few quick steps and your storefront is ready for customers."}
            </p>
          </div>

          {guide.isComplete ? (
            onShare ? (
              <Button onClick={onShare}>
                <Icon icon={Share2} size="sm" /> Share store
              </Button>
            ) : null
          ) : guide.nextStep ? (
            <Button asChild>
              <Link href={guide.nextStep.href}>
                {guide.nextStep.cta}
                <Icon icon={ArrowRight} size="sm" />
              </Link>
            </Button>
          ) : null}
        </div>

        <div
          className="h-2 w-full overflow-hidden rounded-full bg-app-surface-2"
          role="progressbar"
          aria-valuenow={guide.completed}
          aria-valuemin={0}
          aria-valuemax={guide.total}
          aria-label="Store setup progress"
        >
          <div
            className="h-full rounded-full bg-app-accent transition-all duration-slow ease-out"
            style={{ width: `${guide.percent}%` }}
          />
        </div>
      </div>

      <ul className="divide-y divide-app-border border-t border-app-border">
        {guide.steps.map((step) => (
          <li key={step.id}>
            <SetupStepRow step={step} isNext={guide.nextStep?.id === step.id} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function SetupStepRow({ step, isNext }: { step: SetupStep; isNext: boolean }) {
  return (
    <Link
      href={step.href}
      aria-current={isNext ? "step" : undefined}
      className={cn(
        "flex items-center gap-4 px-5 py-4 transition-colors sm:px-6",
        "hover:bg-app-surface-2",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-app-ring",
        isNext && "bg-app-accent-subtle",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
          step.done
            ? "border-transparent bg-app-success text-app-accent-fg"
            : isNext
              ? "border-app-accent text-app-accent"
              : "border-app-border-strong text-transparent",
        )}
      >
        {step.done ? <Icon icon={Check} size="xs" strokeWidth={3} /> : null}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block text-sm font-medium",
            step.done ? "text-app-text-muted" : "text-app-text",
          )}
        >
          {step.title}
        </span>
        <span className="block text-sm text-app-text-muted">{step.description}</span>
      </span>

      {!step.done ? (
        <span
          className={cn(
            "hidden shrink-0 items-center gap-1 text-sm font-medium sm:flex",
            isNext ? "text-app-accent-text" : "text-app-text-muted",
          )}
        >
          {step.cta}
          <Icon icon={ArrowRight} size="xs" />
        </span>
      ) : null}
    </Link>
  );
}
