"use client";

import Link from "next/link";
import { useMemo, useState, useRef } from "react";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { supabase } from "@/lib/supabase-client";
import { ProLayout } from "@/components/ProLayout";
import { 
  User, Package, Globe, Smartphone,
  CheckCircle2, AlertCircle, Camera, ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AccountPage() {
  const { user, isSupabaseActive, authSignOut, handleSignOut, state, updateState, addToast } =
    useSwiftLink();
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
                  <h2 className="text-lg font-bold text-[#E8F1EC]">
                    {state.plan && state.plan !== "free" ? `${state.plan.charAt(0).toUpperCase() + state.plan.slice(1)} Plan` : "Standard Store"}
                  </h2>
                </div>
                <p className="text-xs text-[#9DB3A8] leading-relaxed mb-4">
                  WhatsApp storefront ordering with multi-currency minor unit precision.
                </p>
              </div>
            </div>
          </div>

          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
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
                      <span className="text-xs font-medium text-[#9DB3A8]">/store/</span>
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
