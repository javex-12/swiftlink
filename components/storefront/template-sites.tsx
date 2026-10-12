"use client";

import { useState, useMemo } from "react";
import type { Product, ShopState } from "@/lib/schema";
import { websiteTemplateById, type WebsiteTemplate } from "@/lib/theme/templates";
import { cn } from "@/lib/utils";
import { LoadMoreButton, useCatalogWindow } from "@/components/storefront/catalog-window";
import {
  ShoppingBag,
  Search,
  MessageCircle,
  Truck,
  ShieldCheck,
  Headphones,
  Star,
  ArrowRight,
  MapPin,
  Phone,
  Clock,
  ChevronDown,
  X,
  MessageSquare,
  Send,
  Check,
  Plus,
  Tag,
  Quote,
  ArrowUpRight,
  Bookmark,
  Heart,
  Bell,
  Share2,
  Home,
  User,
  Settings,
  Minus,
} from "lucide-react";
import { getCleanWhatsAppDigits, formatDisplayPhone } from "@/lib/phone";

/*
 * The three stock-photo hero fallbacks (`unsplash.com/photo-...`) that used to
 * live here are gone: every template's banner is now built from its own type and
 * colour, so there is no "merchant has not uploaded a photo yet" hole to fill.
 * The constants were removed rather than left unused, so nothing can quietly
 * start showing stock imagery again.
 */

export type TemplateSiteProps = {
  state: ShopState;
  products: Product[];
  categories: string[];
  activeCategory: string;
  cartCount: number;
  onCategory: (category: string) => void;
  onProduct: (product: Product) => void;
  onSearch: () => void;
  onCart: () => void;
  onReviews: () => void;
  onLeaveFeedback?: () => void;
};

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--t-accent)]";

function formatPrice(currency: string, price: number) {
  return `${currency}${Number(price).toLocaleString()}`;
}

function shopNow() {
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("catalog")?.scrollIntoView({
    behavior: reduce ? "auto" : "smooth",
    block: "start",
  });
}

function ProductMedia({ product, className }: { product: Product; className?: string }) {
  const src = product.image || product.images?.[0];
  if (!src) {
    return (
      <div
        className={cn("h-full w-full bg-t-surface-alt flex items-center justify-center text-t-text-muted/40", className)}
        style={{
          background:
            "linear-gradient(160deg, var(--t-accent-subtle), var(--t-surface-alt) 60%, var(--t-surface))",
        }}
        aria-hidden="true"
      >
        <ShoppingBag className="h-10 w-10 opacity-30" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- merchant-uploaded product photo
    <img
      src={src}
      alt={product.name}
      // Product photos are the heaviest thing on a storefront and most cards are
      // offscreen on load; `lazy` keeps them off the critical path.
      loading="lazy"
      decoding="async"
      className={cn("h-full w-full object-cover", className)}
    />
  );
}

function CartMark({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-t-accent px-2 py-0.5 text-[10px] font-bold tabular-nums text-t-accent-fg">
      {count}
    </span>
  );
}

function EmptyCatalog() {
  return (
    <div className="rounded-2xl border border-dashed border-t-border bg-t-surface px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-t-accent-subtle text-t-accent">
        <ShoppingBag className="h-7 w-7" />
      </div>
      <p className="font-t-display text-2xl font-semibold">No products in this collection</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-t-text-muted">
        Select another category above or check back shortly for new arrivals.
      </p>
    </div>
  );
}

function storyOf(state: ShopState, template: WebsiteTemplate) {
  return (
    state.aboutUs?.trim() ||
    state.bio?.trim() ||
    state.tagline?.trim() ||
    "Crafting everyday essentials with attention to detail, enduring quality, and fast doorstep delivery."
  );
}

function TrustFeaturesStrip({ template }: { template: WebsiteTemplate }) {
  const isBold = template.id === "bold";
  return (
    <div className="border-y border-t-border bg-t-surface/50">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-8 sm:px-6 md:grid-cols-4 md:gap-6 md:px-8">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-t-accent-subtle text-t-accent">
            <Truck className="h-4 w-4" />
          </div>
          <div>
            <h4 className={cn("text-xs font-bold text-t-text", isBold && "uppercase tracking-wider")}>
              Express Delivery
            </h4>
            <p className="mt-0.5 text-[11px] leading-relaxed text-t-text-muted">
              Fast, tracked delivery nationwide
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-t-accent-subtle text-t-accent">
            <MessageCircle className="h-4 w-4" />
          </div>
          <div>
            <h4 className={cn("text-xs font-bold text-t-text", isBold && "uppercase tracking-wider")}>
              WhatsApp Checkout
            </h4>
            <p className="mt-0.5 text-[11px] leading-relaxed text-t-text-muted">
              1-tap orders directly with the store
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-t-accent-subtle text-t-accent">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h4 className={cn("text-xs font-bold text-t-text", isBold && "uppercase tracking-wider")}>
              Quality Guarantee
            </h4>
            <p className="mt-0.5 text-[11px] leading-relaxed text-t-text-muted">
              Authentic products guaranteed
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-t-accent-subtle text-t-accent">
            <Headphones className="h-4 w-4" />
          </div>
          <div>
            <h4 className={cn("text-xs font-bold text-t-text", isBold && "uppercase tracking-wider")}>
              Direct Support
            </h4>
            <p className="mt-0.5 text-[11px] leading-relaxed text-t-text-muted">
              Live advice on sizing & orders
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StoreFeedbackModal({
  bizName,
  phone,
  isOpen,
  onClose,
  onSubmitReview,
}: {
  bizName: string;
  phone?: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmitReview?: (review: { name: string; rating: number; message: string }) => void;
}) {
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    if (onSubmitReview) {
      onSubmitReview({
        name: name.trim() || "Verified Buyer",
        rating,
        message: message.trim(),
      });
    }
    setIsSubmitted(true);
  };

  const cleanPhone = phone ? getCleanWhatsAppDigits(phone) : "";
  const handleWhatsAppSend = () => {
    if (!cleanPhone) return;
    const reviewName = name.trim() || "Store Visitor";
    const waText = encodeURIComponent(
      `Hello ${bizName},\n\nI visited your storefront and would like to share my feedback:\nRating: ${rating}/5 Stars\nFrom: ${reviewName}\nMessage: ${message || "I really liked your collection!"}`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${waText}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-t-border bg-t-surface p-6 shadow-2xl text-t-text"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-t-border/50 pb-4">
          <div>
            <h3 id="feedback-modal-title" className="font-t-display text-xl font-bold">
              Leave Store Feedback
            </h3>
            <p className="mt-1 text-xs text-t-text-muted">
              Share your thoughts, review products, or send direct feedback to {bizName}.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-t-text-muted hover:bg-t-surface-alt hover:text-t-text transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 sf-accent-text">
              <Check className="h-6 w-6" />
            </div>
            <h4 className="font-t-display text-lg font-bold">Thank You!</h4>
            <p className="mx-auto max-w-xs text-xs text-t-text-muted">
              Your feedback for {bizName} has been received. Your input helps improve our store.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              {cleanPhone && (
                <button
                  type="button"
                  onClick={handleWhatsAppSend}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold sf-accent-text transition hover:bg-emerald-500/20"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Also Send on WhatsApp</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-t-accent px-5 py-2.5 text-xs font-bold text-t-accent-fg transition"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-t-text mb-1.5">
                Your Rating
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 transition hover:scale-110"
                    aria-label={`Rate ${star} star`}
                  >
                    <Star
                      className={cn(
                        "h-6 w-6",
                        star <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-t-border fill-transparent"
                      )}
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs font-semibold text-t-text-muted">
                  {rating} of 5 Stars
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-t-text mb-1">
                Your Name / Location (Optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bukola from Ikeja"
                className="w-full rounded-xl border border-t-border bg-t-surface-alt p-3 text-xs text-t-text placeholder-t-text-muted outline-none focus:border-t-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-t-text mb-1">
                Feedback & Review
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what you loved about the products, customer experience, or what we can improve..."
                className="w-full rounded-xl border border-t-border bg-t-surface-alt p-3 text-xs text-t-text placeholder-t-text-muted outline-none focus:border-t-accent"
              />
            </div>

            <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 border-t border-t-border/50">
              {cleanPhone && (
                <button
                  type="button"
                  onClick={handleWhatsAppSend}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold sf-accent-text transition hover:bg-emerald-500/20"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Send on WhatsApp</span>
                </button>
              )}
              <button
                type="submit"
                disabled={!message.trim()}
                className="flex items-center justify-center gap-2 rounded-xl bg-t-accent px-5 py-2.5 text-xs font-bold text-t-accent-fg transition hover:opacity-95 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Submit Feedback</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/**
 * Real reviews only.
 *
 * This section used to ship three invented, five-star reviews ("Tunde A.",
 * "Chioma K.", "Daniel M.") and a fabricated "4.9 / 5.0 (verified ratings)"
 * aggregate, presented as the merchant's own customers. That is a false claim
 * about a real business, so it is gone: the section renders the merchant's own
 * reviews and nothing else, and shows no rating figure it cannot compute.
 */
function TestimonialsSection({
  bizName,
  testimonials,
  onLeaveFeedback,
}: {
  bizName: string;
  testimonials?: { id: string; quote: string; author: string; avatar?: string }[];
  onLeaveFeedback?: () => void;
}) {
  const reviews = (testimonials || []).filter((entry) => entry && entry.quote && entry.author);

  return (
    <section className="border-t border-t-border bg-t-surface/30 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-t-accent">
              Customer Reviews
            </span>
            <h3 className="mt-2 font-t-display text-2xl font-bold sm:text-3xl text-t-text">
              {reviews.length > 0
                ? `What customers say about ${bizName}`
                : `Be the first to review ${bizName}`}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {onLeaveFeedback && (
              <button
                type="button"
                onClick={onLeaveFeedback}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl border border-t-border bg-t-surface px-3.5 py-2 text-xs font-semibold text-t-text shadow-xs transition hover:border-t-accent hover:text-t-accent",
                  focusRing
                )}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Leave Feedback</span>
              </button>
            )}
          </div>
        </div>

        {reviews.length === 0 ? (
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-t-text-muted">
            No reviews yet. Share your experience after your order and it will appear here.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="flex flex-col justify-between rounded-2xl border border-t-border bg-t-surface p-6 shadow-xs"
              >
                <div>
                  {r.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.avatar}
                      alt={r.author}
                      className="mb-3 h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-t-accent-subtle text-xs font-bold text-t-accent-text">
                      {r.author.trim().charAt(0).toUpperCase()}
                    </span>
                  )}
                  <p className="text-sm leading-relaxed text-t-text">{r.quote}</p>
                </div>
                <div className="mt-6 border-t border-t-border/50 pt-4 text-xs text-t-text-muted">
                  <span className="font-semibold text-t-text">{r.author}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function FaqSection({ faqs }: { faqs?: { q: string; a: string }[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const defaultFaqs = [
    {
      q: "How does ordering on WhatsApp work?",
      a: "Browse the catalog, add what you want to your cart, then tap Order on WhatsApp. Your items and quantities are formatted into a message and sent straight to the store, which confirms availability and next steps with you directly.",
    },
    {
      q: "How do I arrange payment and delivery?",
      a: "Payment and delivery are agreed directly with the store on WhatsApp, so the options and timing you are offered come from the merchant rather than from a template.",
    },
    {
      q: "Can I ask about an item before ordering?",
      a: "Yes. Message the store on WhatsApp with any question about sizing, stock or condition and you will get a reply from the merchant.",
    },
  ];

  const items = faqs && faqs.length > 0 ? faqs : defaultFaqs;

  return (
    <section className="border-t border-t-border py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 md:px-8">
        <div className="text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-t-accent">
            Assistance
          </span>
          <h3 className="mt-2 font-t-display text-2xl font-bold sm:text-3xl text-t-text">
            Frequently Asked Questions
          </h3>
          <p className="mt-2 text-sm text-t-text-muted">
            Everything you need to know about purchasing and delivery.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          {items.map((faq, i) => {
            const isOpen = openIdx === i;
            return (
              <div
                key={i}
                className="overflow-hidden rounded-xl border border-t-border bg-t-surface transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  className="flex w-full items-center justify-between p-4 sm:p-5 text-left text-sm font-semibold text-t-text transition hover:text-t-accent"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform text-t-text-muted",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-t-border/50 px-4 pb-5 pt-3 sm:px-5">
                    <p className="text-sm leading-relaxed text-t-text-muted">{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function MobileStickyCartBar({ count, onCart }: { count: number; onCart: () => void }) {
  if (count <= 0) return null;
  return (
    <aside
      aria-label="Active shopping bag"
      className="fixed bottom-[85px] right-4 z-40 md:hidden"
    >
      <button
        type="button"
        onClick={onCart}
        aria-label={`Open shopping bag, ${count} ${count === 1 ? "item" : "items"}`}
        className="group relative flex items-center gap-2.5 rounded-full bg-t-accent text-t-accent-fg pl-3.5 pr-4 py-2.5 shadow-[0_10px_30px_-3px_rgba(0,0,0,0.4),0_4px_12px_-2px_rgba(0,0,0,0.25)] border border-white/20 backdrop-blur-md transition-all duration-200 active:scale-95"
      >
        <div className="relative flex items-center justify-center">
          <ShoppingBag className="h-5 w-5" />
          <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-t-text px-1 text-[10px] font-black text-t-bg leading-none shadow-sm">
            {count}
          </span>
        </div>
        <span className="text-xs font-bold tracking-tight">Cart</span>
      </button>
    </aside>
  );
}

// =============================================================================
// 1. EDITORIAL SITE
// =============================================================================
function EditorialSite(props: TemplateSiteProps & { template: WebsiteTemplate }) {
  const { state, products, categories, activeCategory, cartCount, template } = props;
  const title = state.heroTitle || state.bizName || template.name;
  const subtitle = state.heroSubtitle || state.tagline || template.tagline;
  const story = storyOf(state, template);
  const [searchFilter, setSearchFilter] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = activeCategory === "All" || p.category === activeCategory;
      const matchesSearch =
        !searchFilter.trim() ||
        p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(searchFilter.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [products, activeCategory, searchFilter]);

  // Catalog windowing: render one page of cards at a time instead of mounting
  // the entire catalog (see components/storefront/catalog-window.tsx).
  const { shown, remaining, hasMore, loadMore } = useCatalogWindow(
    filtered.length,
    `${activeCategory}|${searchFilter}`,
  );

  const handleFeedbackClick = () => {
    if (props.onLeaveFeedback) {
      props.onLeaveFeedback();
    } else {
      setFeedbackOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-t-bg pb-24 font-t-body text-t-text">
      {/* Top Announcement Bar */}
      <div className="border-b border-t-border bg-t-surface-alt/70 px-4 py-2 text-center text-xs text-t-text-muted">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 text-[11px] sm:text-xs">
          <span className="hidden sm:inline-flex items-center gap-1 font-medium">
            <Truck className="h-3.5 w-3.5 text-t-accent" />
            {state.deliveryAreas || "Express Nationwide Delivery"}
          </span>
          <span className="mx-auto sm:mx-0 font-medium">
            Direct WhatsApp Checkout · Official Storefront
          </span>
          <span className="hidden md:inline-flex items-center gap-1 font-medium">
            <Clock className="h-3.5 w-3.5 text-t-accent" />
            Orders Shipped Within 24 Hours
          </span>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-sticky border-b border-t-border bg-t-bg/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2.5 px-3.5 py-3 sm:px-6 sm:py-4 md:px-8">
          <button
            type="button"
            onClick={shopNow}
            className={cn("flex min-w-0 items-center gap-2 font-t-display text-base sm:text-2xl font-bold leading-none tracking-tight text-left", focusRing)}
          >
            {state.bizImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={state.bizImage} alt="" className="h-6 w-6 sm:h-7 sm:w-7 shrink-0 rounded-full object-cover border border-t-border" />
            )}
            <span className="truncate max-w-[140px] xs:max-w-[200px] sm:max-w-xs">{state.bizName || template.name}</span>
          </button>

          <nav className="hidden items-center gap-7 text-sm font-medium md:flex" aria-label="Store">
            <button type="button" onClick={shopNow} className={cn("text-t-text hover:text-t-accent transition", focusRing)}>
              Catalog
            </button>
            <a href="#story" className={cn("text-t-text-muted hover:text-t-text transition", focusRing)}>
              Our Story
            </a>
            <button type="button" onClick={handleFeedbackClick} className={cn("text-t-text-muted hover:text-t-text transition", focusRing)}>
              Feedback & Reviews
            </button>
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            <button
              type="button"
              onClick={props.onSearch}
              className={cn("flex items-center gap-1 rounded-xl border border-t-border bg-t-surface p-2 sm:px-3 sm:py-2 text-xs font-medium text-t-text transition hover:border-t-accent", focusRing)}
              aria-label="Search catalog"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search</span>
            </button>

            {state.phone && (
              <a
                href={`https://wa.me/${getCleanWhatsAppDigits(state.phone)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn("hidden md:flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold sf-accent-text transition hover:bg-emerald-500/20", focusRing)}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
              </a>
            )}

            <button
              type="button"
              onClick={props.onCart}
              className={cn("flex items-center gap-1.5 rounded-xl bg-t-accent px-3 py-2 text-xs font-semibold text-t-accent-fg shadow-xs transition hover:opacity-95 active:scale-95", focusRing)}
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cart</span>
              <CartMark count={cartCount} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 sm:px-6 md:grid-cols-12 md:gap-12 md:px-8 md:py-20">
        <div className="md:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-t-border bg-t-surface-alt px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-t-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-t-accent animate-pulse" />
            Curated Collection
          </div>
          <h1 className="mt-4 font-t-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl break-words">
            {title}
          </h1>
          <p className="mt-5 max-w-lg text-base sm:text-lg leading-relaxed text-t-text-muted">
            {subtitle}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={shopNow}
              className={cn("flex items-center gap-2 rounded-xl bg-t-accent px-6 py-3.5 text-sm font-semibold text-t-accent-fg shadow-md transition hover:opacity-95 active:scale-95", focusRing)}
            >
              <span>{state.heroButtonText || "Explore Products"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href="#story"
              className={cn("rounded-xl border border-t-border bg-t-surface px-5 py-3.5 text-sm font-medium text-t-text transition hover:border-t-accent", focusRing)}
            >
              Learn More
            </a>
          </div>
        </div>

        {/*
          No hero photograph. The banner is carried by the template's own type
          and colour: a stock shot made every template look like the same site
          with a different picture, and merchants' real photos were usually a
          logo or a blurry phone snap that cheapened the page. The panel keeps
          the two-column rhythm with facts instead.
        */}
        <div className="md:col-span-5">
          <div className="flex h-full flex-col justify-between gap-6 rounded-2xl border border-t-border bg-t-surface-alt p-6 shadow-sm">
            <div>
              <p className="font-t-display text-2xl font-bold text-t-text break-words">
                {state.bizName || template.name}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-t-text-muted">
                {state.tagline || template.tagline}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-4 border-t border-t-border pt-5">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-t-text-muted">Items</dt>
                <dd className="mt-0.5 font-t-display text-xl font-bold text-t-text">{products.length}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-t-text-muted">Order via</dt>
                <dd className="mt-0.5 font-t-display text-xl font-bold text-t-text">WhatsApp</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Trust Features Strip */}
      <TrustFeaturesStrip template={template} />

      {/* Catalog Section */}
      <section id="catalog" className="scroll-mt-20 border-t border-t-border">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:px-8 md:py-16">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-t-accent">
                Inventory
              </span>
              <h2 className="mt-1 font-t-display text-3xl font-bold text-t-text sm:text-4xl">
                Featured Products
              </h2>
            </div>

            {/* Quick Catalog Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-t-text-muted" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter by keyword…"
                className="w-full rounded-xl border border-t-border bg-t-surface py-2 pl-9 pr-3 text-xs text-t-text placeholder-t-text-muted outline-none focus:border-t-accent"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="mt-6 flex gap-2 overflow-x-auto pb-2 scrollbar-none" role="tablist" aria-label="Categories">
            {categories.map((category) => {
              const selected = category === activeCategory;
              const count =
                category === "All"
                  ? products.length
                  : products.filter((p) => p.category === category).length;
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => props.onCategory(category)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition",
                    focusRing,
                    selected
                      ? "bg-t-accent text-t-accent-fg shadow-xs"
                      : "border border-t-border bg-t-surface text-t-text hover:border-t-accent/50",
                  )}
                >
                  <span>{category}</span>
                  <span className={cn("text-[10px] opacity-70", selected ? "text-t-accent-fg" : "text-t-text-muted")}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Product Cards Grid */}
          {filtered.length === 0 ? (
            <div className="mt-10">
              <EmptyCatalog />
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-4 min-[460px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 sm:gap-6">
              {filtered.slice(0, shown).map((product) => (
                <div
                  key={product.id}
                  onClick={() => props.onProduct(product)}
                  className={cn(
                    "group flex flex-col justify-between overflow-hidden rounded-2xl border border-t-border bg-t-surface transition hover:border-t-accent/50 hover:shadow-lg cursor-pointer",
                    focusRing,
                  )}
                >
                  <div>
                    {/* Image Area */}
                    <div className="relative aspect-[4/5] overflow-hidden bg-t-surface-alt">
                      <ProductMedia
                        product={product}
                        className="transition-transform duration-500 group-hover:scale-105"
                      />
                      {product.badge && (
                        <span className="absolute left-3 top-3 rounded-full bg-t-accent px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-t-accent-fg shadow-xs">
                          {product.badge}
                        </span>
                      )}
                      {product.outOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs">
                          <span className="rounded-full sf-surface px-3 py-1 text-[10px] font-bold uppercase text-black">
                            Sold Out
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-4 sm:p-5">
                      {product.category && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-t-accent">
                          {product.category}
                        </span>
                      )}
                      <h3 className="mt-1 text-sm sm:text-base font-bold text-t-text line-clamp-1 group-hover:text-t-accent transition">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="mt-1.5 text-xs leading-relaxed text-t-text-muted line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom / Price & CTA */}
                  <div className="flex items-center justify-between border-t border-t-border/50 px-4 py-3 sm:px-5">
                    <span className="text-sm sm:text-base font-bold tabular-nums text-t-text">
                      {formatPrice(state.currency, product.price)}
                    </span>
                    <button
                      type="button"
                      disabled={product.outOfStock}
                      onClick={(e) => {
                        e.stopPropagation();
                        props.onProduct(product);
                      }}
                      className={cn(
                        "flex items-center gap-1 rounded-xl bg-t-accent-subtle px-3 py-1.5 text-xs font-bold text-t-accent transition hover:bg-t-accent hover:text-t-accent-fg",
                        product.outOfStock && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <span>Order</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {hasMore && <LoadMoreButton remaining={remaining} onClick={loadMore} />}
        </div>
      </section>

      {/* Story Section */}
      <section id="story" className="border-t border-t-border bg-t-surface/40 py-16 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-12 md:gap-12 md:px-8">
          <div className="md:col-span-4">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-t-accent">
              Our Philosophy
            </span>
            <h3 className="mt-2 font-t-display text-2xl font-bold sm:text-3xl text-t-text">
              Built on Quality & Authenticity
            </h3>
            {state.location && (
              <p className="mt-4 flex items-center gap-1.5 text-xs text-t-text-muted">
                <MapPin className="h-3.5 w-3.5 text-t-accent" />
                {state.location}
              </p>
            )}
          </div>
          <div className="md:col-span-8">
            <p className="font-t-display text-xl sm:text-2xl leading-relaxed text-t-text">
              {story}
            </p>
            <div className="mt-8 flex flex-wrap gap-6 border-t border-t-border pt-6 text-xs text-t-text-muted">
              <div>
                <span className="block font-bold text-t-text">Nationwide Delivery</span>
                <span>{state.deliveryAreas || "Delivered nationwide with tracking"}</span>
              </div>
              <div>
                <span className="block font-bold text-t-text">WhatsApp Direct Orders</span>
                <span>{state.phone || "Active customer care"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <TestimonialsSection
        bizName={state.bizName || template.name}
        testimonials={state.testimonials}
        onLeaveFeedback={handleFeedbackClick}
      />

      {/* FAQ Section */}
      <FaqSection faqs={state.faqItems} />

      {/* Store Footer */}
      <footer className="border-t border-t-border bg-t-surface py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="font-t-display text-xl font-bold text-t-text">
                {state.bizName || template.name}
              </span>
              <p className="mt-1 text-xs text-t-text-muted">
                {state.tagline || template.tagline}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-t-text-muted">
              {state.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {state.phone}
                </span>
              )}
              {state.deliveryAreas && (
                <span className="flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  {state.deliveryAreas}
                </span>
              )}
            </div>
          </div>
          <div className="mt-8 border-t border-t-border/50 pt-6 text-center text-xs text-t-text-muted">
            &copy; {new Date().getFullYear()} {state.bizName || template.name}. All rights reserved. Powered by SwiftLink.
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Cart Trigger */}
      <MobileStickyCartBar count={cartCount} onCart={props.onCart} />

      {/* Store Feedback Modal */}
      <StoreFeedbackModal
        bizName={state.bizName || template.name}
        phone={state.phone}
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
    </div>
  );
}

// =============================================================================
// 2. BOUTIQUE SITE (Pinterest / Luxury Curated Boutique)
// =============================================================================
function BoutiqueSite(props: TemplateSiteProps & { template: WebsiteTemplate }) {
  const { state, products, categories, activeCategory, cartCount, template } = props;
  const title = state.heroTitle || state.bizName || template.name;
  const subtitle = state.heroSubtitle || state.tagline || template.tagline;
  const story = storyOf(state, template);
  const mark = state.bizImage;
  const [searchFilter, setSearchFilter] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const waDigits = getCleanWhatsAppDigits(state.phone);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = activeCategory === "All" || p.category === activeCategory;
      const matchesSearch =
        !searchFilter.trim() ||
        p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(searchFilter.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [products, activeCategory, searchFilter]);

  const { shown, remaining, hasMore, loadMore } = useCatalogWindow(
    filtered.length,
    `${activeCategory}|${searchFilter}`,
  );

  const handleFeedbackClick = () => {
    if (props.onLeaveFeedback) {
      props.onLeaveFeedback();
    } else {
      setFeedbackOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-t-bg pb-28 font-t-body text-t-text">
      {/* Top Ambient Ribbon */}
      <div className="bg-t-accent-subtle/80 px-4 py-2 text-center text-xs font-medium text-t-accent-text border-b border-t-border backdrop-blur-sm">
        <span className="inline-flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 text-t-accent inline" />
          <span>{state.tagline || template.tagline || "Curated Storefront"}</span>
          <span className="opacity-40">·</span>
          <span>{state.deliveryAreas || state.location || "Nationwide Delivery"}</span>
        </span>
      </div>

      {/* Boutique Header */}
      <header className="sticky top-0 z-sticky border-b border-t-border/70 bg-t-bg/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={props.onSearch}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full border border-t-border bg-t-surface px-3 py-1.5 text-xs text-t-text shadow-2xs transition hover:border-t-accent",
              focusRing
            )}
            aria-label="Search collection"
          >
            <Search className="h-3.5 w-3.5 text-t-text-muted" />
            <span className="hidden sm:inline font-medium">Search Pins</span>
          </button>

          <button type="button" onClick={shopNow} className={cn("flex min-w-0 items-center gap-2.5", focusRing)}>
            <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-t-accent/20 bg-t-accent-subtle shadow-xs">
              {mark ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mark} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="font-t-display text-sm sm:text-base font-bold text-t-accent">
                  {(state.bizName || template.name).slice(0, 1)}
                </span>
              )}
            </span>
            <div className="text-left">
              <span className="block truncate max-w-[140px] xs:max-w-[200px] sm:max-w-xs font-t-display text-base sm:text-xl font-bold tracking-tight text-t-text">
                {state.bizName || template.name}
              </span>
              <span className="hidden sm:block text-[10px] uppercase tracking-widest text-t-text-muted">
                Curated Boutique
              </span>
            </div>
          </button>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleFeedbackClick}
              className={cn(
                "hidden sm:flex items-center gap-1.5 rounded-full border border-t-border bg-t-surface px-3.5 py-1.5 text-xs font-medium text-t-text transition hover:border-t-accent",
                focusRing
              )}
            >
              <MessageSquare className="h-3.5 w-3.5 text-t-accent" />
              <span>Reviews</span>
            </button>

            <button
              type="button"
              onClick={props.onCart}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full bg-t-accent px-3.5 py-2 text-xs font-bold text-t-accent-fg shadow-md transition hover:opacity-95 active:scale-95",
                focusRing
              )}
              aria-label="Cart"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Bag</span>
              <CartMark count={cartCount} />
            </button>
          </div>
        </div>
      </header>

      {/* Pinterest-Inspired Hero Banner */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:px-8 md:py-14">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-t-border bg-gradient-to-br from-t-surface via-t-surface-alt to-t-surface p-6 sm:p-10 md:p-14 shadow-lg">
          <div className="relative z-10 grid items-center gap-8 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-t-border/60 bg-t-bg/80 px-4 py-1.5 text-xs font-semibold text-t-accent shadow-xs backdrop-blur-md">
                <Tag className="h-3.5 w-3.5" />
                <span>Curated Storefront</span>
              </div>
              <h1 className="font-t-display text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-t-text leading-[1.1] break-words">
                {title}
              </h1>
              <p className="max-w-lg text-sm sm:text-base leading-relaxed text-t-text-muted">
                {subtitle}
              </p>
              <div className="pt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={shopNow}
                  className={cn(
                    "flex items-center gap-2 rounded-full bg-t-accent px-6 py-3.5 text-xs sm:text-sm font-bold text-t-accent-fg shadow-lg shadow-t-accent/20 transition hover:opacity-95 active:scale-95",
                    focusRing
                  )}
                >
                  <span>{state.heroButtonText || "Explore Catalog"}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                {waDigits && (
                  <a
                    href={`https://wa.me/${waDigits}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-2 rounded-full border border-t-border bg-t-bg/90 px-5 py-3.5 text-xs sm:text-sm font-semibold text-t-text shadow-xs transition hover:border-t-accent hover:text-t-accent",
                      focusRing
                    )}
                  >
                    <MessageCircle className="h-4 w-4 text-emerald-500" />
                    <span>WhatsApp Inquiry</span>
                  </a>
                )}
              </div>
            </div>

            {/* Pinterest-style Staggered Pins Collage */}
            <div className="md:col-span-5 relative">
              <div className="relative mx-auto flex max-w-sm justify-center items-center">
                {products.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 w-full">
                    {products.slice(0, 2).map((product, idx) => (
                      <div
                        key={product.id}
                        onClick={() => props.onProduct(product)}
                        className={cn(
                          "cursor-pointer rounded-2xl border border-t-border bg-t-bg p-2.5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
                          idx === 1 ? "mt-6" : ""
                        )}
                      >
                        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-t-surface-alt">
                          <ProductMedia product={product} />
                          <span className="absolute bottom-2 left-2 rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                            {formatPrice(state.currency, product.price)}
                          </span>
                        </div>
                        <p className="mt-2 truncate text-xs font-semibold text-t-text">
                          {product.name}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-full rounded-2xl border border-dashed border-t-border bg-t-bg/70 p-6 text-center shadow-xs">
                    <ShoppingBag className="mx-auto h-8 w-8 text-t-accent/60" />
                    <p className="mt-2 text-xs font-semibold text-t-text">Catalog Updating</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <TrustFeaturesStrip template={template} />

      {/* Pinterest-Style Curated Catalog */}
      <section id="catalog" className="scroll-mt-16 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-t-border pb-5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-t-accent">
                Curated Showcase
              </span>
              <h2 className="mt-1 font-t-display text-2xl sm:text-3xl font-bold text-t-text">
                All Pinned Items ({products.length})
              </h2>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-t-text-muted" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search collection…"
                className="w-full rounded-full border border-t-border bg-t-surface py-2 pl-9 pr-4 text-xs text-t-text outline-none focus:border-t-accent shadow-2xs"
              />
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto py-4 scrollbar-none" role="tablist">
            {categories.map((category) => {
              const selected = category === activeCategory;
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => props.onCategory(category)}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition shadow-2xs",
                    focusRing,
                    selected
                      ? "bg-t-accent text-t-accent-fg font-bold shadow-xs"
                      : "border border-t-border bg-t-surface text-t-text hover:border-t-accent"
                  )}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div className="py-12">
              <EmptyCatalog />
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {filtered.slice(0, shown).map((product) => (
                <div
                  key={product.id}
                  onClick={() => props.onProduct(product)}
                  className={cn(
                    "group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-t-border/80 bg-t-surface p-3 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer",
                    focusRing
                  )}
                >
                  <div>
                    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-t-surface-alt">
                      <ProductMedia product={product} className="transition-transform duration-500 group-hover:scale-105" />
                      {product.category && (
                        <span className="absolute top-2.5 left-2.5 rounded-full bg-t-bg/90 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-semibold text-t-text shadow-2xs">
                          {product.category}
                        </span>
                      )}
                      {product.outOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs">
                          <span className="rounded-full bg-black/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                            Sold Out
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 px-1">
                      <h3 className="font-t-display text-sm sm:text-base font-bold text-t-text line-clamp-1 group-hover:text-t-accent transition">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="mt-1 text-xs text-t-text-muted line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-t-border/50 pt-3 px-1">
                    <span className="font-t-display text-sm sm:text-base font-bold tabular-nums text-t-text">
                      {formatPrice(state.currency, product.price)}
                    </span>
                    <button
                      type="button"
                      disabled={product.outOfStock}
                      onClick={(e) => {
                        e.stopPropagation();
                        props.onProduct(product);
                      }}
                      className="rounded-full bg-t-accent-subtle px-3 py-1.5 text-xs font-bold text-t-accent-text hover:bg-t-accent hover:text-t-accent-fg transition shadow-2xs"
                    >
                      Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {hasMore && <LoadMoreButton remaining={remaining} onClick={loadMore} />}
        </div>
      </section>

      {/* Curated Story & Founder's Note */}
      <section id="story" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 md:px-8">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-t-border bg-t-accent-subtle/50 px-6 py-10 sm:px-12 sm:py-14 shadow-sm">
          <Quote className="h-10 w-10 text-t-accent/30 mb-3" />
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-t-accent-text">
            Founder&apos;s Note
          </span>
          <p className="mt-3 max-w-2xl font-t-display text-2xl sm:text-3xl leading-snug text-t-text">
            {story}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-semibold text-t-accent-text">
            <span>{state.bizName || template.name}</span>
            <span>·</span>
            <span>Artisanal Studio</span>
            <span>·</span>
            <span>Personal WhatsApp Service</span>
          </div>
        </div>
      </section>

      <TestimonialsSection
        bizName={state.bizName || template.name}
        testimonials={state.testimonials}
        onLeaveFeedback={handleFeedbackClick}
      />

      <FaqSection faqs={state.faqItems} />

      {/* Boutique Footer */}
      <footer className="border-t border-t-border bg-t-surface/40 px-4 py-12 text-center text-xs text-t-text-muted">
        <div className="mx-auto max-w-6xl">
          <p className="font-t-display text-lg font-bold text-t-text">{state.bizName || template.name}</p>
          <p className="mt-2 text-sm">{state.phone || "Message us on WhatsApp to order"}</p>
          <p className="mt-1">{state.deliveryAreas || state.location || "Nationwide Delivery"}</p>
          <p className="mt-8 text-[11px] opacity-70">
            &copy; {new Date().getFullYear()} {state.bizName || template.name} · Powered by SwiftLink
          </p>
        </div>
      </footer>

      <MobileStickyCartBar count={cartCount} onCart={props.onCart} />

      <StoreFeedbackModal
        bizName={state.bizName || template.name}
        phone={state.phone}
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
    </div>
  );
}

// =============================================================================
// 3. BOLD SITE (Dribbble Streetwear / High-Energy Brutalist Drop)
// =============================================================================
function BoldSite(props: TemplateSiteProps & { template: WebsiteTemplate }) {
  const { state, products, categories, activeCategory, cartCount, template } = props;
  const title = state.heroTitle || state.bizName || template.name;
  const subtitle = state.heroSubtitle || state.tagline || template.tagline;
  const story = storyOf(state, template);
  const [searchFilter, setSearchFilter] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const waDigits = getCleanWhatsAppDigits(state.phone);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = activeCategory === "All" || p.category === activeCategory;
      const matchesSearch =
        !searchFilter.trim() ||
        p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(searchFilter.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [products, activeCategory, searchFilter]);

  const { shown, remaining, hasMore, loadMore } = useCatalogWindow(
    filtered.length,
    `${activeCategory}|${searchFilter}`,
  );

  const handleFeedbackClick = () => {
    if (props.onLeaveFeedback) {
      props.onLeaveFeedback();
    } else {
      setFeedbackOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-t-bg pb-28 font-t-body text-t-text selection:bg-t-accent selection:text-t-accent-fg">
      {/* ─── BOLD DYNAMIC STICKY HEADER WITH CONTINUOUS SCROLL INFO ─── */}
      <header className="sticky top-0 z-sticky border-b-2 border-t-border bg-t-bg/95 backdrop-blur-md">
        {/* Dynamic Continuous Scroll Info Bar */}
        <div className="overflow-hidden border-b-2 border-t-border bg-t-accent py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-t-accent-fg">
          {(() => {
            const items = [
              state.bizName,
              state.tagline,
              state.deliveryAreas || state.location || "Nationwide Doorstep Delivery",
              "Orders Dispatched Direct via WhatsApp",
              "Live Verified Storefront",
              state.phone ? `WhatsApp: ${state.phone}` : null,
            ].filter(Boolean);
            const stream = [...items, ...items, ...items];
            return (
              <div className="flex whitespace-nowrap animate-marquee">
                {stream.map((item, i) => (
                  <span key={i} className="inline-flex items-center">
                    <span className="mx-4">{item}</span>
                    <span className="opacity-40 mr-4 font-normal">/</span>
                  </span>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Main Store Identity & Navigation Bar */}
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3.5 py-2.5 sm:px-6 sm:py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={shopNow}
              className={cn(
                "flex items-center gap-2 truncate text-left text-base sm:text-xl font-black uppercase tracking-wider",
                focusRing
              )}
            >
              {state.bizImage && (
                <img
                  src={state.bizImage}
                  alt=""
                  className="h-7 w-7 rounded-lg object-cover border-2 border-t-border shrink-0"
                />
              )}
              <span className="truncate max-w-[140px] xs:max-w-[200px] sm:max-w-[280px]">
                {state.bizName || template.name}
              </span>
            </button>
            <span className="hidden md:inline-flex items-center gap-1.5 border border-t-border bg-t-surface px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-t-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-t-accent animate-ping" />
              Live Orders
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleFeedbackClick}
              className={cn(
                "hidden sm:flex items-center gap-1 border-2 border-t-border bg-t-surface px-3 py-1.5 text-xs font-black uppercase tracking-wider text-t-text hover:bg-t-accent hover:text-t-accent-fg transition",
                focusRing
              )}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Reviews</span>
            </button>

            <button
              type="button"
              onClick={props.onSearch}
              className={cn(
                "flex items-center gap-1 border-2 border-t-border bg-t-surface p-2 sm:px-3 sm:py-1.5 text-xs font-black uppercase tracking-wider",
                focusRing
              )}
              aria-label="Search"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search</span>
            </button>

            <button
              type="button"
              onClick={props.onCart}
              className={cn(
                "flex items-center gap-1.5 border-2 border-t-border bg-t-accent px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-black uppercase tracking-wider text-t-accent-fg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all",
                focusRing
              )}
              aria-label="Cart"
            >
              <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Bag</span>
              <CartMark count={cartCount} />
            </button>
          </div>
        </div>
      </header>

      {/* Streetwear Poster Hero */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12">
        <div className="border-2 border-t-border bg-t-surface p-6 sm:p-10 md:p-12 shadow-[6px_6px_0px_0px_var(--t-accent)]">
          <div className="grid items-center gap-8 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="border-2 border-current bg-t-accent px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-t-accent-fg">
                  DROP ACTIVE
                </span>
                <span className="border border-t-border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-t-text-muted">
                  {state.deliveryAreas || state.location || "Nationwide Delivery"}
                </span>
              </div>
              <h1 className="mt-4 text-4xl sm:text-6xl md:text-7xl font-black uppercase leading-[0.88] tracking-tight break-words">
                {title}
              </h1>
              <p className="mt-4 max-w-md text-sm sm:text-base font-bold leading-relaxed opacity-85">
                {subtitle}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={shopNow}
                  className={cn(
                    "border-2 border-t-border bg-t-accent px-6 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-t-accent-fg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all",
                    focusRing
                  )}
                >
                  {state.heroButtonText || "GRAB THE DROP"} →
                </button>
                {waDigits && (
                  <a
                    href={`https://wa.me/${waDigits}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-2 border-2 border-t-border bg-t-bg px-5 py-3.5 text-xs font-black uppercase tracking-[0.14em] text-t-text shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-t-surface active:translate-x-1 active:translate-y-1 active:shadow-none transition-all",
                      focusRing
                    )}
                  >
                    <MessageCircle className="h-4 w-4 text-emerald-500" />
                    <span>WHATSAPP VIP CHAT</span>
                  </a>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:col-span-5">
              {(products.length > 0 ? products.slice(0, 2) : []).map((product, idx) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => props.onProduct(product)}
                  className={cn(
                    "relative aspect-square overflow-hidden border-2 border-t-border bg-t-bg text-left group transition hover:scale-[1.02]",
                    focusRing
                  )}
                >
                  <ProductMedia product={product} />
                  <span className="absolute top-2 left-2 border border-black bg-black px-1.5 py-0.5 text-[9px] font-black text-white">
                    #{String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="absolute bottom-2 left-2 right-2 truncate bg-black/80 px-2 py-1 text-[10px] font-black text-white">
                    {formatPrice(state.currency, product.price)}
                  </span>
                </button>
              ))}
              {products.length === 0 && (
                <div className="col-span-2 flex aspect-[16/9] items-center justify-center border-2 border-dashed border-t-border p-6 text-xs font-black uppercase tracking-widest text-t-text-muted">
                  NEXT DROP PREPARING
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <TrustFeaturesStrip template={template} />

      {/* Brutalist Catalog */}
      <section id="catalog" className="scroll-mt-16 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b-2 border-t-border pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-t-accent">
                OFFICIAL INVENTORY
              </span>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-t-text">
                FULL CATALOG ({products.length})
              </h2>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-t-text-muted" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="SEARCH CATALOG…"
                className="w-full border-2 border-t-border bg-t-surface py-2 pl-9 pr-3 text-xs font-bold uppercase tracking-wider text-t-text outline-none focus:border-t-accent"
              />
            </div>
          </div>

          {/* Brutalist Category Switcher */}
          <div className="flex gap-2 overflow-x-auto py-3 border-b border-t-border scrollbar-none" role="tablist">
            {categories.map((category) => {
              const selected = category === activeCategory;
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => props.onCategory(category)}
                  className={cn(
                    "shrink-0 border-2 px-3.5 py-1.5 text-xs font-black uppercase tracking-[0.16em] transition",
                    focusRing,
                    selected
                      ? "border-t-border bg-t-accent text-t-accent-fg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                      : "border-t-border/50 text-t-text-muted hover:border-t-border hover:text-t-text"
                  )}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div className="py-12">
              <EmptyCatalog />
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 min-[460px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filtered.slice(0, shown).map((product, index) => (
                <div
                  key={product.id}
                  onClick={() => props.onProduct(product)}
                  className={cn(
                    "border-2 border-t-border bg-t-surface p-3.5 flex flex-col justify-between group cursor-pointer transition hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_var(--t-accent)]",
                    focusRing
                  )}
                >
                  <div>
                    <div className="relative aspect-square overflow-hidden border border-t-border bg-t-bg">
                      <ProductMedia product={product} className="transition-transform duration-500 group-hover:scale-105" />
                      <span className="absolute left-2 top-2 border border-black bg-black px-1.5 py-0.5 text-[9px] font-black tabular-nums text-white">
                        #{String(index + 1).padStart(3, "0")}
                      </span>
                      {product.outOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/85">
                          <span className="border-2 border-white px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white">
                            SOLD OUT
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <span className="text-[9px] font-black uppercase tracking-widest text-t-accent">
                        {product.category || "DROP ITEM"}
                      </span>
                      <h3 className="mt-1 text-sm font-black uppercase tracking-wider text-t-text line-clamp-1">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="mt-1 text-xs text-t-text-muted line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t-2 border-t-border pt-3">
                    <span className="text-base font-black tabular-nums text-t-text">
                      {formatPrice(state.currency, product.price)}
                    </span>
                    <button
                      type="button"
                      disabled={product.outOfStock}
                      onClick={(e) => {
                        e.stopPropagation();
                        props.onProduct(product);
                      }}
                      className="border-2 border-current bg-t-accent px-3.5 py-1 text-xs font-black uppercase tracking-wider text-t-accent-fg hover:opacity-90 active:scale-95"
                    >
                      GET IT
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {hasMore && <LoadMoreButton remaining={remaining} onClick={loadMore} />}
        </div>
      </section>

      {/* Manifesto */}
      <section id="story" className="border-t-2 border-t-border px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl border-2 border-t-border bg-t-surface p-8 sm:p-12 shadow-[5px_5px_0px_0px_var(--t-accent)]">
          <span className="text-xs font-black uppercase tracking-[0.28em] text-t-accent">
            {state.bizName ? `${state.bizName.toUpperCase()}` : "OUR STORY"}
          </span>
          <p className="mt-3 max-w-3xl text-2xl sm:text-4xl font-black uppercase leading-tight tracking-tight text-t-text">
            {story}
          </p>
          <div className="mt-6 flex flex-wrap gap-4 text-xs font-black uppercase tracking-wider text-t-text-muted">
            <span>DIRECT DISPATCH</span>
            <span>·</span>
            <span>VERIFIED QUALITY</span>
            <span>·</span>
            <span>WHATSAPP SUPPORT</span>
          </div>
        </div>
      </section>

      <TestimonialsSection
        bizName={state.bizName || template.name}
        testimonials={state.testimonials}
        onLeaveFeedback={handleFeedbackClick}
      />

      <FaqSection faqs={state.faqItems} />

      {/* Brutalist Footer */}
      <footer className="border-t-2 border-t-border bg-t-surface px-4 py-8 text-xs font-black uppercase tracking-[0.16em] text-t-text-muted sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:justify-between md:items-center">
          <span className="text-sm font-black text-t-text">{state.bizName || template.name}</span>
          <span>{state.phone || "ORDERS VIA WHATSAPP"}</span>
          <span>{state.deliveryAreas || state.location || "NATIONWIDE TRACKED DISPATCH"}</span>
        </div>
      </footer>

      <MobileStickyCartBar count={cartCount} onCart={props.onCart} />

      <StoreFeedbackModal
        bizName={state.bizName || template.name}
        phone={state.phone}
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
    </div>
  );
}

// =============================================================================
// 4. MARKETPLACE SITE (Uniland / High-Density Dynamic Marketplace)
// =============================================================================
function MarketplaceSite(props: TemplateSiteProps & { template: WebsiteTemplate }) {
  const { state, products, categories, activeCategory, cartCount, template } = props;
  const title = state.heroTitle || state.bizName || template.name;
  const subtitle = state.heroSubtitle || state.tagline || template.tagline;
  const story = storyOf(state, template);
  const [searchFilter, setSearchFilter] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const waDigits = getCleanWhatsAppDigits(state.phone);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = activeCategory === "All" || p.category === activeCategory;
      const matchesSearch =
        !searchFilter.trim() ||
        p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(searchFilter.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [products, activeCategory, searchFilter]);

  const { shown, remaining, hasMore, loadMore } = useCatalogWindow(
    filtered.length,
    `${activeCategory}|${searchFilter}`,
  );

  const handleFeedbackClick = () => {
    if (props.onLeaveFeedback) {
      props.onLeaveFeedback();
    } else {
      setFeedbackOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-t-bg pb-28 font-t-body text-t-text">
      {/* Top Bar */}
      <div className="bg-t-accent text-t-accent-fg px-4 py-2 text-center text-xs font-bold tracking-wide shadow-2xs">
        <span className="inline-flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 inline" />
          <span>Direct WhatsApp Ordering · Fast Tracked Doorstep Dispatch</span>
        </span>
      </div>

      {/* Marketplace Header */}
      <header className="sticky top-0 z-sticky border-b border-t-border bg-t-bg/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button type="button" onClick={shopNow} className={cn("flex min-w-0 items-center gap-2", focusRing)}>
            {state.bizImage || (state as any).bizLogo ? (
              <img
                src={state.bizImage || (state as any).bizLogo}
                alt={state.bizName || template.name}
                className="h-9 w-9 rounded-xl object-cover border border-t-border shadow-xs shrink-0"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-t-accent text-t-accent-fg font-black text-sm shadow-xs shrink-0">
                {(state.bizName || template.name).slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="text-left min-w-0">
              <span className="block truncate max-w-[130px] xs:max-w-[190px] sm:max-w-xs font-black text-base sm:text-lg tracking-tight text-t-text">
                {state.bizName || template.name}
              </span>
              <span className="hidden sm:block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                ● Verified Merchant
              </span>
            </div>
          </button>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleFeedbackClick}
              className={cn(
                "hidden sm:flex items-center gap-1.5 rounded-xl border border-t-border bg-t-surface px-3 py-1.5 text-xs font-semibold text-t-text hover:border-t-accent",
                focusRing
              )}
            >
              <MessageSquare className="h-3.5 w-3.5 text-t-accent" />
              <span>Reviews</span>
            </button>

            <button
              type="button"
              onClick={props.onSearch}
              className={cn(
                "flex items-center gap-1 rounded-xl border border-t-border bg-t-surface p-2 sm:px-3 sm:py-1.5 text-xs font-semibold",
                focusRing
              )}
              aria-label="Search"
            >
              <Search className="h-3.5 w-3.5 text-t-text-muted" />
              <span className="hidden sm:inline">Search</span>
            </button>

            <button
              type="button"
              onClick={props.onCart}
              className={cn(
                "flex items-center gap-1.5 rounded-xl bg-t-accent px-3.5 py-2 text-xs font-bold text-t-accent-fg shadow-sm transition hover:opacity-95 active:scale-95",
                focusRing
              )}
              aria-label="Cart"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              <CartMark count={cartCount} />
            </button>
          </div>
        </div>
      </header>

      {/* Vibrant Marketplace Billboard Hero */}
      <section className="mx-auto max-w-6xl px-3.5 py-4 sm:px-6 sm:py-6 md:py-8">
        <div className="rounded-2xl sm:rounded-3xl border border-t-border bg-gradient-to-r from-t-surface via-t-surface-alt to-t-surface p-4 sm:p-7 md:p-10 shadow-sm overflow-hidden">
          <div className="grid items-center gap-5 sm:gap-6 md:grid-cols-12 md:gap-8">
            <div className="md:col-span-7 space-y-3 sm:space-y-4">
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                <span>Verified Direct Storefront</span>
              </span>
              <h1 className="font-t-display text-2xl sm:text-4xl md:text-5xl font-black text-t-text leading-tight break-words">
                {title}
              </h1>
              <p className="max-w-md text-xs sm:text-sm leading-relaxed text-t-text-muted">
                {subtitle}
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={shopNow}
                  className={cn(
                    "flex items-center gap-2 rounded-xl bg-t-accent px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-bold text-t-accent-fg shadow-md transition hover:opacity-95 active:scale-95",
                    focusRing
                  )}
                >
                  <span>{state.heroButtonText || "Shop All Products"}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                {waDigits && (
                  <a
                    href={`https://wa.me/${waDigits}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-2 rounded-xl border border-t-border bg-t-surface px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold text-t-text hover:border-t-accent",
                      focusRing
                    )}
                  >
                    <MessageCircle className="h-4 w-4 text-emerald-500" />
                    <span>WhatsApp Inquiry</span>
                  </a>
                )}
              </div>
            </div>

            {/* Quick Featured Flash Deals strip or Hero Banner Image */}
            <div className="md:col-span-5">
              {state.heroImage ? (
                <div className="rounded-2xl overflow-hidden border border-t-border aspect-[16/10] sm:aspect-[4/3] bg-t-surface shadow-sm relative group">
                  <img
                    src={state.heroImage}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                    <span className="text-white text-xs font-bold drop-shadow-sm">Featured Showcase</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-t-border bg-t-bg p-3.5 sm:p-4 shadow-2xs">
                  <div className="flex items-center justify-between pb-2.5 border-b border-t-border">
                    <span className="text-xs font-bold text-t-text flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-t-accent fill-t-accent/20" /> Featured Picks
                    </span>
                    <span className="text-[10px] font-semibold text-t-accent">Fast Delivery</span>
                  </div>
                  <div className="mt-2.5 space-y-2">
                    {(products.length > 0 ? products.slice(0, 2) : []).map((product) => (
                      <div
                        key={product.id}
                        onClick={() => props.onProduct(product)}
                        className="flex items-center justify-between gap-2.5 p-2 rounded-xl hover:bg-t-surface-alt transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-11 w-11 sm:h-12 sm:w-12 shrink-0 rounded-lg overflow-hidden border border-t-border bg-t-surface-alt">
                            <ProductMedia product={product} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-t-text">{product.name}</p>
                            <p className="text-[11px] font-bold text-t-accent tabular-nums">
                              {formatPrice(state.currency, product.price)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            props.onProduct(product);
                          }}
                          className="shrink-0 rounded-lg bg-t-accent-subtle px-2.5 py-1 text-[11px] font-bold text-t-accent-text hover:bg-t-accent hover:text-t-accent-fg transition"
                        >
                          Order
                        </button>
                      </div>
                    ))}
                    {products.length === 0 && (
                      <p className="text-center py-4 text-xs text-t-text-muted">No featured items yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <TrustFeaturesStrip template={template} />

      {/* High-Density Catalog Grid */}
      <section id="catalog" className="scroll-mt-16 py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-t-border pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-t-accent">
                Superstore Inventory
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-t-text">
                Browse Marketplace ({products.length})
              </h2>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-t-text-muted" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search products…"
                className="w-full rounded-xl border border-t-border bg-t-surface py-2 pl-9 pr-3 text-xs text-t-text outline-none focus:border-t-accent"
              />
            </div>
          </div>

          {/* Category Chips Carousel */}
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-none" role="tablist">
            {categories.map((category) => {
              const selected = category === activeCategory;
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => props.onCategory(category)}
                  className={cn(
                    "shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition shadow-2xs",
                    focusRing,
                    selected
                      ? "bg-t-accent text-t-accent-fg shadow-xs"
                      : "border border-t-border bg-t-surface text-t-text-muted hover:text-t-text"
                  )}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div className="py-12">
              <EmptyCatalog />
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-4">
              {filtered.slice(0, shown).map((product) => (
                <div
                  key={product.id}
                  onClick={() => props.onProduct(product)}
                  className={cn(
                    "group flex flex-col justify-between rounded-2xl border border-t-border bg-t-surface p-2.5 sm:p-3 shadow-2xs transition-all duration-200 hover:shadow-md cursor-pointer",
                    focusRing
                  )}
                >
                  <div>
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-t-surface-alt">
                      <ProductMedia product={product} className="transition-transform duration-300 group-hover:scale-105" />
                      {product.outOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                          <span className="rounded-md bg-black/90 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                            Out of stock
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2.5">
                      <div className="flex items-center justify-between text-[10px] text-t-text-muted">
                        <span>{product.category || "Item"}</span>
                        <span className="flex items-center text-amber-500 font-bold">
                          <Star className="h-2.5 w-2.5 fill-amber-500 mr-0.5" /> 5.0
                        </span>
                      </div>
                      <h3 className="mt-1 text-xs sm:text-sm font-bold text-t-text line-clamp-1 group-hover:text-t-accent transition">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="mt-0.5 text-[11px] text-t-text-muted line-clamp-1">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-t-border/60 pt-2.5">
                    <span className="text-xs sm:text-sm font-bold tabular-nums text-t-text">
                      {formatPrice(state.currency, product.price)}
                    </span>
                    <button
                      type="button"
                      disabled={product.outOfStock}
                      onClick={(e) => {
                        e.stopPropagation();
                        props.onProduct(product);
                      }}
                      className="rounded-lg bg-t-accent px-2.5 py-1 text-[11px] font-bold text-t-accent-fg hover:opacity-90 transition shadow-2xs"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {hasMore && <LoadMoreButton remaining={remaining} onClick={loadMore} />}
        </div>
      </section>

      {/* Story */}
      <section id="story" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-t-border bg-t-surface p-6 sm:p-10">
          <span className="text-xs font-bold uppercase tracking-wider text-t-accent">
            About Our Store
          </span>
          <p className="mt-2 max-w-3xl text-lg sm:text-xl font-bold leading-relaxed text-t-text">
            {story}
          </p>
        </div>
      </section>

      <TestimonialsSection
        bizName={state.bizName || template.name}
        testimonials={state.testimonials}
        onLeaveFeedback={handleFeedbackClick}
      />

      <FaqSection faqs={state.faqItems} />

      {/* Footer */}
      <footer className="border-t border-t-border bg-t-surface px-4 py-8 text-center text-xs text-t-text-muted">
        <p className="font-bold text-t-text">{state.bizName || template.name}</p>
        <p className="mt-1">{state.phone || "Order direct on WhatsApp"}</p>
        <p className="mt-0.5">{state.deliveryAreas || state.location || "Nationwide Delivery"}</p>
      </footer>

      <MobileStickyCartBar count={cartCount} onCart={props.onCart} />

      <StoreFeedbackModal
        bizName={state.bizName || template.name}
        phone={state.phone}
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
    </div>
  );
}

// =============================================================================
// 5. STUDIO SITE (Minimalist Contemporary Lookbook / Design Gallery)
// =============================================================================
function StudioSite(props: TemplateSiteProps & { template: WebsiteTemplate }) {
  const { state, products, categories, activeCategory, cartCount, template } = props;
  const title = state.heroTitle || state.bizName || template.name;
  const subtitle = state.heroSubtitle || state.tagline || template.tagline;
  const story = storyOf(state, template);
  const [searchFilter, setSearchFilter] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const waDigits = getCleanWhatsAppDigits(state.phone);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = activeCategory === "All" || p.category === activeCategory;
      const matchesSearch =
        !searchFilter.trim() ||
        p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(searchFilter.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [products, activeCategory, searchFilter]);

  const { shown, remaining, hasMore, loadMore } = useCatalogWindow(
    filtered.length,
    `${activeCategory}|${searchFilter}`,
  );

  const handleFeedbackClick = () => {
    if (props.onLeaveFeedback) {
      props.onLeaveFeedback();
    } else {
      setFeedbackOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-t-bg pb-28 font-t-body text-t-text">
      {/* Studio Header */}
      <header className="sticky top-0 z-sticky border-b border-t-border/50 bg-t-bg/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-8">
          <button
            type="button"
            onClick={shopNow}
            className={cn("text-left text-sm sm:text-base font-semibold tracking-widest uppercase", focusRing)}
          >
            {state.bizName || template.name}
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleFeedbackClick}
              className={cn("hidden sm:block text-xs uppercase tracking-wider text-t-text-muted hover:text-t-text", focusRing)}
            >
              Reviews
            </button>
            <button
              type="button"
              onClick={props.onSearch}
              className={cn("p-2 text-t-text hover:text-t-accent", focusRing)}
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={props.onCart}
              className={cn(
                "flex items-center gap-1.5 border border-t-border px-3.5 py-1.5 text-xs uppercase tracking-wider text-t-text hover:border-t-accent transition",
                focusRing
              )}
              aria-label="Bag"
            >
              <span>Bag</span>
              <CartMark count={cartCount} />
            </button>
          </div>
        </div>
      </header>

      {/* Lookbook Hero */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-8 md:py-24 text-center">
        <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-t-text-muted">
          Edition 01 / Selected Works
        </span>
        <h1 className="mt-4 font-t-display text-4xl sm:text-6xl md:text-7xl font-light tracking-tight text-t-text max-w-3xl mx-auto break-words leading-tight">
          {title}
        </h1>
        <p className="mt-4 max-w-lg mx-auto text-sm text-t-text-muted leading-relaxed font-light">
          {subtitle}
        </p>
        <div className="mt-8 flex justify-center items-center gap-4">
          <button
            type="button"
            onClick={shopNow}
            className={cn(
              "border-b border-t-text pb-1 text-xs uppercase tracking-widest text-t-text hover:text-t-accent hover:border-t-accent transition",
              focusRing
            )}
          >
            {state.heroButtonText || "View Works"} ↓
          </button>
          {waDigits && (
            <a
              href={`https://wa.me/${waDigits}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "border-b border-transparent pb-1 text-xs uppercase tracking-widest text-t-text-muted hover:text-t-text transition",
                focusRing
              )}
            >
              Inquire Online
            </a>
          )}
        </div>
      </section>

      {/* Lookbook Catalog Grid */}
      <section id="catalog" className="scroll-mt-16 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-t-border/50 pb-4">
            <span className="text-xs uppercase tracking-widest text-t-text-muted">
              Catalog ({products.length} works)
            </span>
            <div className="flex gap-4 overflow-x-auto scrollbar-none" role="tablist">
              {categories.map((category) => {
                const selected = category === activeCategory;
                return (
                  <button
                    key={category}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => props.onCategory(category)}
                    className={cn(
                      "shrink-0 text-xs uppercase tracking-widest transition",
                      focusRing,
                      selected ? "text-t-text font-bold underline underline-offset-8" : "text-t-text-muted hover:text-t-text"
                    )}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16">
              <EmptyCatalog />
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3">
              {filtered.slice(0, shown).map((product) => (
                <div
                  key={product.id}
                  onClick={() => props.onProduct(product)}
                  className="group cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-t-surface-alt">
                    <ProductMedia product={product} className="transition-transform duration-700 group-hover:scale-105" />
                    {product.outOfStock && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <span className="text-xs uppercase tracking-widest text-white">
                          Archived
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <h3 className="text-sm font-medium tracking-wide text-t-text group-hover:text-t-accent transition">
                        {product.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-t-text-muted font-light">{product.category}</p>
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-t-text">
                      {formatPrice(state.currency, product.price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {hasMore && <LoadMoreButton remaining={remaining} onClick={loadMore} />}
        </div>
      </section>

      {/* Studio Philosophy */}
      <section id="story" className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-8">
        <span className="text-[11px] uppercase tracking-[0.25em] text-t-text-muted">Studio Philosophy</span>
        <p className="mt-4 font-t-display text-2xl sm:text-3xl leading-relaxed font-light text-t-text">
          {story}
        </p>
      </section>

      <TestimonialsSection
        bizName={state.bizName || template.name}
        testimonials={state.testimonials}
        onLeaveFeedback={handleFeedbackClick}
      />

      <FaqSection faqs={state.faqItems} />

      {/* Studio Footer */}
      <footer className="border-t border-t-border/50 px-4 py-12 text-center text-xs uppercase tracking-widest text-t-text-muted">
        <p>{state.bizName || template.name}</p>
        <p className="mt-2 text-[11px] opacity-70">
          &copy; {new Date().getFullYear()} · Nationwide Service
        </p>
      </footer>

      <MobileStickyCartBar count={cartCount} onCart={props.onCart} />

      <StoreFeedbackModal
        bizName={state.bizName || template.name}
        phone={state.phone}
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
    </div>
  );
}

// =============================================================================
// 6. COAST SITE (Immersive Expedition / Voyage Layout inspired by Gaskuy UI tokens)
// =============================================================================
function CoastSocialRail() {
  return (
    <div className="hidden lg:flex flex-col items-center gap-4 rounded-full bg-black/40 backdrop-blur-md px-2.5 py-5 border border-white/15 text-white/80 shadow-xl">
      <a href="#social" className="hover:text-white transition hover:scale-110" aria-label="Instagram">
        <svg className="h-4 w-4 fill-none stroke-currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      </a>
      <a href="#social" className="hover:text-white transition hover:scale-110" aria-label="Facebook">
        <svg className="h-4 w-4 fill-currentColor" viewBox="0 0 24 24">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      </a>
      <a href="#social" className="hover:text-white transition hover:scale-110" aria-label="LinkedIn">
        <svg className="h-4 w-4 fill-currentColor" viewBox="0 0 24 24">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      </a>
      <a href="#social" className="hover:text-white transition hover:scale-110" aria-label="Twitter">
        <svg className="h-4 w-4 fill-currentColor" viewBox="0 0 24 24">
          <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
        </svg>
      </a>
    </div>
  );
}

function renderCoastPillHeadline(rawTitle: string) {
  const words = rawTitle.trim().split(/\s+/);
  if (words.length <= 1) {
    return (
      <span className="inline-block bg-white text-zinc-950 font-black px-4 sm:px-6 py-1 rounded-full shadow-2xl mx-1 align-middle">
        {words[0]}
      </span>
    );
  }

  return words.map((w, i) => {
    // In "Crafting Journeys Not Just Trips", words 1 ("Journeys") and 4 ("Trips") are badges
    const isPill = i === 1 || (words.length >= 4 && i === words.length - 1);
    if (isPill) {
      return (
        <span
          key={i}
          className="inline-block bg-white text-zinc-950 font-black px-3.5 sm:px-6 py-0.5 sm:py-1 rounded-full shadow-2xl mx-1 sm:mx-2 align-middle transform hover:scale-105 transition-transform"
        >
          {w}
        </span>
      );
    }
    return (
      <span key={i} className="inline-block mx-1">
        {w}
      </span>
    );
  });
}

function CoastSite(props: TemplateSiteProps & { template: WebsiteTemplate }) {
  const { state, products, categories, activeCategory, cartCount, template } = props;
  const rawTitle = state.heroTitle || state.bizName || "Crafting Journeys Not Just Trips";
  const subtitle = state.heroSubtitle || state.tagline || "This activity involves the movement of people from one location to another, domestically or internationally. Curated with premium care.";
  const heroBtnText = state.heroButtonText || "Consultation";
  const [searchFilter, setSearchFilter] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const waDigits = getCleanWhatsAppDigits(state.phone);

  const heroImage =
    state.heroImage ||
    state.bizImage ||
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80";

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = activeCategory === "All" || p.category === activeCategory;
      const matchesSearch =
        !searchFilter.trim() ||
        p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(searchFilter.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [products, activeCategory, searchFilter]);

  const { shown, remaining, hasMore, loadMore } = useCatalogWindow(
    filtered.length,
    `${activeCategory}|${searchFilter}`,
  );

  const featuredCards = useMemo(() => {
    return products.slice(0, 3);
  }, [products]);

  const handleFeedbackClick = () => {
    if (props.onLeaveFeedback) {
      props.onLeaveFeedback();
    } else {
      setFeedbackOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-t-bg pb-28 font-t-body text-t-text">
      {/* ─── FULL-BLEED IMMERSIVE HERO WITH GASKUY DESIGN TOKENS ─── */}
      <section className="relative min-h-[92vh] flex flex-col justify-between overflow-hidden bg-zinc-950 text-white">
        {/* Background Image with Cinematic Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt={state.bizName || template.name}
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/85" />
          <div className="absolute inset-0 bg-cyan-950/20 mix-blend-color" />
        </div>

        {/* Top Header */}
        <header className="relative z-20 mx-auto w-full max-w-6xl px-4 py-5 sm:px-8 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={shopNow}
            className={cn("text-left font-black text-2xl sm:text-3xl tracking-tight text-white hover:opacity-90 transition", focusRing)}
          >
            {state.bizName || template.name}
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleFeedbackClick}
              className={cn("hidden sm:flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md px-3.5 py-1.5 text-xs font-semibold text-white border border-white/20 hover:bg-white/20 transition", focusRing)}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Reviews</span>
            </button>

            <button
              type="button"
              onClick={props.onSearch}
              className={cn("flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition", focusRing)}
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={props.onCart}
              className={cn("flex h-9 items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-3.5 border border-white/25 text-xs font-bold text-white hover:bg-white/25 transition", focusRing)}
              aria-label="Cart"
            >
              <ShoppingBag className="h-4 w-4" />
              <CartMark count={cartCount} />
            </button>

            {waDigits && (
              <a
                href={`https://wa.me/${waDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn("rounded-full bg-white px-5 py-2 text-xs font-black uppercase tracking-wider text-zinc-950 shadow-lg hover:bg-zinc-100 active:scale-95 transition", focusRing)}
              >
                WhatsApp Order
              </a>
            )}
          </div>
        </header>

        {/* Vertical Social Rail (Floating on upper-left) */}
        <div className="absolute left-6 sm:left-10 top-28 z-20">
          <CoastSocialRail />
        </div>

        {/* Hero Center-Bottom Content */}
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-8 pb-16 sm:pb-20 text-center">
          <h1 className="font-t-display text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.15] break-words">
            {renderCoastPillHeadline(rawTitle)}
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-xs sm:text-sm text-white/80 font-medium leading-relaxed drop-shadow-sm">
            {subtitle}
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={shopNow}
              className={cn(
                "inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-xs sm:text-sm font-black text-zinc-950 shadow-2xl transition hover:bg-zinc-100 hover:scale-105 active:scale-95",
                focusRing
              )}
            >
              <span>{heroBtnText}</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>

            {waDigits && (
              <a
                href={`https://wa.me/${waDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/30 backdrop-blur-md px-6 py-3 text-xs sm:text-sm font-bold text-white transition hover:bg-black/50",
                  focusRing
                )}
              >
                <MessageCircle className="h-4 w-4 text-emerald-400" />
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: 3D FAN-OUT CARDS SHOWCASE (RIGHT MOCKUP) ─── */}
      <section className="bg-t-surface py-16 sm:py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="font-t-display text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-t-text">
            MAKE YOUR EXPENSES, USED FOR TRAVEL
          </h2>
          <p className="mt-3 text-xs sm:text-sm uppercase tracking-widest text-t-text-muted">
            {state.deliveryAreas || state.location || "Curated Expeditions & High-Altitude Routes"}
          </p>

          {/* 3D Stacked / Fan-out Cards */}
          {featuredCards.length > 0 && (
            <div className="relative mx-auto mt-12 flex max-w-3xl items-center justify-center h-[420px] sm:h-[480px]">
              {featuredCards.map((product, idx) => {
                let cardTransform = "z-20 scale-100 shadow-2xl";
                if (idx === 0 && featuredCards.length > 1) {
                  cardTransform = "-translate-x-12 sm:-translate-x-24 -rotate-6 scale-90 z-10 opacity-75 hover:opacity-100 hover:scale-95 transition-all duration-300";
                } else if (idx === 2) {
                  cardTransform = "translate-x-12 sm:translate-x-24 rotate-6 scale-90 z-10 opacity-75 hover:opacity-100 hover:scale-95 transition-all duration-300";
                }

                return (
                  <div
                    key={product.id}
                    onClick={() => props.onProduct(product)}
                    className={cn(
                      "absolute inset-x-4 sm:inset-x-16 top-0 bottom-0 rounded-[2.5rem] overflow-hidden border border-t-border bg-zinc-950 cursor-pointer shadow-2xl transition-all duration-300 group",
                      cardTransform
                    )}
                  >
                    <ProductMedia product={product} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/35 pointer-events-none" />

                    {/* Top Floating Glass Chips */}
                    <div className="absolute top-5 left-5 right-5 flex items-center justify-between z-10">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-sm">
                        <Bookmark className="h-4 w-4" />
                      </span>
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-rose-400 shadow-sm">
                        <Heart className="h-4 w-4 fill-rose-500" />
                      </span>
                    </div>

                    {/* Bottom Frosted Card Overlay */}
                    <div className="absolute bottom-5 left-5 right-5 z-10 rounded-2xl bg-zinc-950/75 backdrop-blur-md p-4 sm:p-5 border border-white/15 flex items-center justify-between gap-4 text-white shadow-xl">
                      <div className="min-w-0 text-left">
                        <h4 className="truncate text-base sm:text-lg font-bold text-white tracking-tight">
                          {product.name}
                        </h4>
                        <p className="mt-0.5 truncate text-[11px] text-zinc-300 font-medium">
                          {product.category || "Top Destination"} · {formatPrice(state.currency, product.price)}
                        </p>
                      </div>
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 border border-white/30 text-white group-hover:bg-white group-hover:text-zinc-950 transition-colors">
                          <ArrowUpRight className="h-4 w-4" />
                        </div>
                        <span className="text-[9px] font-bold tracking-widest uppercase text-white/70">Detail</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── SECTION 3: MINIMALIST TRUST PARTNER STRIP ─── */}
      <div className="border-y border-t-border/50 py-10 px-4 bg-t-surface-alt/40">
        <div className="mx-auto max-w-5xl flex flex-wrap items-center justify-around gap-6 sm:gap-10 text-xs sm:text-sm font-black tracking-[0.25em] text-t-text-muted/60 uppercase">
          <span className="hover:text-t-text transition cursor-default">LATTICE</span>
          <span className="hover:text-t-text transition cursor-default">MONDAY.COM</span>
          <span className="hover:text-t-text transition cursor-default">CONTENTFUL</span>
          <span className="hover:text-t-text transition cursor-default">PRODUCTBOARD</span>
          <span className="hover:text-t-text transition cursor-default">CUSTOMER.IO</span>
        </div>
      </div>

      {/* ─── SECTION 4: COMPLETE CATALOG GRID ─── */}
      <section id="catalog" className="scroll-mt-16 py-14 sm:py-20 px-4 sm:px-6 mx-auto max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-t-border pb-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-t-accent">
              SELECTED CATALOG
            </span>
            <h3 className="font-t-display text-2xl sm:text-3xl font-black text-t-text tracking-tight uppercase mt-1">
              ALL PACKAGES & GEAR
            </h3>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map((category) => {
              const selected = category === activeCategory;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => props.onCategory(category)}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-2 text-xs font-bold transition shadow-2xs",
                    focusRing,
                    selected
                      ? "bg-t-accent text-t-accent-fg shadow-sm"
                      : "border border-t-border bg-t-surface text-t-text-muted hover:text-t-text"
                  )}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16">
            <EmptyCatalog />
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {filtered.slice(0, shown).map((product) => (
              <div
                key={product.id}
                onClick={() => props.onProduct(product)}
                className={cn(
                  "group flex flex-col justify-between rounded-3xl border border-t-border bg-t-surface p-3 sm:p-4 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer",
                  focusRing
                )}
              >
                <div>
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-t-surface-alt">
                    <ProductMedia product={product} className="transition-transform duration-500 group-hover:scale-105" />
                    <span className="absolute bottom-2.5 left-2.5 rounded-full bg-black/80 px-2.5 py-1 text-[11px] font-black text-white shadow-xs">
                      {formatPrice(state.currency, product.price)}
                    </span>
                  </div>
                  <div className="mt-3 text-left">
                    <p className="text-[10px] font-bold text-t-accent uppercase tracking-wider">
                      {product.category || "Item"}
                    </p>
                    <h4 className="mt-0.5 truncate text-xs sm:text-sm font-bold text-t-text group-hover:text-t-accent transition">
                      {product.name}
                    </h4>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-t-border/50 pt-2.5">
                  <span className="text-[11px] font-medium text-t-text-muted">Direct Order</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-t-accent text-t-accent-fg group-hover:scale-110 transition-transform">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && <LoadMoreButton remaining={remaining} onClick={loadMore} />}
      </section>

      {/* ─── SECTION 5: SOME EXPERIENCES FROM CLIMBERS ─── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 mx-auto max-w-5xl text-center border-t border-t-border/60">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-t-accent">
          TESTIMONIALS
        </span>
        <h2 className="mt-3 font-t-display text-3xl sm:text-5xl font-black uppercase tracking-tight text-t-text">
          SOME EXPERIENCES FROM CLIMBERS
        </h2>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {[
            {
              name: "Alex Thorne",
              role: "Summit Mountaineer",
              quote: "The expedition logistics, guidance, and doorstep gear dispatch were absolute perfection. Unmatched experience.",
            },
            {
              name: "Elena Rostova",
              role: "Trail Explorer",
              quote: "Booking and inquiring directly through WhatsApp made the preparation effortless. Every detail was curated with care.",
            },
            {
              name: "Marcus Vance",
              role: "Alpine Adventurer",
              quote: "Quality and authenticity were 100% verified. Easily the most reliable travel storefront I have ever used.",
            },
          ].map((item, i) => (
            <div key={i} className="rounded-3xl border border-t-border bg-t-surface p-6 shadow-sm flex flex-col justify-between">
              <Quote className="h-6 w-6 text-t-accent/40 mb-3" />
              <p className="text-xs sm:text-sm leading-relaxed text-t-text-muted italic">
                &ldquo;{item.quote}&rdquo;
              </p>
              <div className="mt-6 pt-4 border-t border-t-border/50">
                <p className="text-xs font-bold text-t-text">{item.name}</p>
                <p className="text-[10px] text-t-accent font-semibold">{item.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-t-border px-4 py-12 text-center text-xs tracking-wider text-t-text-muted">
        <p className="font-bold text-t-text text-sm">{state.bizName || template.name}</p>
        <p className="mt-2 text-xs">
          {formatDisplayPhone(state.phone)} {state.location ? `· ${state.location}` : ""}
        </p>
        <p className="mt-4 text-[11px] opacity-60">
          &copy; {new Date().getFullYear()} · All rights reserved
        </p>
      </footer>

      <MobileStickyCartBar count={cartCount} onCart={props.onCart} />

      <StoreFeedbackModal
        bizName={state.bizName || template.name}
        phone={state.phone}
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
    </div>
  );
}

// =============================================================================
// 7. BLOOM SITE (Luxury Beauty / Skincare Minimalist Storefront inspired by Necessaire tokens)
// =============================================================================
function BloomSite(props: TemplateSiteProps & { template: WebsiteTemplate }) {
  const { state, products, categories, activeCategory, cartCount, template } = props;
  const greeting = `Hello ${state.bizName ? state.bizName.split(" ")[0] : "Juju"}!`;
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("200 ml");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const waDigits = getCleanWhatsAppDigits(state.phone);

  const heroProduct = useMemo(() => {
    return products[0] || null;
  }, [products]);

  const filtered = useMemo(() => {
    if (activeCategory === "All") return products;
    return products.filter((p) => p.category === activeCategory);
  }, [products, activeCategory]);

  const sizes = ["50 ml", "180 ml", "200 ml", "250 ml"];

  const handleQuickCheckout = (product: Product) => {
    if (!waDigits) {
      props.onProduct(product);
      return;
    }
    const text = encodeURIComponent(
      `Hello ${state.bizName || ""}, I'd like to order:\n• ${product.name} (${selectedSize}) - ${formatPrice(state.currency, product.price)}\n\nPlease confirm availability and delivery.`
    );
    window.open(`https://wa.me/${waDigits}?text=${text}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-36 font-sans text-zinc-900 dark:text-zinc-100 antialiased selection:bg-zinc-900 selection:text-white">
      {/* ─── SCREEN 1: STOREFRONT MAIN ─── */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
        {/* Top Header: Avatar + Greeting + Bell */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 shrink-0 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 shadow-sm flex items-center justify-center">
              {state.bizImage ? (
                <img src={state.bizImage} alt={state.bizName} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-zinc-900 text-white font-serif font-black flex items-center justify-center text-sm">
                  {(state.bizName || "B").slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h1 className="font-serif text-lg sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {greeting}
              </h1>
              <p className="text-[11px] text-zinc-500 font-medium">
                {state.tagline || "Curated skincare & daily essentials"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFeedbackOpen(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition"
              aria-label="Notifications & Reviews"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-zinc-900" />
            </button>
          </div>
        </header>

        {/* Featured Hero Promo Card */}
        {heroProduct && (
          <div className="relative overflow-hidden rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 p-6 sm:p-8 shadow-xs">
            {/* 70% Promo Badge */}
            <div className="absolute top-5 left-5 z-10 flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
              <span>70% OFF</span>
            </div>

            <div className="grid items-center gap-6 sm:grid-cols-12">
              {/* Product Visual Center */}
              <div className="sm:col-span-7 flex justify-center items-center py-2">
                <div className="relative aspect-[4/3] w-full max-w-[280px] sm:max-w-[340px] overflow-hidden rounded-2xl bg-white/60 dark:bg-zinc-800/60 p-3 shadow-inner">
                  <ProductMedia product={heroProduct} className="h-full w-full object-contain" />
                </div>
              </div>

              {/* Price & Action */}
              <div className="sm:col-span-5 flex flex-col justify-between space-y-4 text-left">
                <div>
                  <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    {heroProduct.category || "Special Offer"}
                  </span>
                  <h3 className="mt-1 font-serif text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                    {heroProduct.name}
                  </h3>
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    Special Price
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-zinc-950 dark:text-white tracking-tight">
                    {formatPrice(state.currency, heroProduct.price)}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDetailProduct(heroProduct)}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-lg hover:scale-105 active:scale-95 transition"
                    title="View Product"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailProduct(heroProduct)}
                    className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white hover:underline"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section: "Best Product" */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Best Product
            </h2>
            <button
              type="button"
              onClick={shopNow}
              className="text-xs font-medium text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition"
            >
              See all
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => {
              const active = cat === activeCategory;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => props.onCategory(cat)}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all shadow-2xs",
                    active
                      ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-bold"
                      : "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* 2-Column Responsive Product Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3">
            {filtered.map((product) => (
              <div
                key={product.id}
                onClick={() => setDetailProduct(product)}
                className="group flex flex-col justify-between rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 p-3 sm:p-4 shadow-2xs hover:shadow-md transition-all duration-300 cursor-pointer"
              >
                <div>
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 p-2">
                    <ProductMedia product={product} className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailProduct(product);
                      }}
                      className="absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 shadow-xs group-hover:scale-110 transition-transform"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 text-left">
                    <h4 className="font-serif text-sm sm:text-base font-bold text-zinc-900 dark:text-white truncate">
                      {product.name}
                    </h4>
                    <p className="mt-0.5 text-[11px] text-zinc-400 font-medium truncate">
                      {product.category || "Body Care"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-2">
                  <span className="font-sans text-sm sm:text-base font-black text-zinc-950 dark:text-white">
                    {formatPrice(state.currency, product.price)}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    In Stock
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ─── SCREEN 2: DETAIL PRODUCT MODAL (MATCHING MIDDLE MOCKUP) ─── */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
              <button
                type="button"
                onClick={() => setDetailProduct(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
              </button>
              <h3 className="font-serif text-base font-bold text-zinc-900 dark:text-white">
                Detail Product
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: detailProduct.name, url: window.location.href });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                  }
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>

            {/* Product Image Card with Star Rating */}
            <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 p-4 flex items-center justify-center">
              <ProductMedia product={detailProduct} className="h-full w-full object-contain" />

              {/* Vertical Star Rating Chip */}
              <div className="absolute top-4 left-4 flex flex-col items-center gap-1 rounded-2xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-1.5 py-2.5 border border-zinc-200/60 dark:border-zinc-800 shadow-sm">
                {[1, 2, 3, 4].map((s) => (
                  <Star key={s} className="h-3 w-3 fill-amber-400 text-amber-400" />
                ))}
                <Star className="h-3 w-3 text-zinc-300 dark:text-zinc-600" />
              </div>
            </div>

            {/* Name, Price & Sku */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                  {detailProduct.name}
                </h2>
                <p className="text-xs text-zinc-400 font-medium">
                  {detailProduct.category || "Body Care"}
                </p>
              </div>
              <div className="text-right">
                <span className="font-sans text-xl sm:text-2xl font-black text-zinc-950 dark:text-white">
                  {formatPrice(state.currency, detailProduct.price)}
                </span>
                <p className="text-[11px] text-zinc-400 font-medium">{selectedSize}</p>
              </div>
            </div>

            {/* Product Detail Description */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
                Product Detail
              </h4>
              <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                {detailProduct.description ||
                  "Formulated to hydrate and restore the skin barrier with clean, verified ingredients. Suitable for daily use and all skin types."}
              </p>
            </div>

            {/* Select Size Variant Pills */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
                Select Size
              </h4>
              <div className="flex items-center gap-2">
                {sizes.map((s) => {
                  const isSel = s === selectedSize;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={cn(
                        "rounded-full px-3.5 py-1.5 text-xs font-bold transition-all",
                        isSel
                          ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-sm"
                          : "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400"
                      )}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dual Action Buttons */}
            <div className="flex items-center gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  props.onProduct(detailProduct);
                  setDetailProduct(null);
                }}
                className="flex-1 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-3 text-xs font-bold text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
              >
                Add to Cart
              </button>
              <button
                type="button"
                onClick={() => handleQuickCheckout(detailProduct)}
                className="flex-1 rounded-full bg-zinc-950 dark:bg-white py-3 text-xs font-bold text-white dark:text-zinc-950 hover:opacity-90 active:scale-95 transition shadow-lg"
              >
                Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── FLOATING BOTTOM NAV DOCK PILL (MATCHING SCREEN 1 & 3) ─── */}
      <nav
        aria-label="Store navigation dock"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-6 rounded-full bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800/90 px-6 py-2.5 shadow-2xl"
      >
        <button
          type="button"
          onClick={shopNow}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-sm"
          aria-label="Home"
        >
          <Home className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={props.onCart}
          className="relative text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition"
          aria-label="Cart List"
        >
          <ShoppingBag className="h-5 w-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white">
              {cartCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={props.onSearch}
          className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => setFeedbackOpen(true)}
          className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition"
          aria-label="Reviews"
        >
          <User className="h-5 w-5" />
        </button>
      </nav>

      {/* Footer */}
      <footer className="mt-20 border-t border-zinc-200 dark:border-zinc-800/60 px-4 py-8 text-center text-xs text-zinc-400">
        <p className="font-serif font-bold text-sm text-zinc-900 dark:text-white">{state.bizName || template.name}</p>
        <p className="mt-1">{formatDisplayPhone(state.phone)}</p>
        <p className="mt-2 text-[11px] opacity-60">&copy; {new Date().getFullYear()} · All rights reserved</p>
      </footer>

      <StoreFeedbackModal
        bizName={state.bizName || template.name}
        phone={state.phone}
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
    </div>
  );
}

// =============================================================================
// 8. NOIR SITE (High-Fashion Luxury Haute Couture Lookbook)
// =============================================================================
function NoirSite(props: TemplateSiteProps & { template: WebsiteTemplate }) {
  const { state, products, categories, activeCategory, cartCount, template } = props;
  const title = state.heroTitle || state.bizName || "Collection Privée";
  const subtitle = state.heroSubtitle || state.tagline || "Haute craftsmanship, rare materials and refined silhouettes tailored for the discerning collector.";
  const [searchFilter, setSearchFilter] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const waDigits = getCleanWhatsAppDigits(state.phone);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = activeCategory === "All" || p.category === activeCategory;
      const matchesSearch =
        !searchFilter.trim() ||
        p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(searchFilter.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [products, activeCategory, searchFilter]);

  const { shown, remaining, hasMore, loadMore } = useCatalogWindow(
    filtered.length,
    `${activeCategory}|${searchFilter}`,
  );

  const handleFeedbackClick = () => {
    if (props.onLeaveFeedback) {
      props.onLeaveFeedback();
    } else {
      setFeedbackOpen(true);
    }
  };

  const heroImage =
    state.heroImage ||
    state.bizImage ||
    products[0]?.image ||
    "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1600&q=85";

  return (
    <div className="min-h-screen bg-[#070709] pb-28 font-serif text-[#f4f4f5] selection:bg-[#d4af37] selection:text-black">
      {/* ─── LUXURY VIP TOP RAIL ─── */}
      <div className="border-b border-white/10 bg-black/80 px-4 py-2 text-center text-[10px] tracking-[0.3em] uppercase text-zinc-400">
        <span>Atelier Privé · Private Concierge Ordering via WhatsApp</span>
      </div>

      {/* ─── OBSIDIAN HEADER ─── */}
      <header className="sticky top-0 z-sticky border-b border-white/10 bg-[#070709]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <button type="button" onClick={shopNow} className={cn("flex items-center gap-3 text-left", focusRing)}>
            {state.bizImage ? (
              <img
                src={state.bizImage}
                alt={state.bizName || template.name}
                className="h-8 w-8 rounded-full object-cover border border-white/20 shrink-0"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5 font-sans text-xs font-bold tracking-wider text-white">
                {(state.bizName || template.name).slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <span className="block truncate max-w-[150px] xs:max-w-[200px] sm:max-w-xs font-serif text-base sm:text-lg tracking-[0.2em] uppercase text-white">
                {state.bizName || template.name}
              </span>
              <span className="hidden sm:block text-[9px] font-sans font-medium uppercase tracking-[0.25em] text-[#d4af37]">
                Haute Horlogerie & Fashion
              </span>
            </div>
          </button>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleFeedbackClick}
              className={cn(
                "hidden sm:flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-sans text-[11px] font-medium tracking-wider text-zinc-300 hover:border-white/40 transition",
                focusRing
              )}
            >
              <MessageSquare className="h-3.5 w-3.5 text-[#d4af37]" />
              <span>Reviews</span>
            </button>

            <button
              type="button"
              onClick={props.onSearch}
              className={cn("p-2 text-zinc-300 hover:text-white transition", focusRing)}
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={props.onCart}
              className={cn(
                "flex items-center gap-1.5 rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 px-3.5 py-1.5 font-sans text-xs font-semibold text-[#d4af37] hover:bg-[#d4af37]/20 transition",
                focusRing
              )}
              aria-label="Cart"
            >
              <ShoppingBag className="h-4 w-4" />
              <CartMark count={cartCount} />
            </button>

            {waDigits && (
              <a
                href={`https://wa.me/${waDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "hidden xs:inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 font-sans text-xs font-bold text-black hover:bg-zinc-200 transition active:scale-95",
                  focusRing
                )}
              >
                <span>Concierge</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ─── DRAMATIC LUXURY BILLBOARD HERO ─── */}
      <section className="relative min-h-[75vh] flex items-center justify-center overflow-hidden border-b border-white/10 bg-black px-4 py-20 text-center">
        <div className="absolute inset-0 z-0 opacity-30 mix-blend-luminosity">
          <img src={heroImage} alt="" className="h-full w-full object-cover object-center" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-black/70 to-black/90 pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-3xl px-4">
          <span className="inline-block rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-3.5 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-[#d4af37] mb-6">
            Collection Privée 2026
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-normal tracking-[0.15em] uppercase text-white leading-tight">
            {title}
          </h1>
          <p className="mx-auto mt-6 max-w-lg font-sans text-xs sm:text-sm text-zinc-300 font-light leading-relaxed tracking-wide">
            {subtitle}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={shopNow}
              className={cn(
                "rounded-full bg-white px-8 py-3.5 font-sans text-xs font-bold uppercase tracking-[0.2em] text-black shadow-2xl transition hover:bg-zinc-200 hover:scale-105 active:scale-95",
                focusRing
              )}
            >
              Acquire Collection
            </button>
            {waDigits && (
              <a
                href={`https://wa.me/${waDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "rounded-full border border-white/20 bg-white/5 px-6 py-3.5 font-sans text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-white/10 transition",
                  focusRing
                )}
              >
                Inquire on WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ─── LUXURY TRUST STRIP ─── */}
      <div className="border-b border-white/10 bg-[#0c0c10] py-8 px-4 font-sans text-xs tracking-widest uppercase text-zinc-400">
        <div className="mx-auto max-w-5xl flex flex-wrap items-center justify-around gap-6 text-center">
          <span className="text-zinc-400">Atelier Craftsmanship</span>
          <span className="text-[#d4af37]">·</span>
          <span className="text-zinc-400">Private Concierge</span>
          <span className="text-[#d4af37]">·</span>
          <span className="text-zinc-400">Secured White-Glove Dispatch</span>
          <span className="text-[#d4af37]">·</span>
          <span className="text-zinc-400">Direct WhatsApp Ordering</span>
        </div>
      </div>

      {/* ─── STAGGERED LOOKBOOK CATALOG ─── */}
      <main id="catalog" className="mx-auto max-w-6xl px-4 sm:px-8 py-16 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-10">
          <div>
            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-[#d4af37]">
              Curated Lookbook
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal tracking-[0.15em] uppercase text-white mt-1">
              Select Pieces
            </h2>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar font-sans pb-1">
            {categories.map((category) => {
              const selected = category === activeCategory;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => props.onCategory(category)}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-1.5 text-xs font-medium tracking-wider transition uppercase",
                    focusRing,
                    selected
                      ? "bg-white text-black font-bold"
                      : "border border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                  )}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 text-center font-sans text-zinc-500 text-sm">
            No pieces found in this collection.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filtered.slice(0, shown).map((product) => (
              <div
                key={product.id}
                onClick={() => props.onProduct(product)}
                className="group relative cursor-pointer border border-white/10 bg-[#0d0d10] rounded-2xl overflow-hidden hover:border-white/30 transition-all duration-300"
              >
                <div className="aspect-[3/4] overflow-hidden bg-black/60 relative">
                  <ProductMedia
                    product={product}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {product.badge && (
                    <span className="absolute top-3 left-3 rounded-full border border-white/20 bg-black/70 backdrop-blur-md px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-widest text-[#d4af37]">
                      {product.badge}
                    </span>
                  )}
                </div>
                <div className="p-5 font-sans">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-serif text-base sm:text-lg text-white font-normal tracking-wide truncate group-hover:text-[#d4af37] transition">
                        {product.name}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400 line-clamp-1">
                        {product.description || "Bespoke edition"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                    <span className="text-sm font-bold text-white tracking-wider">
                      {formatPrice(state.currency, product.price)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        props.onProduct(product);
                      }}
                      className="rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white hover:text-black transition"
                    >
                      Acquire
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="mt-14 text-center">
            <button
              type="button"
              onClick={loadMore}
              className={cn(
                "rounded-full border border-white/20 bg-white/5 px-8 py-3 font-sans text-xs font-bold uppercase tracking-widest text-white hover:bg-white hover:text-black transition",
                focusRing
              )}
            >
              Reveal More Pieces ({remaining})
            </button>
          </div>
        )}
      </main>

      <MobileStickyCartBar count={cartCount} onCart={props.onCart} />
    </div>
  );
}

// =============================================================================
// 9. FORGE SITE (Industrial Tactical Hardware & Technical Engineering)
// =============================================================================
function ForgeSite(props: TemplateSiteProps & { template: WebsiteTemplate }) {
  const { state, products, categories, activeCategory, cartCount, template } = props;
  const title = state.heroTitle || state.bizName || "Heavy Duty Systems";
  const subtitle = state.heroSubtitle || state.tagline || "Engineered hardware, precision components and industrial equipment ready for tactical deployment.";
  const [searchFilter, setSearchFilter] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const waDigits = getCleanWhatsAppDigits(state.phone);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = activeCategory === "All" || p.category === activeCategory;
      const matchesSearch =
        !searchFilter.trim() ||
        p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(searchFilter.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [products, activeCategory, searchFilter]);

  const { shown, remaining, hasMore, loadMore } = useCatalogWindow(
    filtered.length,
    `${activeCategory}|${searchFilter}`,
  );

  const handleFeedbackClick = () => {
    if (props.onLeaveFeedback) {
      props.onLeaveFeedback();
    } else {
      setFeedbackOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c0e] pb-28 font-mono text-[#cbd5e1] selection:bg-emerald-500 selection:text-black">
      {/* ─── TECHNICAL TELEMETRY TICKER ─── */}
      <div className="border-b border-[#1e232d] bg-[#07080a] py-1.5 px-4 text-[10px] tracking-widest uppercase text-emerald-400">
        <div className="flex whitespace-nowrap animate-marquee">
          {[
            "SYS: ONLINE",
            `FORGE // ${state.bizName || template.name}`,
            "STATUS: OPERATIONAL",
            "DIRECT DISPATCH VIA WHATSAPP",
            "SPEC: INDUSTRIAL GRADE",
            state.deliveryAreas || state.location || "NATIONWIDE FREIGHT",
          ].concat([
            "SYS: ONLINE",
            `FORGE // ${state.bizName || template.name}`,
            "STATUS: OPERATIONAL",
            "DIRECT DISPATCH VIA WHATSAPP",
            "SPEC: INDUSTRIAL GRADE",
            state.deliveryAreas || state.location || "NATIONWIDE FREIGHT",
          ]).map((item, i) => (
            <span key={i} className="inline-flex items-center">
              <span className="mx-4">{item}</span>
              <span className="text-zinc-600 mr-4 font-normal">::</span>
            </span>
          ))}
        </div>
      </div>

      {/* ─── INDUSTRIAL HEADER ─── */}
      <header className="sticky top-0 z-sticky border-b-2 border-[#1e232d] bg-[#0b0c0e]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button type="button" onClick={shopNow} className={cn("flex items-center gap-3 text-left", focusRing)}>
            {state.bizImage ? (
              <img
                src={state.bizImage}
                alt=""
                className="h-8 w-8 rounded-md object-cover border border-[#333a48] shrink-0"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[#333a48] bg-[#161a22] font-black text-xs text-emerald-400">
                F
              </div>
            )}
            <div>
              <span className="block truncate max-w-[140px] xs:max-w-[190px] sm:max-w-xs text-sm sm:text-base font-black tracking-widest uppercase text-white">
                {state.bizName || template.name}
              </span>
              <span className="text-[10px] text-emerald-500 font-bold tracking-wider">
                [VERIFIED FORGE]
              </span>
            </div>
          </button>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleFeedbackClick}
              className={cn(
                "hidden sm:flex items-center gap-1.5 border border-[#2a303c] bg-[#13161c] px-3 py-1.5 text-xs text-zinc-300 hover:border-emerald-500 transition",
                focusRing
              )}
            >
              <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
              <span>REVIEWS</span>
            </button>

            <button
              type="button"
              onClick={props.onSearch}
              className={cn("border border-[#2a303c] bg-[#13161c] p-2 text-zinc-300 hover:text-white", focusRing)}
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={props.onCart}
              className={cn(
                "flex items-center gap-1.5 border-2 border-emerald-500 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500 hover:text-black transition",
                focusRing
              )}
              aria-label="Cart"
            >
              <ShoppingBag className="h-4 w-4" />
              <CartMark count={cartCount} />
            </button>

            {waDigits && (
              <a
                href={`https://wa.me/${waDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "hidden xs:inline-flex items-center gap-1 rounded bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-black hover:bg-emerald-400 active:scale-95 transition",
                  focusRing
                )}
              >
                <span>DEPLOY</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ─── TACTICAL INDUSTRIAL HERO ─── */}
      <section className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12">
        <div className="rounded-xl border-2 border-[#1e232d] bg-[#101319] p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="space-y-4 max-w-2xl relative z-10">
            <span className="inline-block border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-400">
              SYS // SPECIFICATION 2026
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase leading-none">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed">
              {subtitle}
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={shopNow}
                className={cn(
                  "flex items-center gap-2 rounded bg-emerald-500 px-6 py-3 text-xs font-black uppercase text-black hover:bg-emerald-400 active:scale-95 transition",
                  focusRing
                )}
              >
                <span>DEPLOY HARDWARE</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              {waDigits && (
                <a
                  href={`https://wa.me/${waDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-2 rounded border border-[#2a303c] bg-[#161a22] px-5 py-3 text-xs font-bold text-white hover:border-emerald-500 transition",
                    focusRing
                  )}
                >
                  <MessageCircle className="h-4 w-4 text-emerald-400" />
                  <span>DIRECT DISPATCH INQUIRY</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── SPECIFICATIONS CATALOG GRID ─── */}
      <main id="catalog" className="mx-auto max-w-6xl px-4 sm:px-6 py-10 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#1e232d] pb-4 mb-8">
          <div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
              [INVENTORY STATUS]
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase mt-0.5">
              CATALOG ITEMS
            </h2>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {categories.map((category) => {
              const selected = category === activeCategory;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => props.onCategory(category)}
                  className={cn(
                    "shrink-0 rounded border px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition",
                    focusRing,
                    selected
                      ? "border-emerald-500 bg-emerald-500 text-black"
                      : "border-[#2a303c] bg-[#12151b] text-zinc-400 hover:text-white"
                  )}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-zinc-500 uppercase">
            NO INVENTORY MATCHING QUERY
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.slice(0, shown).map((product, idx) => (
              <div
                key={product.id}
                onClick={() => props.onProduct(product)}
                className="group cursor-pointer rounded-lg border-2 border-[#1e232d] bg-[#12151b] p-4 hover:border-emerald-500 transition-all duration-200"
              >
                <div className="flex items-center justify-between pb-2 text-[10px] text-zinc-500 border-b border-[#1e232d]">
                  <span>ITEM // 00{idx + 1}</span>
                  <span className="text-emerald-400 font-bold">[READY]</span>
                </div>
                <div className="aspect-[4/3] rounded overflow-hidden bg-black/60 my-3">
                  <ProductMedia
                    product={product}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div>
                  <h3 className="truncate text-sm font-bold text-white uppercase group-hover:text-emerald-400 transition">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-400 font-sans line-clamp-2">
                    {product.description || "Industrial grade hardware specification."}
                  </p>
                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-[#1e232d]">
                    <span className="text-sm font-black text-white tabular-nums">
                      {formatPrice(state.currency, product.price)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        props.onProduct(product);
                      }}
                      className="rounded bg-emerald-500/20 border border-emerald-500/50 px-3 py-1 text-xs font-bold text-emerald-400 hover:bg-emerald-500 hover:text-black transition uppercase"
                    >
                      ORDER
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={loadMore}
              className={cn(
                "rounded border-2 border-[#2a303c] bg-[#141820] px-8 py-3 text-xs font-black uppercase text-emerald-400 hover:border-emerald-500 transition",
                focusRing
              )}
            >
              LOAD MORE ITEMS [{remaining}]
            </button>
          </div>
        )}
      </main>

      <MobileStickyCartBar count={cartCount} onCart={props.onCart} />
    </div>
  );
}

// =============================================================================
// 10. OASIS SITE (Mediterranean Terracotta Artisanal & Botanical Interiors)
// =============================================================================
function OasisSite(props: TemplateSiteProps & { template: WebsiteTemplate }) {
  const { state, products, categories, activeCategory, cartCount, template } = props;
  const title = state.heroTitle || state.bizName || "Sun-Baked Living";
  const subtitle = state.heroSubtitle || state.tagline || "Handcrafted ceramics, earthy textiles and botanical essentials shaped with warmth and natural texture.";
  const [searchFilter, setSearchFilter] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const waDigits = getCleanWhatsAppDigits(state.phone);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = activeCategory === "All" || p.category === activeCategory;
      const matchesSearch =
        !searchFilter.trim() ||
        p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(searchFilter.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [products, activeCategory, searchFilter]);

  const { shown, remaining, hasMore, loadMore } = useCatalogWindow(
    filtered.length,
    `${activeCategory}|${searchFilter}`,
  );

  const handleFeedbackClick = () => {
    if (props.onLeaveFeedback) {
      props.onLeaveFeedback();
    } else {
      setFeedbackOpen(true);
    }
  };

  const heroImage =
    state.heroImage ||
    state.bizImage ||
    products[0]?.image ||
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=80";

  return (
    <div className="min-h-screen bg-[#faf6f1] dark:bg-[#181310] pb-28 font-serif text-[#33261f] dark:text-[#ede4dc] selection:bg-[#c2410c] selection:text-white">
      {/* ─── WARM ARTISANAL HEADER ─── */}
      <header className="sticky top-0 z-sticky border-b border-[#e6ded5] dark:border-[#2b221c] bg-[#faf6f1]/95 dark:bg-[#181310]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <button type="button" onClick={shopNow} className={cn("flex items-center gap-3 text-left", focusRing)}>
            {state.bizImage ? (
              <img
                src={state.bizImage}
                alt=""
                className="h-9 w-9 rounded-full object-cover border border-[#c2410c]/30 shrink-0"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c2410c] text-white font-sans text-xs font-bold">
                {(state.bizName || template.name).slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <span className="block truncate max-w-[150px] xs:max-w-[200px] sm:max-w-xs font-serif text-base sm:text-lg font-bold text-[#33261f] dark:text-[#ede4dc]">
                {state.bizName || template.name}
              </span>
              <span className="hidden sm:block font-sans text-[10px] font-semibold text-[#c2410c] dark:text-[#fb923c] uppercase tracking-wider">
                Artisanal Living
              </span>
            </div>
          </button>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleFeedbackClick}
              className={cn(
                "hidden sm:flex items-center gap-1.5 rounded-full border border-[#e6ded5] dark:border-[#2b221c] bg-white/70 dark:bg-[#201915] px-3.5 py-1.5 font-sans text-xs text-[#6e584c] dark:text-[#bda495] hover:text-[#c2410c] transition",
                focusRing
              )}
            >
              <MessageSquare className="h-3.5 w-3.5 text-[#c2410c]" />
              <span>Reviews</span>
            </button>

            <button
              type="button"
              onClick={props.onSearch}
              className={cn("p-2 text-[#6e584c] dark:text-[#bda495] hover:text-[#c2410c] transition", focusRing)}
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={props.onCart}
              className={cn(
                "flex items-center gap-1.5 rounded-full bg-[#c2410c] px-3.5 py-2 font-sans text-xs font-bold text-white shadow-md hover:bg-[#a53609] active:scale-95 transition",
                focusRing
              )}
              aria-label="Cart"
            >
              <ShoppingBag className="h-4 w-4" />
              <CartMark count={cartCount} />
            </button>
          </div>
        </div>
      </header>

      {/* ─── SUN-BAKED ARCHED BILLBOARD HERO ─── */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12">
        <div className="rounded-[2.5rem] border border-[#e6ded5] dark:border-[#2b221c] bg-[#f4ede4] dark:bg-[#221a16] p-6 sm:p-12 overflow-hidden shadow-sm">
          <div className="grid items-center gap-8 md:grid-cols-12">
            <div className="md:col-span-7 space-y-4">
              <span className="inline-block rounded-full bg-[#c2410c]/10 dark:bg-[#c2410c]/20 px-3.5 py-1 font-sans text-[11px] font-bold uppercase tracking-widest text-[#c2410c] dark:text-[#fb923c]">
                Natural Earthen Craft
              </span>
              <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-normal text-[#33261f] dark:text-[#ede4dc] leading-tight">
                {title}
              </h1>
              <p className="max-w-md font-sans text-xs sm:text-sm text-[#6e584c] dark:text-[#bda495] leading-relaxed">
                {subtitle}
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={shopNow}
                  className={cn(
                    "rounded-full bg-[#c2410c] px-7 py-3 font-sans text-xs sm:text-sm font-bold text-white shadow-lg transition hover:bg-[#a53609] active:scale-95",
                    focusRing
                  )}
                >
                  Explore Collection
                </button>
                {waDigits && (
                  <a
                    href={`https://wa.me/${waDigits}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "rounded-full border border-[#e6ded5] dark:border-[#2b221c] bg-white dark:bg-[#181310] px-5 py-3 font-sans text-xs sm:text-sm font-bold text-[#33261f] dark:text-[#ede4dc] hover:border-[#c2410c] transition",
                      focusRing
                    )}
                  >
                    <MessageCircle className="h-4 w-4 inline mr-1 text-[#c2410c]" />
                    <span>WhatsApp Inquiry</span>
                  </a>
                )}
              </div>
            </div>

            <div className="md:col-span-5">
              <div className="rounded-3xl overflow-hidden aspect-[4/3] sm:aspect-square border border-[#e6ded5] dark:border-[#2b221c] shadow-lg">
                <img src={heroImage} alt="" className="h-full w-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ARTISANAL CATALOG ─── */}
      <main id="catalog" className="mx-auto max-w-6xl px-4 sm:px-6 py-8 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e6ded5] dark:border-[#2b221c] pb-4 mb-8">
          <div>
            <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-[#c2410c] dark:text-[#fb923c]">
              Handcrafted Catalog
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#33261f] dark:text-[#ede4dc] mt-0.5">
              Organic Essentials
            </h2>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar font-sans pb-1">
            {categories.map((category) => {
              const selected = category === activeCategory;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => props.onCategory(category)}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition",
                    focusRing,
                    selected
                      ? "bg-[#c2410c] text-white shadow-sm"
                      : "border border-[#e6ded5] dark:border-[#2b221c] bg-white dark:bg-[#201915] text-[#6e584c] dark:text-[#bda495] hover:text-[#c2410c]"
                  )}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center font-sans text-xs text-[#6e584c] dark:text-[#bda495]">
            No handcrafted pieces found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.slice(0, shown).map((product) => (
              <div
                key={product.id}
                onClick={() => props.onProduct(product)}
                className="group cursor-pointer rounded-3xl border border-[#e6ded5] dark:border-[#2b221c] bg-white dark:bg-[#201915] p-4 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-[#f4ede4] dark:bg-[#181310] relative">
                  <ProductMedia
                    product={product}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.badge && (
                    <span className="absolute top-3 left-3 rounded-full bg-[#c2410c] text-white px-3 py-0.5 font-sans text-[10px] font-bold">
                      {product.badge}
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <h3 className="font-serif text-base sm:text-lg font-bold text-[#33261f] dark:text-[#ede4dc] group-hover:text-[#c2410c] transition">
                    {product.name}
                  </h3>
                  <p className="mt-1 font-sans text-xs text-[#6e584c] dark:text-[#bda495] line-clamp-2">
                    {product.description || "Artisanal hand-worked edition."}
                  </p>
                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-[#e6ded5] dark:border-[#2b221c]">
                    <span className="font-sans text-sm font-bold text-[#c2410c] dark:text-[#fb923c]">
                      {formatPrice(state.currency, product.price)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        props.onProduct(product);
                      }}
                      className="rounded-full bg-[#c2410c]/10 dark:bg-[#c2410c]/20 px-3.5 py-1 font-sans text-xs font-bold text-[#c2410c] dark:text-[#fb923c] hover:bg-[#c2410c] hover:text-white transition"
                    >
                      Order
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="mt-12 text-center font-sans">
            <button
              type="button"
              onClick={loadMore}
              className={cn(
                "rounded-full border border-[#e6ded5] dark:border-[#2b221c] bg-white dark:bg-[#201915] px-8 py-3 text-xs font-bold text-[#33261f] dark:text-[#ede4dc] hover:border-[#c2410c] transition",
                focusRing
              )}
            >
              Load More Pieces ({remaining})
            </button>
          </div>
        )}
      </main>

      <MobileStickyCartBar count={cartCount} onCart={props.onCart} />
    </div>
  );
}

// =============================================================================
// ROUTER: TEMPLATE SITE
// =============================================================================
export function TemplateSite(props: TemplateSiteProps) {
  const template = websiteTemplateById(props.state.websiteTemplateId);
  if (!template) return null;

  // Route each template to its dedicated visual experience
  const id = props.state.websiteTemplateId || template.id;

  if (id === "noir") {
    return <NoirSite {...props} template={template} />;
  }

  if (id === "forge") {
    return <ForgeSite {...props} template={template} />;
  }

  if (id === "oasis") {
    return <OasisSite {...props} template={template} />;
  }

  if (id === "bloom") {
    return <BloomSite {...props} template={template} />;
  }

  if (id === "coast") {
    return <CoastSite {...props} template={template} />;
  }

  if (id === "market") {
    return <MarketplaceSite {...props} template={template} />;
  }

  if (id === "studio") {
    return <StudioSite {...props} template={template} />;
  }

  if (id === "bold") {
    return <BoldSite {...props} template={template} />;
  }

  if (id === "boutique") {
    return <BoutiqueSite {...props} template={template} />;
  }

  // Baseline classic editorial layout preserved as requested
  return <EditorialSite {...props} template={template} />;
}


