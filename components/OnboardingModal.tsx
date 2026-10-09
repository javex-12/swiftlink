"use client";

import { useState, useEffect } from "react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { validateStoreHandle, generateHandleSuggestions } from "@/lib/handle";
import { normalizePhoneNumber, SUPPORTED_COUNTRIES } from "@/lib/phone";
import { websiteTemplates, type WebsiteTemplateId } from "@/lib/theme/templates";
import { TemplateFrame } from "@/components/storefront/template-frames";
import { TemplatePreviewModal } from "@/components/storefront/TemplatePreviewModal";
import { Logo } from "@/components/Logo";
import {
  Store,
  MessageSquare,
  Palette,
  Share2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Eye,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { prefillMerchantInput, readRememberedInput, rememberMerchantInput } from "@/lib/remembered-input";

export function OnboardingModal() {
  const { user, state, setStateMerge, saveFullState, addToast } = useSwiftLink();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<number>(1);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);

  // Form state
  const [bizName, setBizName] = useState(state.bizName || "");
  const [storeUsername, setStoreUsername] = useState(state.storeUsername || "");
  const [handleError, setHandleError] = useState<string>("");
  const [handleSuggestions, setHandleSuggestions] = useState<string[]>([]);

  const [countryCode, setCountryCode] = useState<string>("NG");
  const [phone, setPhone] = useState(state.phone || "");
  const [phoneError, setPhoneError] = useState<string>("");

  const [selectedTemplate, setSelectedTemplate] = useState<WebsiteTemplateId>(
    state.websiteTemplateId || "editorial"
  );

  const [instagram, setInstagram] = useState(state.socials?.instagram || "");
  const [tiktok, setTiktok] = useState(state.socials?.tiktok || "");
  const [twitter, setTwitter] = useState(state.socials?.twitter || "");

  // Remember my info: prefill anything the merchant already typed on this
  // device. Only fills blanks — a value already on the store always wins.
  useEffect(() => {
    const prefill = prefillMerchantInput(readRememberedInput(), state);
    if (prefill.state.bizName) setBizName((v) => v || prefill.state.bizName!);
    if (prefill.state.storeUsername) setStoreUsername((v) => v || prefill.state.storeUsername!);
    if (prefill.state.phone) setPhone((v) => v || prefill.state.phone!);
    if (prefill.countryCode) setCountryCode((v) => v || prefill.countryCode!);
    // Mount only: this is a one-time convenience fill.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync state if already partially filled
  useEffect(() => {
    if (!user) return;
    const isComplete = (state as any).onboarding_step >= 5 || (state.isLive && state.bizName && state.phone);
    if (!isComplete && (!state.bizName || !state.phone || (state as any).onboarding_step < 5)) {
      setOpen(true);
      const currentStep = (state as any).onboarding_step || 1;
      setStep(currentStep <= 4 ? currentStep : 1);
    } else {
      setOpen(false);
    }
  }, [user, state]);

  // Handle change validation
  const handleStoreNameChange = (val: string) => {
    setBizName(val);
    if (!storeUsername || storeUsername === (state.storeUsername || "")) {
      const generated = val.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 30);
      const res = validateStoreHandle(generated);
      if (res.isValid) {
        setStoreUsername(res.normalized);
        setHandleError("");
      }
    }
  };

  const handleHandleChange = (val: string) => {
    setStoreUsername(val);
    const res = validateStoreHandle(val);
    if (!res.isValid) {
      setHandleError(res.error || "");
      if (val.trim().length >= 3) {
        setHandleSuggestions(generateHandleSuggestions(val));
      } else {
        setHandleSuggestions([]);
      }
    } else {
      setHandleError("");
      setHandleSuggestions([]);
    }
  };

  // Step 1 -> 2
  const submitStep1 = () => {
    if (!bizName.trim()) {
      addToast("Please enter your store name.", "error");
      return;
    }
    const res = validateStoreHandle(storeUsername);
    if (!res.isValid) {
      setHandleError(res.error || "Please choose a valid store handle.");
      return;
    }

    rememberMerchantInput({ bizName: bizName.trim(), storeUsername: res.normalized });
    setStateMerge({
      bizName: bizName.trim(),
      storeUsername: res.normalized,
      onboarding_step: 2 as any,
    });
    setStep(2);
  };

  // Step 2 -> 3
  const submitStep2 = () => {
    const res = normalizePhoneNumber(phone, countryCode as any);
    if (!res.isValid) {
      setPhoneError(res.error || "Please enter a valid WhatsApp number.");
      return;
    }

    const matchedCountry = SUPPORTED_COUNTRIES.find((c) => c.code === countryCode);
    const currency = matchedCountry?.defaultCurrency || "NGN";

    rememberMerchantInput({ phone: res.normalized, countryCode, currency });
    setStateMerge({
      phone: res.normalized,
      currency,
      onboarding_step: 3 as any,
    });
    setStep(3);
  };

  // Test WhatsApp Chat
  const handleTestWhatsApp = () => {
    const res = normalizePhoneNumber(phone, countryCode as any);
    if (!res.isValid) {
      setPhoneError(res.error || "Enter a valid phone number first.");
      return;
    }
    const cleanNumber = res.normalized.replace(/\+/g, "");
    const testUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
      `Hello ${bizName || "SwiftLink Store"}, testing WhatsApp setup on SwiftLink Pro.`
    )}`;
    window.open(testUrl, "_blank", "noopener,noreferrer");
  };

  // Step 3 -> 4
  const submitStep3 = () => {
    setStateMerge({
      websiteTemplateId: selectedTemplate,
      onboarding_step: 4 as any,
    });
    setStep(4);
  };

  // Step 4 -> 5 (Finish)
  const submitStep4 = (skip: boolean = false) => {
    const socialsData = skip
      ? state.socials || {}
      : {
          ...state.socials,
          instagram: instagram.trim().replace(/^@/, ""),
          tiktok: tiktok.trim().replace(/^@/, ""),
          twitter: twitter.trim().replace(/^@/, ""),
        };

    setStateMerge({
      socials: socialsData,
      isLive: true,
      onboarding_step: 5,
    });
    setStep(5);
  };

  const handleFinish = () => {
    setOpen(false);
    addToast("Your store is live! Welcome to SwiftLink Pro.", "success");
  };

  if (!open || !user) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
        <div className="flex w-full max-w-xl flex-col rounded-[18px] border border-[#1E2D27] bg-[#111C18] p-6 text-[#E8F1EC] shadow-2xl">
          <div className="mb-4 flex items-center justify-between border-b border-[#1E2D27] pb-3">
            <Logo size="sm" showWordmark={true} />
            <span className="text-[11px] font-medium text-[#9DB3A8]">Quick Store Setup</span>
          </div>

          {/* Progress Indicators */}
          {step <= 4 && (
            <div className="mb-6 flex items-center justify-between border-b border-[#1E2D27] pb-4">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                      step === s
                        ? "bg-[#19C37D] text-[#04140D]"
                        : step > s
                        ? "bg-[#14231D] text-[#19C37D] border border-[#24382F]"
                        : "bg-[#0A1210] text-[#9DB3A8] border border-[#1E2D27]"
                    }`}
                  >
                    {step > s ? <Check className="h-3.5 w-3.5" /> : s}
                  </div>
                ))}
              </div>
              <span className="text-xs font-medium text-[#9DB3A8]">
                Step {step} of 4
              </span>
            </div>
          )}

          {/* STEP 1: Your Store */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-[#E8F1EC]">Name your store</h2>
                <p className="mt-1 text-xs text-[#9DB3A8]">
                  Choose your store name and your unique SwiftLink link for buyers.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#E8F1EC]">Store Name</label>
                  <input
                    type="text"
                    value={bizName}
                    onChange={(e) => handleStoreNameChange(e.target.value)}
                    placeholder="e.g. Aura Essentials"
                    className="mt-1.5 w-full rounded-[12px] border border-[#5C7C6D] bg-[#0A1210] px-3.5 py-2.5 text-sm text-[#E8F1EC] outline-none transition focus:border-[#19C37D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#E8F1EC]">Store Link</label>
                  <div className="mt-1.5 flex items-center rounded-[12px] border border-[#5C7C6D] bg-[#0A1210] px-3 py-2 text-sm focus-within:border-[#19C37D]">
                    <span className="select-none text-xs text-[#9DB3A8]">swiftlink.pro/</span>
                    <input
                      type="text"
                      value={storeUsername}
                      onChange={(e) => handleHandleChange(e.target.value)}
                      placeholder="aura-essentials"
                      className="ml-1 w-full bg-transparent text-sm text-[#E8F1EC] outline-none"
                    />
                  </div>
                  {handleError && <p className="mt-1 text-xs text-[#FF8A8A]">{handleError}</p>}
                </div>

                {handleSuggestions.length > 0 && (
                  <div className="rounded-[12px] border border-[#24382F] bg-[#0A1210] p-3">
                    <p className="text-[11px] text-[#9DB3A8]">Suggestions:</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {handleSuggestions.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => {
                            setStoreUsername(sug);
                            setHandleError("");
                            setHandleSuggestions([]);
                          }}
                          className="rounded-[8px] bg-[#14231D] px-2.5 py-1 text-xs font-medium text-[#19C37D] hover:bg-[#19C37D]/20"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={submitStep1}
                  className="flex min-h-[44px] items-center gap-2 rounded-[12px] bg-[#19C37D] px-6 py-2.5 text-sm font-semibold text-[#04140D] transition hover:bg-[#16B070]"
                >
                  Continue to WhatsApp
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: WhatsApp Number */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-[#E8F1EC]">Connect your WhatsApp</h2>
                <p className="mt-1 text-xs text-[#9DB3A8]">
                  Orders from your catalog will be sent directly to this WhatsApp number.
                </p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-[#E8F1EC]">Country</label>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="mt-1.5 w-full rounded-[12px] border border-[#5C7C6D] bg-[#0A1210] px-2.5 py-2.5 text-sm text-[#E8F1EC] outline-none transition focus:border-[#19C37D]"
                    >
                      {SUPPORTED_COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} · {c.name} ({c.callingCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-[#E8F1EC]">WhatsApp Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setPhoneError("");
                      }}
                      placeholder="e.g. 0808 123 4567"
                      className="mt-1.5 w-full rounded-[12px] border border-[#5C7C6D] bg-[#0A1210] px-3.5 py-2.5 text-sm text-[#E8F1EC] outline-none transition focus:border-[#19C37D]"
                    />
                  </div>
                </div>
                {phoneError && <p className="text-xs text-[#FF8A8A]">{phoneError}</p>}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleTestWhatsApp}
                    className="flex min-h-[44px] items-center gap-2 rounded-[12px] border border-[#24382F] bg-[#14231D] px-4 py-2 text-xs font-medium text-[#19C37D] transition hover:bg-[#19C37D]/10"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Send a test WhatsApp message
                  </button>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex min-h-[44px] items-center gap-1.5 text-xs text-[#9DB3A8] hover:text-[#E8F1EC]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <button
                  type="button"
                  onClick={submitStep2}
                  className="flex min-h-[44px] items-center gap-2 rounded-[12px] bg-[#19C37D] px-6 py-2.5 text-sm font-semibold text-[#04140D] transition hover:bg-[#16B070]"
                >
                  Continue to Store Design
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Your Look (Templates) */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-[#E8F1EC]">Choose your look</h2>
                <p className="mt-1 text-xs text-[#9DB3A8]">
                  Select a storefront design. You can preview with sample data or change anytime.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {websiteTemplates.map((tmpl) => {
                  const isSelected = selectedTemplate === tmpl.id;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => setSelectedTemplate(tmpl.id)}
                      className={cn(
                        "flex cursor-pointer flex-col justify-between rounded-[14px] border p-3 transition",
                        isSelected
                          ? "border-[#19C37D] bg-[#14231D]"
                          : "border-[#1E2D27] bg-[#0A1210] hover:border-[#5C7C6D]"
                      )}
                    >
                      <div className="overflow-hidden rounded-[8px] border border-[#1E2D27]">
                        <TemplateFrame id={tmpl.id} appearance="dark" currency={state.currency || "₦"} size="card" />
                      </div>
                      <div className="mt-2.5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#E8F1EC]">{tmpl.name}</span>
                        {isSelected && <Check className="h-4 w-4 text-[#19C37D]" />}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewTemplateId(tmpl.id);
                        }}
                        className="mt-3 flex min-h-[36px] items-center justify-center gap-1 rounded-[8px] border border-[#24382F] bg-[#111C18] py-1 text-[11px] font-medium text-[#9DB3A8] hover:text-[#E8F1EC]"
                      >
                        <Eye className="h-3 w-3" /> Preview
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex min-h-[44px] items-center gap-1.5 text-xs text-[#9DB3A8] hover:text-[#E8F1EC]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <button
                  type="button"
                  onClick={submitStep3}
                  className="flex min-h-[44px] items-center gap-2 rounded-[12px] bg-[#19C37D] px-6 py-2.5 text-sm font-semibold text-[#04140D] transition hover:bg-[#16B070]"
                >
                  Continue to Socials
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Socials (Optional / Skippable) */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-[#E8F1EC]">Connect socials (optional)</h2>
                <p className="mt-1 text-xs text-[#9DB3A8]">
                  Link your social profiles so buyers can discover and follow your brand.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#E8F1EC]">Instagram Handle</label>
                  <div className="mt-1.5 flex items-center rounded-[12px] border border-[#5C7C6D] bg-[#0A1210] px-3 py-2 text-sm focus-within:border-[#19C37D]">
                    <span className="text-xs text-[#9DB3A8]">@</span>
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="yourbrand"
                      className="ml-1 w-full bg-transparent text-sm text-[#E8F1EC] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#E8F1EC]">TikTok Handle</label>
                  <div className="mt-1.5 flex items-center rounded-[12px] border border-[#5C7C6D] bg-[#0A1210] px-3 py-2 text-sm focus-within:border-[#19C37D]">
                    <span className="text-xs text-[#9DB3A8]">@</span>
                    <input
                      type="text"
                      value={tiktok}
                      onChange={(e) => setTiktok(e.target.value)}
                      placeholder="yourbrand"
                      className="ml-1 w-full bg-transparent text-sm text-[#E8F1EC] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#E8F1EC]">X / Twitter Handle</label>
                  <div className="mt-1.5 flex items-center rounded-[12px] border border-[#5C7C6D] bg-[#0A1210] px-3 py-2 text-sm focus-within:border-[#19C37D]">
                    <span className="text-xs text-[#9DB3A8]">@</span>
                    <input
                      type="text"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      placeholder="yourbrand"
                      className="ml-1 w-full bg-transparent text-sm text-[#E8F1EC] outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => submitStep4(true)}
                  className="flex min-h-[44px] items-center text-xs text-[#9DB3A8] hover:text-[#E8F1EC]"
                >
                  Skip for now
                </button>
                <button
                  type="button"
                  onClick={() => submitStep4(false)}
                  className="flex min-h-[44px] items-center gap-2 rounded-[12px] bg-[#19C37D] px-6 py-2.5 text-sm font-semibold text-[#04140D] transition hover:bg-[#16B070]"
                >
                  Publish Store
                  <CheckCircle2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: "Your Store is Live" */}
          {step === 5 && (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#14231D] text-[#19C37D] border border-[#24382F]">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div>
                <h2 className="text-2xl font-bold tracking-tight text-[#E8F1EC]">Your store is live!</h2>
                <p className="mt-1.5 text-xs text-[#9DB3A8]">
                  Share your link on Instagram bio, TikTok, or WhatsApp status to start receiving orders.
                </p>
              </div>

              <div className="rounded-[14px] border border-[#24382F] bg-[#0A1210] p-4 text-left">
                <p className="text-[11px] font-semibold text-[#9DB3A8]">YOUR PUBLIC STORE LINK</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-[#19C37D]">
                    https://swiftlink.pro/{storeUsername}
                  </span>
                  <a
                    href={`/${storeUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[36px] items-center gap-1 rounded-[8px] bg-[#14231D] px-3 py-1 text-xs font-semibold text-[#E8F1EC] hover:bg-[#19C37D] hover:text-[#04140D]"
                  >
                    Visit <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFinish}
                className="w-full flex min-h-[44px] items-center justify-center gap-2 rounded-[12px] bg-[#19C37D] py-3 text-sm font-semibold text-[#04140D] transition hover:bg-[#16B070]"
              >
                Go to Workspace
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Template Preview Full-Screen Modal */}
      {previewTemplateId && (
        <TemplatePreviewModal
          templateId={previewTemplateId}
          vendorState={state}
          isOpen={!!previewTemplateId}
          onClose={() => setPreviewTemplateId(null)}
          onSelectTemplate={(id) => {
            setSelectedTemplate(id as WebsiteTemplateId);
            setPreviewTemplateId(null);
          }}
        />
      )}
    </>
  );
}
