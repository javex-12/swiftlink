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
};

type SocialHubProps = {
  storeId: string;
  accentColor?: string;
  defaultTab?: "feed" | "post" | "report";
};

const EMOJI_AVATARS = ["🔥", "😎", "👑", "🦄", "🌈", "🍕", "🍔", "🍦", "🍩", "🧁", "🍭", "🎨", "🎭", "🎮", "🚀", "🛸", "🛸", "🪐", "🌍", "🌈", "🔥", "💎"];

export function SocialHub({ storeId, accentColor, defaultTab = "feed" }: SocialHubProps) {
  const { state, user, addToast } = useSwiftLink();
  const [tab, setTab] = useState<"feed" | "post" | "report" | "search" | "activity" | "profile">(defaultTab);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [interactions, setInteractions] = useState<Record<string, "like" | "dislike" | null>>({});
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Onboarding State
  const [onboarding, setOnboarding] = useState(false);
  const [setupName, setSetupName] = useState("");
  const [setupUsername, setSetupUsername] = useState("");
  const [setupAvatar, setSetupAvatar] = useState(EMOJI_AVATARS[0]);

  // Post form
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);

  const accent = accentColor || "#10b981";

  const fetchProfile = async () => {
    if (!user) {
      setCheckingProfile(false);
      return;
    }
    const { data, error } = await supabase.from("social_profiles").select("*").eq("id", user.id).maybeSingle();
    if (data) {
      setMyProfile(data as UserProfile);
      setOnboarding(false);
    } else {
      setOnboarding(true);
    }
    setCheckingProfile(false);
  };

  const handleProfileSetup = async () => {
    if (!user || !setupUsername.trim()) return;
    const { error } = await supabase.from("social_profiles").upsert({
      id: user.id,
      username: setupUsername.toLowerCase().trim(),
      display_name: setupName.trim() || setupUsername.trim(),
      avatar_url: setupAvatar,
    });

    if (error) {
      addToast("Username might be taken!", "error");
    } else {
      setMyProfile({ id: user.id, username: setupUsername, display_name: setupName, avatar_url: setupAvatar });
      setOnboarding(false);
      addToast("Profile Ready!", "success");
    }
  };

  const fetchReviews = async () => {
    // We join with social_profiles to get the real identity
    const { data, error } = await supabase
      .from("store_reviews")
      .select(`
        *,
        social_profiles:user_id (
          display_name,
          username,
          avatar_url
        )
      `)
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(50);
    
    if (data) {
        setReviews((data as any[]).map(r => ({ 
            ...r, 
            likes: r.likes || 0, 
            dislikes: r.dislikes || 0,
            author_name: (r.social_profiles as any)?.display_name || r.author_name,
            author_avatar: (r.social_profiles as any)?.avatar_url || "👤"
        })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (!storeId) return;
    fetchReviews();

    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const channel = supabase
      .channel(`social-v3-${storeId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "store_reviews", filter: `store_id=eq.${storeId}` }, 
        () => {
          fetchReviews(); 
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "store_reviews", filter: `store_id=eq.${storeId}` }, 
        (payload) => {
          setReviews(prev => prev.map(r => r.id === payload.new.id ? { ...r, ...payload.new } : r));
      })
      .subscribe();

    channelRef.current = channel;
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [storeId]);

  const handleInteraction = async (id: string, type: "like" | "dislike") => {
    const review = reviews.find(r => r.id === id);
    if (!review) return;

    const currentType = interactions[id];
    let newLikes = review.likes || 0;
    let newDislikes = review.dislikes || 0;

    if (currentType === "like") newLikes--;
    if (currentType === "dislike") newDislikes--;

    let nextType: "like" | "dislike" | null = type;
    if (currentType === type) nextType = null;
    else {
      if (type === "like") newLikes++;
      if (type === "dislike") newDislikes++;
    }

    setInteractions(prev => ({ ...prev, [id]: nextType }));
    setReviews(prev => prev.map(r => r.id === id ? { ...r, likes: newLikes, dislikes: newDislikes } : r));

    void supabase.from("store_reviews").update({ likes: newLikes, dislikes: newDislikes }).eq("id", id);
  };

  const handlePost = async () => {
    if (!message.trim()) return;
    setSubmitting(true);
    
    const { error } = await supabase.from("store_reviews").insert({
      store_id: storeId,
      user_id: user?.id,
      author_name: myProfile?.display_name || "Guest",
      message: message.trim(),
      rating,
      likes: 0,
      dislikes: 0,
      attachments: attachments.length > 0 ? attachments : null
    });

    if (error) {
      addToast("Failed to post: " + error.message, "error");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setMessage("");
    setAttachments([]);
    setTab("feed");
    addToast("Shared with community!");
  };

  const NavItem = ({ id, icon: Icon, label }: { id: any, icon: any, label: string }) => (
    <button
      onClick={() => setTab(id)}
      className={cn(
        "flex flex-col items-center gap-1 flex-1 py-2 transition-all active:scale-90",
        tab === id ? "text-slate-900 dark:text-white" : "text-slate-400 hover:text-slate-600"
      )}
    >
      <div className="relative">
        <Icon size={22} strokeWidth={tab === id ? 2.5 : 1.5} />
        {tab === id && (
          <motion.div layoutId="social-nav-dot" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-current rounded-full" />
        )}
      </div>
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );

  if (checkingProfile) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-black">
        <Loader2 className="animate-spin text-slate-300" size={32} />
      </div>
    );
  }

  if (onboarding && user) {
    return (
      <div className="h-full bg-white dark:bg-black p-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm space-y-12">
          <div className="text-center space-y-4">
            <motion.div 
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="w-28 h-28 rounded-[2.5rem] bg-slate-900 dark:bg-white flex items-center justify-center text-5xl mx-auto shadow-2xl relative group"
            >
              {setupAvatar}
              <button className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-emerald-500 border-4 border-white dark:border-black flex items-center justify-center text-white">
                <Camera size={16} />
              </button>
            </motion.div>
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tight dark:text-white italic uppercase italic">The Setup</h2>
              <p className="text-sm text-slate-400 font-medium tracking-tight">Claim your handle and join the club.</p>
            </div>
          </div>

          <div className="flex justify-center gap-3 flex-wrap">
            {EMOJI_AVATARS.slice(0, 8).map(e => (
               <button 
                key={e} onClick={() => setSetupAvatar(e)}
                className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all", setupAvatar === e ? "bg-slate-900 text-white scale-110" : "bg-slate-50 dark:bg-zinc-900")}
               >
                 {e}
               </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Display Name</p>
              <input 
                value={setupName} onChange={e => setSetupName(e.target.value)}
                placeholder="e.g. Michael"
                className="w-full px-6 py-4 bg-slate-50 dark:bg-zinc-900 rounded-3xl border-none outline-none font-bold dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Handle</p>
              <div className="relative">
                <AtSign size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  value={setupUsername} onChange={e => setSetupUsername(e.target.value)}
                  placeholder="username"
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-zinc-900 rounded-3xl border-none outline-none font-bold dark:text-white"
                />
              </div>
            </div>
            <button 
              onClick={handleProfileSetup}
              disabled={!setupUsername.trim()}
              className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-black/20 disabled:opacity-50 transition-transform active:scale-95"
            >
              Create Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* APP-LIKE HEADER */}
      <header className="shrink-0 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-100 dark:border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-black shadow-lg">
             <Hash size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white italic flex items-center gap-2">
              {tab === "feed" ? "Timeline" : tab === "post" ? "Compose" : tab === "profile" ? "Profile" : "Social"}
              <Verified size={14} className="text-blue-500 fill-blue-500" />
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live · {state.bizName || "SwiftLink"} Community
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={() => setTab("profile")} className="w-10 h-10 rounded-2xl border-2 border-slate-100 dark:border-zinc-800 flex items-center justify-center text-2xl bg-white dark:bg-zinc-900 overflow-hidden shadow-sm active:scale-90 transition-transform">
              {myProfile ? myProfile.avatar_url : "👤"}
           </button>
        </div>
      </header>

      {/* SCROLLABLE BODY */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <AnimatePresence mode="wait">
          
          {/* TIMELINE FEED */}
          {tab === "feed" && (
            <motion.div 
              key="feed" 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="divide-y divide-slate-50 dark:divide-zinc-900"
            >
              {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-300" size={32} /></div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-32 px-10">
                   <div className="w-24 h-24 bg-slate-50 dark:bg-zinc-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">🪩</div>
                   <h2 className="text-xl font-black text-slate-900 dark:text-white italic uppercase">The stage is yours</h2>
                   <p className="text-sm text-slate-400 mt-2 font-medium">Be the first to start a conversation.</p>
                   <button onClick={() => setTab("post")} className="mt-10 px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl transition-transform active:scale-95">Create First Post</button>
                </div>
              ) : (
                reviews.map((r, i) => (
                  <motion.article 
                    key={r.id} 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="p-5 md:p-10 flex gap-5 hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors group"
                  >
                    <div className="shrink-0">
                      <div className="w-14 h-14 rounded-[1.25rem] border-2 border-slate-100 dark:border-zinc-800 flex items-center justify-center text-3xl bg-white dark:bg-zinc-900 shadow-sm overflow-hidden group-hover:scale-105 transition-transform">
                        {r.author_avatar || "👤"}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-[16px] text-slate-900 dark:text-white tracking-tight">{r.author_name}</span>
                          <span className="text-xs text-slate-400 font-bold">@{r.author_name.toLowerCase().replace(/\s/g,'')}</span>
                          <span className="text-slate-300 dark:text-zinc-800">·</span>
                          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <button className="text-slate-300 hover:text-slate-600 dark:hover:text-white p-2 opacity-0 group-hover:opacity-100 transition-all active:scale-90"><MoreHorizontal size={18} /></button>
                      </div>
                      
                      <p className="text-[16px] text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap font-medium">{r.message}</p>
                      
                      {/* Attachments */}
                      {r.attachments && r.attachments.length > 0 && (
                        <div className="mt-5 grid grid-cols-2 gap-3 rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-zinc-800">
                          {r.attachments.map((img, idx) => (
                            <img key={idx} src={img} className="w-full h-56 object-cover hover:scale-110 transition-transform duration-700 cursor-pointer" />
                          ))}
                        </div>
                      )}

                      {/* Interaction Bar */}
                      <div className="flex items-center gap-10 mt-6 pt-2">
                        <button 
                          onClick={() => handleInteraction(r.id, "like")}
                          className={cn("flex items-center gap-2.5 transition-all active:scale-75 group/btn", interactions[r.id] === "like" ? "text-rose-500" : "text-slate-400 hover:text-rose-500")}
                        >
                          <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover/btn:bg-rose-50 dark:group-hover/btn:bg-rose-500/10">
                            <Heart size={20} className={interactions[r.id] === "like" ? "fill-current" : ""} strokeWidth={2.5} />
                          </div>
                          <span className="text-xs font-black">{r.likes > 0 ? r.likes : ""}</span>
                        </button>

                        <button 
                          onClick={() => handleInteraction(r.id, "dislike")}
                          className={cn("flex items-center gap-2.5 transition-all active:scale-75 group/btn", interactions[r.id] === "dislike" ? "text-indigo-500" : "text-slate-400 hover:text-indigo-500")}
                        >
                          <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover/btn:bg-indigo-50 dark:group-hover/btn:bg-indigo-500/10">
                            <ThumbsDown size={20} className={interactions[r.id] === "dislike" ? "fill-current" : ""} strokeWidth={2.5} />
                          </div>
                          <span className="text-xs font-black">{r.dislikes > 0 ? r.dislikes : ""}</span>
                        </button>

                        <button className="flex items-center gap-2.5 text-slate-400 hover:text-blue-500 transition-all group/btn">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover/btn:bg-blue-50 dark:group-hover/btn:bg-blue-500/10">
                            <MessageSquare size={20} strokeWidth={2.5} />
                          </div>
                          <span className="text-xs font-black">2</span>
                        </button>

                        <button className="flex items-center gap-2.5 text-slate-400 hover:text-emerald-500 transition-all group/btn ml-auto">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover/btn:bg-emerald-50 dark:group-hover/btn:bg-emerald-500/10">
                            <Share2 size={19} strokeWidth={2.5} />
                          </div>
                        </button>
                      </div>
                    </div>
                  </motion.article>
                ))
              )}
            </motion.div>
          )}

          {/* COMPOSE VIEW */}
          {tab === "post" && (
            <motion.div key="post" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="p-6 md:p-12 max-w-2xl mx-auto w-full">
               <div className="flex gap-6">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 dark:bg-white flex items-center justify-center text-3xl shrink-0 shadow-xl">
                    {myProfile?.avatar_url || "👤"}
                  </div>
                  <div className="flex-1 space-y-8">
                    <div className="pt-2">
                       <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{myProfile?.display_name || "Guest"}</p>
                       <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">Posting Live</p>
                    </div>
                    <textarea 
                      value={message} onChange={e => setMessage(e.target.value)}
                      placeholder="What's the latest?"
                      className="w-full bg-transparent border-none outline-none text-2xl md:text-3xl font-medium text-slate-700 dark:text-zinc-300 placeholder:text-slate-200 dark:placeholder:text-zinc-800 resize-none min-h-[300px]"
                      autoFocus
                    />
                  </div>
               </div>
               
               <div className="border-t border-slate-100 dark:border-zinc-900 pt-8 mt-12 flex items-center justify-between">
                  <div className="flex items-center gap-6 text-slate-400">
                    <button className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all hover:text-emerald-500"><Camera size={26} /></button>
                    <button className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all hover:text-emerald-500"><MapPin size={26} /></button>
                    <button className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all hover:text-emerald-500"><AtSign size={26} /></button>
                  </div>
                  <button 
                    onClick={handlePost}
                    disabled={submitting || !message.trim()}
                    className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-black/20 disabled:opacity-50 transition-transform active:scale-95 flex items-center gap-3"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} className="-rotate-12" /> Post Feed</>}
                  </button>
               </div>
            </motion.div>
          )}

          {/* PROFILE VIEW */}
          {tab === "profile" && myProfile && (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 md:p-16 max-w-2xl mx-auto space-y-12">
               <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-32 h-32 rounded-[3rem] bg-slate-900 dark:bg-white flex items-center justify-center text-6xl shadow-2xl relative">
                    {myProfile.avatar_url}
                    <button className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-emerald-500 border-4 border-white dark:border-black flex items-center justify-center text-white">
                        <Settings size={18} />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-4xl font-black tracking-tighter dark:text-white italic uppercase">{myProfile.display_name}</h2>
                    <p className="text-lg text-slate-400 font-bold uppercase tracking-[0.2em]">@{myProfile.username}</p>
                  </div>
                  <div className="flex gap-10 py-6">
                    <div className="text-center">
                       <p className="text-2xl font-black dark:text-white">12</p>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Posts</p>
                    </div>
                    <div className="text-center">
                       <p className="text-2xl font-black dark:text-white">840</p>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vibes</p>
                    </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <button className="w-full p-6 rounded-3xl bg-slate-50 dark:bg-zinc-900 flex items-center justify-between group active:scale-[0.98] transition-all">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-black flex items-center justify-center text-slate-400"><User size={22} /></div>
                        <span className="text-sm font-black dark:text-white uppercase tracking-widest">Account Settings</span>
                     </div>
                     <ChevronLeft className="rotate-180 text-slate-300" />
                  </button>
                  <button className="w-full p-6 rounded-3xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-between group active:scale-[0.98] transition-all">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-black/50 flex items-center justify-center text-rose-500"><LogOut size={22} /></div>
                        <span className="text-sm font-black text-rose-500 uppercase tracking-widest">Sign Out Social</span>
                     </div>
                  </button>
               </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* NATIVE BOTTOM NAV */}
      <nav className="shrink-0 bg-white/80 dark:bg-black/80 backdrop-blur-3xl border-t border-slate-100 dark:border-zinc-900 px-8 pb-10 pt-4 fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <NavItem id="feed" icon={Home} label="Timeline" />
          <NavItem id="search" icon={Search} label="Explore" />
          <button 
            onClick={() => setTab("post")}
            className="w-16 h-16 bg-slate-900 dark:bg-white rounded-3xl flex items-center justify-center text-white dark:text-black shadow-2xl active:scale-90 transition-all -mt-10 border-4 border-white dark:border-black"
          >
            <PlusCircle size={32} />
          </button>
          <NavItem id="activity" icon={TrendingUp} label="Trends" />
          <NavItem id="profile" icon={User} label="Profile" />
        </div>
      </nav>

    </div>
  );
}
