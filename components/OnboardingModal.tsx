"use client";

import { useState, useEffect } from "react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { CountrySelector } from "./CountrySelector";
import { Store, Smartphone, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { hasRealStoreName, hasWhatsAppNumber } from "@/lib/setup-guide";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Field, Input, Label } from "@/components/ui/field";

/**
 * First-run setup wizard.
 *
 * Three plain-language questions (name, store name, WhatsApp number) shown once,
 * right after sign-up. Migrated onto the token layer + UI kit so the first screen
 * of the product matches the rest of the console (docs/03-DECISIONS.md D5).
 *
 * The activation check is the real fix: the old code decided a merchant "needed
 * onboarding" with `bizName.includes("store")`, so a business legitimately named
 * "Storehouse Foods" could never finish setup (docs/00-AUDIT.md F-21). It now uses
 * the shared `hasRealStoreName` / `hasWhatsAppNumber` predicates.
 */
export function OnboardingModal() {
  const { user, state, saveFullState, addToast } = useSwiftLink();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [form, setForm] = useState({
    ownerName: state.ownerName || "",
    bizName: state.bizName || "",
    phone: state.phone || "",
    countryCode: "+234",
  });

  useEffect(() => {
    if (!user) return;
    const missingDetails =
      !state.ownerName || !hasRealStoreName(state.bizName) || !hasWhatsAppNumber(state.phone);
    setOpen(missingDetails);
  }, [user, state.ownerName, state.phone, state.bizName]);

  if (!open || !user) return null;

  const handleNext = () => {
    if (step === 1 && !form.ownerName.trim()) {
      addToast("Please enter your name.", "error");
      return;
    }
    if (step === 2 && !form.bizName.trim()) {
      addToast("Please enter your store name.", "error");
      return;
    }
    if (step < 3) setStep((prev) => (prev + 1) as 1 | 2 | 3);
  };

  const handleComplete = () => {
    const rawPhone = form.phone.trim();
    const cleanDigits = rawPhone.replace(/\D/g, "");
    const formattedPhone = cleanDigits.startsWith(form.countryCode.replace("+", ""))
      ? cleanDigits
      : `${form.countryCode.replace("+", "")}${cleanDigits.replace(/^0+/, "")}`;

    const cleanHandle = form.bizName.toLowerCase().replace(/[^a-z0-9]/g, "");

    saveFullState({
      ...state,
      ownerName: form.ownerName.trim(),
      bizName: form.bizName.trim(),
      phone: formattedPhone || form.phone,
      storeUsername: cleanHandle || state.storeUsername,
    });

    setOpen(false);
    addToast("Store setup complete! Welcome to SwiftLink 🎉", "success");
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-modal flex items-center justify-center bg-app-overlay p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg space-y-6 rounded-2xl border border-app-border bg-app-surface p-6 shadow-lg sm:p-8"
        >
          {/* Header */}
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-app-accent-subtle text-app-accent-text">
              <Icon icon={Store} size="md" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-app-text-muted">
                Quick setup · Step {step} of 3
              </p>
              <h2 id="onboarding-title" className="text-lg font-semibold tracking-tight text-app-text">
                Set up your business
              </h2>
            </div>
          </div>

          {/* Progress */}
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-app-surface-2"
            role="progressbar"
            aria-valuenow={step}
            aria-valuemin={1}
            aria-valuemax={3}
            aria-label="Setup progress"
          >
            <div
              className="h-full rounded-full bg-app-accent transition-all duration-slow ease-out"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>

          {/* Step 1 — owner name */}
          {step === 1 ? (
            <Field
              label="What is your full name?"
              hint="This is your personal identity as the store owner."
              required
            >
              <Input
                type="text"
                value={form.ownerName}
                onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                placeholder="e.g. Alex Morgan"
                autoFocus
              />
            </Field>
          ) : null}

          {/* Step 2 — store name */}
          {step === 2 ? (
            <div className="space-y-3">
              <Field
                label="What is your store name?"
                hint="This becomes your brand name and storefront link."
                required
              >
                <Input
                  type="text"
                  value={form.bizName}
                  onChange={(e) => setForm({ ...form, bizName: e.target.value })}
                  placeholder="e.g. Elite Luxe"
                  autoFocus
                />
              </Field>
              {form.bizName ? (
                <p className="rounded-lg bg-app-surface-2 px-3 py-2 text-xs text-app-text-muted">
                  Store link:{" "}
                  <span className="font-medium text-app-text">
                    swiftlink.so/{form.bizName.toLowerCase().replace(/[^a-z0-9]/g, "")}
                  </span>
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Step 3 — WhatsApp number */}
          {step === 3 ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="onboarding-phone" className="text-app-text-muted">
                WhatsApp orders number
                <span className="ml-0.5 text-app-danger" aria-hidden="true">
                  *
                </span>
              </Label>
              <div className="flex gap-2">
                <CountrySelector
                  value={form.countryCode}
                  onChange={(code) => setForm({ ...form, countryCode: code })}
                />
                <div className="relative flex-1">
                  <Smartphone
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-text-subtle"
                  />
                  <Input
                    id="onboarding-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="808 000 0000"
                    className="pl-9"
                    aria-describedby="onboarding-phone-hint"
                    autoFocus
                  />
                </div>
              </div>
              <p id="onboarding-phone-hint" className="text-xs text-app-text-subtle">
                Customers will send orders directly to this WhatsApp number.
              </p>
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 border-t border-app-border pt-5">
            {step > 1 ? (
              <Button variant="ghost" onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3)}>
                Back
              </Button>
            ) : (
              <span />
            )}

            {step < 3 ? (
              <Button onClick={handleNext}>
                Next <Icon icon={ArrowRight} size="sm" />
              </Button>
            ) : (
              <Button onClick={handleComplete}>
                Complete setup <Icon icon={CheckCircle2} size="sm" />
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
