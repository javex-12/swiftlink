"use client";

import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSwiftLink } from "@/context/SwiftLinkContext";

type Review = {
  id: string;
  author_name: string;
  message: string;
  rating: number;
  created_at: string;
  likes?: number;
};

type SocialHubProps = {
  storeId: string;
  accentColor?: string;
  defaultTab?: "feed" | "post" | "report";
};

const AVATARS = ["🧑‍💼", "👩‍🦱", "🧑‍🎤", "👨‍💻", "👩‍🚀", "🧑‍🍳", "👩‍🎨", "🧔", "👩‍🔬", "🧑‍✈️"];
function getAvatar(name: string) {
  return AVATARS[name.charCodeAt(0) % AVATARS.length];
}

const ACCENT_GRADIENTS: Record<string, string> = {
  "#10b981": "from-emerald-500 to-teal-500",
  "#3b82f6": "from-blue-500 to-indigo-500",
  "#f59e0b": "from-amber-500 to-orange-500",
  "#ef4444": "from-rose-500 to-pink-500",
  "#8b5cf6": "from-violet-500 to-purple-500",
};

export function SocialHub({ storeId, accentColor, defaultTab = "feed" }: SocialHubProps) {
  const { submitFeedback } = useSwiftLink();
  const [tab, setTab] = useState<"feed" | "post" | "report">(defaultTab);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [localLikes, setLocalLikes] = useState<Record<string, number>>({});
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Post form
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Report form
  const [reportType, setReportType] = useState("bug");
  const [reportMsg, setReportMsg] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const accent = accentColor || "#10b981";
  const gradClass = ACCENT_GRADIENTS[accent] || "from-emerald-500 to-teal-500";

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("store_reviews")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) setReviews(data as Review[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!storeId) return;
    fetchReviews();

    // Cleanup previous channel before creating new one
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`reviews-${storeId}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "store_reviews",
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => setReviews((prev) => [payload.new as Review, ...prev])
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const handleLike = (id: string, currentLikes: number) => {
    if (liked.has(id)) return;
    setLiked((prev) => new Set([...prev, id]));
    setLocalLikes((prev) => ({ ...prev, [id]: (prev[id] ?? currentLikes ?? 0) + 1 }));
    // Optimistic — fire and forget
    supabase.from("store_reviews").update({ likes: (currentLikes ?? 0) + 1 }).eq("id", id);
  };

  const handlePost = async () => {
    if (!name.trim() || !message.trim()) return;
    setSubmitting(true);
    await supabase.from("store_reviews").insert({
      store_id: storeId,
      author_name: name.trim(),
      message: message.trim(),
      rating,
      likes: 0,
    });
    setSubmitting(false);
    setSubmitted(true);
    setName("");
    setMessage("");
    setRating(5);
    setTimeout(() => {
      setSubmitted(false);
      setTab("feed");
    }, 2000);
  };

  const handleReport = async () => {
    if (!reportMsg.trim()) return;
    setReportSubmitting(true);
    await submitFeedback(reportType, reportMsg);
    setReportSubmitting(false);
    setReportMsg("");
  };

  const reportTypes = [
    { id: "bug", label: "Bug", icon: Bug, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-500/10" },
    { id: "feature", label: "Idea", icon: Lightbulb, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
    { id: "general", label: "Vibe", icon: MessageSquare, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
    { id: "report", label: "Report", icon: AlertTriangle, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
  ];

  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((a, r) => a + r.rating, 0) / totalReviews).toFixed(1)
      : "—";

  return (
    <div className="w-full max-w-2xl mx-auto px-4 md:px-0 py-6 space-y-6">
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-br ${gradClass} rounded-[2rem] p-6 text-white shadow-xl overflow-hidden relative`}
      >
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -right-4 bottom-0 w-24 h-24 rounded-full bg-white/5" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="opacity-80" />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Community</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-black leading-none">{avgRating}</p>
              <div className="flex gap-1 mt-1.5 mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={12}
                    className={
                      s <= Math.round(Number(avgRating))
                        ? "fill-white text-white"
                        : "fill-white/30 text-white/30"
                    }
                  />
                ))}
              </div>
              <p className="text-[11px] font-bold opacity-70">Average rating</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black leading-none">{totalReviews}</p>
              <p className="text-[11px] font-bold opacity-70 mt-1">Reviews</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab Bar */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-1.5 flex gap-1 shadow-sm border border-black/[0.04] dark:border-white/5">
        {(["feed", "post", "report"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              tab === t
                ? "bg-slate-900 dark:bg-white text-white dark:text-black shadow-sm"
                : "text-slate-400 hover:text-slate-700 dark:hover:text-white"
            )}
          >
            {t === "feed" ? "💬 Feed" : t === "post" ? "✍️ Post" : "🚨 Report"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ───── FEED TAB ───── */}
        {tab === "feed" && (
          <motion.div
            key="feed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 size={28} className="animate-spin text-slate-300" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-[2rem] border border-black/[0.04] dark:border-white/5">
                <div className="text-5xl mb-4">💭</div>
                <p className="text-sm font-black text-slate-300 uppercase tracking-widest">No reviews yet</p>
                <p className="text-xs text-slate-400 mt-2">Be the first to share your experience</p>
                <button
                  onClick={() => setTab("post")}
                  className="mt-6 px-6 py-3 rounded-full text-white text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105"
                  style={{ backgroundColor: accent }}
                >
                  Write First Review
                </button>
              </div>
            ) : (
              <AnimatePresence>
                {reviews.map((r, i) => {
                  const likes = localLikes[r.id] ?? r.likes ?? 0;
                  const hasLiked = liked.has(r.id);
                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i < 5 ? i * 0.05 : 0 }}
                      className="bg-white dark:bg-zinc-900 rounded-[1.75rem] p-5 shadow-sm border border-black/[0.04] dark:border-white/5 group"
                    >
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl font-black shrink-0 shadow-sm"
                            style={{ backgroundColor: `${accent}18` }}
                          >
                            {getAvatar(r.author_name)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900 dark:text-white leading-none">
                              {r.author_name}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(r.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={11}
                                className={s <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}
                              />
                            ))}
                          </div>
                          <button className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all text-slate-300 hover:text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5">
                            <MoreHorizontal size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Message */}
                      <p className="mt-3 text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">{r.message}</p>

                      {/* Actions */}
                      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-50 dark:border-white/5">
                        <button
                          onClick={() => handleLike(r.id, r.likes ?? 0)}
                          className={cn(
                            "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all active:scale-90",
                            hasLiked ? "text-rose-500" : "text-slate-300 hover:text-rose-400"
                          )}
                        >
                          <Heart size={14} className={hasLiked ? "fill-rose-500" : ""} />
                          {likes > 0 && <span>{likes}</span>}
                          <span>{hasLiked ? "Liked" : "Like"}</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-500 transition-colors">
                          <Share2 size={13} />
                          <span>Share</span>
                        </button>
                        <div className="ml-auto">
                          <Sparkles size={12} className="text-slate-100" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}

            {!loading && reviews.length > 0 && (
              <button
                onClick={() => setTab("post")}
                className="w-full py-4 rounded-[1.5rem] border-2 border-dashed text-[10px] font-black uppercase tracking-widest transition-all"
                style={{
                  borderColor: `${accent}40`,
                  color: accent,
                }}
              >
                ✍️ Write a Review
              </button>
            )}
          </motion.div>
        )}

        {/* ───── POST TAB ───── */}
        {tab === "post" && (
          <motion.div
            key="post"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-sm border border-black/[0.04] dark:border-white/5 space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-xl">
                  😊
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900 dark:text-white">Share Your Experience</p>
                  <p className="text-[10px] text-slate-400">Your review helps other shoppers</p>
                </div>
              </div>

              {/* Star Rating — interactive */}
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rating</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(s)}
                      className="transition-transform hover:scale-125 active:scale-110"
                    >
                      <Star
                        size={26}
                        className={
                          s <= (hoverRating || rating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200 dark:text-zinc-700"
                        }
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-black text-slate-400 self-center">
                    {["", "Poor", "Fair", "Good", "Great", "Amazing"][hoverRating || rating]}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Name</p>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Amaka, David..."
                  className="w-full bg-slate-50 dark:bg-black rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white outline-none border-2 border-transparent focus:border-slate-200 dark:focus:border-white/10 transition-all"
                />
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Review</p>
                <div className="relative">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What did you love? What could be better? Be honest..."
                    className="w-full bg-slate-50 dark:bg-black rounded-xl px-4 py-3 text-sm font-medium text-gray-600 dark:text-zinc-400 outline-none border-2 border-transparent focus:border-slate-200 dark:focus:border-white/10 transition-all resize-none min-h-[120px]"
                  />
                  <button className="absolute bottom-3 right-3 p-1.5 rounded-lg text-slate-300 hover:text-slate-500 transition-colors">
                    <Smile size={16} />
                  </button>
                </div>
                <p className="text-[10px] text-slate-300 text-right">{message.length}/280</p>
              </div>

              <AnimatePresence>
                {submitted ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full py-5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-sm flex items-center justify-center gap-2"
                  >
                    ✅ Review posted! Thank you.
                  </motion.div>
                ) : (
                  <button
                    onClick={handlePost}
                    disabled={submitting || !name.trim() || !message.trim()}
                    className="w-full py-4 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-40 shadow-lg"
                    style={{ backgroundColor: accent }}
                  >
                    {submitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Send size={14} />
                        Post Review
                      </>
                    )}
                  </button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ───── REPORT TAB ───── */}
        {tab === "report" && (
          <motion.div
            key="report"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-sm border border-black/[0.04] dark:border-white/5 space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white italic uppercase tracking-tight">
                  Feedback Hub
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                  Help us build the future of SwiftLink
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {reportTypes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setReportType(t.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border-2",
                      reportType === t.id
                        ? "border-slate-900 dark:border-white bg-slate-50 dark:bg-white/5"
                        : "border-transparent bg-slate-50 dark:bg-zinc-800/50 opacity-60 grayscale"
                    )}
                  >
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", t.bg, t.color)}>
                      <t.icon size={18} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest dark:text-white">{t.label}</span>
                  </button>
                ))}
              </div>

              <div className="relative">
                <textarea
                  value={reportMsg}
                  onChange={(e) => setReportMsg(e.target.value)}
                  placeholder={
                    reportType === "bug"
                      ? "What broke? Give us the details..."
                      : reportType === "feature"
                      ? "What should we add next?"
                      : "Tell us what's on your mind..."
                  }
                  className="w-full min-h-[140px] bg-slate-50 dark:bg-zinc-800/50 p-5 rounded-[1.5rem] font-bold text-sm outline-none border-2 border-transparent focus:border-slate-100 dark:focus:border-white/10 transition-all resize-none dark:text-white"
                />
              </div>

              <button
                onClick={handleReport}
                disabled={reportSubmitting || !reportMsg.trim()}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-black py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-lg"
              >
                {reportSubmitting ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <TrendingUp size={16} />
                    Submit Report
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
