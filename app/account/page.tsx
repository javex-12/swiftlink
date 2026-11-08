"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { supabase } from "@/lib/supabase-client";
import { ProLayout } from "@/components/ProLayout";import {
  User, Package, Globe, Smartphone, Store, BadgeCheck, ArrowUpRight, MessageCircle,
  CheckCircle2, AlertCircle, Camera, ArrowLeft, Pause, Play, Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDisplayPhone, normalizePhoneNumber } from "@/lib/phone";
import {
  PLANS,
  PLAN_DETAILS,
  accountPlanFor,
  applyProductVisibility,
  effectiveProductLimitFor,
  effectiveStoreLimitFor,
  formatLimit,
  formatUsage,
  isUnlimited,
  normalizePlan,
} from "@/lib/plans";
import { SubscriptionPanel } from "@/components/billing/SubscriptionPanel";
import { DomainSettings } from "@/components/domains/DomainSettings";

export default function AccountPage() {
  const { user, isSupabaseActive, authSignOut, handleSignOut, state, updateState, addToast, setFeedbackOpen, stores, chooseStore, setStoreLive, planReady } =
    useSwiftLink();

  const [actionLoading, setActionLoading] = useState<"deactivate" | "delete" | null>(null);

  const handleDeactivate = async () => {
    if (!window.confirm("Deactivate your store? Your storefront will be paused and hidden from visitors. You can reactivate anytime by logging back in.")) {
      return;
    }
    setActionLoading("deactivate");
    try {
      if (user?.id) {
        await supabase
          .from("stores")
          .update({ is_live: false, state_json: { ...state, isLive: false } })
          .eq("owner_id", user.id);
      }
      addToast("Account deactivated and store paused.", "info");
      await authSignOut();
    } catch (e: any) {
      addToast("Could not deactivate account: " + (e.message || "Unknown error"), "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete your account?\n\nYour store will immediately be taken offline. All your products and store data will be permanently wiped after a 30-day grace period.\n\nPress OK to confirm account deletion."
      )
    ) {
      return;
    }
    setActionLoading("delete");
    try {
      if (user?.id) {
        await supabase
          .from("stores")
          .update({
            is_live: false,
            state_json: {
              ...state,
              isLive: false,
              deletion_requested_at: new Date().toISOString(),
            },
          })
          .eq("owner_id", user.id);
      }
      addToast("Account scheduled for deletion. Data will be completely wiped in 30 days.", "info");
      await authSignOut();
    } catch (e: any) {
      addToast("Could not request account deletion: " + (e.message || "Unknown error"), "error");
    } finally {
      setActionLoading(null);
    }
  };

  /*
   * Plan panel data. Everything comes from `lib/plans` so this screen, the
   * console badge and the landing page cannot describe the same tier
   * differently — and usage is shown against the *enforced* limits, which is
   * what a merchant actually hits.
   */
  const plan = normalizePlan(accountPlanFor(stores && stores.length ? stores : [state])) as keyof typeof PLAN_DETAILS;
  const planDetail = PLAN_DETAILS[plan] || PLAN_DETAILS.free;
  const productLimit = effectiveProductLimitFor(plan);
  const storeLimit = effectiveStoreLimitFor(plan);
  const allStores = stores && stores.length > 0 ? stores : [state];
  const totalVisibleProducts = allStores.reduce((sum, s) => {
    if (!s) return sum;
    const prods = s.id === state?.id ? state?.products : s.products;
    return sum + (prods || []).filter((p) => p && p.visible !== false).length;
  }, 0);
  const usage = [
    {
      label: "Products",
      used: totalVisibleProducts,
      limit: productLimit,
      icon: Package,
    },
    { label: "Stores", used: (stores || []).length, limit: storeLimit, icon: Store },
  ];
  /*
   * Only the catalogue being full is worth flagging. Every single-store plan
   * has `1 of 1` stores by design, so counting that showed "At limit" to every
   * free and Pro merchant as though something were wrong.
   */
  const atLimit = !isUnlimited(productLimit) && totalVisibleProducts >= productLimit;

  /*
   * "Choose what stays live". Products are pre-selected from what the
   * storefront currently shows, so saving without touching anything is a no-op;
   * the choice is only sent when the merchant actually changes it.
   */
  const hiddenProducts = (state?.products || []).filter((product) => product && product.visible === false);
  const visibleProductIds = (state?.products || [])
    .filter((product) => product && product.visible !== false)
    .map((product) => product.id);
  const [pickedIds, setPickedIds] = useState<number[]>(visibleProductIds);
  useEffect(() => {
    setPickedIds(
      (state?.products || []).filter((product) => product && product.visible !== false).map((product) => product.id),
    );
    // Re-seed when the merchant moves to a different store; not on every save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.id]);
  const togglePicked = (id: number) =>
    setPickedIds((prev) => {
      if (prev.includes(id)) return prev.filter((value) => value !== id);
      if (prev.length >= productLimit) return prev;
      return [...prev, id];
    });
  const needsChoice =
    (!isUnlimited(productLimit) && hiddenProducts.length > 0) || (stores || []).length > storeLimit;
  const formatPrice = (value: number) => `${state?.currency || "₦"}${Number(value || 0).toLocaleString()}`;
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
    { label: "Active Products", value: (state?.products || []).length, icon: Package, color: "text-[#19C37D]" },
    { label: "Categories", value: (state?.categories || []).length, icon: Globe, color: "text-[#60A5FA]" },
    { label: "Public Status", value: state?.isLive ? "Live" : "Paused", icon: CheckCircle2, color: state?.isLive ? "text-[#19C37D]" : "text-[#E8B93A]" },
  ];

  return (
    <ProLayout>
      <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 pb-16">
        {/* Top Back Navigation */}
        <Link
          href="/pro"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#182a22] bg-[#111e18] px-5 py-2 text-xs font-semibold text-[#e2efe7] transition hover:bg-[#0f5133] hover:text-[#b8f2d3]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Overview</span>
        </Link>

        {/* M3 Header (.head) */}
        <div className="flex items-start justify-between gap-4 border-b border-[#182a22] pb-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#e2efe7]">Settings</h1>
            <p className="mt-1 text-xs sm:text-sm text-[#9db4a8]">Your account, plan and store options.</p>
          </div>
          <span className="rounded-full bg-[#0f5133] text-[#b8f2d3] font-bold text-xs px-3.5 py-1">
            {planDetail.name}
          </span>
        </div>

        {/* M3 Hero Profile Card (.hero) */}
        <section className="rounded-[44px_44px_44px_16px] bg-[#0f5133] text-[#b8f2d3] p-6 sm:p-8 shadow-lg">
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="relative flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center overflow-hidden rounded-[28px] bg-[#00391f] text-[#5be3a0] shadow-inner transition hover:scale-105 active:scale-95 cursor-pointer border border-[#5be3a0]/30"
              aria-label="Upload profile image"
            >
              {state.bizImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={state.bizImage} className="h-full w-full object-cover" alt="Profile" />
              ) : (
                <User size={36} className="text-[#b8f2d3]" />
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#5be3a0] border-t-transparent" />
                </div>
              )}
            </button>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Signed in as</div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#ffffff] truncate">
                {state.ownerName || "Merchant"}
              </h1>
              <p className="text-xs sm:text-sm text-[#b8f2d3]/90 mt-0.5 truncate">
                {state.bizName || "SwiftLink Store"} · {authLabel}
              </p>
            </div>
          </div>

          {/* M3 Metric Pills (.pst) */}
          <div className="grid grid-cols-3 gap-2.5 mt-6">
            <div className="rounded-[20px] bg-black/15 p-3.5 text-center">
              <b className="block text-xl sm:text-2xl font-extrabold text-[#ffffff]">{(state?.products || []).length}</b>
              <small className="text-[11px] opacity-80 font-medium">Active products</small>
            </div>
            <div className="rounded-[20px] bg-black/15 p-3.5 text-center">
              <b className="block text-xl sm:text-2xl font-extrabold text-[#ffffff]">{(state?.categories || []).length}</b>
              <small className="text-[11px] opacity-80 font-medium">Categories</small>
            </div>
            <div className="rounded-[20px] bg-black/15 p-3.5 text-center">
              <b className="block text-xl sm:text-2xl font-extrabold text-[#ffffff]">{state?.isLive ? "Live" : "Paused"}</b>
              <small className="text-[11px] opacity-80 font-medium">Public status</small>
            </div>
          </div>
        </section>

        {/* Main Settings Sections */}
        <div className="space-y-8">
            {/*
              Plans — the current plan, usage against the *enforced* limits, and
              every tier. Upgrades are self-serve through Paystack's hosted
              checkout (see SubscriptionPanel); the feedback button is still there
              for merchants who would rather talk to a person first.
            */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-[#e2efe7]">Plan and usage</h2>
          <section
            id="plans"
            className="scroll-mt-20 rounded-[32px] border border-[#182a22] bg-[#111e18] p-6 sm:p-8 shadow-sm"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#182a22]">
              <div>
                <small className="text-xs font-semibold uppercase tracking-wider text-[#9db4a8]">Your plan</small>
                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#e2efe7] mt-0.5">
                  {planDetail.name}
                </div>
              </div>
              <b className="text-lg sm:text-xl font-extrabold text-[#5be3a0]">{planDetail.price} / month</b>
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

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-[#E8F1EC]">{detail.name}</h4>
                          {detail.tag && (
                            <span className="rounded-full bg-[#19C37D]/20 border border-[#19C37D]/40 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#19C37D]">
                              {detail.tag}
                            </span>
                          )}
                        </div>
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

              {/*
                Self-serve billing. The card flow lives on Paystack's hosted page
                and the plan is only changed after a verified payment (or a
                signature-checked webhook) — this panel never decides a tier.
              */}
              {planReady && user ? <SubscriptionPanel currentPlan={plan} /> : null}

              <div className="mt-6 flex flex-col gap-3 border-t border-[#1E2D27] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-start gap-2 text-[11px] leading-relaxed text-[#9DB3A8]">
                  <Lock size={13} className="mt-0.5 shrink-0" />
                  Your plan changes as soon as payment is confirmed. Nothing is deleted at a
                  limit: extra products are hidden and extra stores are paused until you upgrade.
                </p>
                <button
                  type="button"
                  onClick={() => setFeedbackOpen(true)}
                  className="flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-[12px] border border-[#24382F] bg-[#14231D] px-4 text-xs font-bold text-[#E8F1EC] transition hover:border-[#19C37D]"
                >
                  <MessageCircle size={14} />
                  Ask about your plan
                </button>
              </div>

              {/*
                Choosing, for accounts that were already over their plan.

                Existing accounts are not asked to delete anything: products
                beyond the cap are hidden and extra stores are paused, and this
                is where the merchant says *which* ones they want. Before this,
                the rules blocked new additions while the rows already there kept
                running, so the limit read as a suggestion.
              */}
              {needsChoice && hiddenProducts.length > 0 && (
                <div className="mt-6 rounded-[14px] border border-[#E8B93A]/40 bg-[#E8B93A]/5 p-4 sm:p-5">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E8B93A]">
                    <AlertCircle size={14} /> Choose what stays live
                  </h4>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-[#9DB3A8]">
                    The {planDetail.name} plan includes {formatLimit(productLimit)}. {hiddenProducts.length} hidden from your storefront.
                    Nothing has been deleted — pick again here any time, or upgrade for more.
                  </p>

                  <div className="mt-4">
                    <p className="text-[11px] font-semibold text-[#E8F1EC]">
                      Products shown on your storefront: {pickedIds.length} of {Math.min(productLimit, state.products.length)}
                    </p>
                    <div className="mt-2 max-h-60 space-y-1.5 overflow-y-auto pr-1 custom-scrollbar">
                      {(state?.products || []).map((product) => {
                        const picked = pickedIds.includes(product.id);
                        const full = !picked && pickedIds.length >= productLimit;
                        return (
                          <button
                            key={product.id}
                            type="button"
                            aria-pressed={picked}
                            disabled={full}
                            onClick={() => togglePicked(product.id)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-[10px] border px-3 py-2 text-left transition",
                              picked ? "border-[#19C37D]/50 bg-[#19C37D]/10" : "border-[#1E2D27] bg-[#0E1714]",
                              full && "opacity-40",
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                                picked ? "border-[#19C37D] bg-[#19C37D] text-[#04140D]" : "border-[#24382F]",
                              )}
                            >
                              {picked && <CheckCircle2 size={11} />}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-[#E8F1EC]">
                              {product.name || `Product ${product.id}`}
                            </span>
                            <span className="shrink-0 text-[11px] tabular-nums text-[#9DB3A8]">
                              {formatPrice(product.price)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      disabled={pickedIds.length === 0}
                      onClick={() => {
                        updateState("products", applyProductVisibility(state?.products || [], pickedIds));
                        addToast(
                          `${pickedIds.length} product${pickedIds.length === 1 ? "" : "s"} will show on your storefront.`,
                          "success",
                        );
                      }}
                      className="mt-3 flex min-h-[40px] items-center justify-center gap-2 rounded-[12px] bg-[#19C37D] px-4 text-xs font-bold text-[#04140D] transition hover:bg-[#16B070] disabled:opacity-40"
                    >
                      Save my {Math.min(productLimit, (state?.products || []).length)} products
                    </button>
                  </div>
                </div>
              )}

              {stores.length > 1 && (
                <div className="mt-6 border-t border-[#1E2D27] pt-5">
                  <p className="text-[11px] font-semibold text-[#E8F1EC]">Your stores</p>
                  <p className="mt-1 text-[11px] text-[#9DB3A8]">
                    You are editing <strong className="text-[#E8F1EC]">{state.bizName || "Untitled"}</strong>. Up
                    to {formatLimit(storeLimit)} {storeLimit === 1 ? "store can" : "stores can"} be live at
                    once on {planDetail.name}. Pausing a store takes it offline and keeps everything in it.
                  </p>
                  <div className="mt-3 space-y-1.5">
                    {stores.map((store) => {
                      const editing = store.id === state.id;
                      const live = store.isLive !== false;
                      return (
                        <div
                          key={store.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-[#1E2D27] bg-[#0E1714] px-3 py-2"
                        >
                          <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-[#E8F1EC]">
                            {store.bizName || "Untitled store"}
                            <span
                              className={
                                live
                                  ? "ml-2 text-[10px] font-semibold text-[#19C37D]"
                                  : "ml-2 text-[10px] font-semibold text-[#9DB3A8]"
                              }
                            >
                              {live ? "live" : "paused"}
                            </span>
                            {editing && (
                              <span className="ml-2 text-[10px] font-semibold text-[#E8B93A]">editing</span>
                            )}
                          </span>
                          <div className="flex shrink-0 items-center gap-1.5">
                            {!editing && (
                              <button
                                type="button"
                                onClick={() => void chooseStore(store.id as string)}
                                className="rounded-lg border border-[#24382F] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#E8F1EC] transition hover:border-[#19C37D]/50 hover:text-[#19C37D]"
                              >
                                Open
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => void setStoreLive(store.id as string, !live)}
                              className={
                                live
                                  ? "rounded-lg border border-[#24382F] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9DB3A8] transition hover:border-[#FF8A8A]/50 hover:text-[#FF8A8A]"
                                  : "rounded-lg border border-[#19C37D]/40 bg-[#19C37D]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#19C37D] transition hover:bg-[#19C37D]/20"
                              }
                            >
                              {live ? "Pause" : "Go live"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* Store Controls Section */}
            <div className="mt-8 space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-[#e2efe7]">Store</h2>
              <div className="rounded-[32px] border border-[#182a22] bg-[#111e18] p-3 space-y-2">
                {/* Store visibility with interactive toggle */}
                <div className="flex items-center justify-between gap-4 p-4 rounded-[24px] bg-[#14231c]">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-11 w-11 rounded-[16px] bg-[#182a22] flex items-center justify-center shrink-0 text-[#19C37D]">
                      <Store size={20} />
                    </div>
                    <div>
                      <b className="block text-sm font-bold text-[#e2efe7]">Store visibility</b>
                      <small className="text-xs text-[#9db4a8]">
                        {state.isLive ? "Live. Buyers can send orders" : "Paused. Buyers cannot order"}
                      </small>
                    </div>
                  </div>

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
                      "flex min-h-[38px] items-center justify-center gap-1.5 rounded-full px-4 text-xs font-bold transition active:scale-95",
                      state.isLive
                        ? "border border-[#27402f] bg-[#0a130f] text-[#9db4a8] hover:text-[#ff8a8a]"
                        : "bg-[#19C37D] text-[#04140D] hover:bg-[#16B070]",
                    )}
                  >
                    {state.isLive ? <Pause size={13} /> : <Play size={13} />}
                    {state.isLive ? "Stop store" : "Go live"}
                  </button>
                </div>

                {/* Custom Domain Section */}
                <div id="domain" className="p-5 rounded-[24px] bg-[#14231c] space-y-3">
                  <div className="flex items-center gap-3.5">
                    <div className="h-11 w-11 rounded-[16px] bg-[#182a22] flex items-center justify-center shrink-0 text-[#60A5FA]">
                      <Globe size={20} />
                    </div>
                    <div>
                      <b className="block text-sm font-bold text-[#e2efe7]">Your own domain</b>
                      <small className="text-xs text-[#9db4a8]">Point a domain you own at your store</small>
                    </div>
                  </div>
                  <div className="pt-2">
                    <DomainSettings
                      currentPlan={plan}
                      storeId={state.id}
                      storeHandle={state.storeUsername}
                    />
                  </div>
                </div>

                {/* Store Details Input Group */}
                <div className="p-5 rounded-[24px] bg-[#14231c] space-y-4">
                  <div className="flex items-center gap-3.5 mb-2">
                    <div className="h-11 w-11 rounded-[16px] bg-[#182a22] flex items-center justify-center shrink-0 text-[#19C37D]">
                      <BadgeCheck size={20} />
                    </div>
                    <div>
                      <b className="block text-sm font-bold text-[#e2efe7]">Store identity</b>
                      <small className="text-xs text-[#9db4a8]">Brand name and WhatsApp order destination</small>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#9db4a8] mb-1.5 ml-1">
                        Store / Brand Name
                      </label>
                      <input
                        type="text"
                        value={state.bizName || ""}
                        onChange={(e) => updateState("bizName", e.target.value)}
                        placeholder="e.g. CyderStore"
                        className="w-full rounded-[20px] border-2 border-[#27402f] bg-[#0a130f] px-4 py-2.5 text-sm text-[#e2efe7] outline-none transition focus:border-[#5be3a0]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#9db4a8] mb-1.5 ml-1">
                        Store Handle (swiftlink.pro/...)
                      </label>
                      <input
                        type="text"
                        value={state.storeUsername || ""}
                        onChange={(e) => updateState("storeUsername", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                        placeholder="your-brand"
                        className="w-full rounded-[20px] border-2 border-[#27402f] bg-[#0a130f] px-4 py-2.5 text-sm text-[#e2efe7] outline-none transition focus:border-[#5be3a0]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#9db4a8] mb-1.5 ml-1">
                        Owner Name
                      </label>
                      <input
                        type="text"
                        value={state.ownerName || ""}
                        onChange={(e) => updateState("ownerName", e.target.value)}
                        placeholder="e.g. Michael Dosunmu"
                        className="w-full rounded-[20px] border-2 border-[#27402f] bg-[#0a130f] px-4 py-2.5 text-sm text-[#e2efe7] outline-none transition focus:border-[#5be3a0]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#9db4a8] mb-1.5 ml-1">
                        WhatsApp Order Phone
                      </label>
                      <input
                        type="tel"
                        value={state.phone ? (state.phone.startsWith("+") ? state.phone : formatDisplayPhone(state.phone)) : ""}
                        onChange={(e) => updateState("phone", e.target.value)}
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val) {
                            const norm = normalizePhoneNumber(val, "NG");
                            if (norm.isValid) {
                              updateState("phone", norm.normalized);
                            } else if (!val.startsWith("+")) {
                              const digits = val.replace(/\D/g, "");
                              if (digits.startsWith("0")) {
                                updateState("phone", `+234${digits.slice(1)}`);
                              } else {
                                updateState("phone", `+234${digits}`);
                              }
                            }
                          }
                        }}
                        placeholder="+234 808 000 0000"
                        className="w-full rounded-[20px] border-2 border-[#27402f] bg-[#0a130f] px-4 py-2.5 text-sm text-[#e2efe7] outline-none transition focus:border-[#5be3a0]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Actions Section */}
            <div className="mt-8 space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-[#e2efe7]">Account</h2>
              <div className="rounded-[32px] border border-[#182a22] bg-[#111e18] p-3 space-y-2">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="w-full flex items-center justify-between p-4 rounded-[24px] bg-[#14231c] hover:bg-[#182a22] transition text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="h-11 w-11 rounded-[16px] bg-[#182a22] flex items-center justify-center shrink-0 text-[#19C37D]">
                      <User size={20} />
                    </div>
                    <div>
                      <b className="block text-sm font-bold text-[#e2efe7]">Your profile</b>
                      <small className="text-xs text-[#9db4a8]">{state.ownerName || "Change photo and name"}</small>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[#5be3a0]">Change</span>
                </button>

                <button
                  type="button"
                  onClick={() => void authSignOut()}
                  className="w-full flex items-center justify-between p-4 rounded-[24px] bg-[#14231c] hover:bg-[#182a22] transition text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="h-11 w-11 rounded-[16px] bg-[#182a22] flex items-center justify-center shrink-0 text-[#9db4a8]">
                      <Lock size={20} />
                    </div>
                    <div>
                      <b className="block text-sm font-bold text-[#e2efe7]">Sign out</b>
                      <small className="text-xs text-[#9db4a8]">{authLabel}</small>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[#9db4a8]">Exit</span>
                </button>
              </div>
            </div>

            {/* Danger Zone Section */}
            <div className="mt-8 space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-[#ff8a8a]">Danger zone</h2>
              <section className="rounded-[32px] border border-rose-500/20 bg-[#141212] p-6 shadow-sm">
                <p className="text-xs sm:text-sm text-[#9db4a8] leading-relaxed">
                  Deleted accounts enter a 30-day grace period before data is permanently wiped. Storefronts are taken offline immediately.
                </p>
                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    disabled={actionLoading !== null}
                    onClick={handleDeactivate}
                    className="flex-1 min-h-[44px] px-5 py-2.5 rounded-full border border-[#ffe3a3]/30 bg-[#4a3a0f]/40 text-[#ffe3a3] text-xs font-bold hover:bg-[#4a3a0f] transition disabled:opacity-50"
                  >
                    {actionLoading === "deactivate" ? "Deactivating…" : "Deactivate Account"}
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading !== null}
                    onClick={handleDelete}
                    className="flex-1 min-h-[44px] px-5 py-2.5 rounded-full bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition disabled:opacity-50"
                  >
                    {actionLoading === "delete" ? "Scheduling…" : "Delete account (30 days)"}
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </ProLayout>
  );
}
