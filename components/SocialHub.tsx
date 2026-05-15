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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSwiftLink } from "@/context/SwiftLinkContext";

type Review = {
  id: string;
  author_name: string;
  message: string;
  rating: number;
  created_at: string;
  likes: number;
  dislikes: number;
  author_avatar?: string;
};

type SocialHubProps = {
  storeId: string;
  accentColor?: string;
  defaultTab?: "feed" | "post" | "report";
};

const AVATARS = ["🧑‍💼", "👩‍🦱", "🧑‍🎤", "👨‍💻", "👩‍🚀", "🧑‍🍳", "👩‍🎨", "🧔", "👩‍🔬", "🧑‍✈️"];
function getAvatar(name: string) {
  if (!name) return "👤";
  return AVATARS[name.charCodeAt(0) % AVATARS.length];
}

export function SocialHub({ storeId, accentColor, defaultTab = "feed" }: SocialHubProps) {
  const { state, submitFeedback, addToast } = useSwiftLink();
  const [tab, setTab] = useState<"feed" | "post" | "report" | "search" | "activity">(defaultTab);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [interactions, setInteractions] = useState<Record<string, "like" | "dislike" | null>>({});
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Post form
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const accent = accentColor || "#10b981";

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from("store_reviews")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(50);
    
    if (error) console.error("Fetch Error:", error);
    if (data) setReviews((data as any[]).map(r => ({ ...r, likes: r.likes || 0, dislikes: r.dislikes || 0 })));
    setLoading(false);
  };

  useEffect(() => {
    if (!storeId) return;
    fetchReviews();

    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const channel = supabase
      .channel(`social-v2-${storeId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "store_reviews", filter: `store_id=eq.${storeId}` }, 
        (payload) => {
          const newR = { ...payload.new, likes: payload.new.likes || 0, dislikes: payload.new.dislikes || 0 } as Review;
          setReviews(prev => [newR, ...prev]);
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
    if (!name.trim() || !message.trim()) return;
    setSubmitting(true);
    
    const { error } = await supabase.from("store_reviews").insert({
      store_id: storeId,
      author_name: name.trim(),
      message: message.trim(),
      rating,
      likes: 0,
      dislikes: 0
    });

    if (error) {
      addToast("Failed to post: " + error.message, "error");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setName("");
    setMessage("");
    setTab("feed");
    addToast("Post shared with community!");
  };

  const NavItem = ({ id, icon: Icon, label }: { id: typeof tab, icon: any, label: string }) => (
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

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Dynamic Header */}
      <header className="shrink-0 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-100 dark:border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white italic flex items-center gap-2">
            {tab === "feed" ? "Timeline" : tab === "post" ? "Compose" : "Social Hub"}
            <Verified size={14} className="text-blue-500 fill-blue-500" />
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live · {state.bizName || "SwiftLink"} Community
          </p>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={() => setTab("activity")} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors relative">
              <Bell size={20} className="text-slate-600 dark:text-slate-400" />
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-black" />
           </button>
        </div>
      </header>

      {/* Main Content Area */}
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
                   <div className="w-20 h-20 bg-slate-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">🪩</div>
                   <h2 className="text-lg font-black text-slate-900 dark:text-white">The floor is yours</h2>
                   <p className="text-sm text-slate-400 mt-2">No posts yet. Be the trendsetter.</p>
                   <button onClick={() => setTab("post")} className="mt-8 px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-full text-xs font-black uppercase tracking-widest shadow-xl transition-transform active:scale-95">Create First Post</button>
                </div>
              ) : (
                reviews.map((r, i) => (
                  <motion.article 
                    key={r.id} 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="p-5 md:p-8 flex gap-4 hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors group"
                  >
                    <div className="shrink-0">
                      <div className="w-12 h-12 rounded-full border-2 border-slate-100 dark:border-zinc-800 flex items-center justify-center text-2xl bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
                        {getAvatar(r.author_name)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-[15px] text-slate-900 dark:text-white">{r.author_name}</span>
                          <span className="text-xs text-slate-400 font-medium">@{r.author_name.toLowerCase().replace(/\s/g,'')}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-[11px] text-slate-400 font-bold uppercase">{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        <button className="text-slate-300 hover:text-slate-600 dark:hover:text-white p-1 opacity-0 group-hover:opacity-100 transition-all"><MoreHorizontal size={16} /></button>
                      </div>
                      
                      <p className="text-[15px] text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{r.message}</p>
                      
                      {/* Interaction Bar */}
                      <div className="flex items-center gap-8 mt-4">
                        <button 
                          onClick={() => handleInteraction(r.id, "like")}
                          className={cn("flex items-center gap-2 transition-all active:scale-90 group/btn", interactions[r.id] === "like" ? "text-rose-500" : "text-slate-400 hover:text-rose-500")}
                        >
                          <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover/btn:bg-rose-50 dark:group-hover/btn:bg-rose-500/10">
                            <Heart size={18} className={interactions[r.id] === "like" ? "fill-current" : ""} />
                          </div>
                          <span className="text-xs font-black">{r.likes > 0 ? r.likes : ""}</span>
                        </button>

                        <button 
                          onClick={() => handleInteraction(r.id, "dislike")}
                          className={cn("flex items-center gap-2 transition-all active:scale-90 group/btn", interactions[r.id] === "dislike" ? "text-indigo-500" : "text-slate-400 hover:text-indigo-500")}
                        >
                          <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover/btn:bg-indigo-50 dark:group-hover/btn:bg-indigo-500/10">
                            <ThumbsDown size={18} className={interactions[r.id] === "dislike" ? "fill-current" : ""} />
                          </div>
                          <span className="text-xs font-black">{r.dislikes > 0 ? r.dislikes : ""}</span>
                        </button>

                        <button className="flex items-center gap-2 text-slate-400 hover:text-blue-500 transition-all group/btn">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover/btn:bg-blue-50 dark:group-hover/btn:bg-blue-500/10">
                            <MessageSquare size={18} />
                          </div>
                        </button>

                        <button className="flex items-center gap-2 text-slate-400 hover:text-emerald-500 transition-all group/btn ml-auto">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover/btn:bg-emerald-50 dark:group-hover/btn:bg-emerald-500/10">
                            <Share2 size={18} />
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
            <motion.div key="post" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="p-6 max-w-2xl mx-auto w-full">
               <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center text-2xl shrink-0">😊</div>
                  <div className="flex-1 space-y-6">
                    <input 
                      value={name} onChange={e => setName(e.target.value)}
                      placeholder="Your name or @handle"
                      className="w-full bg-transparent border-none outline-none text-lg font-black text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-zinc-700"
                    />
                    <textarea 
                      value={message} onChange={e => setMessage(e.target.value)}
                      placeholder="What's happening in the community?"
                      className="w-full bg-transparent border-none outline-none text-xl md:text-2xl font-medium text-slate-700 dark:text-zinc-300 placeholder:text-slate-300 dark:placeholder:text-zinc-700 resize-none min-h-[200px]"
                      autoFocus
                    />
                  </div>
               </div>
               
               <div className="border-t border-slate-100 dark:border-zinc-800 pt-6 mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-emerald-500">
                    <button className="p-2 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-500/10"><Camera size={22} /></button>
                    <button className="p-2 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-500/10"><MapPin size={22} /></button>
                    <button className="p-2 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-500/10"><AtSign size={22} /></button>
                  </div>
                  <button 
                    onClick={handlePost}
                    disabled={submitting || !name.trim() || !message.trim()}
                    className="px-8 py-3 bg-emerald-500 text-white rounded-full font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/20 disabled:opacity-50 transition-transform active:scale-95 flex items-center gap-2"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={16} /> : <><Send size={16} /> Post</>}
                  </button>
               </div>
            </motion.div>
          )}

          {/* REPORT / FEEDBACK VIEW */}
          {tab === "report" && (
            <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-xl mx-auto space-y-8">
               <div className="text-center space-y-2">
                 <h2 className="text-2xl font-black italic dark:text-white uppercase tracking-tight">System Report</h2>
                 <p className="text-sm text-slate-400 font-medium">Found a bug or have a feature idea? Let us know.</p>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'bug', icon: Bug, label: 'Bug Report', color: 'bg-rose-500' },
                    { id: 'idea', icon: Lightbulb, label: 'Feature Idea', color: 'bg-amber-500' },
                    { id: 'vibe', icon: Sparkles, label: 'General Vibe', color: 'bg-emerald-500' },
                    { id: 'help', icon: AlertTriangle, label: 'Need Help', color: 'bg-indigo-500' },
                  ].map(item => (
                    <button key={item.id} className="p-6 rounded-3xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-left space-y-4 hover:shadow-xl transition-all group">
                       <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", item.color)}>
                         <item.icon size={24} />
                       </div>
                       <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{item.label}</span>
                    </button>
                  ))}
               </div>
               
               <div className="bg-slate-50 dark:bg-zinc-900/50 p-6 rounded-[2.5rem] border border-slate-100 dark:border-zinc-800">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Quick Message</p>
                  <textarea placeholder="Tell us more..." className="w-full bg-transparent border-none outline-none text-slate-900 dark:text-white font-medium resize-none min-h-[100px]" />
                  <button className="w-full mt-4 py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs">Submit Report</button>
               </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* NATIVE-FEEL BOTTOM NAV */}
      <nav className="shrink-0 bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-t border-slate-100 dark:border-zinc-900 px-6 pb-8 pt-4 fixed bottom-0 left-0 right-0 z-30">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          <NavItem id="feed" icon={Home} label="Feed" />
          <NavItem id="search" icon={Search} label="Search" />
          <button 
            onClick={() => setTab("post")}
            className="w-14 h-14 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-black shadow-2xl shadow-black/20 active:scale-90 transition-all -mt-8 border-4 border-white dark:border-black"
          >
            <PlusCircle size={28} />
          </button>
          <NavItem id="report" icon={MessageSquare} label="Talk" />
          <NavItem id="activity" icon={TrendingUp} label="Trends" />
        </div>
      </nav>

    </div>
  );
}