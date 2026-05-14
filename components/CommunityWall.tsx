"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Send, MessageCircle, Heart, Loader2 } from "lucide-react";

type Review = {
  id: string;
  author_name: string;
  message: string;
  rating: number;
  created_at: string;
};

export function CommunityWall({ storeId, accentColor }: { storeId: string; accentColor?: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const accent = accentColor || "#10b981";

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("store_reviews")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setReviews(data as Review[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!storeId) return;
    fetchReviews();

    const channel = supabase
      .channel(`reviews-${storeId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "store_reviews", filter: `store_id=eq.${storeId}` },
        (payload) => setReviews((prev) => [payload.new as Review, ...prev])
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [storeId]);

  const handleSubmit = async () => {
    if (!name.trim() || !message.trim()) return;
    setSubmitting(true);
    await supabase.from("store_reviews").insert({
      store_id: storeId,
      author_name: name.trim(),
      message: message.trim(),
      rating,
    });
    setSubmitting(false);
    setSubmitted(true);
    setName("");
    setMessage("");
    setRating(5);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="py-10 px-4 md:px-8 max-w-screen-lg mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight italic">Community Wall</h2>
        <p className="text-slate-400 text-sm mt-1">See what others are saying. Leave your own review.</p>
      </div>

      {/* Post Form */}
      <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-sm border border-black/[0.04] dark:border-white/5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <MessageCircle size={16} className="text-slate-400" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Share Your Experience</p>
        </div>

        {/* Star Rating */}
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => setRating(s)}>
              <Star size={20} className={s <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
            </button>
          ))}
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full bg-slate-50 dark:bg-black rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white outline-none border border-slate-100 dark:border-white/5"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell others what you think about this store..."
          className="w-full bg-slate-50 dark:bg-black rounded-xl px-4 py-3 text-sm font-medium text-gray-600 dark:text-zinc-400 outline-none border border-slate-100 dark:border-white/5 resize-none min-h-[80px]"
        />

        <button
          onClick={handleSubmit}
          disabled={submitting || !name.trim() || !message.trim()}
          className="w-full py-4 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
          style={{ backgroundColor: accent }}
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : submitted ? "✓ Posted!" : <><Send size={14} /> Post Review</>}
        </button>
      </div>

      {/* Reviews Feed */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-slate-300">
          <MessageCircle size={40} strokeWidth={1} className="mx-auto mb-3" />
          <p className="text-xs font-black uppercase tracking-widest">No reviews yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {reviews.map((r) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-zinc-900 rounded-[1.5rem] p-5 shadow-sm border border-black/[0.04] dark:border-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0"
                      style={{ backgroundColor: accent }}>
                      {r.author_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900 dark:text-white">{r.author_name}</p>
                      <p className="text-[10px] text-slate-400">{timeAgo(r.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => <Star key={s} size={12} className={s <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"} />)}
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">{r.message}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
