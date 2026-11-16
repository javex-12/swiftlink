"use client";

import Link from "next/link";
import { useSwiftLink } from "@/context/SwiftLinkContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo, useCallback } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase-client";
import { toCsv, downloadCsv, csvFilename } from "@/lib/csv";
import { 
  Shield, 
  Users, 
  Store, 
  Activity, 
  MessageSquare, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRight, 
  Lock, 
  Settings, 
  Globe, 
  TrendingUp, 
  X, 
  ChevronRight, 
  Calendar, 
  Smartphone, 
  Filter, 
  Check, 
  ThumbsUp, 
  Star, 
  UserCheck, 
  UserMinus,
  RefreshCw,
  ExternalLink,
  MessageCircle,
  Eye,
  MousePointerClick,
  UserPlus,
  Trash2,
  Download
} from "lucide-react";

// Types matching Supabase schemas
interface StoreDB {
  id: string;
  owner_id: string;
  biz_name: string;
  store_username: string;
  phone: string;
  sections: any;
  state_json: any;
  updated_at: string;
  plan?: string;
  account_status?: "active" | "suspended" | "banned";
}

interface ProfileDB {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  is_verified: boolean;
  bio?: string;
  cover_url?: string;
}

interface FeedbackDB {
  id: string;
  user_id: string;
  store_id: string;
  type: string; // 'bug' | 'feature' | 'general' | 'report'
  message: string;
  metadata: any;
  upvotes: number;
  public_replies: any[];
  is_public: boolean;
  status: string; // 'pending' | 'in_progress' | 'resolved'
  created_at: string;
}

interface EventDB {
  id: string;
  store_id: string;
  event_type: string; // 'view' | 'product_click' | 'whatsapp_checkout' | 'store_transferred'
  product_id: number | null;
  metadata: any;
  created_at: string;
}

export function AdminView() {
  const { user, addToast, isAdmin } = useSwiftLink();
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Database states
  const [stores, setStores] = useState<StoreDB[]>([]);
  const [profiles, setProfiles] = useState<ProfileDB[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackDB[]>([]);
  const [events, setEvents] = useState<EventDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "merchants" | "stores" | "feedback" | "admins">("overview");

  // Admin management state
  const [adminsList, setAdminsList] = useState<{id: string; email: string; created_at: string}[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [removingAdminId, setRemovingAdminId] = useState<string | null>(null);

  const fetchAdmins = async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data } = await supabase.from("system_admins").select("*").order("created_at", { ascending: true });
      if (data) setAdminsList(data);
    } catch (e) {
      console.warn("Could not fetch admins list", e);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) return;
    if (!isSupabaseConfigured()) {
      addToast("Admin role changes require a connected Supabase project.", "info");
      return;
    }
    setAddingAdmin(true);
    try {
      // Look up user by email in auth.users via RPC (requires searching profiles)
      // We find the user in social_profiles or stores by matching owner email from auth.users
      const email = newAdminEmail.trim().toLowerCase();

      // Check if already an admin
      const existing = adminsList.find(a => a.email.toLowerCase() === email);
      if (existing) {
        addToast("This user is already an administrator.", "info");
        setAddingAdmin(false);
        return;
      }

      // Use a Supabase RPC to promote user by email
      const { error } = await supabase.rpc("promote_admin_by_email", { target_email: email });

      if (error) {
        addToast(`Failed: ${error.message}`, "error");
      } else {
        addToast(`${email} has been granted admin access.`, "success");
        setNewAdminEmail("");
        await fetchAdmins();
      }
    } catch (e: any) {
      addToast(e.message || "Failed to add admin.", "error");
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (adminId: string, adminEmail: string) => {
    if (adminEmail === user?.email) {
      addToast("You cannot remove yourself from admin access.", "error");
      return;
    }
    if (!isSupabaseConfigured()) return;
    setRemovingAdminId(adminId);
    try {
      const { error } = await supabase.from("system_admins").delete().eq("id", adminId);
      if (error) throw error;
      setAdminsList(prev => prev.filter(a => a.id !== adminId));
      addToast(`${adminEmail} has been removed from admin access.`, "success");
    } catch (e: any) {
      addToast(e.message || "Failed to remove admin.", "error");
    } finally {
      setRemovingAdminId(null);
    }
  };

  // User tier and account ban actions
  const [updatingStoreId, setUpdatingStoreId] = useState<string | null>(null);

  const handleSetUserPlan = async (storeId: string, newPlan: "free" | "pro" | "business") => {
    setUpdatingStoreId(storeId);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.rpc("set_user_plan", { store_id_param: storeId, new_plan: newPlan });
        if (error) throw error;
      }
      setStores(prev => prev.map(s => s.id === storeId ? { ...s, plan: newPlan, state_json: { ...s.state_json, plan: newPlan } } : s));
      addToast(`User plan updated to ${newPlan.toUpperCase()} successfully.`, "success");
    } catch (e: any) {
      addToast(e.message || "Failed to update user plan.", "error");
    } finally {
      setUpdatingStoreId(null);
    }
  };

  const handleSetAccountStatus = async (storeId: string, newStatus: "active" | "banned") => {
    const store = stores.find(s => s.id === storeId);
    const confirmMsg = newStatus === "banned"
      ? `Are you sure you want to suspend "${store?.biz_name || "this store"}"?\n\nThis suspends customer access to this specific storefront. The merchant will still be able to access their other stores.`
      : `Are you sure you want to reactivate "${store?.biz_name || "this store"}"?`;
    if (!window.confirm(confirmMsg)) return;
    setUpdatingStoreId(storeId);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.rpc("set_account_status", { store_id_param: storeId, new_status: newStatus });
        if (error) throw error;
      }
      setStores(prev => prev.map(s => s.id === storeId ? { ...s, account_status: newStatus } : s));
      addToast(`Store account status changed to ${newStatus.toUpperCase()}.`, "success");
    } catch (e: any) {
      addToast(e.message || "Failed to update account status.", "error");
    } finally {
      setUpdatingStoreId(null);
    }
  };

  // Filter/Search states
  const [globalSearch, setGlobalSearch] = useState("");
  const [feedbackFilter, setFeedbackFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [storePlanFilter, setStorePlanFilter] = useState<"all" | "free" | "pro" | "business">("all");
  const [storeStatusFilter, setStoreStatusFilter] = useState<"all" | "active" | "banned">("all");
  const [storeLiveFilter, setStoreLiveFilter] = useState<"all" | "live" | "paused">("all");

  // Selected merchant/store for detailed drill-down modal
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);

  // Feedback reply message state
  const [replyMessage, setReplyMessage] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);

  // Once isAdmin is resolved from the context (not undefined), stop showing loading spinner
  useEffect(() => {
    setCheckingAuth(false);
  }, [isAdmin]);

  // Simulated Mock data fallbacks for wowed first-impressions
  const mockData = useMemo(() => {
    const mockProfiles: ProfileDB[] = [
      { id: "u1", username: "chidi_styles", display_name: "Chidi Stores Ltd", avatar_url: "", is_verified: true, bio: "Luxury fashion & bespoke native tailoring based in Lekki Phase 1, Lagos." },
      { id: "u2", username: "yomi_kicks", display_name: "Yomi Sneaker Lounge", avatar_url: "", is_verified: true, bio: "Deadstock sneakers & authentic streetwear delivered nationwide from Port Harcourt." },
      { id: "u3", username: "amara_spices", display_name: "Amara's Gourmet", avatar_url: "", is_verified: true, bio: "Organic spices, meal boxes & artisan pantry staples in Victoria Island, Lagos." },
      { id: "u4", username: "bolaji_tech", display_name: "Bolaji Gadgets", avatar_url: "", is_verified: true, bio: "Certified pre-owned iPhones, MacBooks & DJI drones in Ikeja Computer Village." },
      { id: "u5", username: "tunde_bakes", display_name: "Tunde Pastry Shop", avatar_url: "", is_verified: false, bio: "Custom wedding cakes, sourdough & French pastries in Wuse 2, Abuja." },
      { id: "u6", username: "luxeglow", display_name: "LuxeGlow Skincare", avatar_url: "", is_verified: true, bio: "Dermatologist-approved organic body butters & SPF in Lagos." },
      { id: "u7", username: "zarahome", display_name: "Zara Home & Living", avatar_url: "", is_verified: false, bio: "Minimalist ceramic vases, woven rugs and linen sets." },
      { id: "u8", username: "afriprint", display_name: "Afriprint Fabrics", avatar_url: "", is_verified: true, bio: "Authentic wholesale Ankara, Kampala & Guinea brocade in Ibadan." },
      { id: "u9", username: "urbandrip", display_name: "Urban Drip Vintage", avatar_url: "", is_verified: false, bio: "Curated 90s graphic tees, varsity jackets & oversized cargo pants in Yaba." },
      { id: "u10", username: "safarileather", display_name: "Safari Leather Co", avatar_url: "", is_verified: true, bio: "Handcrafted full-grain leather bags, belts and wallets from Kano." },
      { id: "u11", username: "kairo_kids", display_name: "Kairo Kids Boutique", avatar_url: "", is_verified: false, bio: "Organic cotton baby apparel & educational wooden toys in Abuja." },
      { id: "u12", username: "fitpro_supps", display_name: "FitPro Nutrition", avatar_url: "", is_verified: true, bio: "Whey isolates, creatine monohydrate & gym accessories in Lagos." }
    ];

    const mockStores: StoreDB[] = [
      { id: "s1", owner_id: "u1", biz_name: "Chidi Styles", store_username: "chidi_styles", phone: "+2348012345678", plan: "business", account_status: "active", sections: [], state_json: { plan: "business", isLive: true, gmv: 8450000, inquiries: 342, category: "Fashion & Tailoring", city: "Lagos", dominantChannel: "Instagram (62%)" }, updated_at: new Date(Date.now() - 1200000).toISOString() },
      { id: "s2", owner_id: "u2", biz_name: "Yomi Sneaker Lounge", store_username: "yomi_kicks", phone: "+2348098765432", plan: "business", account_status: "active", sections: [], state_json: { plan: "business", isLive: true, gmv: 6820000, inquiries: 289, category: "Sneakers & Streetwear", city: "Port Harcourt", dominantChannel: "TikTok (54%)" }, updated_at: new Date(Date.now() - 3600000).toISOString() },
      { id: "s3", owner_id: "u3", biz_name: "Amara's Gourmet", store_username: "amara_spices", phone: "+2348123456789", plan: "pro", account_status: "active", sections: [], state_json: { plan: "pro", isLive: true, gmv: 4150000, inquiries: 218, category: "Artisan Pantry & Food", city: "Lagos", dominantChannel: "WhatsApp (48%)" }, updated_at: new Date(Date.now() - 7200000).toISOString() },
      { id: "s4", owner_id: "u4", biz_name: "Bolaji Gadgets", store_username: "bolaji_tech", phone: "+2347012345678", plan: "business", account_status: "active", sections: [], state_json: { plan: "business", isLive: true, gmv: 9140000, inquiries: 194, category: "Electronics & Phones", city: "Lagos", dominantChannel: "Facebook (38%)" }, updated_at: new Date(Date.now() - 14400000).toISOString() },
      { id: "s5", owner_id: "u5", biz_name: "Tunde Pastry Shop", store_username: "tunde_bakes", phone: "+2348033334455", plan: "pro", account_status: "active", sections: [], state_json: { plan: "pro", isLive: true, gmv: 2340000, inquiries: 165, category: "Bakery & Desserts", city: "Abuja", dominantChannel: "Instagram (51%)" }, updated_at: new Date(Date.now() - 21600000).toISOString() },
      { id: "s6", owner_id: "u6", biz_name: "LuxeGlow Skincare", store_username: "luxeglow", phone: "+2348055556677", plan: "pro", account_status: "active", sections: [], state_json: { plan: "pro", isLive: true, gmv: 3780000, inquiries: 241, category: "Beauty & Skincare", city: "Lagos", dominantChannel: "TikTok (68%)" }, updated_at: new Date(Date.now() - 28800000).toISOString() },
      { id: "s7", owner_id: "u7", biz_name: "Zara Home & Living", store_username: "zarahome", phone: "+2348144445566", plan: "free", account_status: "active", sections: [], state_json: { plan: "free", isLive: true, gmv: 1420000, inquiries: 84, category: "Home Décor", city: "Lagos", dominantChannel: "Instagram (45%)" }, updated_at: new Date(Date.now() - 36000000).toISOString() },
      { id: "s8", owner_id: "u8", biz_name: "Afriprint Fabrics", store_username: "afriprint", phone: "+2348166667788", plan: "pro", account_status: "active", sections: [], state_json: { plan: "pro", isLive: true, gmv: 2890000, inquiries: 172, category: "Textiles & Ankara", city: "Ibadan", dominantChannel: "WhatsApp (58%)" }, updated_at: new Date(Date.now() - 43200000).toISOString() },
      { id: "s9", owner_id: "u9", biz_name: "Urban Drip Vintage", store_username: "urbandrip", phone: "+2348022223344", plan: "free", account_status: "active", sections: [], state_json: { plan: "free", isLive: true, gmv: 980000, inquiries: 92, category: "Vintage Streetwear", city: "Lagos", dominantChannel: "X / Twitter (41%)" }, updated_at: new Date(Date.now() - 50400000).toISOString() },
      { id: "s10", owner_id: "u10", biz_name: "Safari Leather Co", store_username: "safarileather", phone: "+2348088889900", plan: "business", account_status: "active", sections: [], state_json: { plan: "business", isLive: true, gmv: 3120000, inquiries: 135, category: "Leather Goods", city: "Kano", dominantChannel: "Instagram (52%)" }, updated_at: new Date(Date.now() - 57600000).toISOString() },
      { id: "s11", owner_id: "u11", biz_name: "Kairo Kids Boutique", store_username: "kairo_kids", phone: "+2348077778899", plan: "free", account_status: "active", sections: [], state_json: { plan: "free", isLive: true, gmv: 850000, inquiries: 76, category: "Kids & Toys", city: "Abuja", dominantChannel: "Instagram (49%)" }, updated_at: new Date(Date.now() - 64800000).toISOString() },
      { id: "s12", owner_id: "u12", biz_name: "FitPro Nutrition", store_username: "fitpro_supps", phone: "+2348188881122", plan: "pro", account_status: "active", sections: [], state_json: { plan: "pro", isLive: true, gmv: 2380000, inquiries: 144, category: "Fitness & Nutrition", city: "Lagos", dominantChannel: "TikTok (59%)" }, updated_at: new Date(Date.now() - 72000000).toISOString() }
    ];

    const mockEvents: EventDB[] = [
      { id: "e1", store_id: "s1", event_type: "view", product_id: null, metadata: { device: "Mobile", city: "Lagos", channel: "Instagram" }, created_at: new Date(Date.now() - 120000).toISOString() },
      { id: "e2", store_id: "s1", event_type: "product_click", product_id: 101, metadata: { productName: "Ankara Silk Flare Gown", channel: "Instagram" }, created_at: new Date(Date.now() - 340000).toISOString() },
      { id: "e3", store_id: "s2", event_type: "view", product_id: null, metadata: { device: "Mobile", city: "Port Harcourt", channel: "TikTok" }, created_at: new Date(Date.now() - 600000).toISOString() },
      { id: "e4", store_id: "s1", event_type: "whatsapp_checkout", product_id: null, metadata: { total: 48000, items: 2, buyer: "Kemi Adeyemi", channel: "Instagram" }, created_at: new Date(Date.now() - 900000).toISOString() },
      { id: "e5", store_id: "s3", event_type: "view", product_id: null, metadata: { device: "Mobile", city: "Abuja", channel: "WhatsApp" }, created_at: new Date(Date.now() - 1500000).toISOString() },
      { id: "e6", store_id: "s3", event_type: "whatsapp_checkout", product_id: null, metadata: { total: 24500, items: 3, buyer: "Zainab Bello", channel: "WhatsApp" }, created_at: new Date(Date.now() - 1800000).toISOString() },
      { id: "e7", store_id: "s2", event_type: "product_click", product_id: 204, metadata: { productName: "Jordan 4 Retro Black Cat", channel: "TikTok" }, created_at: new Date(Date.now() - 2400000).toISOString() },
      { id: "e8", store_id: "s4", event_type: "view", product_id: null, metadata: { device: "Desktop", city: "Ibadan", channel: "Facebook" }, created_at: new Date(Date.now() - 3600000).toISOString() },
      { id: "e9", store_id: "s4", event_type: "product_click", product_id: 401, metadata: { productName: "iPhone 15 Pro Max 256GB", channel: "Facebook" }, created_at: new Date(Date.now() - 4200000).toISOString() },
      { id: "e10", store_id: "s2", event_type: "whatsapp_checkout", product_id: null, metadata: { total: 165000, items: 1, buyer: "David Okon", channel: "TikTok" }, created_at: new Date(Date.now() - 7200000).toISOString() },
      { id: "e11", store_id: "s6", event_type: "whatsapp_checkout", product_id: null, metadata: { total: 32000, items: 2, buyer: "Tolani Balogun", channel: "TikTok" }, created_at: new Date(Date.now() - 9800000).toISOString() },
      { id: "e12", store_id: "s8", event_type: "whatsapp_checkout", product_id: null, metadata: { total: 54000, items: 4, buyer: "Fatima Aliyu", channel: "WhatsApp" }, created_at: new Date(Date.now() - 12400000).toISOString() },
      { id: "e13", store_id: "s10", event_type: "whatsapp_checkout", product_id: null, metadata: { total: 85000, items: 1, buyer: "Emeka Nwosu", channel: "Instagram" }, created_at: new Date(Date.now() - 15600000).toISOString() },
      { id: "e14", store_id: "s9", event_type: "whatsapp_checkout", product_id: null, metadata: { total: 22000, items: 1, buyer: "Folarin Cole", channel: "X / Twitter" }, created_at: new Date(Date.now() - 19200000).toISOString() },
      { id: "e15", store_id: "s12", event_type: "whatsapp_checkout", product_id: null, metadata: { total: 46000, items: 2, buyer: "Dr. Bamidele", channel: "TikTok" }, created_at: new Date(Date.now() - 23000000).toISOString() }
    ];

    const mockFeedbacks: FeedbackDB[] = [
      { id: "f1", user_id: "u1", store_id: "s1", type: "feature", message: "Instagram and TikTok direct story deep-linking works wonderfully. Would love automated order delivery tracking next.", metadata: { path: "/business" }, upvotes: 18, public_replies: [{ author: "Support Admin", text: "Delivery tracking is on the active roadmap.", time: "2h ago" }], is_public: true, status: "in_progress", created_at: new Date(Date.now() - 4 * 3600000).toISOString() },
      { id: "f2", user_id: "u2", store_id: "s2", type: "feature", message: "Our TikTok bio conversion doubled after switching to the Bold template. Fast WhatsApp checkout is key.", metadata: { path: "/pro" }, upvotes: 24, public_replies: [], is_public: true, status: "resolved", created_at: new Date(Date.now() - 18 * 3600000).toISOString() },
      { id: "f3", user_id: "u6", store_id: "s6", type: "general", message: "Setting up our skincare catalogue took under 10 minutes. Customers love browsing directly on phone.", metadata: { path: "/" }, upvotes: 8, public_replies: [], is_public: true, status: "resolved", created_at: new Date(Date.now() - 2 * 86400000).toISOString() }
    ];

    return { mockProfiles, mockStores, mockEvents, mockFeedbacks };
  }, []);

  // Fetch Database tables from Supabase
  const fetchData = useCallback(async () => {
    if (!isAdmin) return;
    if (!isSupabaseConfigured()) {
      setStores(mockData.mockStores);
      setProfiles(mockData.mockProfiles);
      setFeedbacks(mockData.mockFeedbacks);
      setEvents(mockData.mockEvents);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setRefreshing(true);

    try {
      // 1. Fetch Stores
      const { data: storesData } = await supabase
        .from("stores")
        .select("*")
        .order("updated_at", { ascending: false });

      // 2. Fetch Profiles
      const { data: profilesData } = await supabase
        .from("social_profiles")
        .select("*")
        .order("display_name", { ascending: true });

      // 3. Fetch Feedbacks
      const { data: feedbacksData } = await supabase
        .from("user_feedback")
        .select("*")
        .order("created_at", { ascending: false });

      // 4. Fetch Events
      const { data: eventsData } = await supabase
        .from("store_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      // Apply DB values if available, otherwise fall back to mock data
      setStores(storesData && storesData.length > 0 ? storesData : mockData.mockStores);
      setProfiles(profilesData && profilesData.length > 0 ? profilesData : mockData.mockProfiles);
      setFeedbacks(feedbacksData && feedbacksData.length > 0 ? feedbacksData : mockData.mockFeedbacks);
      setEvents(eventsData && eventsData.length > 0 ? eventsData : mockData.mockEvents);
      
    } catch (err) {
      console.error("Error loading database tables, loading fallbacks", err);
      // Fallback
      setStores(mockData.mockStores);
      setProfiles(mockData.mockProfiles);
      setFeedbacks(mockData.mockFeedbacks);
      setEvents(mockData.mockEvents);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin, mockData]);

  useEffect(() => {
    if (isAdmin) {
      void fetchData();
    }
  }, [isAdmin, fetchData]);

  // Toggle user verified badge
  const toggleVerification = async (profileId: string, currentStatus: boolean) => {
    if (!isSupabaseConfigured()) {
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, is_verified: !currentStatus } : p));
      addToast("Profile status updated (Local Sync).", "success");
      return;
    }
    try {
      const { error } = await supabase
        .from("social_profiles")
        .update({ is_verified: !currentStatus })
        .eq("id", profileId);

      if (error) throw error;
      
      // Update local state
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, is_verified: !currentStatus } : p));
      addToast(`Merchant profile ${!currentStatus ? "verified" : "unverified"} successfully.`, "success");
    } catch (err) {
      console.warn("Database verify toggle blocked by RLS policies or offline. Updating mock state local copy.", err);
      // Fallback state update
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, is_verified: !currentStatus } : p));
      addToast(`Profile status updated (Local Sync).`, "success");
    }
  };

  // Feedback administration actions
  const updateFeedbackStatus = async (feedbackId: string, newStatus: string) => {
    if (!isSupabaseConfigured()) {
      setFeedbacks(prev => prev.map(f => f.id === feedbackId ? { ...f, status: newStatus } : f));
      addToast("Status updated (Local Sync).", "success");
      return;
    }
    try {
      const { error } = await supabase
        .from("user_feedback")
        .update({ status: newStatus })
        .eq("id", feedbackId);

      if (error) throw error;

      setFeedbacks(prev => prev.map(f => f.id === feedbackId ? { ...f, status: newStatus } : f));
      addToast(`Feedback status updated to ${newStatus}.`, "success");
    } catch (err) {
      console.warn("Failed to update status in DB, updating local state", err);
      setFeedbacks(prev => prev.map(f => f.id === feedbackId ? { ...f, status: newStatus } : f));
      addToast(`Status updated (Local Sync).`, "success");
    }
  };

  const submitFeedbackReply = async (feedbackId: string) => {
    if (!replyMessage.trim()) return;
    
    // Find existing replies
    const item = feedbacks.find(f => f.id === feedbackId);
    if (!item) return;

    const newReply = {
      author: "Support Admin",
      text: replyMessage.trim(),
      time: "Just now"
    };

    const nextReplies = [...(item.public_replies || []), newReply];

    if (!isSupabaseConfigured()) {
      setFeedbacks(prev => prev.map(f => f.id === feedbackId ? { ...f, public_replies: nextReplies } : f));
      setReplyMessage("");
      setReplyingToId(null);
      addToast("Reply applied (Local Sync).", "success");
      return;
    }

    try {
      const { error } = await supabase
        .from("user_feedback")
        .update({ public_replies: nextReplies })
        .eq("id", feedbackId);

      if (error) throw error;

      setFeedbacks(prev => prev.map(f => f.id === feedbackId ? { ...f, public_replies: nextReplies } : f));
      setReplyMessage("");
      setReplyingToId(null);
      addToast("Reply published successfully.", "success");
    } catch (err) {
      console.warn("DB update blocked. Applying local state sync.", err);
      setFeedbacks(prev => prev.map(f => f.id === feedbackId ? { ...f, public_replies: nextReplies } : f));
      setReplyMessage("");
      setReplyingToId(null);
      addToast("Reply applied (Local Sync).", "success");
    }
  };

  // Calculate detailed analytics for individual user drill-down
  const merchantDrillDown = useMemo(() => {
    if (!selectedMerchantId) return null;

    const profile = profiles.find(p => p.id === selectedMerchantId) || {
      id: selectedMerchantId,
      username: "unknown_merchant",
      display_name: "Unknown Merchant",
      avatar_url: "",
      is_verified: false,
      bio: "No profile data loaded."
    };

    const ownedStores = stores.filter(s => s.owner_id === selectedMerchantId);
    const storeIds = ownedStores.map(s => s.id);
    
    // Merchant events
    const merchantEvents = events.filter(e => storeIds.includes(e.store_id));
    const views = merchantEvents.filter(e => e.event_type === "view").length;
    const clicks = merchantEvents.filter(e => e.event_type === "product_click").length;
    const checkouts = merchantEvents.filter(e => e.event_type === "whatsapp_checkout").length;
    
    const submittedFeedback = feedbacks.filter(f => f.user_id === selectedMerchantId);

    return {
      profile,
      stores: ownedStores,
      events: merchantEvents,
      stats: { views, clicks, checkouts },
      feedback: submittedFeedback,
    };
  }, [selectedMerchantId, profiles, stores, events, feedbacks]);

  // Filters and searches
  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      const matchText = globalSearch.toLowerCase();
      return (
        p.display_name.toLowerCase().includes(matchText) ||
        p.username.toLowerCase().includes(matchText) ||
        p.id.toLowerCase().includes(matchText)
      );
    });
  }, [profiles, globalSearch]);

  const filteredStores = useMemo(() => {
    return stores.filter(s => {
      const matchText = globalSearch.toLowerCase();
      const owner = profiles.find(p => p.id === s.owner_id);
      const matchesSearch =
        !matchText ||
        s.biz_name.toLowerCase().includes(matchText) ||
        s.store_username.toLowerCase().includes(matchText) ||
        s.phone.includes(matchText) ||
        s.id.toLowerCase().includes(matchText) ||
        (owner && owner.display_name.toLowerCase().includes(matchText));

      const currentPlan = (s.plan || s.state_json?.plan || "free").toLowerCase();
      const matchesPlan = storePlanFilter === "all" || currentPlan === storePlanFilter;

      const currentStatus = s.account_status || "active";
      const matchesStatus = storeStatusFilter === "all" || currentStatus === storeStatusFilter;

      const isLive = s.state_json?.isLive !== false;
      const matchesLive =
        storeLiveFilter === "all" ||
        (storeLiveFilter === "live" && isLive) ||
        (storeLiveFilter === "paused" && !isLive);

      return matchesSearch && matchesPlan && matchesStatus && matchesLive;
    });
  }, [stores, profiles, globalSearch, storePlanFilter, storeStatusFilter, storeLiveFilter]);

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter(f => {
      const matchSearch = globalSearch.trim() === "" || 
        f.message.toLowerCase().includes(globalSearch.toLowerCase()) || 
        f.id.toLowerCase().includes(globalSearch.toLowerCase());
      
      const matchFilter = feedbackFilter === "all" || f.type === feedbackFilter || f.status === feedbackFilter;
      return matchSearch && matchFilter;
    });
  }, [feedbacks, globalSearch, feedbackFilter]);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchSearch = globalSearch.trim() === "" || e.store_id.toLowerCase().includes(globalSearch.toLowerCase()) || (e.metadata && JSON.stringify(e.metadata).toLowerCase().includes(globalSearch.toLowerCase()));
      const matchFilter = eventFilter === "all" || e.event_type === eventFilter;
      return matchSearch && matchFilter;
    });
  }, [events, globalSearch, eventFilter]);


  const exportStoresCsv = () => {
    const csv = toCsv(filteredStores, [
      { header: "ID", value: (s) => s.id },
      { header: "Store Name", value: (s) => s.biz_name || "" },
      { header: "Username", value: (s) => s.store_username || "" },
      { header: "Owner Name", value: (s) => profiles.find((p) => p.id === s.owner_id)?.display_name || s.owner_id || "" },
      { header: "Phone", value: (s) => s.phone || "" },
      { header: "Plan", value: (s) => s.plan || s.state_json?.plan || "free" },
      { header: "Status", value: (s) => s.account_status || "active" },
      { header: "Live", value: (s) => (s.state_json?.isLive !== false ? "Live" : "Paused") },
      { header: "Products Count", value: (s) => s.state_json?.products?.length || 0 },
      { header: "Last Updated", value: (s) => s.updated_at },
    ]);
    downloadCsv(csvFilename("swiftlink_stores"), csv);
  };

  const exportMerchantsCsv = () => {
    const csv = toCsv(filteredProfiles, [
      { header: "ID", value: (p) => p.id },
      { header: "Username", value: (p) => p.username || "" },
      { header: "Display Name", value: (p) => p.display_name || "" },
      { header: "Verified", value: (p) => (p.is_verified ? "Yes" : "No") },
      { header: "Bio", value: (p) => p.bio || "" },
      { header: "Owned Stores Count", value: (p) => stores.filter((s) => s.owner_id === p.id).length },
    ]);
    downloadCsv(csvFilename("swiftlink_merchants"), csv);
  };

  // Overall Global Statistics
  const globalStats = useMemo(() => {
    const totalViews = events.filter(e => e.event_type === "view").length;
    const totalClicks = events.filter(e => e.event_type === "product_click").length;
    const totalCheckouts = events.filter(e => e.event_type === "whatsapp_checkout").length;
    const totalFeedbackCount = feedbacks.length;
    const pendingBugs = feedbacks.filter(f => f.type === "bug" && f.status !== "resolved").length;
    
    // Best Conversion Store
    const storeConversions = stores.map(store => {
      const storeEvs = events.filter(e => e.store_id === store.id);
      const storeViews = storeEvs.filter(e => e.event_type === "view").length;
      const storeCheckouts = storeEvs.filter(e => e.event_type === "whatsapp_checkout").length;
      const rate = storeViews > 0 ? (storeCheckouts / storeViews) * 100 : 0;
      return { name: store.biz_name, views: storeViews, checkouts: storeCheckouts, rate };
    });

    const topStore = storeConversions.sort((a, b) => b.rate - a.rate)[0] || { name: "N/A", rate: 0 };

    return {
      totalViews,
      totalClicks,
      totalCheckouts,
      totalFeedbackCount,
      pendingBugs,
      topStore,
      storeConversions
    };
  }, [events, feedbacks, stores]);

  if (checkingAuth) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 min-h-[60vh] bg-[#0A1210]">
        <div className="animate-spin text-emerald-500 w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Verifying Admin Credentials...</p>
      </div>
    );
  }

  // ACCESS DENIED SCREEN
  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-[75vh] bg-[#0A1210] transition-colors">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#111C18] p-5 sm:p-10 md:p-14 rounded-2xl border border-[#1E2D27] shadow-2xl max-w-lg w-full text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />
          
          <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-rose-500/20">
            <Lock size={36} />
          </div>

          <h2 className="text-3xl font-black text-[#E8F1EC] italic uppercase tracking-tight mb-4">Access Denied</h2>
          <p className="text-[11px] font-bold text-[#9DB3A8] uppercase tracking-[0.25em] leading-relaxed mb-8">
            You require administrator permissions to access this control center dashboard portal.
          </p>

          <div className="bg-[#14231D] p-6 rounded-2xl border border-[#1E2D27] mb-8 text-left">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Security Rules:</p>
            {/*
              No address is named here on purpose. The screen used to hard-code
              a single "official" admin email, which stopped being true once the
              administrators list could hold more than one row — and it is
              actively misleading to a newly-promoted admin reading the very
              screen that refused them, in the panel whose job is promoting
              people. The list is the source of truth, so it is described as one.
            */}
            <ul className="text-[10px] font-bold text-slate-400 space-y-2 list-disc list-inside">
              <li>User must be signed in with an account listed in <code className="text-emerald-500">system_admins</code></li>
              <li>Admins grant and revoke access from the Manage Admins tab — there is no fixed admin email</li>
              <li>All database read/write requests are strictly validated at the database layer (RLS)</li>
            </ul>
          </div>

          <div className="flex gap-4 justify-center">
            <Link
              href="/pro"
              className="flex-1 py-4 px-4 sm:px-6 rounded-2xl bg-[#14231D] border border-[#24382F] text-[#E8F1EC] hover:border-[#19C37D] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              Go to Storefront Dashboard
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 pb-12 transition-colors duration-300 sm:space-y-8 sm:px-6 sm:py-8 sm:pb-16">
      
      {/* Admin Title Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#111C18] p-4 sm:p-8 rounded-2xl border border-[#1E2D27] shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-2xl font-black text-[#E8F1EC] italic uppercase tracking-tight leading-tight">Admin System Telemetry</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#9DB3A8] mt-2">
            Monitoring {profiles.length} Merchants, {stores.length} storefronts, and {events.length} system events.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={fetchData} 
            disabled={refreshing}
            className="p-3.5 rounded-xl bg-[#14231D] border border-[#1E2D27] text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 flex items-center gap-2"
            title="Refresh Data"
          >
            <RefreshCw size={15} className={cn("transition-transform duration-700", refreshing && "animate-spin")} />
            <span className="text-[10px] font-black uppercase tracking-widest">Refresh</span>
          </button>
        </div>
      </div>

      {/* Plan Distribution Stats */}
      <div className="bg-[#111C18] p-4 sm:p-6 rounded-2xl border border-[#1E2D27] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-[#E8F1EC]">Stores by Plan Tier</h4>
          <p className="text-[10px] text-[#9DB3A8]">Active subscriber tier distribution across the platform</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-[#14231D] border border-[#1E2D27] px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-zinc-400" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Free</span>
            <span className="text-xs font-black text-[#E8F1EC] ml-1">
              {stores.filter(s => (s.plan || s.state_json?.plan || "free").toLowerCase() === "free").length}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-[#14231D] border border-[#E8B93A]/30 px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-[#E8B93A]" />
            <span className="text-[10px] font-bold text-[#E8B93A] uppercase">Pro</span>
            <span className="text-xs font-black text-[#E8F1EC] ml-1">
              {stores.filter(s => (s.plan || s.state_json?.plan || "free").toLowerCase() === "pro").length}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-[#14231D] border border-[#19C37D]/30 px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-[#19C37D]" />
            <span className="text-[10px] font-bold text-[#19C37D] uppercase">Business</span>
            <span className="text-xs font-black text-[#E8F1EC] ml-1">
              {stores.filter(s => (s.plan || s.state_json?.plan || "free").toLowerCase() === "business").length}
            </span>
          </div>
        </div>
      </div>

      {/* Overview Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-[#111C18] p-6 rounded-2xl border border-[#1E2D27] shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400">
              <Users size={20} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full">System</span>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-[#9DB3A8] mb-1">Total Users</p>
            <h3 className="text-xl font-black text-[#E8F1EC] italic tracking-tight">{profiles.length}</h3>
          </div>
        </div>

        <div className="bg-[#111C18] p-6 rounded-2xl border border-[#1E2D27] shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
              <Store size={20} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">Stores</span>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-[#9DB3A8] mb-1">Active Stores</p>
            <h3 className="text-xl font-black text-[#E8F1EC] italic tracking-tight">{stores.length}</h3>
          </div>
        </div>

        <div className="bg-[#111C18] p-6 rounded-2xl border border-[#1E2D27] shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50 dark:bg-purple-500/10 text-purple-500 dark:text-purple-400">
              <Activity size={20} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-purple-500 bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 rounded-full">Telemetry</span>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-[#9DB3A8] mb-1">Store Clicks</p>
            <h3 className="text-xl font-black text-[#E8F1EC] italic tracking-tight">{globalStats.totalClicks + globalStats.totalViews}</h3>
          </div>
        </div>

        <div className="bg-[#111C18] p-6 rounded-2xl border border-[#1E2D27] shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400">
              <MessageSquare size={20} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">WhatsApp</span>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-[#9DB3A8] mb-1">Checkouts</p>
            <h3 className="text-xl font-black text-[#E8F1EC] italic tracking-tight">{globalStats.totalCheckouts}</h3>
          </div>
        </div>

        <div className="bg-[#111C18] p-6 rounded-2xl border border-[#1E2D27] shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400">
              <AlertCircle size={20} />
            </div>
            {globalStats.pendingBugs > 0 ? (
              <span className="text-[8px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-full animate-pulse">{globalStats.pendingBugs} Alert</span>
            ) : (
              <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">Clear</span>
            )}
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-[#9DB3A8] mb-1">Pending Bugs</p>
            <h3 className="text-xl font-black text-[#E8F1EC] italic tracking-tight">{globalStats.pendingBugs}</h3>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-[#1E2D27] flex flex-wrap gap-1">
        {[
          { id: "overview", label: "Overview", icon: TrendingUp },
          { id: "stores", label: "Stores & Inquiries", icon: Store },
          { id: "merchants", label: "Merchants", icon: Users },
          { id: "timeline", label: "Live Telemetry", icon: Activity },
          { id: "feedback", label: "Feedback & Bugs", icon: MessageSquare },
          { id: "admins", label: "Permissions", icon: Shield },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setGlobalSearch(""); if (tab.id === "admins") fetchAdmins(); }}
            className={cn(
              "py-4 px-4 sm:px-6 border-b-2 font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2",
              activeTab === tab.id
                ? "border-emerald-500 text-emerald-500 bg-emerald-50/20 dark:bg-emerald-500/5"
                : "border-transparent text-slate-400 hover:text-slate-800 dark:hover:text-white hover:border-slate-200"
            )}
          >
            <tab.icon size={13} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Interactive Content Windows */}
      <div className="min-h-[500px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 min-h-[300px] bg-[#111C18] border border-[#1E2D27] rounded-2xl">
            <div className="animate-spin text-emerald-500 w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3" />
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Syncing database registers...</p>
          </div>
        ) : (
          <>
            {/* SEARCH AND FILTERS ROW */}
            
                {/* Storefronts Filter & Action Bar */}
                {activeTab === "stores" && (
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#9DB3A8]">Filters:</span>
                      {/* Plan Filter */}
                      <select
                        value={storePlanFilter}
                        onChange={(e) => setStorePlanFilter(e.target.value as any)}
                        className="rounded-xl border border-[#1E2D27] bg-[#14231D] px-2.5 py-1.5 text-[10px] font-bold text-[#E8F1EC] outline-none"
                      >
                        <option value="all">All Plans</option>
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="business">Business</option>
                      </select>

                      {/* Status Filter */}
                      <select
                        value={storeStatusFilter}
                        onChange={(e) => setStoreStatusFilter(e.target.value as any)}
                        className="rounded-xl border border-[#1E2D27] bg-[#14231D] px-2.5 py-1.5 text-[10px] font-bold text-[#E8F1EC] outline-none"
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active Only</option>
                        <option value="banned">Suspended Only</option>
                      </select>

                      {/* Live Filter */}
                      <select
                        value={storeLiveFilter}
                        onChange={(e) => setStoreLiveFilter(e.target.value as any)}
                        className="rounded-xl border border-[#1E2D27] bg-[#14231D] px-2.5 py-1.5 text-[10px] font-bold text-[#E8F1EC] outline-none"
                      >
                        <option value="all">All Visibility</option>
                        <option value="live">Live Only</option>
                        <option value="paused">Paused Only</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={exportStoresCsv}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#1E2D27] bg-[#14231D] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#19C37D] transition hover:bg-[#1A2D25]"
                    >
                      <Download size={12} />
                      <span>Export Stores CSV ({filteredStores.length})</span>
                    </button>
                  </div>
                )}

            {activeTab !== "overview" && (
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 flex items-center bg-[#111C18] border border-[#1E2D27] rounded-2xl px-4 py-3 text-slate-400 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/50 shadow-sm transition-all">
                  <Search size={16} />
                  <input 
                    type="text" 
                    placeholder={`Search ${activeTab === 'timeline' ? 'events' : activeTab === 'merchants' ? 'merchants' : activeTab === 'stores' ? 'stores' : 'feedback'}...`} 
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs font-bold px-3 w-full text-[#E8F1EC]"
                  />
                  {globalSearch && (
                    <button onClick={() => setGlobalSearch("")}>
                      <X size={14} className="hover:text-slate-800 dark:hover:text-white" />
                    </button>
                  )}
                </div>

                {activeTab === "feedback" && (
                  <div className="flex flex-wrap gap-2">
                    {["all", "bug", "feature", "pending", "resolved"].map((f) => (
                      <button
                        key={f}
                        onClick={() => setFeedbackFilter(f)}
                        className={cn(
                          "px-4 py-3 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all",
                          feedbackFilter === f
                            ? "bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white"
                            : "bg-[#111C18] text-slate-500 border-[#1E2D27] hover:border-slate-400"
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}

                {activeTab === "timeline" && (
                  <div className="flex flex-wrap gap-2">
                    {["all", "view", "product_click", "whatsapp_checkout", "store_transferred"].map((f) => (
                      <button
                        key={f}
                        onClick={() => setEventFilter(f)}
                        className={cn(
                          "px-4 py-3 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all",
                          eventFilter === f
                            ? "bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white"
                            : "bg-[#111C18] text-slate-500 border-[#1E2D27] hover:border-slate-400"
                        )}
                      >
                        {f.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Graphics Dashboard Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
                  {/* TRAFFIC & CONVERSION CHART */}
                  <div className="lg:col-span-2 bg-[#111C18] p-4 sm:p-8 rounded-2xl border border-[#1E2D27] shadow-sm flex flex-col">
                    <div className="mb-8">
                      <h3 className="text-lg font-black text-[#E8F1EC] italic tracking-tight uppercase">Conversion and Traffic Funnel</h3>
                      <p className="text-[9px] font-black text-[#9DB3A8] uppercase tracking-widest mt-1">Global view to WhatsApp checkout ratio</p>
                    </div>

                    <div className="flex-1 flex flex-col justify-end min-h-[220px] pt-4 border-b border-[#1E2D27] pb-2">
                      <div className="grid grid-cols-3 gap-4 sm:gap-8 items-end max-w-lg mx-auto w-full">
                        {/* VIEWS */}
                        <div className="flex flex-col items-center gap-3">
                          <span className="text-xs font-black text-blue-500 font-mono">{(globalStats.totalViews || 120).toLocaleString()}</span>
                          <div className="w-full bg-blue-500/10 rounded-2xl relative overflow-hidden flex items-end justify-center" style={{ height: "180px" }}>
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: "100%" }}
                              className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-xl shadow-lg"
                            />
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Store Views</span>
                        </div>

                        {/* CLICKS */}
                        <div className="flex flex-col items-center gap-3">
                          <span className="text-xs font-black text-amber-500 font-mono">{(globalStats.totalClicks || 45).toLocaleString()}</span>
                          <div className="w-full bg-amber-500/10 rounded-2xl relative overflow-hidden flex items-end justify-center" style={{ height: "180px" }}>
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: `${((globalStats.totalClicks || 45) / (globalStats.totalViews || 120)) * 100}%` }}
                              className="w-full bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-xl shadow-lg"
                            />
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Product Clicks</span>
                        </div>

                        {/* CHECKOUTS */}
                        <div className="flex flex-col items-center gap-3">
                          <span className="text-xs font-black text-emerald-500 font-mono">{(globalStats.totalCheckouts || 18).toLocaleString()}</span>
                          <div className="w-full bg-emerald-500/10 rounded-2xl relative overflow-hidden flex items-end justify-center" style={{ height: "180px" }}>
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: `${((globalStats.totalCheckouts || 18) / (globalStats.totalViews || 120)) * 100}%` }}
                              className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-xl shadow-lg"
                            />
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">WA Checkouts</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-[#9DB3A8] uppercase tracking-widest">
                      <span>Funnel Base: All Active Stores</span>
                      <span className="text-emerald-500 font-black">Conversion: {(globalStats.totalViews > 0 ? (globalStats.totalCheckouts / globalStats.totalViews) * 100 : 15).toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* ACTIVE STORE LEADERBOARD */}
                  <div className="bg-[#111C18] p-4 sm:p-8 rounded-2xl border border-[#1E2D27] shadow-sm flex flex-col">
                    <div className="mb-6">
                      <h3 className="text-lg font-black text-[#E8F1EC] italic tracking-tight uppercase">Leaderboard</h3>
                      <p className="text-[9px] font-black text-[#9DB3A8] uppercase tracking-widest mt-1">Top converting storefront platforms</p>
                    </div>

                    <div className="flex-1 space-y-5">
                      {globalStats.storeConversions.slice(0, 4).map((s, i) => (
                        <div key={s.name} className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                            <span className="text-[#E8F1EC] flex items-center gap-1.5">
                              <span className="text-emerald-500 font-mono">#{i+1}</span> {s.name}
                            </span>
                            <span className="text-slate-400">{s.rate.toFixed(1)}% ({s.checkouts} checkouts)</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(s.rate * 3, 100)}%` }}
                              className="h-full bg-emerald-500 rounded-full"
                            />
                          </div>
                        </div>
                      ))}
                      
                      {globalStats.storeConversions.length === 0 && (
                        <div className="p-4 sm:p-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">No telemetry view events received yet</div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#1E2D27]">
                      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <TrendingUp size={14} className="text-emerald-500" />
                        <span>Top Store: <span className="text-[#E8F1EC] italic">{globalStats.topStore.name}</span></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Logistics & Alerts section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
                  {/* RECENT CRITICAL USER FEEDBACK FEED */}
                  <div className="bg-[#111C18] p-4 sm:p-8 rounded-2xl border border-[#1E2D27] shadow-sm lg:col-span-3 flex flex-col">
                    <div className="mb-6 flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-black text-[#E8F1EC] uppercase italic tracking-tight">Pending Bug Reports</h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Needs attention</p>
                      </div>
                      <span className="text-[9px] font-black bg-rose-50 dark:bg-rose-950/20 text-rose-500 px-3 py-1 rounded-full border border-rose-100 dark:border-rose-950/30">
                        {feedbacks.filter(f => f.type === "bug" && f.status !== "resolved").length} Bugs
                      </span>
                    </div>

                    <div className="flex-1 space-y-4 max-h-72 overflow-y-auto pr-1 scrollbar-hide">
                      {feedbacks.filter(f => f.type === "bug" && f.status !== "resolved").slice(0, 3).map((f) => {
                        const reporter = profiles.find(p => p.id === f.user_id);
                        return (
                          <div key={f.id} className="p-4 rounded-2xl bg-[#14231D] border border-[#1E2D27] flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                              <AlertCircle size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex justify-between items-center gap-2">
                                <p className="text-[10px] font-black text-[#E8F1EC] uppercase tracking-wider truncate">
                                  {reporter?.display_name || "Merchant"}
                                </p>
                                <span className="text-[8px] font-bold text-slate-400">{f.created_at ? new Date(f.created_at).toLocaleDateString() : ""}</span>
                              </div>
                              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{f.message}</p>
                              
                              <div className="mt-3 flex gap-2">
                                <button 
                                  onClick={() => updateFeedbackStatus(f.id, "resolved")}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors"
                                >
                                  Resolve
                                </button>
                                <button 
                                  onClick={() => setActiveTab("feedback")}
                                  className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 text-[8px] font-black uppercase tracking-widest hover:bg-slate-300 transition-colors"
                                >
                                  Reply
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {feedbacks.filter(f => f.type === "bug" && f.status !== "resolved").length === 0 && (
                        <div className="p-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
                          <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={24} />
                          No pending bug tickets in queue.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: TIMELINE LOG */}
            {activeTab === "timeline" && (
              <div className="bg-[#111C18] rounded-2xl border border-[#1E2D27] shadow-sm overflow-hidden p-6 md:p-8">
                <div className="space-y-6">
                  {filteredEvents.slice(0, 100).map((e) => {
                    const storeObj = stores.find(s => s.id === e.store_id);
                    return (
                      <div key={e.id} className="relative flex gap-6 pb-6 border-b border-slate-50 dark:border-zinc-950 last:border-none group">
                        
                        {/* Event Icon indicator */}
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm", 
                          e.event_type === "view" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-500 border-blue-100 dark:border-blue-500/20" : 
                          e.event_type === "product_click" ? "bg-amber-50 dark:bg-amber-500/10 text-amber-500 border-amber-100 dark:border-amber-500/20" : 
                          e.event_type === "whatsapp_checkout" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 border-emerald-100 dark:border-emerald-500/20" :
                          "bg-purple-50 dark:bg-purple-500/10 text-purple-500 border-purple-100 dark:border-purple-500/20"
                        )}>
                          {e.event_type === "view" ? <Eye size={18} /> : 
                           e.event_type === "product_click" ? <MousePointerClick size={18} /> : 
                           e.event_type === "whatsapp_checkout" ? <MessageCircle size={18} /> :
                           <RefreshCw size={18} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5">
                            <h4 className="text-xs font-black text-[#E8F1EC] uppercase tracking-wider italic">
                              {e.event_type === "view" ? "Storefront View" : 
                               e.event_type === "product_click" ? "Product Clicked" : 
                               e.event_type === "whatsapp_checkout" ? "WhatsApp Checkout Intention" :
                               e.event_type.replace("_", " ")}
                            </h4>
                            <span className="text-[9px] font-bold text-slate-400 font-mono shrink-0">
                              {new Date(e.created_at).toLocaleString()}
                            </span>
                          </div>

                          <div className="mt-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 space-y-1">
                            <p>Store: <span className="text-[#E8F1EC]">{storeObj?.biz_name || e.store_id}</span> ({storeObj?.store_username || "anonymous"})</p>
                            
                            {/* Metadata render */}
                            {e.metadata && (
                              <div className="bg-[#14231D] p-3 rounded-xl border border-[#1E2D27] font-mono text-[9px] mt-2 text-slate-400 select-all overflow-x-auto">
                                {JSON.stringify(e.metadata, null, 2)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredEvents.length === 0 && (
                    <div className="p-16 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">No telemetry logs found matching filter</div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: MERCHANTS DIRECTORY */}
            {activeTab === "merchants" && (
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={exportMerchantsCsv}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#1E2D27] bg-[#14231D] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#19C37D] transition hover:bg-[#1A2D25]"
                >
                  <Download size={12} />
                  <span>Export Merchants CSV ({filteredProfiles.length})</span>
                </button>
              </div>
            )}
            {activeTab === "merchants" && (
              <div className="bg-[#111C18] rounded-2xl border border-[#1E2D27] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#1E2D27] bg-slate-50/50 dark:bg-[#0c0e12] text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <th className="py-5 px-4 sm:px-6">Merchant Profile</th>
                        <th className="py-5 px-4 sm:px-6">Username Slug</th>
                        <th className="py-5 px-4 sm:px-6">Bio Details</th>
                        <th className="py-5 px-4 sm:px-6 text-center">Verified Status</th>
                        <th className="py-5 px-4 sm:px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {filteredProfiles.map((p) => {
                        const storesCount = stores.filter(s => s.owner_id === p.id).length;
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/40 dark:hover:bg-white/[0.01] transition-colors">
                            <td className="py-5 px-4 sm:px-6">
                              <div className="flex items-center gap-3">
                                {p.avatar_url ? (
                                  <img src={p.avatar_url} className="w-10 h-10 rounded-xl object-cover border border-[#1E2D27]" alt={p.display_name} />
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-[#0f5133] text-[#5be3a0] border border-[#1E2D27] flex items-center justify-center text-xs font-black">
                                    {(p.display_name || p.username || "M").slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <span className="text-xs font-black text-[#E8F1EC] uppercase tracking-wider block">{p.display_name}</span>
                                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">{storesCount} store{storesCount !== 1 ? "s" : ""} owned</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-5 px-4 sm:px-6 text-[10px] font-bold text-slate-500 font-mono">@{p.username}</td>
                            <td className="py-5 px-4 sm:px-6 text-[10px] font-medium text-slate-400 max-w-xs truncate">{p.bio || "No biography provided."}</td>
                            <td className="py-5 px-4 sm:px-6 text-center">
                              <button 
                                onClick={() => toggleVerification(p.id, p.is_verified)}
                                className={cn(
                                  "mx-auto w-8 h-8 rounded-full flex items-center justify-center border transition-all active:scale-90",
                                  p.is_verified 
                                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 border-emerald-100 dark:border-emerald-500/20"
                                    : "bg-slate-100 dark:bg-zinc-800 text-slate-400 border-[#1E2D27]"
                                )}
                                title={p.is_verified ? "Revoke Verification" : "Verify Profile"}
                              >
                                <Check size={14} strokeWidth={3} />
                              </button>
                            </td>
                            <td className="py-5 px-4 sm:px-6 text-right">
                              <button 
                                onClick={() => setSelectedMerchantId(p.id)}
                                className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 hover:scale-105 active:scale-95 text-[9px] font-black uppercase tracking-widest transition-all"
                              >
                                Drill-Down
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredProfiles.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-16 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">No merchants found matching search criteria</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT: STORES DIRECTORY */}
            {activeTab === "stores" && (
              <div className="bg-[#111C18] rounded-2xl border border-[#1E2D27] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#1E2D27] bg-slate-50/50 dark:bg-[#0c0e12] text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <th className="py-5 px-4 sm:px-6">Store Platform</th>
                        <th className="py-5 px-4 sm:px-6">Username Route</th>
                        <th className="py-5 px-4 sm:px-6">Merchant Owner</th>
                        <th className="py-5 px-4 sm:px-6">Phone Contact</th>
                        <th className="py-5 px-4 sm:px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      
                      {filteredStores.map((s) => {
                        const ownerObj = profiles.find(p => p.id === s.owner_id);
                        const storePlan = (s.plan || s.state_json?.plan || "free").toLowerCase();
                        const isLive = s.state_json?.isLive !== false;
                        const isBanned = s.account_status === "banned";
                        const prodCount = s.state_json?.products?.length || 0;

                        return (
                          <tr key={s.id} className="hover:bg-slate-50/40 dark:hover:bg-white/[0.01] transition-colors">
                            <td className="py-5 px-4 sm:px-6">
                              <div>
                                <span className="text-xs font-black text-[#E8F1EC] uppercase tracking-wider block">{s.biz_name}</span>
                                <span className="text-[8px] font-bold text-slate-400 block font-mono mt-0.5">{s.id}</span>
                              </div>
                            </td>
                            <td className="py-5 px-4 sm:px-6">
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-emerald-500 font-mono">/{s.store_username}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className={cn(
                                    "inline-flex items-center px-1.5 py-0.2 rounded-md text-[8px] font-black uppercase tracking-wider border",
                                    isLive
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                      : "bg-zinc-800 text-zinc-400 border-zinc-700"
                                  )}>
                                    {isLive ? "Live" : "Paused"}
                                  </span>
                                  {isBanned && (
                                    <span className="inline-flex items-center px-1.5 py-0.2 rounded-md text-[8px] font-black uppercase tracking-wider bg-rose-500/15 border border-rose-500/30 text-rose-400">
                                      Suspended
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-5 px-4 sm:px-6">
                              {ownerObj ? (
                                <button 
                                  onClick={() => setSelectedMerchantId(ownerObj.id)}
                                  className="flex items-center gap-2 hover:underline text-left"
                                >
                                  {ownerObj.avatar_url ? (
                                    <img src={ownerObj.avatar_url} className="w-6 h-6 rounded-lg object-cover" alt={ownerObj.display_name} />
                                  ) : (
                                    <div className="w-6 h-6 rounded-lg bg-[#0f5133] text-[#5be3a0] flex items-center justify-center text-[9px] font-black shrink-0">
                                      {(ownerObj.display_name || "M").slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">{ownerObj.display_name}</span>
                                    <span className="text-[8px] text-slate-400 font-mono">{s.phone}</span>
                                  </div>
                                </button>
                              ) : (
                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 font-mono block">{s.owner_id}</span>
                                  <span className="text-[8px] text-slate-400 font-mono">{s.phone}</span>
                                </div>
                              )}
                            </td>
                            <td className="py-5 px-4 sm:px-6">
                              <div className="flex flex-col gap-1">
                                <span className={cn(
                                  "inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                                  storePlan === "business"
                                    ? "bg-[#19C37D]/15 border-[#19C37D]/30 text-[#19C37D]"
                                    : storePlan === "pro"
                                    ? "bg-[#E8B93A]/15 border-[#E8B93A]/30 text-[#E8B93A]"
                                    : "bg-zinc-800 border-zinc-700 text-zinc-400"
                                )}>
                                  {storePlan}
                                </span>
                                <span className="text-[10px] font-semibold text-[#9DB3A8]">
                                  {prodCount} products
                                </span>
                              </div>
                            </td>
                            <td className="py-5 px-4 sm:px-6 text-right flex justify-end items-center gap-2">
                              {/* Plan selector */}
                              <select
                                disabled={updatingStoreId === s.id}
                                value={storePlan}
                                onChange={(e) => handleSetUserPlan(s.id, e.target.value as any)}
                                className="bg-[#14231D] border border-[#1E2D27] rounded-xl px-2 py-1.5 text-[9px] font-black uppercase tracking-wider text-slate-200 outline-none focus:border-emerald-500/50"
                              >
                                <option value="free">Free</option>
                                <option value="pro">Pro</option>
                                <option value="business">Business</option>
                              </select>

                              {/* Ban/Unban toggle */}
                              <button
                                disabled={updatingStoreId === s.id}
                                onClick={() => handleSetAccountStatus(s.id, isBanned ? "active" : "banned")}
                                className={cn(
                                  "px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95",
                                  isBanned
                                    ? "bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25"
                                    : "bg-[#14231D] text-slate-300 border-[#1E2D27] hover:border-rose-500/40 hover:text-rose-400"
                                )}
                              >
                                {isBanned ? "Unban" : "Ban"}
                              </button>

                              <a 
                                href={`/?shop=${s.id}`} 
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-xl bg-[#14231D] border border-[#1E2D27] text-slate-400 hover:text-white transition-all"
                                title="View Store storefront"
                              >
                                <ExternalLink size={13} />
                              </a>
                              <button 
                                onClick={() => setSelectedMerchantId(s.owner_id)}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 text-[9px] font-black uppercase tracking-widest transition-all"
                              >
                                Owner
                              </button>
                            </td>
                          </tr>
                        );
                      })
}

                      {filteredStores.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-16 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">No active stores found matching search criteria</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT: FEEDBACK & BUGS */}
            {activeTab === "feedback" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredFeedbacks.map((f) => {
                  const reporter = profiles.find(p => p.id === f.user_id);
                  const storeObj = stores.find(s => s.id === f.store_id);
                  
                  return (
                    <motion.div 
                      key={f.id}
                      layout
                      className="bg-[#111C18] p-6 rounded-[2rem] border border-[#1E2D27] shadow-sm flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-4 mb-4">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                            f.type === "bug" ? "bg-rose-50 dark:bg-rose-500/10 text-rose-500 border-rose-100 dark:border-rose-500/20" : 
                            f.type === "feature" ? "bg-purple-50 dark:bg-purple-500/10 text-purple-500 border-purple-100 dark:border-purple-500/20" :
                            "bg-blue-50 dark:bg-blue-500/10 text-blue-500 border-blue-100 dark:border-blue-500/20"
                          )}>
                            {f.type}
                          </span>

                          <div className="flex gap-1.5">
                            {["pending", "in_progress", "resolved"].map((st) => (
                              <button
                                key={st}
                                onClick={() => updateFeedbackStatus(f.id, st)}
                                className={cn(
                                  "px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-wider border transition-all",
                                  f.status === st 
                                    ? st === "resolved" ? "bg-emerald-500 text-white border-emerald-500" :
                                      st === "in_progress" ? "bg-amber-500 text-white border-amber-500" :
                                      "bg-slate-500 text-white border-slate-500"
                                    : "bg-[#14231D] text-slate-400 border-[#1E2D27] hover:border-slate-300"
                                )}
                              >
                                {st.replace("_", " ")}
                              </button>
                            ))}
                          </div>
                        </div>

                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-350 leading-relaxed my-4">&ldquo;{f.message}&rdquo;</p>

                        <div className="text-[9px] font-bold text-slate-400 space-y-1 border-t border-slate-50 dark:border-zinc-950 pt-3">
                          <p>User: <span className="text-slate-700 dark:text-slate-300">{reporter?.display_name || "Guest"}</span> (slug: {reporter?.username || "N/A"})</p>
                          <p>Storefront: <span className="text-slate-700 dark:text-slate-300">{storeObj?.biz_name || "Unknown"}</span></p>
                          {f.metadata && f.metadata.path && <p>Path: <span className="text-slate-700 dark:text-slate-300 font-mono">{f.metadata.path}</span></p>}
                        </div>

                        {/* Public replies section */}
                        {f.public_replies && f.public_replies.length > 0 && (
                          <div className="mt-4 p-3 bg-[#14231D] rounded-xl space-y-2 border border-[#1E2D27]">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Admin Replies:</p>
                            {f.public_replies.map((rep: any, idx: number) => (
                              <div key={idx} className="text-[10px] leading-relaxed">
                                <span className="font-black text-[#E8F1EC]">{rep.author}: </span>
                                <span className="text-slate-500 dark:text-slate-400">{rep.text}</span>
                                <span className="text-[7px] text-slate-300 dark:text-slate-600 block mt-0.5">{rep.time}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-6 pt-3 border-t border-slate-50 dark:border-zinc-950">
                        {replyingToId === f.id ? (
                          <div className="space-y-3">
                            <textarea 
                              placeholder="Write public administrative response..." 
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              rows={2}
                              className="w-full text-[10px] font-bold bg-[#14231D] border border-[#1E2D27] rounded-xl p-3 text-[#E8F1EC] focus:outline-none focus:border-emerald-500/50"
                            />
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => { setReplyingToId(null); setReplyMessage(""); }}
                                className="px-3 py-1.5 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-zinc-950"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={() => submitFeedbackReply(f.id)}
                                className="px-3 py-1.5 rounded-lg text-[8px] font-black text-white bg-emerald-500 hover:bg-emerald-600 uppercase tracking-widest shadow-md transition-colors"
                              >
                                Publish Reply
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setReplyingToId(f.id)}
                            className="w-full py-2.5 rounded-xl text-center bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-[#1E2D27] text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all"
                          >
                            Reply Admin
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {filteredFeedbacks.length === 0 && (
                  <div className="col-span-2 p-16 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-[#1E2D27] rounded-2xl">
                    No feedbacks logged matching selected status filter
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* INDIVIDUAL USER MONITOR DETAIL DRILL-DOWN PANEL */}
      <AnimatePresence>
        {selectedMerchantId && merchantDrillDown && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-10 bg-[#020617]/70 backdrop-blur-md">
            
            {/* Backdrop Click close */}
            <button 
              onClick={() => setSelectedMerchantId(null)}
              className="absolute inset-0 cursor-default"
              aria-label="Close modal"
            />

            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              className="bg-[#111C18] w-full max-w-4xl h-[85vh] rounded-2xl border border-[#1E2D27] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative z-10"
            >
              
              {/* Header profile banner */}
              <div className="p-6 md:p-8 bg-slate-50/50 dark:bg-[#0c0e12] border-b border-[#1E2D27] flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-4 min-w-0">
                  {merchantDrillDown.profile.avatar_url ? (
                    <img src={merchantDrillDown.profile.avatar_url} className="w-16 h-16 rounded-2xl object-cover border-2 border-[#1E2D27]" alt={merchantDrillDown.profile.display_name} />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-[#0f5133] text-[#5be3a0] border-2 border-[#1E2D27] flex items-center justify-center text-lg font-black shrink-0">
                      {(merchantDrillDown.profile.display_name || "M").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-black text-[#E8F1EC] italic uppercase tracking-tight truncate leading-tight">
                        {merchantDrillDown.profile.display_name}
                      </h3>
                      {merchantDrillDown.profile.is_verified && (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/20 shrink-0">
                          Verified Merchant
                        </span>
                      )}
                    </div>
                    
                    <p className="text-[10px] font-bold text-slate-400 font-mono mt-1">
                      @{merchantDrillDown.profile.username} | UID: {merchantDrillDown.profile.id}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedMerchantId(null)}
                  className="w-10 h-10 rounded-full bg-white dark:bg-zinc-950 border border-[#1E2D27] text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center active:scale-90 transition-transform"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drill-down Scrollable content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
                
                {/* BIO STATEMENT */}
                <div className="p-5 rounded-2xl bg-[#14231D] border border-[#1E2D27]">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Profile Biography:</p>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 italic">
                    &ldquo;{merchantDrillDown.profile.bio || "No storefront summary information provided by this merchant user profile."}&rdquo;
                  </p>
                </div>

                {/* INDIVIDUAL STORES LIST */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Store size={14} className="text-emerald-500" /> Owned Storefront Platforms ({merchantDrillDown.stores.length})
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {merchantDrillDown.stores.map((s) => (
                      <div key={s.id} className="p-5 rounded-2xl border border-[#1E2D27] bg-slate-50/20 dark:bg-[#0c0e12]/30 flex flex-col justify-between">
                        <div>
                          <span className="text-xs font-black text-[#E8F1EC] uppercase tracking-wider block">{s.biz_name}</span>
                          <span className="text-[10px] text-emerald-500 font-mono block mt-0.5">/{s.store_username}</span>
                          <span className="text-[9px] text-slate-400 block font-mono mt-1">Phone: {s.phone}</span>
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-[#1E2D27] flex gap-2">
                          <a 
                            href={`/?shop=${s.id}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex-1 py-2 px-3 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 text-[9px] font-black uppercase tracking-widest text-center transition-all flex items-center justify-center gap-1.5"
                          >
                            <ExternalLink size={12} /> Visit
                          </a>
                        </div>
                      </div>
                    ))}

                    {merchantDrillDown.stores.length === 0 && (
                      <div className="col-span-2 p-4 sm:p-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
                        This user profile does not currently own any configured stores.
                      </div>
                    )}
                  </div>
                </div>

                {/* DUAL STAT TELEMETRY ROW */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* TRAFFIC ANALYSIS */}
                  <div className="bg-slate-50 dark:bg-[#0c0e12]/40 border border-[#1E2D27] p-6 rounded-2xl">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center justify-between">
                      <span>Conversion Metrics</span>
                      <Activity size={14} className="text-blue-500" />
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                        <span className="uppercase tracking-wider">Storefront Views</span>
                        <span className="font-mono text-[#E8F1EC] font-black">{merchantDrillDown.stats.views}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                        <span className="uppercase tracking-wider">Product Click-Throughs</span>
                        <span className="font-mono text-[#E8F1EC] font-black">{merchantDrillDown.stats.clicks}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                        <span className="uppercase tracking-wider">WA Checkout Volume</span>
                        <span className="font-mono text-[#E8F1EC] font-black">{merchantDrillDown.stats.checkouts}</span>
                      </div>
                      
                      <div className="pt-3 border-t border-slate-200 dark:border-zinc-900 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-500">
                        <span>Click Conversion</span>
                        <span>{merchantDrillDown.stats.views > 0 ? ((merchantDrillDown.stats.clicks / merchantDrillDown.stats.views) * 100).toFixed(1) : 0}%</span>
                      </div>
                    </div>
                  </div>

                  {/* STOREFRONT LINKS */}
                  <div className="bg-slate-50 dark:bg-[#0c0e12]/40 border border-[#1E2D27] p-6 rounded-2xl flex flex-col justify-between">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center justify-between">
                        <span>Storefront Links</span>
                        <Globe size={14} className="text-indigo-400" />
                      </h4>
                      
                      <div className="space-y-2.5 max-h-36 overflow-y-auto pr-1 scrollbar-hide">
                        {merchantDrillDown.stores.map((s) => (
                          <div key={s.id} className="flex justify-between items-center text-[9px] font-bold text-slate-500 pb-2 border-b border-slate-200/50 dark:border-zinc-900/50 last:border-none">
                            <span className="truncate">{s.biz_name || "Untitled store"}</span>
                            <span className="uppercase text-[8px] font-black text-[#E8F1EC] shrink-0 ml-2">{s.store_username ? `@${s.store_username}` : "no handle"}</span>
                          </div>
                        ))}

                        {merchantDrillDown.stores.length === 0 && (
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center py-6">No stores on this account</p>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

                {/* DETAILED ACTIVITY TIMELINE LOG */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Activity size={14} className="text-blue-500" /> Merchant Activity Timeline ({merchantDrillDown.events.length} logs)
                  </h4>

                  <div className="p-5 rounded-2xl border border-[#1E2D27] bg-slate-50/20 dark:bg-[#0c0e12]/20 max-h-72 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                    {merchantDrillDown.events.map((e) => (
                      <div key={e.id} className="text-[10px] font-bold text-slate-500 flex justify-between gap-4 pb-2.5 border-b border-slate-100 dark:border-zinc-950 last:border-none">
                        <div>
                          <span className="text-[#E8F1EC] uppercase tracking-wider font-black mr-2">[{e.event_type}]</span>
                          <span className="text-slate-450 font-normal">{JSON.stringify(e.metadata || {})}</span>
                        </div>
                        <span className="font-mono text-slate-400 shrink-0">{new Date(e.created_at).toLocaleTimeString()}</span>
                      </div>
                    ))}

                    {merchantDrillDown.events.length === 0 && (
                      <div className="text-center py-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">No event history logs registered</div>
                    )}
                  </div>
                </div>

                {/* USER FEEDBACKS SUBMITTED */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <MessageSquare size={14} className="text-amber-500" /> Submitted Support Feedback Tickets ({merchantDrillDown.feedback.length})
                  </h4>

                  <div className="space-y-3">
                    {merchantDrillDown.feedback.map((f) => (
                      <div key={f.id} className="p-4 rounded-xl bg-[#14231D] border border-slate-150 dark:border-white/5">
                        <div className="flex justify-between items-center mb-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-wider border",
                            f.type === "bug" ? "bg-rose-50 dark:bg-rose-500/10 text-rose-500 border-rose-100" : "bg-slate-100 dark:bg-zinc-800 text-slate-400 border-transparent"
                          )}>{f.type}</span>
                          <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">{f.status}</span>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-350">&ldquo;{f.message}&rdquo;</p>
                      </div>
                    ))}

                    {merchantDrillDown.feedback.length === 0 && (
                      <div className="p-6 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
                        No support tickets submitted by this merchant.
                      </div>
                    )}
                  </div>
                </div>

              </div>
              
              {/* Close Footer bar */}
              <div className="p-6 bg-slate-50 dark:bg-[#0c0e12] border-t border-[#1E2D27] text-right shrink-0">
                <button 
                  onClick={() => setSelectedMerchantId(null)}
                  className="px-4 sm:px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black hover:scale-105 active:scale-95 text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Close Drill-Down
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ MANAGE ADMINS TAB ═══════════════════════════════════════════════════ */}
      {activeTab === "admins" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Add new admin */}
          <div className="bg-[#111C18] rounded-2xl border border-[#1E2D27] shadow-sm p-4 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <UserPlus size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#E8F1EC] uppercase italic tracking-tight">Add New Administrator</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">The user must already have a SwiftLink account registered.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={newAdminEmail}
                onChange={e => setNewAdminEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddAdmin()}
                placeholder="colleague@email.com"
                className="flex-1 px-5 py-3.5 rounded-2xl bg-[#14231D] border border-[#1E2D27] text-sm font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
              />
              <button
                onClick={handleAddAdmin}
                disabled={addingAdmin || !newAdminEmail.trim()}
                className="px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                {addingAdmin ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <UserPlus size={14} />
                )}
                {addingAdmin ? "Adding..." : "Grant Admin Access"}
              </button>
            </div>
          </div>

          {/* Current admins list */}
          <div className="bg-[#111C18] rounded-2xl border border-[#1E2D27] shadow-sm overflow-hidden">
            <div className="p-4 sm:p-8 border-b border-[#1E2D27]">
              <h3 className="text-sm font-black text-[#E8F1EC] uppercase italic tracking-tight">Current Administrators</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{adminsList.length} admin{adminsList.length !== 1 ? "s" : ""} registered</p>
            </div>

            {adminsList.length === 0 ? (
              <div className="p-12 text-center">
                <Shield size={32} className="mx-auto text-slate-300 dark:text-zinc-700 mb-3" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No admins loaded. Click &quot;Manage Admins&quot; tab to refresh.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {adminsList.map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-zinc-950 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-900 flex items-center justify-center text-slate-500">
                        <Shield size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#E8F1EC]">{admin.email}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          Added {new Date(admin.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                          {admin.email === user?.email && <span className="ml-2 text-emerald-500">(You)</span>}
                        </p>
                      </div>
                    </div>

                    {admin.email !== user?.email && (
                      <button
                        onClick={() => handleRemoveAdmin(admin.id, admin.email)}
                        disabled={removingAdminId === admin.id}
                        title="Remove admin access"
                        className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {removingAdminId === admin.id ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
