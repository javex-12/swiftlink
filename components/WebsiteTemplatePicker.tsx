"use client";

import { useState } from "react";
import { Check, Moon, Sun, Eye } from "lucide-react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { cn } from "@/lib/utils";
import { websiteTemplates, type WebsiteTemplateId } from "@/lib/theme/templates";
import { TemplateFrame } from "@/components/storefront/template-frames";
import { TemplatePreviewModal } from "@/components/storefront/TemplatePreviewModal";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";

export function WebsiteTemplatePicker() {
  const { state, setStateMerge, addToast } = useSwiftLink();
  const [previewId, setPreviewId] = useState<string | null>(null);

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
    <>
      <Card className="p-5 sm:p-6 bg-[#111C18] border-[#1E2D27] text-[#E8F1EC]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight text-[#E8F1EC]">Storefront Templates</h2>
            <p className="max-w-md text-sm text-[#9DB3A8]">
              Choose a design for your public catalog. Preview anytime with sample products.
            </p>
          </div>

          {/* Light / dark version toggle */}
          <div
            role="group"
            aria-label="Storefront appearance"
            className="inline-flex rounded-lg border border-[#24382F] bg-[#0A1210] p-1"
          >
            {(["light", "dark"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => applyAppearance(mode)}
                aria-pressed={appearance === mode}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                  appearance === mode
                    ? "bg-[#14231D] text-[#19C37D] shadow-xs"
                    : "text-[#9DB3A8] hover:text-[#E8F1EC]"
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
              <div
                key={template.id}
                className={cn(
                  "flex flex-col justify-between rounded-xl border p-4 transition-colors",
                  isSelected
                    ? "border-[#19C37D] bg-[#14231D]"
                    : "border-[#1E2D27] bg-[#0A1210] hover:border-[#5C7C6D]"
                )}
              >
                <div
                  onClick={() => applyTemplate(template.id)}
                  className="cursor-pointer space-y-3"
                >
                  <div className="overflow-hidden rounded-lg border border-[#1E2D27]" aria-hidden="true">
                    <TemplateFrame
                      id={template.id}
                      appearance={appearance}
                      currency={state.currency || "₦"}
                      size="card"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#E8F1EC]">{template.name}</span>
                    {isSelected ? (
                      <Badge tone="accent">
                        <Icon icon={Check} size="xs" /> Selected
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-[#9DB3A8]">{template.description}</p>
                </div>

                <div className="mt-4 flex items-center gap-2 pt-2 border-t border-[#1E2D27]">
                  <button
                    type="button"
                    onClick={() => applyTemplate(template.id)}
                    className={cn(
                      "flex-1 flex min-h-[38px] items-center justify-center rounded-[8px] text-xs font-semibold transition",
                      isSelected
                        ? "bg-[#19C37D] text-[#04140D]"
                        : "bg-[#14231D] text-[#E8F1EC] hover:bg-[#19C37D] hover:text-[#04140D]"
                    )}
                  >
                    {isSelected ? "Active" : "Use template"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewId(template.id)}
                    className="flex min-h-[38px] items-center justify-center gap-1 rounded-[8px] border border-[#24382F] bg-[#111C18] px-3 text-xs font-medium text-[#9DB3A8] hover:text-[#E8F1EC]"
                  >
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Full-screen preview modal with sample data */}
      {previewId && (
        <TemplatePreviewModal
          templateId={previewId}
          vendorState={state}
          isOpen={!!previewId}
          onClose={() => setPreviewId(null)}
          onSelectTemplate={(id) => applyTemplate(id as WebsiteTemplateId)}
        />
      )}
    </>
  );
}
