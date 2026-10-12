"use client";

import { useState } from "react";
import { Check, Eye } from "lucide-react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { cn } from "@/lib/utils";
import { websiteTemplates, type WebsiteTemplateId } from "@/lib/theme/templates";
import { isTemplateAllowedOnPlan, templateUpgradeRequiredMessage, FREE_TEMPLATE_IDS } from "@/lib/plans";
import { TemplateFrame } from "@/components/storefront/template-frames";
import { TemplatePreviewModal } from "@/components/storefront/TemplatePreviewModal";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";

export function WebsiteTemplatePicker() {
  const { state, setStateMerge, addToast } = useSwiftLink();
  const [previewId, setPreviewId] = useState<string | null>(null);

  const selected = state.websiteTemplateId;
  const appearance: "light" | "dark" = state.storefrontTheme?.background === "light" ? "light" : "dark";

  const applyTemplate = (id: WebsiteTemplateId) => {
    const template = websiteTemplates.find((item) => item.id === id);
    if (!template) return;
    if (!isTemplateAllowedOnPlan(id, state.plan)) {
      addToast(templateUpgradeRequiredMessage(template.name), "error");
      return;
    }
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
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate text-sm font-semibold text-[#E8F1EC]">{template.name}</span>
                      {!(FREE_TEMPLATE_IDS as readonly string[]).includes(template.id) ? (
                        <span className="rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-400">
                          PRO
                        </span>
                      ) : (
                        <span className="rounded bg-[#19C37D]/10 border border-[#19C37D]/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#19C37D]">
                          FREE
                        </span>
                      )}
                    </div>
                    {isSelected ? (
                      <Badge tone="accent">
                        <Icon icon={Check} size="xs" /> Selected
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-[#9DB3A8]">{template.description}</p>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-[#1E2D27]">
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
