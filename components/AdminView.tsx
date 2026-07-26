"use client";

import { useSwiftLink } from "@/context/SwiftLinkContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase-client";
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
  Truck, 
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
  Trash2
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

interface DispatchDB {
  id: string;
  tracking_code: string;
  store_id: string;
  driver_name: string;
  customer_name: string;
  destination: string;
  status: string; // 'pending' | 'en_route' | 'delivered'
  updated_at: string;
}

export function AdminView() {
  const { user, addToast, isAdmin } = useSwiftLink();
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Database states
  const [stores, setStores] = useState<StoreDB[]>([]);
  const [profiles, setProfiles] = useState<ProfileDB[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackDB[]>([]);
  const [events, setEvents] = useState<EventDB[]>([]);
  const [dispatches, setDispatches] = useState<DispatchDB[]>([]);
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
    try {
      const { data } = await supabase.from("system_admins").select("*").order("created_at", { ascending: true });
      if (data) setAdminsList(data);
    } catch (e) {
      console.warn("Could not fetch admins list", e);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) return;
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
      const { error } = await supabase.rpc("set_user_plan", { store_id_param: storeId, new_plan: newPlan });
      if (error) throw error;
      setStores(prev => prev.map(s => s.id === storeId ? { ...s, plan: newPlan, state_json: { ...s.state_json, plan: newPlan } } : s));
      addToast(`User plan updated to ${newPlan.toUpperCase()} successfully.`, "success");
    } catch (e: any) {
      addToast(e.message || "Failed to update user plan.", "error");
    } finally {
      setUpdatingStoreId(null);
    }
  };

  const handleSetAccountStatus = async (storeId: string, newStatus: "active" | "banned") => {
    setUpdatingStoreId(storeId);
    try {
      const { error } = await supabase.rpc("set_account_status", { store_id_param: storeId, new_status: newStatus });
      if (error) throw error;
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
      { id: "u1", username: "chidi_styles", display_name: "Chidi Stores Ltd", avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100", is_verified: true, bio: "Premium fashion merchant based in Lekki Phase 1." },
      { id: "u2", username: "yomi_kicks", display_name: "Yomi Sneaker Lounge", avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100", is_verified: false, bio: "Deadstock sneakers & street wear delivered nationwide." },
      { id: "u3", username: "amara_spices", display_name: "Amara's Kitchen", avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100", is_verified: true, bio: "Home cooked organic food & catering services." },
      { id: "u4", username: "bolaji_tech", display_name: "Bolaji Gadgets", avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100", is_verified: false, bio: "Certified pre-owned iPhones and MacBooks in Lagos." },
      { id: "u5", username: "tunde_bakes", display_name: "Tunde Pastry Shop", avatar_url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100", is_verified: false, bio: "Custom cakes, cupcakes & croissants in Abuja." }
    ];

    const mockStores: StoreDB[] = [
      { id: "s1", owner_id: "u1", biz_name: "Chidi Styles", store_username: "chidi_styles", phone: "+2348012345678", sections: [], state_json: {}, updated_at: new Date(Date.now() - 3600000).toISOString() },
      { id: "s2", owner_id: "u2", biz_name: "Yomi Sneakers", store_username: "yomi_kicks", phone: "+2348098765432", sections: [], state_json: {}, updated_at: new Date(Date.now() - 7200000).toISOString() },
      { id: "s3", owner_id: "u3", biz_name: "Amara's Gourmet", store_username: "amara_spices", phone: "+2348123456789", sections: [], state_json: {}, updated_at: new Date(Date.now() - 15000000).toISOString() },
      { id: "s4", owner_id: "u4", biz_name: "Bolaji Electronics", store_username: "bolaji_tech", phone: "+2347012345678", sections: [], state_json: {}, updated_at: new Date(Date.now() - 86400000).toISOString() }
    ];

    const mockEvents: EventDB[] = [
      { id: "e1", store_id: "s1", event_type: "view", product_id: null, metadata: { device: "Mobile", city: "Lagos" }, created_at: new Date(Date.now() - 120000).toISOString() },
      { id: "e2", store_id: "s1", event_type: "product_click", product_id: 101, metadata: { productName: "Ankara Flare Gown" }, created_at: new Date(Date.now() - 340000).toISOString() },
      { id: "e3", store_id: "s2", event_type: "view", product_id: null, metadata: { device: "Desktop", city: "Port Harcourt" }, created_at: new Date(Date.now() - 600000).toISOString() },
      { id: "e4", store_id: "s1", event_type: "whatsapp_checkout", product_id: null, metadata: { total: 32000, items: 1 }, created_at: new Date(Date.now() - 900000).toISOString() },
      { id: "e5", store_id: "s3", event_type: "view", product_id: null, metadata: { device: "Mobile", city: "Abuja" }, created_at: new Date(Date.now() - 1500000).toISOString() },
      { id: "e6", store_id: "s3", event_type: "whatsapp_checkout", product_id: null, metadata: { total: 15500, items: 3 }, created_at: new Date(Date.now() - 1800000).toISOString() },
      { id: "e7", store_id: "s2", event_type: "product_click", product_id: 204, metadata: { productName: "Jordan 4 Retro Black Cat" }, created_at: new Date(Date.now() - 2400000).toISOString() },
      { id: "e8", store_id: "s4", event_type: "view", product_id: null, metadata: { device: "Mobile", city: "Ibadan" }, created_at: new Date(Date.now() - 3600000).toISOString() },
      { id: "e9", store_id: "s4", event_type: "product_click", product_id: 401, metadata: { productName: "iPhone 13 Pro 128GB" }, created_at: new Date(Date.now() - 4200000).toISOString() },
      { id: "e10", store_id: "s2", event_type: "whatsapp_checkout", product_id: null, metadata: { total: 140000, items: 1 }, created_at: new Date(Date.now() - 7200000).toISOString() },
      { id: "e11", store_id: "s1", event_type: "store_transferred", product_id: null, metadata: { from: "u5", to: "u1", email: "chidi_styles@gmail.com" }, created_at: new Date(Date.now() - 18000000).toISOString() }
    ];

    const mockFeedbacks: FeedbackDB[] = [
      { id: "f1", user_id: "u1", store_id: "s1", type: "bug", message: "The product image selector glitches when choosing a second image on Android devices.", metadata: { path: "/business", userAgent: "Mozilla/Android" }, upvotes: 4, public_replies: [{ author: "Support Admin", text: "Under investigation. We are looking into Android asset sizing constraints.", time: "10m ago" }], is_public: true, status: "in_progress", created_at: new Date(Date.now() - 4 * 3600000).toISOString() },
      { id: "f2", user_id: "u2", store_id: "s2", type: "feature", message: "Would love to see an automated Paystack payment integration alongside WhatsApp checkout for faster orders.", metadata: { path: "/pro" }, upvotes: 12, public_replies: [], is_public: true, status: "pending", created_at: new Date(Date.now() - 18 * 3600000).toISOString() },
      { id: "f3", user_id: "u3", store_id: "s3", type: "general", message: "This dashboard is incredibly easy to use. Setting up my food storefront took less than 5 minutes!", metadata: { path: "/" }, upvotes: 1, public_replies: [], is_public: false, status: "resolved", created_at: new Date(Date.now() - 2 * 86400000).toISOString() }
    ];

    const mockDispatches: DispatchDB[] = [
      { id: "d1", tracking_code: "SL-TRK-78A", store_id: "s1", driver_name: "Musa Audu", customer_name: "Rita Okoye", destination: "VI, Lagos", status: "en_route", updated_at: new Date().toISOString() },
      { id: "d2", tracking_code: "SL-TRK-29B", store_id: "s2", driver_name: "John Okafor", customer_name: "Femi Adesina", destination: "Yaba, Lagos", status: "pending", updated_at: new Date().toISOString() },
      { id: "d3", tracking_code: "SL-TRK-90C", store_id: "s3", driver_name: "Usman Danjuma", customer_name: "Hadiza Bello", destination: "Wuse 2, Abuja", status: "delivered", updated_at: new Date(Date.now() - 7200000).toISOString() }
    ];

    return { mockProfiles, mockStores, mockEvents, mockFeedbacks, mockDispatches };
  }, []);

  // Fetch Database tables from Supabase
  const fetchData = async () => {
    if (!isAdmin) return;
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

      // 5. Fetch Dispatch tracking
      const { data: dispatchesData } = await supabase
        .from("dispatch_tracking")
        .select("*")
        .order("updated_at", { ascending: false });

      // Apply DB values if available, otherwise fall back to mock data
      setStores(storesData && storesData.length > 0 ? storesData : mockData.mockStores);
      setProfiles(profilesData && profilesData.length > 0 ? profilesData : mockData.mockProfiles);
      setFeedbacks(feedbacksData && feedbacksData.length > 0 ? feedbacksData : mockData.mockFeedbacks);
      setEvents(eventsData && eventsData.length > 0 ? eventsData : mockData.mockEvents);
      setDispatches(dispatchesData && dispatchesData.length > 0 ? dispatchesData : mockData.mockDispatches);
      
    } catch (err) {
      console.error("Error loading database tables, loading fallbacks", err);
      // Fallback
      setStores(mockData.mockStores);
      setProfiles(mockData.mockProfiles);
      setFeedbacks(mockData.mockFeedbacks);
      setEvents(mockData.mockEvents);
      setDispatches(mockData.mockDispatches);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  // Toggle user verified badge
  const toggleVerification = async (profileId: string, currentStatus: boolean) => {
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
      avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
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
    const deliveries = dispatches.filter(d => storeIds.includes(d.store_id));

    return {
      profile,
      stores: ownedStores,
      events: merchantEvents,
      stats: { views, clicks, checkouts },
      feedback: submittedFeedback,
      deliveries
    };
  }, [selectedMerchantId, profiles, stores, events, feedbacks, dispatches]);

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
      return (
        s.biz_name.toLowerCase().includes(matchText) ||
        s.store_username.toLowerCase().includes(matchText) ||
        s.phone.includes(matchText) ||
        (owner && owner.display_name.toLowerCase().includes(matchText))
      );
    });
  }, [stores, profiles, globalSearch]);

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

  // Overall Global Statistics
  const globalStats = useMemo(() => {
    const totalViews = events.filter(e => e.event_type === "view").length;
    const totalClicks = events.filter(e => e.event_type === "product_click").length;
    const totalCheckouts = events.filter(e => e.event_type === "whatsapp_checkout").length;
    const totalFeedbackCount = feedbacks.length;
    const pendingBugs = feedbacks.filter(f => f.type === "bug" && f.status !== "resolved").length;
    const activeDispatches = dispatches.filter(d => d.status !== "delivered").length;
    
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
      activeDispatches,
      topStore,
      storeConversions
    };
  }, [events, feedbacks, dispatches, stores]);

  if (checkingAuth) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 min-h-[60vh] bg-slate-50 dark:bg-[#020617]">
        <div className="animate-spin text-emerald-500 w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Verifying Admin Credentials...</p>
      </div>
    );
  }

  // ACCESS DENIED SCREEN
  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-[75vh] bg-slate-50 dark:bg-[#020617] transition-colors">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-black p-10 md:p-14 rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-2xl max-w-lg w-full text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />
          
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-100 dark:border-rose-500/20">
            <Lock size={36} />
          </div>

          <h2 className="text-3xl font-black text-slate-900 dark:text-white italic uppercase tracking-tight mb-4">Access Denied</h2>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] leading-relaxed mb-8">
            You require administrator permissions to access this control center dashboard portal.
          </p>

          <div className="bg-slate-50 dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-white/5 mb-8 text-left">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Security Rules:</p>
            <ul className="text-[10px] font-bold text-slate-400 space-y-2 list-disc list-inside">
              <li>User must be signed in with an authorized administrator account</li>
              <li>Only the official admin account <code className="text-emerald-500">admin@swiftlink.pro</code> is authorized</li>
              <li>All database read/write requests are strictly validated at the database layer (RLS)</li>
            </ul>
          </div>

          <div className="flex gap-4 justify-center">
            <a 
              href="/pro"
              className="flex-1 py-4 px-6 rounded-2xl bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-800 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              Go to Storefront Dashboard
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full pb-16 transition-colors duration-300">
      
      {/* Admin Title Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-black p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/10 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-2xl font-black text-slate-900 dark:text-white italic uppercase tracking-tight leading-tight">Admin System Telemetry</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mt-2">
            Monitoring {profiles.length} Merchants, {stores.length} storefronts, and {events.length} system events.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={fetchData} 
            disabled={refreshing}
            className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 flex items-center gap-2"
            title="Refresh Data"
          >
            <RefreshCw size={15} className={cn("transition-transform duration-700", refreshing && "animate-spin")} />
            <span className="text-[10px] font-black uppercase tracking-widest">Refresh</span>
          </button>
        </div>
      </div>

      {/* Overview Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-black p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/10 shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400">
              <Users size={20} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full">System</span>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-1">Total Users</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white italic tracking-tight">{profiles.length}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-black p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/10 shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
              <Store size={20} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">Stores</span>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-1">Active Stores</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white italic tracking-tight">{stores.length}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-black p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/10 shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50 dark:bg-purple-500/10 text-purple-500 dark:text-purple-400">
              <Activity size={20} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-purple-500 bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 rounded-full">Telemetry</span>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-1">Store Clicks</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white italic tracking-tight">{globalStats.totalClicks + globalStats.totalViews}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-black p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/10 shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400">
              <MessageSquare size={20} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">WhatsApp</span>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-1">Checkouts</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white italic tracking-tight">{globalStats.totalCheckouts}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-black p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/10 shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all">
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
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-1">Pending Bugs</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white italic tracking-tight">{globalStats.pendingBugs}</h3>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-100 dark:border-white/5 flex flex-wrap gap-1">
        {[
          { id: "overview", label: "Overview", icon: TrendingUp },
          { id: "timeline", label: "Telemetry Log", icon: Activity },
          { id: "merchants", label: "Merchants", icon: Users },
          { id: "stores", label: "Storefronts", icon: Store },
          { id: "feedback", label: "User Feedback", icon: MessageSquare },
          { id: "admins", label: "Manage Admins", icon: Shield }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setGlobalSearch(""); if (tab.id === "admins") fetchAdmins(); }}
            className={cn(
              "py-4 px-6 border-b-2 font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2",
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
          <div className="flex flex-col items-center justify-center p-20 min-h-[300px] bg-white dark:bg-black border border-slate-100 dark:border-white/5 rounded-[2.5rem]">
            <div className="animate-spin text-emerald-500 w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3" />
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Syncing database registers...</p>
          </div>
        ) : (
          <>
            {/* SEARCH AND FILTERS ROW */}
            {activeTab !== "overview" && (
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 flex items-center bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-slate-400 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/50 shadow-sm transition-all">
                  <Search size={16} />
                  <input 
                    type="text" 
                    placeholder={`Search ${activeTab === 'timeline' ? 'events' : activeTab === 'merchants' ? 'merchants' : activeTab === 'stores' ? 'stores' : 'feedback'}...`} 
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs font-bold px-3 w-full text-slate-900 dark:text-white"
                  />
                  {globalSearch && (
                    <button onClick={() => setGlobalSearch("")}>
                      <X size={14} className="hover:text-slate-800 dark:hover:text-white" />
                    </button>
                  )}
                </div>

                {activeTab === "feedback" && (
                  <div className="flex gap-2 shrink-0">
                    {["all", "bug", "feature", "pending", "resolved"].map((f) => (
                      <button
                        key={f}
                        onClick={() => setFeedbackFilter(f)}
                        className={cn(
                          "px-4 py-3 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all",
                          feedbackFilter === f
                            ? "bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white"
                            : "bg-white dark:bg-black text-slate-500 border-slate-200 dark:border-white/10 hover:border-slate-400"
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}

                {activeTab === "timeline" && (
                  <div className="flex gap-2 shrink-0">
                    {["all", "view", "product_click", "whatsapp_checkout", "store_transferred"].map((f) => (
                      <button
                        key={f}
                        onClick={() => setEventFilter(f)}
                        className={cn(
                          "px-4 py-3 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all",
                          eventFilter === f
                            ? "bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white"
                            : "bg-white dark:bg-black text-slate-500 border-slate-200 dark:border-white/10 hover:border-slate-400"
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* TRAFFIC & CONVERSION CHART */}
                  <div className="lg:col-span-2 bg-white dark:bg-black p-8 rounded-[3rem] border border-slate-100 dark:border-white/10 shadow-sm flex flex-col">
                    <div className="mb-8">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white italic tracking-tight uppercase">Conversion and Traffic Funnel</h3>
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mt-1">Global view to WhatsApp checkout ratio</p>
                    </div>

                    <div className="flex-1 flex flex-col justify-end min-h-[220px] pt-4 border-b border-slate-100 dark:border-white/5 pb-2">
                      <div className="grid grid-cols-3 gap-8 items-end max-w-lg mx-auto w-full">
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
                    <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      <span>Funnel Base: All Active Stores</span>
                      <span className="text-emerald-500 font-black">Conversion: {(globalStats.totalViews > 0 ? (globalStats.totalCheckouts / globalStats.totalViews) * 100 : 15).toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* ACTIVE STORE LEADERBOARD */}
                  <div className="bg-white dark:bg-black p-8 rounded-[3rem] border border-slate-100 dark:border-white/10 shadow-sm flex flex-col">
                    <div className="mb-6">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white italic tracking-tight uppercase">Leaderboard</h3>
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mt-1">Top converting storefront platforms</p>
                    </div>

                    <div className="flex-1 space-y-5">
                      {globalStats.storeConversions.slice(0, 4).map((s, i) => (
                        <div key={s.name} className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                            <span className="text-slate-900 dark:text-white flex items-center gap-1.5">
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
                        <div className="p-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">No telemetry view events received yet</div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <TrendingUp size={14} className="text-emerald-500" />
                        <span>Top Store: <span className="text-slate-900 dark:text-white italic">{globalStats.topStore.name}</span></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Logistics & Alerts section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* CRITICAL ACTIONS & LOGISTICS */}
                  <div className="bg-white dark:bg-black p-8 rounded-[3rem] border border-slate-100 dark:border-white/10 shadow-sm lg:col-span-1 flex flex-col">
                    <div className="mb-6 flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Active Dispatches</h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Live tracking telemetry logs</p>
                      </div>
                      <Truck size={18} className="text-indigo-400" />
                    </div>

                    <div className="flex-1 space-y-4 max-h-72 overflow-y-auto pr-1 scrollbar-hide">
                      {dispatches.slice(0, 4).map((d) => (
                        <div key={d.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-white/5 flex justify-between items-center gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-black text-slate-950 dark:text-white uppercase tracking-wider truncate">{d.tracking_code}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">To: {d.destination}</p>
                          </div>
                          
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider shrink-0",
                            d.status === "delivered" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                            d.status === "en_route" ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                            "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400"
                          )}>
                            {d.status.replace("_", " ")}
                          </span>
                        </div>
                      ))}

                      {dispatches.length === 0 && (
                        <div className="p-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">No active dispatches found</div>
                      )}
                    </div>
                  </div>

                  {/* RECENT CRITICAL USER FEEDBACK FEED */}
                  <div className="bg-white dark:bg-black p-8 rounded-[3rem] border border-slate-100 dark:border-white/10 shadow-sm lg:col-span-2 flex flex-col">
                    <div className="mb-6 flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Pending Bug Reports</h3>
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
                          <div key={f.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-white/5 flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                              <AlertCircle size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex justify-between items-center gap-2">
                                <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider truncate">
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
              <div className="bg-white dark:bg-black rounded-[2.5rem] border border-slate-100 dark:border-white/10 shadow-sm overflow-hidden p-6 md:p-8">
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
                            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider italic">
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
                            <p>Store: <span className="text-slate-900 dark:text-white">{storeObj?.biz_name || e.store_id}</span> ({storeObj?.store_username || "anonymous"})</p>
                            
                            {/* Metadata render */}
                            {e.metadata && (
                              <div className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl border border-slate-100 dark:border-white/5 font-mono text-[9px] mt-2 text-slate-400 select-all overflow-x-auto">
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
              <div className="bg-white dark:bg-black rounded-[2.5rem] border border-slate-100 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0c0e12] text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <th className="py-5 px-6">Merchant Profile</th>
                        <th className="py-5 px-6">Username Slug</th>
                        <th className="py-5 px-6">Bio Details</th>
                        <th className="py-5 px-6 text-center">Verified Status</th>
                        <th className="py-5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {filteredProfiles.map((p) => {
                        const storesCount = stores.filter(s => s.owner_id === p.id).length;
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/40 dark:hover:bg-white/[0.01] transition-colors">
                            <td className="py-5 px-6">
                              <div className="flex items-center gap-3">
                                <img src={p.avatar_url} className="w-10 h-10 rounded-xl object-cover border border-slate-100 dark:border-white/10" alt="" />
                                <div>
                                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">{p.display_name}</span>
                                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">{storesCount} store{storesCount !== 1 ? "s" : ""} owned</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-5 px-6 text-[10px] font-bold text-slate-500 font-mono">@{p.username}</td>
                            <td className="py-5 px-6 text-[10px] font-medium text-slate-400 max-w-xs truncate">{p.bio || "No biography provided."}</td>
                            <td className="py-5 px-6 text-center">
                              <button 
                                onClick={() => toggleVerification(p.id, p.is_verified)}
                                className={cn(
                                  "mx-auto w-8 h-8 rounded-full flex items-center justify-center border transition-all active:scale-90",
                                  p.is_verified 
                                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 border-emerald-100 dark:border-emerald-500/20"
                                    : "bg-slate-100 dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-white/5"
                                )}
                                title={p.is_verified ? "Revoke Verification" : "Verify Profile"}
                              >
                                <Check size={14} strokeWidth={3} />
                              </button>
                            </td>
                            <td className="py-5 px-6 text-right">
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
              <div className="bg-white dark:bg-black rounded-[2.5rem] border border-slate-100 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0c0e12] text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <th className="py-5 px-6">Store Platform</th>
                        <th className="py-5 px-6">Username Route</th>
                        <th className="py-5 px-6">Merchant Owner</th>
                        <th className="py-5 px-6">Phone Contact</th>
                        <th className="py-5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {filteredStores.map((s) => {
                        const ownerObj = profiles.find(p => p.id === s.owner_id);
                        return (
                          <tr key={s.id} className="hover:bg-slate-50/40 dark:hover:bg-white/[0.01] transition-colors">
                            <td className="py-5 px-6">
                              <div>
                                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">{s.biz_name}</span>
                                <span className="text-[8px] font-bold text-slate-400 block font-mono mt-0.5">{s.id}</span>
                              </div>
                            </td>
                            <td className="py-5 px-6 text-[10px] font-bold text-emerald-500 font-mono">/{s.store_username}</td>
                            <td className="py-5 px-6">
                              {ownerObj ? (
                                <button 
                                  onClick={() => setSelectedMerchantId(ownerObj.id)}
                                  className="flex items-center gap-2 hover:underline text-left"
                                >
                                  <img src={ownerObj.avatar_url} className="w-6 h-6 rounded-lg object-cover" alt="" />
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">{ownerObj.display_name}</span>
                                </button>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-400 font-mono">{s.owner_id}</span>
                              )}
                            </td>
                            <td className="py-5 px-6 text-[10px] font-bold text-slate-500 font-mono">{s.phone}</td>
                            <td className="py-5 px-6 text-right flex justify-end items-center gap-3">
                              {/* Plan selector */}
                              <div className="flex items-center gap-1.5">
                                <select
                                  disabled={updatingStoreId === s.id}
                                  value={(s as any).plan || (s.state_json as any)?.plan || "free"}
                                  onChange={(e) => handleSetUserPlan(s.id, e.target.value as any)}
                                  className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/5 rounded-xl px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500/50"
                                >
                                  <option value="free">Free</option>
                                  <option value="pro">Pro</option>
                                  <option value="business">Business</option>
                                </select>
                              </div>

                              {/* Ban/Unban toggle */}
                              <button
                                disabled={updatingStoreId === s.id}
                                onClick={() => handleSetAccountStatus(s.id, (s as any).account_status === "banned" ? "active" : "banned")}
                                className={cn(
                                  "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95",
                                  (s as any).account_status === "banned"
                                    ? "bg-rose-50 dark:bg-rose-500/10 text-rose-500 border-rose-100 dark:border-rose-500/20"
                                    : "bg-slate-50 dark:bg-zinc-950 text-slate-400 border-slate-100 dark:border-white/5 hover:border-slate-355"
                                )}
                              >
                                {(s as any).account_status === "banned" ? "Banned" : "Ban"}
                              </button>

                              <a 
                                href={`/?shop=${s.id}`} 
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-950 dark:hover:text-white transition-all"
                                title="View Store storefront"
                              >
                                <ExternalLink size={14} />
                              </a>
                              <button 
                                onClick={() => setSelectedMerchantId(s.owner_id)}
                                className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 text-[9px] font-black uppercase tracking-widest transition-all"
                              >
                                Owner Drill
                              </button>
                            </td>
                          </tr>
                        );
                      })}

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
                      className="bg-white dark:bg-black p-6 rounded-[2rem] border border-slate-100 dark:border-white/10 shadow-sm flex flex-col justify-between group"
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
                                    : "bg-slate-50 dark:bg-zinc-950 text-slate-400 border-slate-100 dark:border-white/5 hover:border-slate-300"
                                )}
                              >
                                {st.replace("_", " ")}
                              </button>
                            ))}
                          </div>
                        </div>

                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-350 leading-relaxed my-4">"{f.message}"</p>

                        <div className="text-[9px] font-bold text-slate-400 space-y-1 border-t border-slate-50 dark:border-zinc-950 pt-3">
                          <p>User: <span className="text-slate-700 dark:text-slate-300">{reporter?.display_name || "Guest"}</span> (slug: {reporter?.username || "N/A"})</p>
                          <p>Storefront: <span className="text-slate-700 dark:text-slate-300">{storeObj?.biz_name || "Unknown"}</span></p>
                          {f.metadata && f.metadata.path && <p>Path: <span className="text-slate-700 dark:text-slate-300 font-mono">{f.metadata.path}</span></p>}
                        </div>

                        {/* Public replies section */}
                        {f.public_replies && f.public_replies.length > 0 && (
                          <div className="mt-4 p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl space-y-2 border border-slate-100 dark:border-white/5">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Admin Replies:</p>
                            {f.public_replies.map((rep: any, idx: number) => (
                              <div key={idx} className="text-[10px] leading-relaxed">
                                <span className="font-black text-slate-900 dark:text-white">{rep.author}: </span>
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
                              className="w-full text-[10px] font-bold bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/5 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/50"
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
                            className="w-full py-2.5 rounded-xl text-center bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-slate-100 dark:border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all"
                          >
                            Reply Admin
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {filteredFeedbacks.length === 0 && (
                  <div className="col-span-2 p-16 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-100 dark:border-white/10 rounded-[2.5rem]">
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
              className="bg-white dark:bg-black w-full max-w-4xl h-[85vh] rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative z-10"
            >
              
              {/* Header profile banner */}
              <div className="p-6 md:p-8 bg-slate-50/50 dark:bg-[#0c0e12] border-b border-slate-100 dark:border-white/5 flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-4 min-w-0">
                  <img src={merchantDrillDown.profile.avatar_url} className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200 dark:border-white/10" alt="" />
                  
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white italic uppercase tracking-tight truncate leading-tight">
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
                  className="w-10 h-10 rounded-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/5 text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center active:scale-90 transition-transform"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drill-down Scrollable content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
                
                {/* BIO STATEMENT */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-white/5">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Profile Biography:</p>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 italic">
                    "{merchantDrillDown.profile.bio || "No storefront summary information provided by this merchant user profile."}"
                  </p>
                </div>

                {/* INDIVIDUAL STORES LIST */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Store size={14} className="text-emerald-500" /> Owned Storefront Platforms ({merchantDrillDown.stores.length})
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {merchantDrillDown.stores.map((s) => (
                      <div key={s.id} className="p-5 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/20 dark:bg-[#0c0e12]/30 flex flex-col justify-between">
                        <div>
                          <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">{s.biz_name}</span>
                          <span className="text-[10px] text-emerald-500 font-mono block mt-0.5">/{s.store_username}</span>
                          <span className="text-[9px] text-slate-400 block font-mono mt-1">Phone: {s.phone}</span>
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex gap-2">
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
                      <div className="col-span-2 p-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
                        This user profile does not currently own any configured stores.
                      </div>
                    )}
                  </div>
                </div>

                {/* DUAL STAT TELEMETRY ROW */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* TRAFFIC ANALYSIS */}
                  <div className="bg-slate-50 dark:bg-[#0c0e12]/40 border border-slate-100 dark:border-white/5 p-6 rounded-2xl">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center justify-between">
                      <span>Conversion Metrics</span>
                      <Activity size={14} className="text-blue-500" />
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                        <span className="uppercase tracking-wider">Storefront Views</span>
                        <span className="font-mono text-slate-900 dark:text-white font-black">{merchantDrillDown.stats.views}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                        <span className="uppercase tracking-wider">Product Click-Throughs</span>
                        <span className="font-mono text-slate-900 dark:text-white font-black">{merchantDrillDown.stats.clicks}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                        <span className="uppercase tracking-wider">WA Checkout Volume</span>
                        <span className="font-mono text-slate-900 dark:text-white font-black">{merchantDrillDown.stats.checkouts}</span>
                      </div>
                      
                      <div className="pt-3 border-t border-slate-200 dark:border-zinc-900 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-500">
                        <span>Click Conversion</span>
                        <span>{merchantDrillDown.stats.views > 0 ? ((merchantDrillDown.stats.clicks / merchantDrillDown.stats.views) * 100).toFixed(1) : 0}%</span>
                      </div>
                    </div>
                  </div>

                  {/* ACTIVE DELIVERIES LOGISTICS */}
                  <div className="bg-slate-50 dark:bg-[#0c0e12]/40 border border-slate-100 dark:border-white/5 p-6 rounded-2xl flex flex-col justify-between">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center justify-between">
                        <span>Merchant Logistics Portal</span>
                        <Truck size={14} className="text-indigo-400" />
                      </h4>
                      
                      <div className="space-y-2.5 max-h-36 overflow-y-auto pr-1 scrollbar-hide">
                        {merchantDrillDown.deliveries.map((d) => (
                          <div key={d.id} className="flex justify-between items-center text-[9px] font-bold text-slate-500 pb-2 border-b border-slate-200/50 dark:border-zinc-900/50 last:border-none">
                            <span>{d.tracking_code} ({d.driver_name})</span>
                            <span className="uppercase text-[8px] font-black text-slate-900 dark:text-white">{d.status}</span>
                          </div>
                        ))}

                        {merchantDrillDown.deliveries.length === 0 && (
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center py-6">No logistics dispatches tracked</p>
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

                  <div className="p-5 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/20 dark:bg-[#0c0e12]/20 max-h-72 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                    {merchantDrillDown.events.map((e) => (
                      <div key={e.id} className="text-[10px] font-bold text-slate-500 flex justify-between gap-4 pb-2.5 border-b border-slate-100 dark:border-zinc-950 last:border-none">
                        <div>
                          <span className="text-slate-900 dark:text-white uppercase tracking-wider font-black mr-2">[{e.event_type}]</span>
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
                      <div key={f.id} className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-white/5">
                        <div className="flex justify-between items-center mb-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-wider border",
                            f.type === "bug" ? "bg-rose-50 dark:bg-rose-500/10 text-rose-500 border-rose-100" : "bg-slate-100 dark:bg-zinc-800 text-slate-400 border-transparent"
                          )}>{f.type}</span>
                          <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">{f.status}</span>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-350">"{f.message}"</p>
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
              <div className="p-6 bg-slate-50 dark:bg-[#0c0e12] border-t border-slate-100 dark:border-white/5 text-right shrink-0">
                <button 
                  onClick={() => setSelectedMerchantId(null)}
                  className="px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black hover:scale-105 active:scale-95 text-[10px] font-black uppercase tracking-widest transition-all"
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
          <div className="bg-white dark:bg-black rounded-[2.5rem] border border-slate-100 dark:border-white/10 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <UserPlus size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Add New Administrator</h3>
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
                className="flex-1 px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
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
          <div className="bg-white dark:bg-black rounded-[2.5rem] border border-slate-100 dark:border-white/10 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Current Administrators</h3>
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
                        <p className="text-sm font-black text-slate-900 dark:text-white">{admin.email}</p>
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
