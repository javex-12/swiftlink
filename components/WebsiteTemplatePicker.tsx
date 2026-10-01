"use client";

import { Check, Moon, Sun } from "lucide-react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { cn } from "@/lib/utils";
import { websiteTemplates, type WebsiteTemplateId } from "@/lib/theme/templates";
import { TemplateFrame } from "@/components/storefront/template-frames";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";

/**
 * Choose your website.
 *
 * Three complete templates, each with a light and a dark version
 * (`docs/03-DECISIONS.md` D11). Selecting one writes the template id plus its page
 * composition onto the store, and the storefront renders it through the `--t-*`
 * token engine — so the light/dark choice is a real, contrast-checked theme swap,
 * not a hand-painted second palette.
 */
export function WebsiteTemplatePicker() {
  const { state, setStateMerge, addToast } = useSwiftLink();

  const selected = state.websiteTemplateId;
  const appearance: "light" | "dark" = state.storefrontTheme?.background === "dark" ? "dark" : "light";

  const applyAppearance = (next: "light" | "dark") => {
    setStateMerge({
      storefrontTheme: { ...(state.storefrontTheme ?? {}), background: next },
    });
  };

  const applyTemplate = (id: WebsiteTemplateId) => {
    const template = websiteTemplates.find((item) => item.id === id);
    if (!template) return;
    setStateMerge({
      websiteTemplateId: id,
      heroTemplateId: template.composition.heroTemplateId,
      catalogTemplateId: template.composition.catalogTemplateId,
      aboutTemplateId: template.composition.aboutTemplateId,
      footerTemplateId: template.composition.footerTemplateId,
      storefrontTheme: { ...(state.storefrontTheme ?? {}), background: appearance },
    });
    addToast(`${template.name} applied to your store.`, "success");
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-app-text">Choose your website</h2>
          <p className="max-w-md text-sm text-app-text-muted">
            Three complete designs, each with a light and dark version. You can change this anytime.
          </p>
        </div>

        {/* Light / dark version toggle */}
        <div
          role="group"
          aria-label="Storefront appearance"
          className="inline-flex rounded-lg border border-app-border bg-app-surface-2 p-1"
        >
          {(["light", "dark"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => applyAppearance(mode)}
              aria-pressed={appearance === mode}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring",
                appearance === mode
                  ? "bg-app-surface text-app-text shadow-xs"
                  : "text-app-text-muted hover:text-app-text",
              )}
            >
              <Icon icon={mode === "light" ? Sun : Moon} size="xs" />
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {websiteTemplates.map((template) => {
          const isSelected = selected === template.id;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => applyTemplate(template.id)}
              aria-pressed={isSelected}
              className={cn(
                "flex flex-col gap-3 rounded-xl border p-4 text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring",
                isSelected
                  ? "border-app-accent bg-app-accent-subtle"
                  : "border-app-border bg-app-surface hover:border-app-border-strong",
              )}
            >
              <div className="overflow-hidden rounded-lg border border-app-border" aria-hidden="true">
                <TemplateFrame
                  id={template.id}
                  appearance={appearance}
                  currency={state.currency || "₦"}
                  size="card"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-app-text">{template.name}</span>
                {isSelected ? (
                  <Badge tone="accent">
                    <Icon icon={Check} size="xs" /> Selected
                  </Badge>
                ) : null}
              </div>
              <span className="text-xs text-app-text-muted">{template.description}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
