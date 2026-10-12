"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabase-client";

export interface StorefrontReviewsProps {
  storeId: string;
  storeName: string;
  accentColor?: string;
  isDark?: boolean;
}

interface StoreReview {
  id: string;
  store_id: string;
  reviewer_user_id?: string | null;
  reviewer_biz_name?: string | null;
  reviewer_avatar?: string | null;
  guest_name?: string | null;
  message: string;
  rating?: number | null;
  created_at: string;
}

interface SwiftLinkMerchant {
  id: string;
  biz_name?: string | null;
  biz_image?: string | null;
}

export function StorefrontReviews({
  storeId,
  storeName,
  accentColor = "#19C37D",
  isDark = false,
}: StorefrontReviewsProps) {
  const [reviews, setReviews] = useState<StoreReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"guest" | "swiftlink">("guest");

  // User state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [merchantProfile, setMerchantProfile] = useState<SwiftLinkMerchant | null>(null);

  // Form fields
  const [guestName, setGuestName] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const rateLimitKey = `swiftlink_review_${storeId}`;

  const fetchReviews = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("store_reviews")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error loading reviews:", error.message);
      } else if (data) {
        setReviews(data as StoreReview[]);
      }
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchReviews();

    const checkUser = async () => {
      if (!isSupabaseConfigured()) return;
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setCurrentUser(user);
          const { data: storeData } = await supabase
            .from("stores")
            .select("biz_name, biz_image")
            .eq("user_id", user.id)
            .maybeSingle();

          if (storeData) {
            setMerchantProfile({
              id: user.id,
              biz_name: storeData.biz_name,
              biz_image: storeData.biz_image,
            });
          }
        }
      } catch (err) {
        console.error("Error checking auth user:", err);
      }
    };

    checkUser();
  }, [storeId, fetchReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Rate limiter: 5 minutes
    const lastSubmitStr = typeof window !== "undefined" ? localStorage.getItem(rateLimitKey) : null;
    if (lastSubmitStr) {
      const lastSubmit = parseInt(lastSubmitStr, 10);
      const elapsed = Date.now() - lastSubmit;
      if (!isNaN(lastSubmit) && elapsed < 5 * 60 * 1000) {
        const remainingMinutes = Math.ceil((5 * 60 * 1000 - elapsed) / 60000);
        setErrorMessage(`You already left a review recently. Please wait ${remainingMinutes} minute(s) before posting another.`);
        return;
      }
    }

    const trimmedMsg = message.trim();
    if (trimmedMsg.length < 5) {
      setErrorMessage("Review message must be at least 5 characters.");
      return;
    }
    if (trimmedMsg.length > 800) {
      setErrorMessage("Review message cannot exceed 800 characters.");
      return;
    }

    setSubmitting(true);

    try {
      if (activeTab === "guest") {
        const trimmedName = guestName.trim();
        if (!trimmedName) {
          setErrorMessage("Please enter your name.");
          setSubmitting(false);
          return;
        }

        const { error } = await supabase.from("store_reviews").insert({
          store_id: storeId,
          guest_name: trimmedName,
          message: trimmedMsg,
          rating: rating || null,
        });

        if (error) {
          throw error;
        }
      } else {
        if (!currentUser) {
          setErrorMessage("Please sign in to post a verified review.");
          setSubmitting(false);
          return;
        }

        const { error } = await supabase.from("store_reviews").insert({
          store_id: storeId,
          reviewer_user_id: currentUser.id,
          reviewer_biz_name: merchantProfile?.biz_name || "Verified Merchant",
          reviewer_avatar: merchantProfile?.biz_image || null,
          message: trimmedMsg,
          rating: rating || null,
        });

        if (error) {
          throw error;
        }
      }

      if (typeof window !== "undefined") {
        localStorage.setItem(rateLimitKey, Date.now().toString());
      }

      setSuccessMessage("Thank you! Your review has been submitted.");
      setMessage("");
      setGuestName("");
      setRating(null);
      await fetchReviews();
    } catch (err: any) {
      console.error("Failed to submit review:", err);
      setErrorMessage(err?.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const cardBg = isDark ? "bg-[#111111] border-[#222222] text-white" : "bg-white border-gray-100 text-gray-900";
  const subText = isDark ? "text-gray-400" : "text-gray-500";
  const inputBg = isDark
    ? "bg-[#1a1a1a] border-[#333333] text-white placeholder-gray-500 focus:border-gray-500"
    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-400";

  return (
    <section className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Customer Reviews</h2>
          <p className={`text-sm mt-1 ${subText}`}>
            Feedback and experiences from customers of {storeName}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setFormOpen((prev) => !prev)}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-xl text-white transition-opacity hover:opacity-90 shadow-sm self-start sm:self-auto"
          style={{ backgroundColor: accentColor }}
        >
          {formOpen ? "Close Review Form" : "Leave a Review"}
        </button>
      </div>

      {formOpen && (
        <div className={`rounded-2xl border p-5 mb-8 ${cardBg} shadow-sm transition-all`}>
          <div className="flex border-b border-inherit pb-3 mb-5 gap-4">
            <button
              type="button"
              onClick={() => setActiveTab("guest")}
              className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
                activeTab === "guest"
                  ? "border-current text-current"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
              style={{ color: activeTab === "guest" ? accentColor : undefined }}
            >
              Guest
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("swiftlink")}
              className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
                activeTab === "swiftlink"
                  ? "border-current text-current"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
              style={{ color: activeTab === "swiftlink" ? accentColor : undefined }}
            >
              Sign in with SwiftLink
            </button>
          </div>

          {activeTab === "swiftlink" && !currentUser ? (
            <div className="py-6 text-center space-y-3">
              <p className={`text-sm ${subText}`}>
                Sign in to SwiftLink Pro to leave a verified review under your business identity.
              </p>
              <div>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-xl text-white transition-opacity hover:opacity-90 shadow-sm"
                  style={{ backgroundColor: accentColor }}
                >
                  Sign in / Create Account
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === "swiftlink" && currentUser && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-inherit">
                  {merchantProfile?.biz_image ? (
                    <img
                      src={merchantProfile.biz_image}
                      alt={merchantProfile.biz_name || "Merchant logo"}
                      className="w-10 h-10 rounded-full object-cover border border-inherit"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: accentColor }}
                    >
                      {(merchantProfile?.biz_name || currentUser.email || "M")[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-semibold">
                      {merchantProfile?.biz_name || "Verified Merchant"}
                    </div>
                    <div className={`text-xs ${subText}`}>Verified SwiftLink Account</div>
                  </div>
                </div>
              )}

              {activeTab === "guest" && (
                <div>
                  <label htmlFor="guest-name" className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${subText}`}>
                    Your Name
                  </label>
                  <input
                    id="guest-name"
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Enter your name"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-colors ${inputBg}`}
                    maxLength={100}
                  />
                </div>
              )}

              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${subText}`}>
                  Rating (Optional)
                </label>
                <div className="flex items-center gap-1.5 text-2xl select-none">
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const isFilled = rating !== null && starVal <= rating;
                    return (
                      <button
                        key={starVal}
                        type="button"
                        onClick={() => setRating(rating === starVal ? null : starVal)}
                        className="transition-transform hover:scale-110 focus:outline-none"
                        style={{ color: isFilled ? accentColor : "#cbd5e1" }}
                        title={`${starVal} star${starVal > 1 ? "s" : ""}`}
                      >
                        {isFilled ? "★" : "☆"}
                      </button>
                    );
                  })}
                  {rating !== null && (
                    <button
                      type="button"
                      onClick={() => setRating(null)}
                      className={`text-xs ml-2 hover:underline ${subText}`}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="review-message" className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${subText}`}>
                  Your Review
                </label>
                <textarea
                  id="review-message"
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share details of your experience with this store..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-colors ${inputBg}`}
                  minLength={5}
                  maxLength={800}
                />
                <div className={`text-right text-xs mt-1 ${subText}`}>
                  {message.length} / 800
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl text-sm bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl text-sm bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400">
                  {successMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 shadow-sm"
                style={{ backgroundColor: accentColor }}
              >
                {submitting ? "Submitting Review..." : "Submit Review"}
              </button>
            </form>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className={`h-24 rounded-2xl border animate-pulse ${isDark ? "bg-[#181818] border-[#222]" : "bg-gray-100 border-gray-200"}`} />
          <div className={`h-24 rounded-2xl border animate-pulse ${isDark ? "bg-[#181818] border-[#222]" : "bg-gray-100 border-gray-200"}`} />
        </div>
      ) : reviews.length === 0 ? (
        <div className={`rounded-2xl border p-8 text-center ${cardBg}`}>
          <p className={`text-sm ${subText}`}>Be the first to leave a review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => {
            const formattedDate = new Date(rev.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
            const displayName = rev.reviewer_biz_name || rev.guest_name || "Customer";
            const initial = displayName.charAt(0).toUpperCase() || "C";

            return (
              <div key={rev.id} className={`rounded-2xl border p-4 ${cardBg}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {rev.reviewer_avatar ? (
                      <img
                        src={rev.reviewer_avatar}
                        alt={displayName}
                        className="w-9 h-9 rounded-full object-cover border border-inherit"
                      />
                    ) : (
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white"
                        style={{ backgroundColor: accentColor }}
                      >
                        {initial}
                      </div>
                    )}

                    <div>
                      <div className="text-sm font-semibold flex items-center gap-1.5">
                        <span>{displayName}</span>
                        {rev.reviewer_user_id && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Verified
                          </span>
                        )}
                      </div>
                      <div className={`text-xs ${subText}`}>{formattedDate}</div>
                    </div>
                  </div>

                  {rev.rating && rev.rating >= 1 && (
                    <div className="flex items-center gap-0.5 text-sm" style={{ color: accentColor }}>
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <span key={idx}>{idx < rev.rating! ? "★" : "☆"}</span>
                      ))}
                    </div>
                  )}
                </div>

                <p className="text-sm leading-relaxed whitespace-pre-wrap">{rev.message}</p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
