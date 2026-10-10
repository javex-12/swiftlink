"use client";

import Link from "next/link";
import { useMemo, useState, useRef } from "react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { supabase } from "@/lib/supabase-client";
import { ProLayout } from "@/components/ProLayout";import {
  User, Package, Globe, Smartphone, Store, Sparkles,
  CheckCircle2, AlertCircle, Camera, ArrowLeft, Pause, Play, Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PLANS,
  PLAN_DETAILS,
  effectiveProductLimitFor,
  effectiveStoreLimitFor,
  formatUsage,
  isUnlimited,
  normalizePlan,
} from "@/lib/plans";

export default function AccountPage() {
  const { user, isSupabaseActive, authSignOut, handleSignOut, state, updateState, addToast, setFeedbackOpen, stores } =
    useSwiftLink();

  /*
   * Plan panel data. Everything comes from `lib/plans` so this screen, the
   * console badge and the landing page cannot describe the same tier
   * differently — and usage is shown against the *enforced* limits, which is
   * what a merchant actually hits.
   */
  const plan = normalizePlan(state.plan) as keyof typeof PLAN_DETAILS;
  const planDetail = PLAN_DETAILS[plan];
  const productLimit = effectiveProductLimitFor(plan);
  const storeLimit = effectiveStoreLimitFor(plan);
  const visibleProducts = state.products.filter((p) => p.visible !== false).length;
  const usage = [
    {
      label: "Products",
      used: visibleProducts,
      limit: productLimit,
      icon: Package,
    },
    { label: "Stores", used: stores.length, limit: storeLimit, icon: Store },
  ];
  const atLimit = usage.some((u) => !isUnlimited(u.limit) && u.used >= u.limit);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    const path = `${user.id}/profile/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const { error } = await supabase.storage.from('branding').upload(path, file, { upsert: true });
    if (error) { 
      addToast('Upload failed: ' + error.message, 'error'); 
      setUploadingAvatar(false); 
      return; 
    }
    const { data: { publicUrl } } = supabase.storage.from('branding').getPublicUrl(path);
    updateState('bizImage', publicUrl);
    addToast('Profile picture updated!', 'success');
    setUploadingAvatar(false);
  };

  const authLabel = useMemo(() => {
    if (!isSupabaseActive) return "Offline mode (Supabase not configured)";
    if (!user) return "Connecting…";
    return user.email ? `${user.email}` : "Signed in";
  }, [isSupabaseActive, user]);

  const stats = [
    { label: "Active Products", value: state.products.length, icon: Package, color: "text-[#19C37D]" },
    { label: "Categories", value: state.categories.length, icon: Globe, color: "text-[#60A5FA]" },
    { label: "Public Status", value: state.isLive ? "Live" : "Paused", icon: CheckCircle2, color: state.isLive ? "text-[#19C37D]" : "text-[#E8B93A]" },
  ];

  return (
    <ProLayout>
      <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
        {/* Top Back Navigation & Header Section */}
        <div>
          <Link
            href="/pro"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-[12px] border border-[#24382F] bg-[#14231D] px-4 py-2 text-xs font-semibold text-[#E8F1EC] transition hover:bg-[#19C37D] hover:text-[#04140D] mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Overview</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#1E2D27] pb-5">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#E8F1EC]">Settings</h1>
                {state.plan && state.plan !== "free" && (
                  <span className="rounded-full border border-[#24382F] bg-[#14231D] px-2.5 py-0.5 text-[11px] font-medium text-[#19C37D]">
                    {state.plan.charAt(0).toUpperCase() + state.plan.slice(1)} Plan
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-[#9DB3A8] mt-1">Manage your store identity and preferences.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-[#111C18] p-6 sm:p-8 rounded-[18px] border border-[#1E2D27] shadow-sm text-center">
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <div className="relative w-24 h-24 mx-auto mb-4 group">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="block w-full h-full rounded-[18px] bg-[#14231D] border-2 border-[#1E2D27] overflow-hidden shadow-inner cursor-pointer relative"
                  aria-label="Upload profile image"
                >
                  {state.bizImage ? (
                    <img src={state.bizImage} className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={32} className="text-[#9DB3A8]" />
                    </div>
                  )}
                  <div className={cn("absolute inset-0 bg-black/50 flex items-center justify-center rounded-[18px] transition-opacity", uploadingAvatar ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                    {uploadingAvatar ? (
                      <div className="w-6 h-6 border-2 border-[#19C37D] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera size={20} className="text-[#E8F1EC]" />
                    )}
                  </div>
                </button>
                <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-[#19C37D] text-[#04140D] rounded-full flex items-center justify-center shadow-lg border border-[#111C18] pointer-events-none">
                  <CheckCircle2 size={15} />
                </div>
              </div>
              <p className="text-[11px] text-[#9DB3A8] mb-2">Tap to change photo</p>
              <h3 className="text-base font-bold text-[#E8F1EC] tracking-tight truncate">{state.bizName || "New Merchant"}</h3>
              <p className="text-xs text-[#9DB3A8] mt-1 mb-6 truncate">{authLabel}</p>
              
              <div className="grid grid-cols-3 gap-2 border-t border-[#1E2D27] pt-5">
                {stats.map(s => (
                  <div key={s.label}>
                    <p className="text-sm font-bold text-[#E8F1EC] leading-none">{s.value}</p>
                    <p className="text-[10px] text-[#9DB3A8] uppercase tracking-wider mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Plan Status */}
            <div className="bg-[#111C18] p-6 rounded-[18px] border border-[#1E2D27] relative overflow-hidden">
              <div className="relative z-10">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9DB3A8]">Your Plan</span>
                <div className="flex items-center gap-2 mt-1 mb-3">
                  <h2 className="text-lg font-bold text-[#E8F1EC]">{planDetail.name} plan</h2>
                  {atLimit && (
                    <span className="rounded-full bg-[#E8B93A]/15 px-2 py-0.5 text-[10px] font-semibold text-[#E8B93A]">At limit</span>
                  )}
                </div>
                <p className="text-xs text-[#9DB3A8] leading-relaxed mb-4">{planDetail.summary}</p>
                <Link
                  href="#plans"
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[12px] border border-[#24382F] bg-[#14231D] px-3 text-[11px] font-semibold text-[#E8F1EC] transition hover:border-[#19C37D]"
                >
                  <Sparkles size={12} />
                  Compare and upgrade
                </Link>
              </div>
            </div>
          </div>

          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/*
              Plans — the current plan, usage against the *enforced* limits, and
              every tier. There is no self-serve checkout in the app yet (only
              Paystack for storefront orders), so the call to action opens the
              feedback channel an admin already reads rather than pretending to
              take a payment.
            */}
            <section
              id="plans"
              className="scroll-mt-20 bg-[#111C18] p-6 sm:p-8 rounded-[18px] border border-[#1E2D27] shadow-sm"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-[10px] bg-[#14231D] border border-[#24382F] flex items-center justify-center text-[#19C37D]">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[#E8F1EC]">Plan and usage</h3>
                  <p className="text-xs text-[#9DB3A8]">
                    You are on <strong className="text-[#E8F1EC]">{planDetail.name}</strong> ({planDetail.price}).
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {usage.map((u) => {
                  const capped = !isUnlimited(u.limit);
                  const full = capped && u.used >= u.limit;
                  return (
                    <div
                      key={u.label}
                      className={cn(
                        "rounded-[14px] border p-4",
                        full ? "border-[#E8B93A]/40 bg-[#E8B93A]/5" : "border-[#1E2D27] bg-[#0E1714]",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#9DB3A8]">
                          <u.icon size={13} /> {u.label}
                        </span>
                        <span
                          className={cn(
                            "text-[11px] font-semibold tabular-nums",
                            full ? "text-[#E8B93A]" : "text-[#E8F1EC]",
                          )}
                        >
                          {formatUsage(u.used, u.limit)}
                        </span>
                      </div>
                      {capped && (
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#14231D]">
                          <div
                            className={cn("h-full rounded-full", full ? "bg-[#E8B93A]" : "bg-[#19C37D]")}
                            style={{ width: `${Math.min(100, (u.used / u.limit) * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {PLANS.map((id) => {
                  const detail = PLAN_DETAILS[id];
                  const isCurrent = id === plan;
                  return (
                    <div
                      key={id}
                      className={cn(
                        "rounded-[14px] border p-4",
                        isCurrent
                          ? "border-[#19C37D]/40 bg-[#19C37D]/5"
                          : "border-[#1E2D27] bg-[#0E1714]",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-[#E8F1EC]">{detail.name}</h4>
                        {isCurrent ? (
                          <span className="rounded-full bg-[#19C37D]/15 px-2 py-0.5 text-[10px] font-semibold text-[#19C37D]">
                            Current
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-[11px] font-semibold text-[#9DB3A8]">{detail.price}</p>
                      <ul className="mt-3 space-y-1.5">
                        {detail.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-1.5 text-[11px] text-[#9DB3A8]">
                            <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-[#19C37D]" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-[#1E2D27] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-start gap-2 text-[11px] leading-relaxed text-[#9DB3A8]">
                  <Lock size={13} className="mt-0.5 shrink-0" />
                  Card checkout for plans is not live in the app yet — plan changes are
                  applied by the team, and your stores and products are never deleted
                  when a limit is reached.
                </p>
                <button
                  type="button"
                  onClick={() => setFeedbackOpen(true)}
                  className="flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-[12px] bg-[#19C37D] px-4 text-xs font-bold text-[#04140D] transition hover:bg-[#16B070]"
                >
                  <Sparkles size={14} />
                  {plan === "business" ? "Ask about your plan" : "Request an upgrade"}
                </button>
              </div>
            </section>

            {/*
              Store visibility — the open/closed switch, in Settings so it is
              reachable by every user from the console and not only from inside
              the store editor.
            */}
            <div className="bg-[#111C18] p-6 sm:p-8 rounded-[18px] border border-[#1E2D27] shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-[10px] bg-[#14231D] border border-[#24382F] flex items-center justify-center text-[#19C37D]">
                  {state.isLive ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                </div>
                <h3 className="font-semibold text-sm text-[#E8F1EC]">Store visibility</h3>
              </div>
              <p className="text-xs text-[#9DB3A8] leading-relaxed">
                {state.isLive
                  ? "Your storefront is live and customers can send orders to WhatsApp."
                  : "Your store is paused. The page still loads, but customers cannot check out."}
              </p>
              <button
                type="button"
                aria-pressed={!state.isLive}
                onClick={() => {
                  const next = !state.isLive;
                  updateState("isLive", next);
                  addToast(
                    next
                      ? "Store is live — customers can order again."
                      : "Store paused — customers can no longer check out.",
                    next ? "success" : "info",
                  );
                }}
                className={cn(
                  "mt-4 flex w-full sm:w-auto min-h-[44px] items-center justify-center gap-2 rounded-[12px] border px-4 text-xs font-semibold transition",
                  state.isLive
                    ? "border-[#24382F] bg-[#14231D] text-[#E8F1EC] hover:border-[#FF8A8A]/60 hover:text-[#FF8A8A]"
                    : "border-[#19C37D] bg-[#19C37D] text-[#04140D] hover:bg-[#16B070]",
                )}
              >
                {state.isLive ? <Pause size={15} /> : <Play size={15} />}
                {state.isLive ? "Stop store" : "Go live"}
              </button>
            </div>

            {/* Identity Settings */}
            <div className="bg-[#111C18] p-6 sm:p-8 rounded-[18px] border border-[#1E2D27] shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-[10px] bg-[#14231D] border border-[#24382F] flex items-center justify-center text-[#19C37D]">
                  <User size={18} />
                </div>
                <h3 className="font-semibold text-sm text-[#E8F1EC]">Store Identity</h3>
              </div>
              
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#9DB3A8]">Your Full Name (Owner)</label>
                    <div className="flex items-center gap-2 bg-[#14231D] px-3.5 py-2.5 rounded-[12px] border border-[#24382F] focus-within:border-[#19C37D]">
                      <User size={15} className="text-[#9DB3A8]" />
                      <input 
                        type="text" 
                        value={state.ownerName || ""} 
                        onChange={(e) => updateState("ownerName", e.target.value)}
                        placeholder="e.g. Michael Dosunmu"
                        className="bg-transparent flex-1 font-medium text-xs outline-none text-[#E8F1EC] placeholder:text-[#9DB3A8]/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#9DB3A8]">Store / Brand Name</label>
                    <div className="flex items-center gap-2 bg-[#14231D] px-3.5 py-2.5 rounded-[12px] border border-[#24382F] focus-within:border-[#19C37D]">
                      <Globe size={15} className="text-[#9DB3A8]" />
                      <input 
                        type="text" 
                        value={state.bizName || ""} 
                        onChange={(e) => updateState("bizName", e.target.value)}
                        placeholder="e.g. CyderStore"
                        className="bg-transparent flex-1 font-medium text-xs outline-none text-[#E8F1EC] placeholder:text-[#9DB3A8]/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#9DB3A8]">Store Handle (Custom Link)</label>
                    <div className="flex items-center gap-2 bg-[#14231D] px-3.5 py-2.5 rounded-[12px] border border-[#24382F] focus-within:border-[#19C37D]">
                      <span className="text-xs font-medium text-[#9DB3A8]">/</span>
                      <input 
                        type="text" 
                        value={state.storeUsername || ""} 
                        onChange={(e) => updateState("storeUsername", e.target.value)}
                        placeholder="your-brand"
                        className="bg-transparent flex-1 font-medium text-xs outline-none text-[#E8F1EC] placeholder:text-[#9DB3A8]/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#9DB3A8]">WhatsApp Order Phone</label>
                    <div className="flex items-center gap-2 bg-[#14231D] px-3.5 py-2.5 rounded-[12px] border border-[#24382F] focus-within:border-[#19C37D]">
                      <Smartphone size={15} className="text-[#9DB3A8]" />
                      <input 
                        type="tel" 
                        value={state.phone || ""} 
                        onChange={(e) => updateState("phone", e.target.value)}
                        placeholder="+234..."
                        className="bg-transparent flex-1 font-medium text-xs outline-none text-[#E8F1EC] placeholder:text-[#9DB3A8]/50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Session Actions */}
            <div className="bg-[#111C18] rounded-[18px] border border-[#1E2D27] p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="text-[#E8B93A]" size={18} />
                <h3 className="font-semibold text-sm text-[#E8F1EC]">Account Session</h3>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => void authSignOut()}
                  className="flex-1 min-h-[44px] px-4 py-2.5 bg-[#14231D] border border-[#24382F] text-[#E8F1EC] rounded-[12px] text-xs font-semibold hover:border-[#5c7c6d] hover:bg-[#1E2D27] transition"
                >
                  Log Out
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex-1 min-h-[44px] px-4 py-2.5 bg-[#2a1414] border border-[#FF8A8A]/30 text-[#FF8A8A] rounded-[12px] text-xs font-semibold hover:bg-[#3d1818] transition"
                >
                  Reset Local Workspace
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProLayout>
  );
}
