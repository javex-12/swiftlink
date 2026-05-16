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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSwiftLink } from "@/context/SwiftLinkContext";

type UserProfile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio?: string;
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
  
  // Follow System State
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({ followers: 0, following: 0, posts: 0 });
  const [feedFilter, setFeedFilter] = useState<"global" | "following">("global");

  // UI State
  const [activeThread, setActiveThread] = useState<Review | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");

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
    setStats({
      following: follows.count || 0,
      followers: followers.count || 0,
      posts: posts.count || 0
    });
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
      setOnboarding(false);
      fetchStats(user.id);
      fetchFollowing();
    } else {
      setOnboarding(true);
    }
    setCheckingProfile(false);
  };

  const fetchReviews = async () => {
    let query = supabase
      .from("store_reviews")
      .select(`*, social_profiles:user_id (display_name, username, avatar_url)`)
      .order("created_at", { ascending: false })
      .limit(50);
    
    if (feedFilter === "global") {
       query = query.eq("store_id", storeId);
    } else if (feedFilter === "following" && user) {
       query = query.in("user_id", Array.from(followingIds));
    }

    const { data } = await query;
    if (data) {
        setReviews((data as any[]).map(r => ({ 
            ...r, 
            likes: r.likes || 0, 
            dislikes: r.dislikes || 0,
            author_name: (r.social_profiles as any)?.display_name || r.author_name,
            author_avatar: (r.social_profiles as any)?.avatar_url || "User"
        })));
    }
    setLoading(false);
  };

  const fetchMessages = async (recipientId: string) => {
    if (!user) return;
    const { data } = await supabase
      .from("social_messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`)
      .order("created_at", { ascending: true });
    if (data) setDirectMessages(data);
  };

  useEffect(() => { fetchProfile(); }, [user]);
  useEffect(() => { fetchReviews(); }, [storeId, feedFilter, followingIds]);

  const handleSendMessage = async () => {
    if (!chatText.trim() || !activeChat || !user) return;
    const { error } = await supabase.from("social_messages").insert({
      sender_id: user.id, recipient_id: activeChat.id, content: chatText.trim()
    });
    if (!error) { setChatText(""); fetchMessages(activeChat.id); }
  };

  const handleInteraction = async (id: string, type: "like" | "dislike") => {
    const review = reviews.find(r => r.id === id);
    if (!review) return;
    const currentType = interactions[id];
    let nl = review.likes || 0;
    let nd = review.dislikes || 0;
    if (currentType === "like") nl--; if (currentType === "dislike") nd--;
    if (currentType === type) setInteractions(prev => ({ ...prev, [id]: null }));
    else { 
       setInteractions(prev => ({ ...prev, [id]: type }));
       if (type === "like") nl++; if (type === "dislike") nd++;
    }
    setReviews(prev => prev.map(r => r.id === id ? { ...r, likes: nl, dislikes: nd } : r));
    void supabase.from("store_reviews").update({ likes: nl, dislikes: nd }).eq("id", id);
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

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black font-sans relative overflow-hidden">
      <AnimatePresence>{localVibes.map(v => <VibeBurst key={v.id} emoji={v.emoji} x={v.x} />)}</AnimatePresence>

      <header className="shrink-0 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-100 dark:border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {onBack && <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800"><ChevronLeft size={22} className="dark:text-white" /></button>}
          <div className="w-10 h-10 rounded-2xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-black shadow-lg"><Hash size={20} /></div>
          <div><h1 className="text-xl font-black text-slate-900 dark:text-white italic">Social Hub</h1><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Experience</p></div>
        </div>
        <div className="flex items-center gap-4">
           <button onClick={() => setTab("activity")} className="relative p-1"><Bell size={22} className="text-slate-500" />{notifications.length > 0 && <div className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full" />}</button>
           <button onClick={() => setTab("profile")} className="w-10 h-10 rounded-2xl border-2 border-slate-100 dark:border-zinc-800 overflow-hidden shadow-sm"><AvatarIcon src={myProfile?.avatar_url} /></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <AnimatePresence mode="wait">
          {tab === "feed" && (
            <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
              <div className="flex border-b border-slate-50 dark:border-zinc-900 sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10">
                 {["global", "following"].map(f => (
                   <button key={f} onClick={() => setFeedFilter(f as any)} className={cn("flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all", feedFilter === f ? "text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white" : "text-slate-400")}>
                     {f === "global" ? "🌍 Global" : "👥 Following"}
                   </button>
                 ))}
              </div>

              <div className="divide-y divide-slate-50 dark:divide-zinc-900">
                {reviews.map((r, i) => (
                  <article key={r.id} className="p-5 md:p-10 flex gap-5 hover:bg-slate-50/30 dark:hover:bg-zinc-900/20 transition-colors group">
                    <div className="shrink-0 w-14 h-14"><AvatarIcon src={r.author_avatar} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                           <span className="font-black text-[16px] dark:text-white">{r.author_name}</span>
                           {r.user_id === state.id && <Verified size={14} className="text-blue-500 fill-blue-500" />}
                        </div>
                        {r.user_id !== user?.id && (
                           <button onClick={() => toggleFollow(r.user_id!)} className={cn("px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all", followingIds.has(r.user_id!) ? "bg-slate-100 dark:bg-zinc-800 text-slate-400" : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20")}>
                              {followingIds.has(r.user_id!) ? "Following" : "Follow"}
                           </button>
                        )}
                      </div>
                      <p className="text-[16px] text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">{r.message}</p>
                      {r.tagging_product && (
                        <div className="mt-4 p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/10 flex items-center gap-4">
                           <img src={state.products.find(p => p.id === r.tagging_product)?.image} className="w-12 h-12 rounded-xl object-cover" />
                           <div className="flex-1 min-w-0"><p className="text-[10px] font-black uppercase text-emerald-500">Tagged Item</p><p className="font-bold truncate dark:text-white text-sm">{state.products.find(p => p.id === r.tagging_product)?.name}</p></div>
                        </div>
                      )}
                      <div className="flex items-center gap-8 mt-6">
                        <button onClick={() => handleInteraction(r.id, "like")} className={cn("flex items-center gap-2", interactions[r.id] === "like" ? "text-rose-500" : "text-slate-400")}><Heart size={20} className={interactions[r.id] === "like" ? "fill-current" : ""} /><span className="text-xs font-black">{r.likes > 0 ? r.likes : ""}</span></button>
                        <button onClick={() => { setActiveThread(r); }} className="flex items-center gap-2 text-slate-400"><MessageSquare size={20} /></button>
                        {r.user_id !== user?.id && <button onClick={() => { setActiveChat({ id: r.user_id!, display_name: r.author_name, username: r.author_name, avatar_url: r.author_avatar || "User" }); }} className="text-slate-400"><Send size={19} /></button>}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </motion.div>
          )}

          {tab === "profile" && myProfile && (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 md:p-16 max-w-2xl mx-auto space-y-12">
               <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-32 h-32 rounded-[3rem] mx-auto shadow-2xl relative"><AvatarIcon src={myProfile.avatar_url} /></div>
                  <div className="space-y-1"><h2 className="text-4xl font-black tracking-tighter dark:text-white italic uppercase">{myProfile.display_name}</h2><p className="text-lg text-slate-400 font-bold uppercase">@{myProfile.username}</p></div>
                  <div className="flex gap-10 py-6">
                    <div className="text-center"><p className="text-2xl font-black dark:text-white">{stats.posts}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Posts</p></div>
                    <div className="text-center"><p className="text-2xl font-black dark:text-white">{stats.followers}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Followers</p></div>
                    <div className="text-center"><p className="text-2xl font-black dark:text-white">{stats.following}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Following</p></div>
                  </div>
               </div>
               <button className="w-full p-6 rounded-3xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-between group active:scale-[0.98] transition-all"><div className="flex items-center gap-4 text-rose-500"><LogOut size={22} /><span className="text-sm font-black uppercase">Sign Out Social</span></div></button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* OVERLAYS (Chat, Thread, etc) */}
      <AnimatePresence>
        {activeChat && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-0 z-[150] bg-white dark:bg-black flex flex-col">
             <header className="px-6 py-4 border-b border-slate-100 dark:border-zinc-900 flex items-center gap-4">
                <button onClick={() => setActiveChat(null)}><ChevronLeft size={24} className="dark:text-white" /></button>
                <div className="w-10 h-10 rounded-full overflow-hidden border"><AvatarIcon src={activeChat.avatar_url} /></div>
                <div><p className="font-black dark:text-white leading-tight">{activeChat.display_name}</p><p className="text-[10px] font-bold text-emerald-500">Active Now</p></div>
             </header>
             <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                {directMessages.map((m, i) => (
                  <div key={i} className={cn("flex", m.sender_id === user?.id ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[75%] p-4 rounded-3xl", m.sender_id === user?.id ? "bg-slate-900 text-white rounded-tr-none" : "bg-slate-100 dark:bg-zinc-900 dark:text-white rounded-tl-none")}><p className="text-sm font-medium">{m.content}</p></div>
                  </div>
                ))}
             </div>
             <div className="p-4 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-slate-100 dark:border-zinc-900 pb-10"><div className="max-w-2xl mx-auto flex gap-3"><textarea value={chatText} onChange={e => setChatText(e.target.value)} placeholder="Say something..." className="flex-1 bg-slate-50 dark:bg-zinc-900 rounded-2xl px-5 py-4 text-sm outline-none resize-none dark:text-white" rows={1} /><button onClick={handleSendMessage} className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg"><Send size={20} /></button></div></div>
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