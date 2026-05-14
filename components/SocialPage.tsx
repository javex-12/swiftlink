"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Share2,
  ThumbsDown,
  ArrowLeft,
  PenLine,
  MoreHorizontal,
  Loader2,
  X,
  Send,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Post = {
  id: string;
  author_name: string;
  message: string;
  rating: number;
  created_at: string;
  likes: number;
  dislikes: number;
};

type Comment = {
  id: string;
  review_id: string;
  author_name: string;
  message: string;
  created_at: string;
};

type SocialPageProps = {
  storeId: string;
  accentColor?: string;
  onBack: () => void;
};

const AVATARS = ["🧑‍💼", "👩‍🦱", "🧑‍🎤", "👨‍💻", "👩‍🚀", "🧑‍🍳", "👩‍🎨", "🧔", "👩‍🔬", "🧑‍✈️"];
function getAvatar(name: string) {
  if (!name) return "👤";
  return AVATARS[name.charCodeAt(0) % AVATARS.length];
}

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
};

export function SocialPage({ storeId, accentColor = "#10b981", onBack }: SocialPageProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [loading, setLoading] = useState(true);
  
  // Interaction State
  const [userInteractions, setUserInteractions] = useState<Record<string, "like" | "dislike" | null>>({});
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  
  // Compose Post State
  const [isComposing, setIsComposing] = useState(false);
  const [composeName, setComposeName] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const [submittingPost, setSubmittingPost] = useState(false);

  const postsChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const commentsChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!storeId) return;

    const fetchInitialData = async () => {
      // Fetch posts (reviews)
      const { data: postsData } = await supabase
        .from("store_reviews")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (postsData) {
        // Ensure dislikes property exists (in case schema is partially applied)
        const normalizedPosts = postsData.map(p => ({
            ...p,
            dislikes: p.dislikes || 0,
            likes: p.likes || 0
        })) as Post[];
        
        setPosts(normalizedPosts);

        // Fetch comments for these posts
        const postIds = normalizedPosts.map(p => p.id);
        if (postIds.length > 0) {
            // Safe query: we only select if we have post IDs
            const { data: commentsData, error } = await supabase
                .from("store_review_comments")
                .select("*")
                .in("review_id", postIds)
                .order("created_at", { ascending: true });
                
            if (commentsData && !error) {
                const commentsMap: Record<string, Comment[]> = {};
                commentsData.forEach((c: Comment) => {
                    if (!commentsMap[c.review_id]) commentsMap[c.review_id] = [];
                    commentsMap[c.review_id].push(c);
                });
                setComments(commentsMap);
            }
        }
      }
      setLoading(false);
    };

    fetchInitialData();

    // Setup Realtime for Posts
    if (postsChannelRef.current) supabase.removeChannel(postsChannelRef.current);
    postsChannelRef.current = supabase
      .channel(`social-posts-${storeId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "store_reviews", filter: `store_id=eq.${storeId}` }, 
        (payload) => {
          const newPost = { ...payload.new, likes: payload.new.likes || 0, dislikes: payload.new.dislikes || 0 } as Post;
          setPosts(prev => [newPost, ...prev]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "store_reviews", filter: `store_id=eq.${storeId}` }, 
        (payload) => {
          setPosts(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p));
      })
      .subscribe();

    // Setup Realtime for Comments
    if (commentsChannelRef.current) supabase.removeChannel(commentsChannelRef.current);
    commentsChannelRef.current = supabase
      .channel(`social-comments-${storeId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "store_review_comments" }, 
        (payload) => {
          const newComment = payload.new as Comment;
          setComments(prev => ({
            ...prev,
            [newComment.review_id]: [...(prev[newComment.review_id] || []), newComment]
          }));
      })
      .subscribe();

    return () => {
      if (postsChannelRef.current) supabase.removeChannel(postsChannelRef.current);
      if (commentsChannelRef.current) supabase.removeChannel(commentsChannelRef.current);
    };
  }, [storeId]);

  const handleInteraction = async (postId: string, type: "like" | "dislike") => {
    const currentInteraction = userInteractions[postId];
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    let newLikes = post.likes;
    let newDislikes = post.dislikes;

    // Remove existing interaction
    if (currentInteraction === "like") newLikes--;
    if (currentInteraction === "dislike") newDislikes--;

    // Apply new interaction
    let newInteraction: "like" | "dislike" | null = type;
    if (currentInteraction === type) {
      newInteraction = null; // Toggle off
    } else {
      if (type === "like") newLikes++;
      if (type === "dislike") newDislikes++;
    }

    // Optimistic Update
    setUserInteractions(prev => ({ ...prev, [postId]: newInteraction }));
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: newLikes, dislikes: newDislikes } : p));

    // Persist
    await supabase.from("store_reviews").update({ likes: newLikes, dislikes: newDislikes }).eq("id", postId);
  };

  const handleComment = async (postId: string) => {
    if (!commentText.trim()) return;
    const author = "Anonymous User"; // You could link this to auth later
    
    // Optimistic UI for smooth feel
    const tempId = `temp-${Date.now()}`;
    const newComment: Comment = {
      id: tempId,
      review_id: postId,
      author_name: author,
      message: commentText.trim(),
      created_at: new Date().toISOString()
    };
    
    setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment]
    }));
    
    const textToSubmit = commentText;
    setCommentText("");
    
    // We swallow errors silently for this demo if table doesn't exist yet
    try {
      await supabase.from("store_review_comments").insert({
        review_id: postId,
        author_name: author,
        message: textToSubmit.trim(),
      });
    } catch(e) {
      console.error(e);
    }
  };

  const handlePost = async () => {
    if (!composeName.trim() || !composeMessage.trim()) return;
    setSubmittingPost(true);
    await supabase.from("store_reviews").insert({
      store_id: storeId,
      author_name: composeName.trim(),
      message: composeMessage.trim(),
      rating: 5, // Default for non-review posts
      likes: 0,
      dislikes: 0
    });
    setSubmittingPost(false);
    setIsComposing(false);
    setComposeMessage("");
    setComposeName("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-black overflow-hidden flex flex-col font-sans">
      {/* Top Header */}
      <header className="flex-shrink-0 sticky top-0 z-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center justify-between px-4 h-14 md:h-16 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors text-slate-900 dark:text-white"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Community</h1>
          </div>
          <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
            <Sparkles size={20} />
          </button>
        </div>
      </header>

      {/* Main Feed Scroll Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
        <div className="max-w-2xl mx-auto w-full pb-32 pt-2 md:pt-6">
          
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-slate-300" size={32} />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 px-6">
              <div className="w-20 h-20 bg-slate-100 dark:bg-zinc-900 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">💭</div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">It&apos;s quiet in here</h2>
              <p className="text-slate-500 dark:text-zinc-400 text-sm mb-8">Be the first to share your thoughts with the community.</p>
              <button 
                onClick={() => setIsComposing(true)}
                className="px-6 py-3 rounded-full text-white font-black text-sm transition-transform active:scale-95 shadow-lg"
                style={{ backgroundColor: accentColor }}
              >
                Write a Post
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-zinc-800 md:rounded-3xl md:border md:border-slate-100 dark:md:border-zinc-800 md:bg-white dark:md:bg-zinc-950 md:shadow-sm md:overflow-hidden md:mb-8">
              <AnimatePresence>
                {posts.map((post) => {
                  const hasLiked = userInteractions[post.id] === "like";
                  const hasDisliked = userInteractions[post.id] === "dislike";
                  const postComments = comments[post.id] || [];
                  const isCommenting = activeCommentPostId === post.id;

                  return (
                    <motion.article 
                      key={post.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="px-4 py-5 md:p-6 bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors"
                    >
                      {/* Post Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: `${accentColor}15` }}>
                            {getAvatar(post.author_name)}
                          </div>
                          <div>
                            <p className="font-bold text-[15px] text-slate-900 dark:text-white leading-tight">
                              {post.author_name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
                              @{post.author_name.toLowerCase().replace(/\s+/g, '')} · {timeAgo(post.created_at)}
                            </p>
                          </div>
                        </div>
                        <button className="text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full p-2 -mr-2">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>

                      {/* Post Body */}
                      <div className="pl-13">
                        <p className="text-[15px] text-slate-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                          {post.message}
                        </p>

                        {/* Action Bar */}
                        <div className="flex items-center gap-6 mt-4">
                          <button 
                            onClick={() => handleComment(isCommenting ? null as any : post.id)} // Toggle comment area
                            className="flex items-center gap-2 text-slate-500 hover:text-blue-500 transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10">
                              <MessageCircle size={18} className={isCommenting ? "fill-blue-500 text-blue-500" : ""} />
                            </div>
                            <span className="text-xs font-bold">{postComments.length > 0 ? postComments.length : ""}</span>
                          </button>

                          <button 
                            onClick={() => handleInteraction(post.id, "like")}
                            className={cn(
                              "flex items-center gap-2 transition-colors group",
                              hasLiked ? "text-rose-500" : "text-slate-500 hover:text-rose-500"
                            )}
                          >
                            <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-rose-50 dark:group-hover:bg-rose-500/10">
                              <Heart size={18} className={hasLiked ? "fill-rose-500" : ""} />
                            </div>
                            <span className="text-xs font-bold">{post.likes > 0 ? post.likes : ""}</span>
                          </button>

                          <button 
                            onClick={() => handleInteraction(post.id, "dislike")}
                            className={cn(
                              "flex items-center gap-2 transition-colors group",
                              hasDisliked ? "text-indigo-500" : "text-slate-500 hover:text-indigo-500"
                            )}
                          >
                            <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10">
                              <ThumbsDown size={18} className={hasDisliked ? "fill-indigo-500" : ""} />
                            </div>
                            <span className="text-xs font-bold">{post.dislikes > 0 ? post.dislikes : ""}</span>
                          </button>

                          <button className="flex items-center gap-2 text-slate-500 hover:text-emerald-500 transition-colors group ml-auto">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10">
                              <Share2 size={18} />
                            </div>
                          </button>
                        </div>

                        {/* Inline Comments Section */}
                        <AnimatePresence>
                          {isCommenting && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 border-l-2 border-slate-100 dark:border-zinc-800 ml-4 pl-4 space-y-4"
                            >
                              {/* Existing Comments */}
                              {postComments.map((comment) => (
                                <div key={comment.id} className="flex gap-3">
                                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-xs shrink-0">
                                    {getAvatar(comment.author_name)}
                                  </div>
                                  <div className="bg-slate-50 dark:bg-zinc-900 rounded-2xl rounded-tl-none px-4 py-2.5 flex-1 border border-slate-100 dark:border-zinc-800">
                                    <p className="text-xs font-black text-slate-900 dark:text-white mb-0.5">{comment.author_name}</p>
                                    <p className="text-sm text-slate-700 dark:text-zinc-300 leading-snug">{comment.message}</p>
                                  </div>
                                </div>
                              ))}

                              {/* Write Comment */}
                              <div className="flex gap-3 items-end pt-2">
                                <div className="flex-1 relative">
                                  <textarea 
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Post your reply..."
                                    className="w-full bg-slate-100 dark:bg-zinc-900 border-none rounded-2xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-blue-500/50 outline-none text-slate-900 dark:text-white"
                                    rows={1}
                                  />
                                </div>
                                <button 
                                  onClick={() => handleComment(post.id)}
                                  disabled={!commentText.trim()}
                                  className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white disabled:opacity-50 disabled:scale-100 active:scale-90 transition-all shrink-0 shadow-lg shadow-blue-500/20"
                                >
                                  <Send size={16} className="-ml-0.5" />
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Button (+ Post) */}
      <AnimatePresence>
        {!isComposing && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsComposing(true)}
            className="fixed bottom-6 right-6 md:bottom-10 md:right-10 w-14 h-14 rounded-full text-white shadow-2xl flex items-center justify-center z-40"
            style={{ backgroundColor: accentColor, boxShadow: `0 10px 25px -5px ${accentColor}80` }}
          >
            <PenLine size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Full-Screen Compose Modal */}
      <AnimatePresence>
        {isComposing && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-white dark:bg-zinc-950 flex flex-col"
          >
            <div className="flex items-center justify-between px-4 h-14 border-b border-slate-100 dark:border-zinc-800">
              <button onClick={() => setIsComposing(false)} className="p-2 text-slate-900 dark:text-white rounded-full hover:bg-slate-100 dark:hover:bg-zinc-900">
                <X size={20} />
              </button>
              <button 
                onClick={handlePost}
                disabled={submittingPost || !composeMessage.trim() || !composeName.trim()}
                className="px-5 py-1.5 rounded-full text-white font-bold text-sm disabled:opacity-50 transition-transform active:scale-95"
                style={{ backgroundColor: accentColor }}
              >
                {submittingPost ? <Loader2 size={16} className="animate-spin" /> : "Post"}
              </button>
            </div>

            <div className="flex-1 p-6 flex flex-col max-w-2xl w-full mx-auto">
              <input
                value={composeName}
                onChange={e => setComposeName(e.target.value)}
                placeholder="What's your name?"
                className="text-xl font-bold bg-transparent outline-none placeholder:text-slate-300 dark:placeholder:text-zinc-600 mb-6 text-slate-900 dark:text-white"
                autoFocus
              />
              <textarea
                value={composeMessage}
                onChange={e => setComposeMessage(e.target.value)}
                placeholder="What's happening?"
                className="flex-1 text-xl lg:text-2xl font-medium bg-transparent outline-none resize-none placeholder:text-slate-300 dark:placeholder:text-zinc-600 text-slate-900 dark:text-white"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
