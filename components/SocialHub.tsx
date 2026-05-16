"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Send,
  Heart,
  Loader2,
  Bug,
  Lightbulb,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Users,
  Sparkles,
  ImagePlus,
  MoreHorizontal,
  Share2,
  Smile,
  ThumbsDown,
  ChevronLeft,
  Camera,
  MapPin,
  AtSign,
  Verified,
  Search,
  Bell,
  Home,
  PlusCircle,
  User,
  Settings,
  LogOut,
  Hash,
  X,
  Zap,
  Globe,
  Ghost,
  ShieldCheck,
  Package,
  UserPlus,
  UserMinus,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSwiftLink } from "@/context/SwiftLinkContext";

type UserProfile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio?: string;
  cover_url?: string;
  is_verified?: boolean;
};

type Review = {
  id: string;
  author_name: string;
  message: string;
  rating: number;
  created_at: string;
  likes: number;
  dislikes: number;
  author_avatar?: string;
  user_id?: string;
  attachments?: string[];
  tagging_product?: number;
  author_is_verified?: boolean;
};

type SocialHubProps = {
  storeId: string;
  accentColor?: string;
  defaultTab?: "feed" | "post" | "report";
  onBack?: () => void;
};

const PROF_AVATARS = [
    { id: "User", icon: User, color: "bg-blue-500" },
    { id: "Zap", icon: Zap, color: "bg-amber-500" },
    { id: "Sparkles", icon: Sparkles, color: "bg-emerald-500" },
    { id: "Globe", icon: Globe, color: "bg-indigo-500" },
    { id: "Ghost", icon: Ghost, color: "bg-slate-800" },
    { id: "ShieldCheck", icon: ShieldCheck, color: "bg-rose-500" },
];

function VibeBurst({ emoji, x }: { emoji: string, x: number }) {
  return (
    <motion.div
      initial={{ y: 0, opacity: 1, scale: 0.5 }}
      animate={{ y: -150, opacity: 0, scale: 2, rotate: x }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      className="absolute pointer-events-none text-2xl z-[100]"
      style={{ left: `calc(50% + ${x}px)` }}
    >
      {emoji}
    </motion.div>
  );
}

export function SocialHub({ storeId, accentColor, defaultTab = "feed", onBack }: SocialHubProps) {
  const { state, user, addToast } = useSwiftLink();
  const [tab, setTab] = useState<"feed" | "post" | "report" | "search" | "activity" | "profile">(defaultTab);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [interactions, setInteractions] = useState<Record<string, "like" | "dislike" | null>>({});
  
  // Follow System
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({ followers: 0, following: 0, posts: 0 });
  const [feedFilter, setFeedFilter] = useState<"global" | "following">("global");

  // UI & Edit State
  const [activeThread, setActiveThread] = useState<Review | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [hasMore, setHasMore] = useState(true);

  // Post form
  const [onboarding, setOnboarding] = useState(false);
  const [setupName, setSetupName] = useState("");
  const [setupUsername, setSetupUsername] = useState("");
  const [setupAvatar, setSetupAvatar] = useState("User");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [localVibes, setLocalVibes] = useState<any[]>([]);
  const [taggingProduct, setTaggingProduct] = useState<number | null>(null);
  const [showProductPicker, setShowProductPicker] = useState(false);

  // DM State
  const [activeChat, setActiveChat] = useState<UserProfile | null>(null);
  const [directMessages, setDirectMessages] = useState<any[]>([]);
  const [chatText, setChatText] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchFollowing = async () => {
    if (!user) return;
    const { data } = await supabase.from("social_follows").select("following_id").eq("follower_id", user.id);
    if (data) setFollowingIds(new Set(data.map(f => f.following_id)));
  };

  const fetchStats = async (profileId: string) => {
    const [follows, followers, posts] = await Promise.all([
      supabase.from("social_follows").select("*", { count: 'exact', head: true }).eq("follower_id", profileId),
      supabase.from("social_follows").select("*", { count: 'exact', head: true }).eq("following_id", profileId),
      supabase.from("store_reviews").select("*", { count: 'exact', head: true }).eq("user_id", profileId)
    ]);
    setStats({ following: follows.count || 0, followers: followers.count || 0, posts: posts.count || 0 });
  };

  const toggleFollow = async (targetId: string) => {
    if (!user || targetId === user.id) return;
    const isFollowing = followingIds.has(targetId);
    if (isFollowing) {
       setFollowingIds(prev => { const next = new Set(prev); next.delete(targetId); return next; });
       await supabase.from("social_follows").delete().eq("follower_id", user.id).eq("following_id", targetId);
    } else {
       setFollowingIds(prev => new Set([...prev, targetId]));
       await supabase.from("social_follows").insert({ follower_id: user.id, following_id: targetId });
       void supabase.from("social_notifications").insert({ user_id: targetId, actor_id: user.id, type: "follow" });
    }
  };

  const fetchProfile = async () => {
    if (!user) { setCheckingProfile(false); return; }
    const { data } = await supabase.from("social_profiles").select("*").eq("id", user.id).maybeSingle();
    if (data) {
      setMyProfile(data as UserProfile);
      setEditName(data.display_name);
      setEditBio(data.bio || "");
      setEditAvatar(data.avatar_url);
      setOnboarding(false);
      fetchStats(user.id);
      fetchFollowing();
    } else {
      setOnboarding(true);
    }
    setCheckingProfile(false);
  };

  const fetchReviews = async (append = false) => {
    const limit = 20;
    const from = append ? reviews.length : 0;
    const to = from + limit - 1;

    let query = supabase
      .from("store_reviews")
      .select(`*, social_profiles:user_id (display_name, username, avatar_url, bio, is_verified)`)
      .order("created_at", { ascending: false })
      .range(from, to);
    
    if (feedFilter === "global") { query = query.eq("store_id", storeId); }
    else if (feedFilter === "following" && user) { query = query.in("user_id", Array.from(followingIds)); }

    const { data } = await query;
    if (data) {
        const normalized = (data as any[]).map(r => ({ 
            ...r, likes: r.likes || 0, dislikes: r.dislikes || 0,
            author_name: (r.social_profiles as any)?.display_name || r.author_name,
            author_avatar: (r.social_profiles as any)?.avatar_url || "User",
            author_is_verified: (r.social_profiles as any)?.is_verified || false
        }));
        setReviews(prev => append ? [...prev, ...normalized] : normalized);
        setHasMore(data.length === limit);
    }
    setLoading(false);
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from("social_profiles").update({ display_name: editName.trim(), bio: editBio.trim(), avatar_url: editAvatar }).eq("id", user.id);
    if (!error) { setMyProfile(prev => ({ ...prev!, display_name: editName, bio: editBio, avatar_url: editAvatar })); setEditingProfile(false); addToast("Profile Updated!", "success"); }
    else { addToast("Update failed: " + error.message, "error"); }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase.from("social_notifications").select(`*, actor:actor_id (display_name, avatar_url)`).eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    if (data) setNotifications(data);
  };

  const fetchComments = async (postId: string) => {
    setLoadingComments(true);
    const { data } = await supabase.from("store_review_comments").select("*").eq("review_id", postId).order("created_at", { ascending: true });
    if (data) setComments(data);
    setLoadingComments(false);
  };

  const fetchMessages = async (recipientId: string) => {
    if (!user) return;
    const { data } = await supabase.from("social_messages").select("*").or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`).order("created_at", { ascending: true });
    if (data) setDirectMessages(data);
  };

  useEffect(() => { fetchProfile(); }, [user]);
  useEffect(() => { fetchReviews(); }, [storeId, feedFilter, followingIds]);
  useEffect(() => { if (tab === "activity") fetchNotifications(); }, [tab, user]);
  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.id);
      const channel = supabase.channel(`chat-${activeChat.id}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "social_messages" }, () => fetchMessages(activeChat.id)).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [activeChat]);

  const handleSendMessage = async () => {
    if (!chatText.trim() || !activeChat || !user) return;
    const { error } = await supabase.from("social_messages").insert({ sender_id: user.id, recipient_id: activeChat.id, content: chatText.trim() });
    if (!error) { setChatText(""); fetchMessages(activeChat.id); }
  };

  const handleInteraction = async (id: string, type: "like" | "dislike") => {
    const review = reviews.find(r => r.id === id);
    if (!review) return;
    const currentType = interactions[id];
    let nl = review.likes || 0; let nd = review.dislikes || 0;
    if (currentType === "like") nl--; if (currentType === "dislike") nd--;
    if (currentType === type) setInteractions(prev => ({ ...prev, [id]: null }));
    else { setInteractions(prev => ({ ...prev, [id]: type })); if (type === "like") nl++; if (type === "dislike") nd++; }
    setReviews(prev => prev.map(r => r.id === id ? { ...r, likes: nl, dislikes: nd } : r));
    void supabase.from("store_reviews").update({ likes: nl, dislikes: nd }).eq("id", id);
    if (type === "like" && user && review.user_id && review.user_id !== user.id) {
       void supabase.from("social_notifications").insert({ user_id: review.user_id, actor_id: user.id, type: "vibe", post_id: id });
    }
  };

  const handleVibe = (id: string, emoji: string) => {
    const vibe = { id: Math.random(), emoji, x: Math.random() * 100 - 50 };
    setLocalVibes(prev => [...prev, vibe]);
    setTimeout(() => setLocalVibes(prev => prev.filter(v => v.id !== vibe.id)), 2000);
    handleInteraction(id, "like");
  };

  const handlePost = async () => {
    if (!message.trim()) return;
    setSubmitting(true);
    
    const newPostObj = { store_id: storeId, user_id: user?.id, author_name: myProfile?.display_name || "Guest", message: message.trim(), rating, likes: 0, dislikes: 0, attachments: attachments.length > 0 ? attachments : undefined, tagging_product: taggingProduct ?? undefined };
    
    // Optimistic Update so the user feels like it saved instantly
    const tempId = `temp-${Date.now()}`;
    const optimisticPost: Review = {
      ...newPostObj,
      id: tempId,
      created_at: new Date().toISOString(),
      author_avatar: myProfile?.avatar_url || "User",
      author_is_verified: myProfile?.is_verified || false
    };
    
    setReviews(prev => [optimisticPost, ...prev]);
    setMessage(""); setAttachments([]); setTaggingProduct(null); setTab("feed"); addToast("Shared!", "success");
    setSubmitting(false);

    const { error, data } = await supabase.from("store_reviews").insert(newPostObj).select("id").single();
    if (error) { 
       addToast("Failed: " + error.message, "error"); 
       setReviews(prev => prev.filter(r => r.id !== tempId)); // revert
    } else if (data) {
       // Swap temp ID with real ID silently
       setReviews(prev => prev.map(r => r.id === tempId ? { ...r, id: data.id } : r));
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !activeThread) return;
    
    const commentObj = { review_id: activeThread.id, author_name: myProfile?.display_name || "Guest", message: newComment.trim() };
    const tempId = `temp-comment-${Date.now()}`;
    const optimisticComment = { ...commentObj, id: tempId, created_at: new Date().toISOString() };
    
    setComments(prev => [...prev, optimisticComment]);
    setNewComment("");

    const { error } = await supabase.from("store_review_comments").insert(commentObj);
    if (error) {
       addToast("Failed to post reply: " + error.message, "error");
       setComments(prev => prev.filter(c => c.id !== tempId));
    } else {
       if (user && activeThread.user_id && activeThread.user_id !== user.id) {
           void supabase.from("social_notifications").insert({ user_id: activeThread.user_id, actor_id: user.id, type: "comment", post_id: activeThread.id });
       }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !user) return; setUploading(true);
    const path = `social/${user.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("social_media").upload(path, file);
    if (!error) { const { data: { publicUrl } } = supabase.storage.from("social_media").getPublicUrl(path); setAttachments(prev => [...prev, publicUrl]); }
    setUploading(false);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const parseMessage = (text: string) => {
    const parts = text.split(/([@#]\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("#")) return <span key={i} onClick={(e) => { e.stopPropagation(); setSearchQuery(part); setTab("search"); }} className="text-emerald-500 font-bold cursor-pointer">{part}</span>;
      if (part.startsWith("@")) return <span key={i} onClick={(e) => { e.stopPropagation(); setSearchQuery(part); setTab("search"); }} className="text-blue-500 font-bold cursor-pointer">{part}</span>;
      return part;
    });
  };

  const AvatarIcon = ({ src, className = "w-full h-full" }: { src?: string, className?: string }) => {
     if (src?.startsWith("http")) return <img src={src} className={cn("rounded-full object-cover", className)} alt="Ava" />;
     const found = PROF_AVATARS.find(a => a.id === src) || PROF_AVATARS[0];
     const Icon = found.icon;
     return <div className={cn("rounded-full flex items-center justify-center text-white p-2", found.color, className)}><Icon size="100%" /></div>;
  };

  const NavItem = ({ id, icon: Icon, label }: { id: any, icon: any, label: string }) => (
    <button onClick={() => setTab(id)} className={cn("flex flex-col items-center gap-1 flex-1 py-2 transition-all active:scale-90", tab === id ? "text-slate-900 dark:text-white" : "text-slate-400")}>
      <Icon size={22} strokeWidth={tab === id ? 2.5 : 1.5} />
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );

  if (checkingProfile) return <div className="h-full flex items-center justify-center bg-white dark:bg-black"><Loader2 className="animate-spin text-slate-300" size={32} /></div>;

  if (onboarding && user) {
    return (
      <div className="h-full bg-white dark:bg-black p-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm space-y-12">
          <div className="text-center space-y-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-28 h-28 rounded-[2.5rem] mx-auto shadow-2xl relative"><AvatarIcon src={setupAvatar} /></motion.div>
            <h2 className="text-3xl font-black dark:text-white italic uppercase">The Setup</h2>
          </div>
          <div className="flex justify-center gap-3 flex-wrap">{PROF_AVATARS.map(a => (<button key={a.id} onClick={() => setSetupAvatar(a.id)} className={cn("w-12 h-12 rounded-2xl transition-all overflow-hidden", setupAvatar === a.id ? "ring-4 ring-emerald-500 scale-110" : "opacity-60")}><AvatarIcon src={a.id} /></button>))}</div>
          <div className="space-y-4">
            <input value={setupName} onChange={e => setSetupName(e.target.value)} placeholder="Display Name" className="w-full px-6 py-4 bg-slate-50 dark:bg-zinc-900 rounded-3xl outline-none font-bold dark:text-white" />
            <div className="relative"><AtSign size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" /><input value={setupUsername} onChange={e => setSetupUsername(e.target.value)} placeholder="handle" className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-zinc-900 rounded-3xl outline-none font-bold dark:text-white" /></div>
            <button onClick={async () => { if (!user || !setupUsername.trim()) return; const { error } = await supabase.from("social_profiles").upsert({ id: user.id, username: setupUsername.toLowerCase().trim(), display_name: setupName.trim() || setupUsername.trim(), avatar_url: setupAvatar }); if (!error) { setMyProfile({ id: user.id, username: setupUsername, display_name: setupName, avatar_url: setupAvatar }); setOnboarding(false); addToast("Ready!", "success"); } }} disabled={!setupUsername.trim()} className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl">Start Vibing</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black font-sans relative overflow-hidden">
      <AnimatePresence>{localVibes.map(v => <VibeBurst key={v.id} emoji={v.emoji} x={v.x} />)}</AnimatePresence>

      <header className="shrink-0 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-100 dark:border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {onBack && <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800"><ChevronLeft size={22} className="dark:text-white" /></button>}
          <div className="w-10 h-10 rounded-2xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-black shadow-lg"><Hash size={20} /></div>
          <div><h1 className="text-xl font-black text-slate-900 dark:text-white italic">Social Hub</h1><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Live Hub</p></div>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={() => setTab("activity")} className="relative p-1"><Bell size={22} className="text-slate-500" />{notifications.length > 0 && <div className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full" />}</button>
           <button onClick={() => setTab("profile")} className="w-10 h-10 rounded-2xl border-2 border-slate-100 dark:border-zinc-800 overflow-hidden active:scale-90 transition-transform"><AvatarIcon src={myProfile?.avatar_url} /></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <AnimatePresence mode="wait">
          {tab === "feed" && (
            <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col">
              <div className="flex border-b border-slate-50 dark:border-zinc-900 sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10">
                 {["global", "following"].map(f => (
                   <button key={f} onClick={() => setFeedFilter(f as any)} className={cn("flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all", feedFilter === f ? "text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white" : "text-slate-400")}>{f === "global" ? "🌍 Global" : "👥 Following"}</button>
                 ))}
              </div>
              <div className="divide-y divide-slate-50 dark:divide-zinc-900">
                {reviews.map((r, i) => (
                  <article key={r.id} className="p-5 md:p-10 flex gap-5 hover:bg-slate-50/30 dark:hover:bg-zinc-900/20 transition-colors group cursor-pointer" onClick={() => { setActiveThread(r); fetchComments(r.id); }}>
                    <div className="shrink-0 w-14 h-14"><AvatarIcon src={r.author_avatar} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2"><span className="font-black text-[16px] dark:text-white">{r.author_name}</span>{r.author_is_verified && <Verified size={14} className="text-blue-500 fill-blue-500" />}</div>
                        {r.user_id !== user?.id && <button onClick={(e) => { e.stopPropagation(); toggleFollow(r.user_id!); }} className={cn("px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all", followingIds.has(r.user_id!) ? "bg-slate-100 dark:bg-zinc-800 text-slate-400" : "bg-emerald-500 text-white shadow-lg")}>{followingIds.has(r.user_id!) ? "Following" : "Follow"}</button>}
                      </div>
                      <p className="text-[16px] text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">{parseMessage(r.message)}</p>
                      {r.tagging_product && (
                        <div className="mt-4 p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/10 flex items-center gap-4"><img src={state.products.find(p => p.id === r.tagging_product)?.image} className="w-12 h-12 rounded-xl object-cover" /><div className="flex-1 min-w-0"><p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Tagged</p><p className="font-bold truncate dark:text-white text-sm">{state.products.find(p => p.id === r.tagging_product)?.name}</p></div></div>
                      )}
                      {r.attachments && r.attachments.length > 0 && (
                        <div className="mt-5 grid grid-cols-2 gap-3 rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-zinc-800">{r.attachments.map((img, idx) => <img key={idx} src={img} onClick={(e) => { e.stopPropagation(); setActiveImage(img); }} className="w-full h-56 object-cover hover:scale-110 transition-transform duration-700" />)}</div>
                      )}
                      <div className="flex items-center gap-10 mt-6 pt-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleVibe(r.id, "🔥")} className={cn("flex items-center gap-2.5 transition-all active:scale-75", interactions[r.id] === "like" ? "text-rose-500" : "text-slate-400")}><Heart size={20} className={interactions[r.id] === "like" ? "fill-current" : ""} strokeWidth={2.5} /><span className="text-xs font-black">{r.likes > 0 ? r.likes : ""}</span></button>
                        <button onClick={() => { setActiveThread(r); fetchComments(r.id); }} className="flex items-center gap-2.5 text-slate-400"><MessageSquare size={20} strokeWidth={2.5} /></button>
                        {r.user_id !== user?.id && <button onClick={() => { setActiveChat({ id: r.user_id!, display_name: r.author_name, username: r.author_name, avatar_url: r.author_avatar || "User" }); }} className="text-slate-400 ml-auto"><Send size={19} strokeWidth={2.5} /></button>}
                      </div>
                    </div>
                  </article>
                ))}
                {hasMore && <button onClick={() => fetchReviews(true)} className="w-full py-10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Load More Posts</button>}
              </div>
            </motion.div>
          )}

          {tab === "activity" && (
            <motion.div key="activity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
               <h2 className="text-xl font-black dark:text-white italic uppercase px-2">Activity</h2>
               {notifications.length === 0 ? <div className="py-20 text-center text-slate-400 font-bold">No new activity.</div> : notifications.map((n, i) => (
                 <div key={i} className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-zinc-900/50 rounded-3xl"><div className="w-12 h-12 shrink-0"><AvatarIcon src={n.actor?.avatar_url} /></div><div className="flex-1"><p className="text-sm dark:text-zinc-300 font-bold"><span className="font-black dark:text-white">{n.actor?.display_name}</span> {n.type === "vibe" ? "vibed with your post 🔥" : n.type === "comment" ? "replied to your thread 💬" : "started following you 👥"}</p></div></div>
               ))}
            </motion.div>
          )}

          {tab === "post" && (
            <motion.div key="post" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="p-6 md:p-12 max-w-2xl mx-auto w-full relative">
               <div className="flex gap-6">
                  <div className="w-16 h-16 shrink-0 shadow-xl"><AvatarIcon src={myProfile?.avatar_url} /></div>
                  <div className="flex-1 space-y-8">
                    <p className="text-xl font-black dark:text-white tracking-tight">{myProfile?.display_name || "Guest"}</p>
                    <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="What's the latest?" className="w-full bg-transparent border-none outline-none text-2xl md:text-3xl font-medium dark:text-zinc-300 placeholder:text-slate-200 dark:placeholder:text-zinc-800 resize-none min-h-[300px]" autoFocus />
                    <div className="flex gap-2 flex-wrap">
                       {attachments.map((img, idx) => (<div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border"><img src={img} className="w-full h-full object-cover" /><button onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"><X size={10} /></button></div>))}
                       {taggingProduct && (<div className="relative w-48 h-24 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 p-3 flex gap-3 items-center"><img src={state.products.find(p => p.id === taggingProduct)?.image} className="w-16 h-16 rounded-xl object-cover" /><div className="flex-1 min-w-0"><p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Tagged</p><p className="text-xs font-bold truncate dark:text-white">{state.products.find(p => p.id === taggingProduct)?.name}</p></div><button onClick={() => setTaggingProduct(null)} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1"><X size={10} /></button></div>)}
                    </div>
                  </div>
               </div>
               <div className="border-t border-slate-100 dark:border-zinc-900 pt-8 mt-12 flex items-center justify-between">
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} hidden accept="image/*" />
                  <div className="flex items-center gap-6 text-slate-400">
                    <button onClick={() => fileInputRef.current?.click()} className={cn("p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-900", uploading && "animate-pulse")}><Camera size={26} /></button>
                    <button onClick={() => setShowProductPicker(true)} className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-900"><Package size={26} /></button>
                  </div>
                  <button onClick={handlePost} disabled={submitting || !message.trim()} className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-3xl font-black text-[11px] uppercase tracking-widest shadow-2xl disabled:opacity-50 transition-transform active:scale-95 flex items-center gap-3">{submitting ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> Post Feed</>}</button>
               </div>
               {showProductPicker && (<div className="absolute inset-x-6 bottom-32 bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border p-6 z-50"><h3 className="font-black italic uppercase mb-4 dark:text-white">Tag Product</h3><div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar">{state.products.map(p => (<button key={p.id} onClick={() => { setTaggingProduct(p.id); setShowProductPicker(false); }} className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-800 text-left"><img src={p.image} className="w-12 h-12 rounded-xl object-cover" /><div className="flex-1"><p className="font-bold text-sm dark:text-white">{p.name}</p></div></button>))}</div></div>)}
            </motion.div>
          )}

          {tab === "profile" && myProfile && (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 md:p-16 max-w-2xl mx-auto space-y-12">
               {editingProfile ? (
                 <div className="space-y-8">
                    <div className="flex items-center justify-between"><h2 className="text-xl font-black dark:text-white uppercase italic">Edit Profile</h2><button onClick={() => setEditingProfile(false)}><X size={24} className="dark:text-white" /></button></div>
                    <div className="space-y-4">
                       <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Display Name" className="w-full p-5 bg-slate-50 dark:bg-zinc-900 rounded-3xl dark:text-white font-bold" />
                       <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Bio..." className="w-full p-5 bg-slate-50 dark:bg-zinc-900 rounded-3xl dark:text-white font-medium min-h-[100px]" />
                       <p className="text-[10px] font-black uppercase text-slate-400 ml-4">Select Avatar</p>
                       <div className="flex gap-2 flex-wrap">{PROF_AVATARS.map(a => (<button key={a.id} onClick={() => setEditAvatar(a.id)} className={cn("w-10 h-10 rounded-xl overflow-hidden transition-all", editAvatar === a.id ? "ring-4 ring-emerald-500 scale-110" : "opacity-40")}><AvatarIcon src={a.id} /></button>))}</div>
                       <button onClick={handleUpdateProfile} className="w-full py-5 bg-emerald-500 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl">Save Changes</button>
                    </div>
                 </div>
               ) : (
                 <div className="space-y-12">
                   <div className="flex flex-col items-center text-center space-y-6">
                      <div className="w-32 h-32 rounded-[3rem] mx-auto shadow-2xl relative"><AvatarIcon src={myProfile.avatar_url} /><button onClick={() => setEditingProfile(true)} className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-emerald-500 border-4 border-white dark:border-black flex items-center justify-center text-white"><Settings size={18} /></button></div>
                      <div className="space-y-1"><h2 className="text-4xl font-black tracking-tighter dark:text-white italic uppercase">{myProfile.display_name}</h2><p className="text-lg text-slate-400 font-bold uppercase">@{myProfile.username}</p></div>
                      {myProfile.bio && <p className="text-slate-600 dark:text-zinc-400 font-medium max-w-sm">{myProfile.bio}</p>}
                      <div className="flex gap-10 py-6"><div className="text-center"><p className="text-2xl font-black dark:text-white">{stats.posts}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Posts</p></div><div className="text-center"><p className="text-2xl font-black dark:text-white">{stats.followers}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Followers</p></div><div className="text-center"><p className="text-2xl font-black dark:text-white">{stats.following}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Following</p></div></div>
                   </div>
                   <button className="w-full p-6 rounded-3xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-between group active:scale-[0.98] transition-all"><div className="flex items-center gap-4 text-rose-500"><LogOut size={22} /><span className="text-sm font-black uppercase">Sign Out Social</span></div></button>
                 </div>
               )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {activeImage && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4"><button onClick={() => setActiveImage(null)} className="absolute top-8 right-8 text-white p-2 hover:bg-white/10 rounded-full transition-colors"><X size={32} /></button><img src={activeImage} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" /></motion.div>)}
        {activeThread && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-0 z-[100] bg-white dark:bg-black flex flex-col">
             <header className="shrink-0 px-6 py-4 border-b border-slate-100 dark:border-zinc-900 flex items-center gap-4"><button onClick={() => setActiveThread(null)}><ChevronLeft size={24} className="dark:text-white" /></button><h2 className="text-lg font-black dark:text-white italic uppercase">Thread</h2></header>
             <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar"><div className="flex gap-4"><div className="w-12 h-12 shrink-0"><AvatarIcon src={activeThread.author_avatar} /></div><div className="flex-1 min-w-0"><p className="font-black dark:text-white tracking-tight">{activeThread.author_name}</p><p className="text-slate-600 dark:text-zinc-300 mt-2 text-lg leading-relaxed">{parseMessage(activeThread.message)}</p></div></div><div className="border-t border-slate-100 dark:border-zinc-900 pt-8 space-y-6"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Replies</p>{loadingComments ? <Loader2 className="animate-spin text-slate-300 mx-auto" size={24} /> : comments.map((c, i) => (<div key={i} className="flex gap-4"><div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-zinc-900 flex items-center justify-center text-xl shrink-0"><MessageSquare size={18} /></div><div className="bg-slate-50 dark:bg-zinc-900/50 rounded-2xl rounded-tl-none p-4 flex-1"><p className="text-xs font-black dark:text-white mb-1">{c.author_name}</p><p className="text-sm dark:text-zinc-300 leading-snug">{c.message}</p></div></div>))}</div></div>
             <div className="p-4 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-slate-100 dark:border-zinc-900 pb-10"><div className="max-w-2xl mx-auto flex gap-3"><textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Say something..." className="flex-1 bg-slate-50 dark:bg-zinc-900 rounded-2xl px-5 py-4 text-sm outline-none resize-none dark:text-white" rows={1} /><button onClick={handlePostComment} className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg"><Send size={20} /></button></div></div>
          </motion.div>
        )}
        {activeChat && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-0 z-[150] bg-white dark:bg-black flex flex-col">
             <header className="shrink-0 px-6 py-4 border-b border-slate-100 dark:border-zinc-900 flex items-center gap-4"><button onClick={() => setActiveChat(null)}><ChevronLeft size={24} className="dark:text-white" /></button><div className="w-10 h-10 rounded-full overflow-hidden border"><AvatarIcon src={activeChat.avatar_url} /></div><div><p className="font-black dark:text-white leading-tight">{activeChat.display_name}</p><p className="text-[10px] font-bold text-emerald-500">Active Now</p></div></header>
             <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">{directMessages.map((m, i) => (<div key={i} className={cn("flex", m.sender_id === user?.id ? "justify-end" : "justify-start")}><div className={cn("max-w-[75%] p-4 rounded-3xl", m.sender_id === user?.id ? "bg-slate-900 text-white rounded-tr-none" : "bg-slate-100 dark:bg-zinc-900 dark:text-white rounded-tl-none")}><p className="text-sm font-medium">{m.content}</p></div></div>))}</div>
             <div className="p-4 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-slate-100 dark:border-zinc-800 pb-10"><div className="max-w-2xl mx-auto flex gap-3"><textarea value={chatText} onChange={e => setChatText(e.target.value)} placeholder="Say something..." className="flex-1 bg-slate-50 dark:bg-zinc-900 rounded-2xl px-5 py-4 text-sm outline-none resize-none dark:text-white" rows={1} /><button onClick={handleSendMessage} className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg"><Send size={20} /></button></div></div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="shrink-0 bg-white/80 dark:bg-black/80 backdrop-blur-3xl border-t border-slate-100 dark:border-zinc-900 px-8 pb-10 pt-4 fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <NavItem id="feed" icon={Home} label="Timeline" />
          <NavItem id="search" icon={Search} label="Explore" />
          <button onClick={() => setTab("post")} className="w-16 h-16 bg-slate-900 dark:bg-white rounded-3xl flex items-center justify-center text-white dark:text-black shadow-2xl -mt-10 border-4 border-white dark:border-black shrink-0"><PlusCircle size={32} /></button>
          <NavItem id="activity" icon={Bell} label="Activity" />
          <NavItem id="profile" icon={User} label="Me" />
        </div>
      </nav>
    </div>
  );
}