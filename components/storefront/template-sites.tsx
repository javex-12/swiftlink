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
} from "lucide-react";

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

  const cleanPhone = phone ? phone.replace(/\D/g, "") : "";
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

function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  // Deliberately generic. These answers used to promise specific policies the
  // merchant never agreed to ("same-day shipping", "bank transfer, USSD, cards"),
  // which is the same fabrication problem as the old testimonials — a shopper
  // would hold the vendor to promises the template invented.
  const faqs = [
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
          {faqs.map((faq, i) => {
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
      className="fixed bottom-4 left-4 right-4 z-40 md:hidden"
    >
      <button
        type="button"
        onClick={onCart}
        className="flex w-full items-center justify-between rounded-2xl bg-t-accent px-5 py-3.5 text-sm font-bold text-t-accent-fg shadow-2xl transition active:scale-[0.98]"
      >
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          <span>{count} {count === 1 ? "item" : "items"} in Cart</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
          <span>Checkout via WhatsApp</span>
          <ArrowRight className="h-4 w-4" />
        </div>
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
            <span className="truncate max-w-[140px] xs:max-w-[200px] sm:max-w-xs md:max-w-none">{state.bizName || template.name}</span>
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
                href={`https://wa.me/${state.phone.replace(/\D/g, "")}`}
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
      <FaqSection />

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
// 2. BOUTIQUE SITE
// =============================================================================
function BoutiqueSite(props: TemplateSiteProps & { template: WebsiteTemplate }) {
  const { state, products, categories, activeCategory, cartCount, template } = props;
  const title = state.heroTitle || state.bizName || template.name;
  const subtitle = state.heroSubtitle || state.tagline || template.tagline;
  const story = storyOf(state, template);
  const mark = state.bizImage;
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
      {/* Top Banner */}
      <div className="bg-t-accent-subtle px-4 py-2 text-center text-xs font-semibold text-t-accent-text border-b border-t-border">
        {state.tagline || template.tagline || "Artisanal Boutique"} · Fast Nationwide Tracked Delivery
      </div>

      {/* Header */}
      <header className="sticky top-0 z-sticky border-b border-t-border bg-t-bg/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3.5 py-3 sm:px-6 sm:py-3.5 md:px-8">
          <button
            type="button"
            onClick={props.onSearch}
            className={cn("flex shrink-0 items-center gap-1 rounded-full border border-t-border bg-t-surface p-2 sm:px-3 sm:py-1.5 text-xs text-t-text transition hover:border-t-accent", focusRing)}
            aria-label="Search"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Search</span>
          </button>

          <button type="button" onClick={shopNow} className={cn("flex min-w-0 items-center gap-1.5 sm:gap-2", focusRing)}>
            <span className="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-t-accent-subtle shadow-xs">
              {mark ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mark} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs sm:text-sm font-bold text-t-accent-text">
                  {(state.bizName || template.name).slice(0, 1)}
                </span>
              )}
            </span>
            <span className="truncate max-w-[130px] xs:max-w-[180px] sm:max-w-xs font-t-display text-sm sm:text-lg font-bold text-t-text">
              {state.bizName || template.name}
            </span>
          </button>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleFeedbackClick}
              className={cn("hidden sm:flex items-center gap-1 rounded-full border border-t-border bg-t-surface px-3 py-1.5 text-xs font-medium text-t-text transition hover:border-t-accent", focusRing)}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Reviews</span>
            </button>

            <button
              type="button"
              onClick={props.onCart}
              className={cn("flex shrink-0 items-center gap-1.5 rounded-full bg-t-accent px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-t-accent-fg shadow-xs transition hover:opacity-95 active:scale-95", focusRing)}
              aria-label="Cart"
            >
              <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Cart</span>
              <CartMark count={cartCount} />
            </button>
          </div>
        </div>
      </header>

      {/* Boutique Hero: Warm, 2-column artisanal storefront banner */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:px-8 md:py-16">
        <div className="grid items-center gap-8 rounded-3xl border border-t-border bg-t-surface-alt/70 p-6 sm:p-10 md:grid-cols-12 md:gap-12 md:p-12 shadow-sm">
          <div className="md:col-span-7 space-y-4">
            <span className="inline-block rounded-full bg-t-accent-subtle px-3.5 py-1 text-xs font-bold text-t-accent-text">
              Artisanal Boutique Collection
            </span>
            <h1 className="font-t-display text-3xl font-bold leading-tight sm:text-5xl md:text-6xl text-t-text break-words">
              {title}
            </h1>
            <p className="max-w-lg text-sm sm:text-base leading-relaxed text-t-text-muted">
              {subtitle}
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={shopNow}
                className={cn(
                  "flex items-center gap-2 rounded-full bg-t-accent px-6 py-3 text-sm font-bold text-t-accent-fg shadow-md transition hover:opacity-95 active:scale-95",
                  focusRing
                )}
              >
                <span>{state.heroButtonText || "Browse Collection"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              {state.phone && (
                <a
                  href={`https://wa.me/${state.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-2 rounded-full border border-t-border bg-t-surface px-5 py-3 text-sm font-semibold text-t-text transition hover:border-t-accent",
                    focusRing
                  )}
                >
                  <MessageCircle className="h-4 w-4 sf-accent-text" />
                  <span>Inquire via WhatsApp</span>
                </a>
              )}
            </div>
          </div>
          {/* Same reason as the editorial banner: no hero photograph. */}
          <div className="md:col-span-5">
            <div className="flex h-full flex-col justify-between gap-6 rounded-2xl border border-t-border bg-t-surface p-6 shadow-sm">
              <div>
                <span className="inline-block rounded-full bg-t-accent-subtle px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-t-accent-text">
                  Hand-selected
                </span>
                <p className="mt-3 font-t-display text-xl font-bold text-t-text break-words">
                  {state.bizName || template.name}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-t-text-muted">
                  Personal WhatsApp checkout, one customer at a time.
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-4 border-t border-t-border pt-5">
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-t-text-muted">Items</dt>
                  <dd className="mt-0.5 font-t-display text-xl font-bold text-t-text">{products.length}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-t-text-muted">Reply time</dt>
                  <dd className="mt-0.5 font-t-display text-xl font-bold text-t-text">Minutes</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <TrustFeaturesStrip template={template} />

      {/* Catalog */}
      <section id="catalog" className="scroll-mt-24 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
            <h2 className="font-t-display text-2xl sm:text-3xl font-bold text-t-text">
              Store Catalog
            </h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-t-text-muted" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search products…"
                className="w-full rounded-full border border-t-border bg-t-surface py-2 pl-9 pr-3 text-xs text-t-text placeholder-t-text-muted outline-none focus:border-t-accent"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none" role="tablist" aria-label="Categories">
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
                    "shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition",
                    focusRing,
                    selected
                      ? "bg-t-accent text-t-accent-fg shadow-xs"
                      : "bg-t-surface border border-t-border text-t-text hover:border-t-accent/50",
                  )}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <EmptyCatalog />
          ) : (
            <div className="grid grid-cols-1 gap-4 min-[460px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 sm:gap-6">
              {filtered.slice(0, shown).map((product) => (
                <div
                  key={product.id}
                  onClick={() => props.onProduct(product)}
                  className={cn(
                    "group flex flex-col justify-between overflow-hidden rounded-2xl bg-t-surface border border-t-border p-3 sm:p-4 text-left shadow-xs transition hover:shadow-lg cursor-pointer",
                    focusRing,
                  )}
                >
                  <div>
                    <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-t-surface-alt">
                      <ProductMedia product={product} className="transition-transform duration-500 group-hover:scale-105" />
                      {product.badge && (
                        <span className="absolute left-2.5 top-2.5 rounded-full bg-t-accent px-2 py-0.5 text-[9px] font-bold text-t-accent-fg">
                          {product.badge}
                        </span>
                      )}
                      {product.outOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs">
                          <span className="rounded-full sf-surface px-2.5 py-0.5 text-[9px] font-bold uppercase text-black">
                            Sold Out
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-t-accent">
                        {product.category || "Item"}
                      </span>
                      <h3 className="mt-0.5 text-sm sm:text-base font-bold text-t-text line-clamp-1 group-hover:text-t-accent transition">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="mt-1 text-xs text-t-text-muted line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-t-border/50 pt-3">
                    <span className="text-sm font-bold tabular-nums text-t-text">
                      {formatPrice(state.currency, product.price)}
                    </span>
                    <button
                      type="button"
                      disabled={product.outOfStock}
                      onClick={(e) => {
                        e.stopPropagation();
                        props.onProduct(product);
                      }}
                      className="rounded-full bg-t-accent-subtle px-3 py-1 text-xs font-bold text-t-accent-text hover:bg-t-accent hover:text-t-accent-fg transition"
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

      {/* Story */}
      <section id="story" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 md:px-8">
        <div className="rounded-3xl bg-t-accent-subtle border border-t-border px-6 py-10 sm:px-12 sm:py-14">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-t-accent-text">
            Our Story
          </span>
          <p className="mt-3 max-w-2xl font-t-display text-2xl sm:text-3xl leading-snug text-t-text">
            {story}
          </p>
          <div className="mt-6 flex items-center gap-4 text-xs font-semibold text-t-accent-text">
            <span>Artisanal Boutique</span>
            <span>·</span>
            <span>Fast Nationwide Delivery</span>
          </div>
        </div>
      </section>

      <TestimonialsSection
        bizName={state.bizName || template.name}
        testimonials={state.testimonials}
        onLeaveFeedback={handleFeedbackClick}
      />
      <FaqSection />

      {/* Footer */}
      <footer className="border-t border-t-border px-4 py-10 text-center text-xs text-t-text-muted">
        <p className="text-base font-bold text-t-text">{state.bizName || template.name}</p>
        <p className="mt-2">{state.phone || "Message us on WhatsApp to order"}</p>
        <p className="mt-1">{state.deliveryAreas || state.location || ""}</p>
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
// 3. BOLD SITE
// =============================================================================
function BoldSite(props: TemplateSiteProps & { template: WebsiteTemplate }) {
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
      <div className="h-2 bg-t-accent" />

      {/* Header */}
      <header className="sticky top-0 z-sticky border-b border-t-border bg-t-bg/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2.5 px-3.5 py-3 sm:px-6">
          <button
            type="button"
            onClick={shopNow}
            className={cn("truncate min-w-0 max-w-[140px] xs:max-w-[200px] sm:max-w-none text-left text-sm sm:text-lg font-black uppercase tracking-[0.14em]", focusRing)}
          >
            {state.bizName || template.name}
          </button>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            <button
              type="button"
              onClick={handleFeedbackClick}
              className={cn("hidden sm:flex items-center gap-1 border border-t-border px-3 py-2 text-xs font-bold uppercase tracking-wider text-t-text hover:bg-t-surface", focusRing)}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Reviews</span>
            </button>

            <button
              type="button"
              onClick={props.onSearch}
              className={cn("flex items-center gap-1 border border-t-border p-2 sm:px-3 sm:py-2 text-xs font-bold uppercase tracking-wider", focusRing)}
              aria-label="Search"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search</span>
            </button>
            <button
              type="button"
              onClick={props.onCart}
              className={cn("flex items-center gap-1.5 bg-t-accent px-3 py-2 sm:px-4 sm:py-2 text-xs font-bold uppercase tracking-wider text-t-accent-fg shadow-sm transition active:scale-95", focusRing)}
              aria-label="Cart"
            >
              <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Cart</span>
              <CartMark count={cartCount} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-t-accent text-t-accent-fg">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 sm:px-6 md:grid-cols-12 md:py-20">
          <div className="md:col-span-7">
            <span className="text-xs font-black uppercase tracking-[0.28em] opacity-80">
              Official Storefront
            </span>
            <h1 className="mt-3 text-4xl sm:text-6xl md:text-7xl font-black uppercase leading-[0.88] tracking-tight break-words">
              {title}
            </h1>
            <p className="mt-5 max-w-sm text-sm sm:text-base leading-relaxed opacity-90">
              {subtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={shopNow}
                className={cn("bg-t-bg px-6 py-3.5 text-xs font-black uppercase tracking-[0.16em] text-t-text shadow-md transition active:scale-95", focusRing)}
              >
                {state.heroButtonText || "Shop Collection"} →
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 md:col-span-5">
            {(products.length > 0 ? products.slice(0, 2) : []).map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => props.onProduct(product)}
                className={cn("aspect-square overflow-hidden bg-t-bg border border-t-border", focusRing)}
              >
                <ProductMedia product={product} />
              </button>
            ))}
            {products.length === 0 && (
              <div className="col-span-2 flex aspect-[16/9] items-center justify-center rounded-xl border border-white/20 text-[11px] font-black uppercase tracking-[0.24em] opacity-70">
                Catalog coming soon
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <TrustFeaturesStrip template={template} />

      {/* Catalog */}
      <section id="catalog" className="scroll-mt-16 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-t-border pb-4">
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-t-text">
              All Items ({products.length})
            </h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-t-text-muted" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search catalog…"
                className="w-full border border-t-border bg-t-surface py-2 pl-9 pr-3 text-xs uppercase tracking-wider text-t-text outline-none focus:border-t-accent"
              />
            </div>
          </div>

          {/* Categories */}
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
                    "shrink-0 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] transition",
                    focusRing,
                    selected ? "bg-t-accent text-t-accent-fg" : "text-t-text-muted hover:text-t-text"
                  )}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div className="py-10">
              <EmptyCatalog />
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-px bg-t-border min-[460px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filtered.slice(0, shown).map((product, index) => (
                <div
                  key={product.id}
                  onClick={() => props.onProduct(product)}
                  className={cn("bg-t-bg p-4 flex flex-col justify-between group cursor-pointer transition hover:bg-t-surface", focusRing)}
                >
                  <div>
                    <div className="relative aspect-square overflow-hidden bg-t-surface-alt">
                      <ProductMedia product={product} className="transition-transform duration-500 group-hover:scale-105" />
                      <span className="absolute left-2 top-2 bg-black/70 px-1.5 py-0.5 text-[9px] font-black tabular-nums text-white">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {product.outOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                          <span className="border-2 border-white px-2 py-1 text-[10px] font-black uppercase text-white">
                            SOLD OUT
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <span className="text-[9px] font-black uppercase tracking-widest text-t-accent">
                        {product.category || "Item"}
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

                  <div className="mt-4 flex items-center justify-between border-t border-t-border pt-3">
                    <span className="text-sm font-black tabular-nums text-t-text">
                      {formatPrice(state.currency, product.price)}
                    </span>
                    <button
                      type="button"
                      disabled={product.outOfStock}
                      onClick={(e) => {
                        e.stopPropagation();
                        props.onProduct(product);
                      }}
                      className="bg-t-accent px-3 py-1 text-[11px] font-black uppercase tracking-wider text-t-accent-fg hover:opacity-90"
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

      {/* Story */}
      <section id="story" className="border-t border-t-border px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <span className="text-xs font-black uppercase tracking-[0.24em] text-t-accent">
            Manifesto
          </span>
          <p className="mt-3 max-w-3xl text-2xl sm:text-3xl font-black uppercase leading-tight tracking-tight text-t-text">
            {story}
          </p>
        </div>
      </section>

      <TestimonialsSection
        bizName={state.bizName || template.name}
        testimonials={state.testimonials}
        onLeaveFeedback={handleFeedbackClick}
      />
      <FaqSection />

      {/* Footer */}
      <footer className="border-t border-t-border px-4 py-8 text-[11px] font-bold uppercase tracking-[0.16em] text-t-text-muted sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 md:flex-row md:justify-between">
          <span>{state.bizName || template.name}</span>
          <span>{state.phone || "Order on WhatsApp"}</span>
          <span>{state.deliveryAreas || state.location || "Nationwide Delivery"}</span>
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

export function TemplateSite(props: TemplateSiteProps) {
  const template = websiteTemplateById(props.state.websiteTemplateId);
  if (!template) return null;

  // Route by the template's navigation shape so each member of the family lands
  // on the layout that matches how it behaves. The three original templates map
  // exactly as they always did (boutique=drawer, bold=bottom, editorial=top);
  // the newer ones reuse those engines while their palette, type pairing,
  // radius, density and image ratio make each look distinct.
  const nav = template.light.nav;
  if (nav === "drawer") return <BoutiqueSite {...props} template={template} />;
  if (nav === "bottom") return <BoldSite {...props} template={template} />;
  return <EditorialSite {...props} template={template} />;
}
