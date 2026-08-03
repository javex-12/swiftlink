"use client";

import { useState, useEffect } from "react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { CountrySelector } from "./CountrySelector";
import { Store, User, Smartphone, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function OnboardingModal() {
  const { user, state, updateState, saveFullState, addToast } = useSwiftLink();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [form, setForm] = useState({
    ownerName: state.ownerName || "",
    bizName: state.bizName || "",
    phone: state.phone || "",
    countryCode: "+234"
  });

  // Check if onboarding is needed on mount & state change
  useEffect(() => {
    if (!user) return;
    const isDefaultBizName = !state.bizName || state.bizName.toLowerCase().includes("store") || state.bizName.toLowerCase().includes("my store");
    const isMissingDetails = !state.ownerName || !state.phone || isDefaultBizName;
    if (isMissingDetails) {
      setOpen(true);
    } else {
      setOpen(false);
    }
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
    if (step < 3) setStep((prev) => (prev + 1) as any);
  };

  const handleComplete = () => {
    const rawPhone = form.phone.trim();
    const cleanDigits = rawPhone.replace(/\D/g, "");
    const formattedPhone = cleanDigits.startsWith(form.countryCode.replace("+", ""))
      ? cleanDigits
      : `${form.countryCode.replace("+", "")}${cleanDigits.replace(/^0+/, "")}`;

    const cleanHandle = form.bizName.toLowerCase().replace(/[^a-z0-9]/g, "");

    const nextState = {
      ...state,
      ownerName: form.ownerName.trim(),
      bizName: form.bizName.trim(),
      phone: formattedPhone || form.phone,
      storeUsername: cleanHandle || state.storeUsername
    };

    saveFullState(nextState);
    setOpen(false);
    addToast("Store setup complete! Welcome to SwiftLink 🎉", "success");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg bg-white dark:bg-[#07130e] border border-slate-200 dark:border-emerald-500/20 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
                <Store size={20} />
              </div>
              <div>
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-emerald-600 dark:text-[#00c885] font-black">Quick Setup • Step {step} of 3</span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Setup Your Business</h2>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 dark:bg-[#00c885] transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>

          {/* Step 1: Owner Name */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400">What is your full name?</label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">This is your personal identity as store owner.</p>
              </div>
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-[#0e251b] border border-slate-200 dark:border-emerald-500/20">
                <User size={18} className="text-emerald-500 shrink-0" />
                <input
                  type="text"
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  placeholder="e.g. Alex Morgan"
                  className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Step 2: Store Name */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400">What is your store name?</label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">This will be your brand name and custom storefront link.</p>
              </div>
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-[#0e251b] border border-slate-200 dark:border-emerald-500/20">
                <Store size={18} className="text-emerald-500 shrink-0" />
                <input
                  type="text"
                  value={form.bizName}
                  onChange={(e) => setForm({ ...form, bizName: e.target.value })}
                  placeholder="e.g. Elite Luxe"
                  className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
                  autoFocus
                />
              </div>
              {form.bizName && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl text-[10px] font-mono text-emerald-600 dark:text-[#00c885] border border-emerald-200 dark:border-emerald-500/20">
                  Store Link: <span className="font-bold">swiftlink.so/{form.bizName.toLowerCase().replace(/[^a-z0-9]/g, "")}</span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: WhatsApp Number */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400">WhatsApp Orders Number</label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Customers will send orders directly to this WhatsApp number.</p>
              </div>
              <div className="flex gap-2">
                <CountrySelector value={form.countryCode} onChange={(code) => setForm({ ...form, countryCode: code })} />
                <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-[#0e251b] border border-slate-200 dark:border-emerald-500/20">
                  <Smartphone size={18} className="text-emerald-500 shrink-0" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="808 000 0000"
                    className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
                    autoFocus
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((prev) => (prev - 1) as any)}
                className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Back
              </button>
            ) : <div />}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 dark:bg-[#00c885] text-white dark:text-[#07110d] rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 dark:hover:bg-[#00b377] transition-all shadow-lg active:scale-95"
              >
                Next <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                className="flex items-center gap-2 px-8 py-3.5 bg-emerald-500 dark:bg-[#00c885] text-white dark:text-[#07110d] rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 dark:hover:bg-[#00b377] transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
              >
                Complete Setup <CheckCircle2 size={16} />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
