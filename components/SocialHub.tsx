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

export function SocialHub({ storeId, accentColor, defaultTab = "feed", onBack }: SocialHubProps) {
  const { state, user, addToast } = useSwiftLink();
  const [tab, setTab] = useState<"feed" | "post" | "report" | "search" | "activity" | "profile">(defaultTab);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [interactions, setInteractions] = useState<Record<string, "like" | "dislike" | null>>({});
  
  const [activeThread, setActiveThread] = useState<Review | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");

  const [onboarding, setOnboarding] = useState(false);
  const [setupName, setSetupName] = useState("");
  const [setupUsername, setSetupUsername] = useState("");
  const [setupAvatar, setSetupAvatar] = useState("User");

  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const accent = accentColor || "#10b981";

  const fetchProfile = async () => {
    if (!user) {
      setCheckingProfile(false);
      return;
    }
    const { data } = await supabase.from("social_profiles").select("*").eq("id", user.id).maybeSingle();
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
    const { data } = await supabase
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
            author_avatar: (r.social_profiles as any)?.avatar_url || "User"
        })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchProfile(); }, [user]);

  useEffect(() => {
    if (!storeId) return;
    fetchReviews();
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const channel = supabase
      .channel(`social-v6-${storeId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "store_reviews", filter: `store_id=eq.${storeId}` }, () => fetchReviews())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "store_reviews", filter: `store_id=eq.${storeId}` }, 
        (payload) => setReviews(prev => prev.map(r => r.id === payload.new.id ? { ...r, ...payload.new } : r)))
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
    else { if (type === "like") newLikes++; if (type === "dislike") newDislikes++; }
    setInteractions(prev => ({ ...prev, [id]: nextType }));
    setReviews(prev => prev.map(r => r.id === id ? { ...r, likes: newLikes, dislikes: newDislikes } : r));
    void supabase.from("store_reviews").update({ likes: newLikes, dislikes: newDislikes }).eq("id", id);
  };

  const handlePost = async () => {
    if (!message.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("store_reviews").insert({
      store_id: storeId, user_id: user?.id, author_name: myProfile?.display_name || "Guest",
      message: message.trim(), rating, likes: 0, dislikes: 0,
      attachments: attachments.length > 0 ? attachments : null
    });
    if (error) { addToast("Failed to post: " + error.message, "error"); }
    else { setSubmitting(false); setMessage(""); setAttachments([]); setTab("feed"); addToast("Shared!"); }
    setSubmitting(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const path = `social/${user.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("social_media").upload(path, file);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("social_media").getPublicUrl(path);
      setAttachments(prev => [...prev, publicUrl]);
      addToast("Photo added!", "success");
    }
    setUploading(false);
  };

  const trendingTags = useMemo(() => {
    const tags: Record<string, number> = {};
    reviews.forEach(r => {
      const found = r.message.match(/#\w+/g);
      if (found) found.forEach(t => { tags[t] = (tags[t] || 0) + 1; });
    });
    return Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [reviews]);

  const AvatarIcon = ({ src, className = "w-full h-full" }: { src?: string, className?: string }) => {
     if (src?.startsWith("http")) return <img src={src} className={cn("rounded-full object-cover", className)} alt="Ava" />;
     const found = PROF_AVATARS.find(a => a.id === src) || PROF_AVATARS[0];
     const Icon = found.icon;
     return <div className={cn("rounded-full flex items-center justify-center text-white p-2", found.color, className)}><Icon size="100%" /></div>;
  };

  const NavItem = ({ id, icon: Icon, label }: { id: any, icon: any, label: string }) => (
    <button onClick={() => setTab(id)} className={cn("flex flex-col items-center gap-1 flex-1 py-2 transition-all active:scale-90", tab === id ? "text-slate-900 dark:text-white" : "text-slate-400")}>
      <div className="relative">
        <Icon size={22} strokeWidth={tab === id ? 2.5 : 1.5} />
        {tab === id && <motion.div layoutId="social-nav-dot" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-current rounded-full" />}
      </div>
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );

  if (checkingProfile) return <div className="h-full flex items-center justify-center bg-white dark:bg-black"><Loader2 className="animate-spin text-slate-300" size={32} /></div>;

  if (onboarding && user) {
    return (
      <div className="h-full bg-white dark:bg-black p-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm space-y-12">
          <div className="text-center space-y-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-28 h-28 rounded-[2.5rem] mx-auto shadow-2xl relative">
              <AvatarIcon src={setupAvatar} />
              <button className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-emerald-500 border-4 border-white dark:border-black flex items-center justify-center text-white"><Settings size={16} /></button>
            </motion.div>
            <h2 className="text-3xl font-black tracking-tight dark:text-white italic uppercase">The Setup</h2>
          </div>
          <div className="flex justify-center gap-3 flex-wrap">
            {PROF_AVATARS.map(a => (
               <button key={a.id} onClick={() => setSetupAvatar(a.id)} className={cn("w-12 h-12 rounded-2xl transition-all overflow-hidden", setupAvatar === a.id ? "ring-4 ring-emerald-500 scale-110" : "opacity-60")}>
                  <AvatarIcon src={a.id} />
               </button>
            ))}
          </div>
          <div className="space-y-4">
            <input value={setupName} onChange={e => setSetupName(e.target.value)} placeholder="Display Name" className="w-full px-6 py-4 bg-slate-50 dark:bg-zinc-900 rounded-3xl outline-none font-bold dark:text-white" />
            <div className="relative">
              <AtSign size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={setupUsername} onChange={e => setSetupUsername(e.target.value)} placeholder="handle" className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-zinc-900 rounded-3xl outline-none font-bold dark:text-white" />
            </div>
            <button onClick={handleProfileSetup} disabled={!setupUsername.trim()} className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl">Start Vibing</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black font-sans relative selection:bg-emerald-500 selection:text-white">
      <header className="shrink-0 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-100 dark:border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {onBack && <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800"><ChevronLeft size={22} className="dark:text-white" /></button>}
          <div className="w-10 h-10 rounded-2xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-black shadow-lg"><Hash size={20} /></div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white italic flex items-center gap-2">{tab === "feed" ? "Timeline" : tab === "post" ? "Compose" : "Social"}<Verified size={14} className="text-blue-500 fill-blue-500" /></h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Live Hub</p>
          </div>
        </div>
        <button onClick={() => setTab("profile")} className="w-10 h-10 rounded-2xl border-2 border-slate-100 dark:border-zinc-800 overflow-hidden active:scale-90 transition-transform">
           <AvatarIcon src={myProfile?.avatar_url} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <AnimatePresence mode="wait">
          {tab === "feed" && (
            <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="divide-y divide-slate-50 dark:divide-zinc-900">
              {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-300" size={32} /></div> : reviews.length === 0 ? (
                <div className="text-center py-32 px-10">
                   <div className="w-24 h-24 bg-slate-50 dark:bg-zinc-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner text-slate-300"><Users size={40} /></div>
                   <h2 className="text-xl font-black dark:text-white italic uppercase">No Activity Yet</h2>
                   <button onClick={() => setTab("post")} className="mt-10 px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl">First Post</button>
                </div>
              ) : reviews.map((r, i) => (
                <motion.article key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-5 md:p-10 flex gap-5 hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors group cursor-pointer" onClick={() => { setActiveThread(r); fetchComments(r.id); }}>
                  <div className="shrink-0 w-14 h-14"><AvatarIcon src={r.author_avatar} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2"><span className="font-black text-[16px] dark:text-white tracking-tight">{r.author_name}</span><span className="text-xs text-slate-400 font-bold">@{r.author_name.toLowerCase().replace(/\s/g,'')}</span></div>
                    </div>
                    <p className="text-[16px] text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap font-medium">{r.message}</p>
                    {r.attachments && r.attachments.length > 0 && (
                      <div className="mt-5 grid grid-cols-2 gap-3 rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-zinc-800">
                        {r.attachments.map((img, idx) => <img key={idx} src={img} className="w-full h-56 object-cover hover:scale-110 transition-transform duration-700" />)}
                      </div>
                    )}
                    <div className="flex items-center gap-10 mt-6 pt-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleInteraction(r.id, "like")} className={cn("flex items-center gap-2.5 transition-all active:scale-75", interactions[r.id] === "like" ? "text-rose-500" : "text-slate-400 hover:text-rose-500")}><Heart size={20} className={interactions[r.id] === "like" ? "fill-current" : ""} /><span className="text-xs font-black">{r.likes > 0 ? r.likes : ""}</span></button>
                      <button onClick={() => { setActiveThread(r); fetchComments(r.id); }} className="flex items-center gap-2.5 text-slate-400 hover:text-blue-500 transition-all"><MessageSquare size={20} /></button>
                      <button className="flex items-center gap-2.5 text-slate-400 hover:text-emerald-500 transition-all ml-auto"><Share2 size={19} /></button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          )}

          {tab === "post" && (
            <motion.div key="post" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="p-6 md:p-12 max-w-2xl mx-auto w-full">
               <div className="flex gap-6">
                  <div className="w-16 h-16 shrink-0 shadow-xl"><AvatarIcon src={myProfile?.avatar_url} /></div>
                  <div className="flex-1 space-y-8">
                    <p className="text-xl font-black dark:text-white tracking-tight">{myProfile?.display_name || "Guest"}</p>
                    <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="What's the latest?" className="w-full bg-transparent border-none outline-none text-2xl md:text-3xl font-medium dark:text-zinc-300 placeholder:text-slate-200 dark:placeholder:text-zinc-800 resize-none min-h-[300px]" autoFocus />
                    {attachments.length > 0 && <div className="flex gap-2 flex-wrap">{attachments.map((img, idx) => (
                      <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-100 dark:border-zinc-800"><img src={img} className="w-full h-full object-cover" /><button onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"><X size={10} /></button></div>
                    ))}</div>}
                  </div>
               </div>
               <div className="border-t border-slate-100 dark:border-zinc-900 pt-8 mt-12 flex items-center justify-between">
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} hidden accept="image/*" />
                  <div className="flex items-center gap-6 text-slate-400">
                    <button onClick={() => fileInputRef.current?.click()} className={cn("p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-900", uploading && "animate-pulse")}><Camera size={26} /></button>
                    <button className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-900"><MapPin size={26} /></button>
                  </div>
                  <button onClick={handlePost} disabled={submitting || !message.trim()} className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-3xl font-black text-[11px] uppercase tracking-widest shadow-2xl disabled:opacity-50 transition-transform active:scale-95 flex items-center gap-3">{submitting ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> Post Feed</>}</button>
               </div>
            </motion.div>
          )}

          {tab === "profile" && myProfile && (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 md:p-16 max-w-2xl mx-auto space-y-12">
               <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-32 h-32 rounded-[3rem] mx-auto shadow-2xl relative"><AvatarIcon src={myProfile.avatar_url} /><button className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-emerald-500 border-4 border-white dark:border-black flex items-center justify-center text-white"><Settings size={18} /></button></div>
                  <div className="space-y-1"><h2 className="text-4xl font-black tracking-tighter dark:text-white italic uppercase">{myProfile.display_name}</h2><p className="text-lg text-slate-400 font-bold uppercase tracking-widest">@{myProfile.username}</p></div>
               </div>
               <button className="w-full p-6 rounded-3xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-between group active:scale-[0.98] transition-all"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-white dark:bg-black/50 flex items-center justify-center text-rose-500"><LogOut size={22} /></div><span className="text-sm font-black text-rose-500 uppercase tracking-widest">Sign Out Social</span></div></button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {activeThread && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-0 z-[100] bg-white dark:bg-black flex flex-col">
             <header className="shrink-0 px-6 py-4 border-b border-slate-100 dark:border-zinc-900 flex items-center gap-4">
                <button onClick={() => setActiveThread(null)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"><ChevronLeft size={24} className="dark:text-white" /></button>
                <h2 className="text-lg font-black dark:text-white italic uppercase">Thread</h2>
             </header>
             <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                <div className="flex gap-4"><div className="w-12 h-12 shrink-0"><AvatarIcon src={activeThread.author_avatar} /></div><div className="flex-1 min-w-0"><p className="font-black dark:text-white tracking-tight">{activeThread.author_name}</p><p className="text-slate-600 dark:text-zinc-300 mt-2 text-lg leading-relaxed">{activeThread.message}</p></div></div>
                <div className="border-t border-slate-100 dark:border-zinc-900 pt-8 space-y-6"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Replies</p>{loadingComments ? <Loader2 className="animate-spin text-slate-300 mx-auto" size={24} /> : comments.map((c, i) => (<div key={i} className="flex gap-4"><div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-zinc-900 flex items-center justify-center text-xl shrink-0"><MessageSquare size={18} /></div><div className="bg-slate-50 dark:bg-zinc-900/50 rounded-2xl rounded-tl-none p-4 flex-1"><p className="text-xs font-black dark:text-white mb-1">{c.author_name}</p><p className="text-sm dark:text-zinc-300 leading-snug">{c.message}</p></div></div>))}</div>
             </div>
             <div className="p-4 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-slate-100 dark:border-zinc-900 pb-10"><div className="max-w-2xl mx-auto flex gap-3 items-end"><textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Post your reply..." className="flex-1 bg-slate-50 dark:bg-zinc-900 rounded-2xl px-5 py-4 text-sm outline-none resize-none min-h-[56px] dark:text-white" rows={1} /><button onClick={handlePostComment} disabled={!newComment.trim()} className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20 active:scale-95 transition-transform"><Send size={20} /></button></div></div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="shrink-0 bg-white/80 dark:bg-black/80 backdrop-blur-3xl border-t border-slate-100 dark:border-zinc-900 px-8 pb-10 pt-4 fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <NavItem id="feed" icon={Home} label="Timeline" />
          <NavItem id="search" icon={Search} label="Explore" />
          <button onClick={() => setTab("post")} className="w-16 h-16 bg-slate-900 dark:bg-white rounded-3xl flex items-center justify-center text-white dark:text-black shadow-2xl active:scale-90 transition-all -mt-10 border-4 border-white dark:border-black"><PlusCircle size={32} /></button>
          <NavItem id="activity" icon={TrendingUp} label="Trends" />
          <NavItem id="profile" icon={User} label="Profile" />
        </div>
      </nav>
    </div>
  );
}