import Link from "next/link";
import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import { Logo } from "@/components/Logo";
import { HelpFeedbackForm } from "@/components/HelpFeedbackForm";

export const metadata: Metadata = {
  title: "Help & Support — SwiftLink Pro",
  description:
    "Comprehensive guide and answers to frequently asked questions about SwiftLink Pro storefronts, catalog management, WhatsApp orders, and billing.",
  alternates: {
    canonical: "/help",
  },
};

interface FaqItem {
  question: string;
  answer: React.ReactNode;
}

interface FaqCategory {
  title: string;
  description: string;
  items: FaqItem[];
}

const FAQ_SECTIONS: FaqCategory[] = [
  {
    title: "Getting Started",
    description: "Learn how to launch your storefront and connect your WhatsApp channel.",
    items: [
      {
        question: "How do I set up my store?",
        answer: (
          <p>
            When you register an account, SwiftLink automatically creates your initial store draft. Open the{" "}
            <Link href="/business" className="font-medium text-[#19C37D] underline decoration-[#19C37D]/40 underline-offset-2 transition hover:text-[#22E595]">
              Store Editor
            </Link>{" "}
            to name your store, select your unique handle URL, upload your brand logo, and customize your storefront colors.
          </p>
        ),
      },
      {
        question: "How do I add products to my catalog?",
        answer: (
          <p>
            Inside the Store Editor under the &ldquo;Products&rdquo; tab, click &ldquo;Add Product&rdquo;. Provide a product title, price, description, category, and upload one or more high-resolution product photos. Changes can be saved directly to your live storefront.
          </p>
        ),
      },
      {
        question: "How do I publish my store or take it offline?",
        answer: (
          <p>
            At the top of the Store Editor, use the status toggle switch to move between &ldquo;Live&rdquo; and &ldquo;Draft&rdquo;. When in Draft mode, customers visiting your link will see a friendly store-maintenance banner and order links remain inactive until you toggle back to Live.
          </p>
        ),
      },
      {
        question: "Which WhatsApp number should I configure?",
        answer: (
          <p>
            Enter the international phone number (with country code, e.g. +234...) where you or your sales team actively handle customer communications. When buyers check out from your catalog, order links automatically direct to this number.
          </p>
        ),
      },
    ],
  },
  {
    title: "Store & Catalog",
    description: "Managing your layout, visual themes, inventory caps, and product categories.",
    items: [
      {
        question: "How many products can I publish on each plan?",
        answer: (
          <p>
            The Free plan permits up to 6 published products in a single storefront. Upgrading to Pro or Business unlocks unlimited published products (up to a fair-use ceiling of 1,000 products per store). You can also store additional hidden products in your catalog without deletion.
          </p>
        ),
      },
      {
        question: "How do I change my website design template?",
        answer: (
          <p>
            Navigate to the &ldquo;Design&rdquo; tab in your Store Editor and browse the template library. Click &ldquo;Preview&rdquo; on any template to preview your live catalog within that layout, then click &ldquo;Apply Template&rdquo; to save and activate it immediately.
          </p>
        ),
      },
      {
        question: "How does Storefront Light / Dark mode work?",
        answer: (
          <p>
            In the &ldquo;Design&rdquo; tab, choose your default theme mode (Light Mode or Dark Mode). Your storefront adapts its background, typography contrast, and cards automatically to reflect this choice, while preserving your brand&apos;s accent color.
          </p>
        ),
      },
      {
        question: "Can I organize my catalog into categories?",
        answer: (
          <p>
            Yes. You can create custom category filters (such as Footwear, Accessories, New Arrivals) in the Store Editor. Customers can then filter products seamlessly on your storefront with a single tap.
          </p>
        ),
      },
    ],
  },
  {
    title: "Orders & WhatsApp",
    description: "Understanding order generation, customer checkout, and merchant communication.",
    items: [
      {
        question: "How does the checkout process work for customers?",
        answer: (
          <p>
            Customers browse your storefront, add selected items and quantities to their shopping cart, and tap &ldquo;Order on WhatsApp&rdquo;. They provide their delivery details, and SwiftLink instantly opens WhatsApp with a pre-formatted order summary ready to send to your business number.
          </p>
        ),
      },
      {
        question: "What does the WhatsApp order message contain?",
        answer: (
          <p>
            The message lists each item name, selected variant/options, quantity, individual prices, total order value, customer delivery name, delivery address, and any customer notes.
          </p>
        ),
      },
      {
        question: "Do customers pay through SwiftLink or directly to the merchant?",
        answer: (
          <p>
            All sales transactions occur directly between you and your customer. SwiftLink is not an escrow service or third-party payment intermediary, meaning 100% of your earnings go straight to your preferred payment method (bank transfer, POS, cash on delivery, or card) with zero platform commissions.
          </p>
        ),
      },
    ],
  },
  {
    title: "Account & Billing",
    description: "Managing your subscription, payments, grace periods, and cancellation.",
    items: [
      {
        question: "How do I upgrade or change my plan?",
        answer: (
          <p>
            Visit your{" "}
            <Link href="/account" className="font-medium text-[#19C37D] underline decoration-[#19C37D]/40 underline-offset-2 transition hover:text-[#22E595]">
              Account Settings
            </Link>{" "}
            to view current plan details, compare tiers, and upgrade using our secure billing provider.
          </p>
        ),
      },
      {
        question: "What happens if a subscription renewal fails?",
        answer: (
          <p>
            If a recurring charge fails, your account enters a 7-day grace period. You will receive an email alert, and all your storefronts and products remain fully accessible while you update your payment information.
          </p>
        ),
      },
      {
        question: "Will my products or stores be deleted if I downgrade?",
        answer: (
          <p>
            No. SwiftLink never deletes your product inventory, branding, or order records upon plan changes. When moving to a lower tier, excess products are simply marked hidden from public view, and you retain full freedom to select which products remain published.
          </p>
        ),
      },
      {
        question: "How do I cancel my subscription?",
        answer: (
          <p>
            You can cancel at any time from your Account Settings. Upon cancellation, your paid plan benefits remain active until the end of your prepaid billing period, after which your store transitions gracefully to the Free tier.
          </p>
        ),
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#0A1210] text-[#E8F1EC]">
      {/* Sticky Top Nav */}
      <header className="sticky top-0 z-30 border-b border-[#1E2D27] bg-[#111C18]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="flex items-center gap-2">
            <Logo size="sm" showWordmark={true} />
          </Link>
          <div className="flex items-center gap-4 text-xs font-medium text-[#9DB3A8]">
            <Link href="/pro" className="transition hover:text-[#E8F1EC]">
              Dashboard
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-[#1E2D27] bg-[#14231D] px-3.5 py-1.5 text-xs font-semibold text-[#E8F1EC] transition hover:border-[#19C37D] hover:text-[#19C37D]"
            >
              Back to App
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-5 py-16">
        <div className="mb-14">
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#19C37D]">
            Knowledge Base
          </p>
          <h1 className="text-5xl font-black uppercase italic tracking-tighter text-[#E8F1EC] md:text-7xl">
            Help &amp; <span className="text-[#19C37D] underline decoration-[#19C37D]/30 underline-offset-8">Support</span>
          </h1>
          <p className="mt-4 text-sm text-[#9DB3A8]">
            Guides, operational answers, and direct support for your SwiftLink Pro storefront.
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-12">
          {FAQ_SECTIONS.map((section, sIdx) => (
            <div key={section.title} className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-[#1E2D27] pb-3">
                <h2 className="text-sm font-black uppercase tracking-widest text-[#E8F1EC]">
                  {sIdx + 1}. {section.title}
                </h2>
                <span className="text-[11px] text-[#9DB3A8]">
                  {section.items.length} answers
                </span>
              </div>
              <p className="text-xs text-[#9DB3A8]">{section.description}</p>

              <div className="space-y-3 pt-2">
                {section.items.map((item) => (
                  <details
                    key={item.question}
                    className="group rounded-2xl border border-[#1E2D27] bg-[#111C18] p-0 transition-colors open:border-[#24382F]"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 text-sm font-semibold text-[#E8F1EC] [&::-webkit-details-marker]:hidden">
                      <span>{item.question}</span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-[#9DB3A8] transition-transform duration-200 group-open:rotate-180 group-open:text-[#19C37D]" />
                    </summary>
                    <div className="px-6 pb-4 text-sm leading-relaxed text-[#9DB3A8]">
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Feedback Section */}
        <div className="mt-20 border-t border-[#1E2D27] pt-14">
          <div className="mb-6">
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#19C37D]">
              Direct Feedback
            </p>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-[#E8F1EC]">
              Have a suggestion or found a bug?
            </h2>
            <p className="mt-1 text-sm text-[#9DB3A8]">
              Send your feedback straight to our engineering team. We review every note.
            </p>
          </div>

          <HelpFeedbackForm />
        </div>

        {/* Footer */}
        <footer className="mt-20 flex flex-col items-center justify-between gap-4 border-t border-[#1E2D27] pt-8 text-xs text-[#9DB3A8] sm:flex-row">
          <div className="flex items-center gap-4">
            <Link href="/terms" className="transition hover:text-[#E8F1EC]">
              Terms of Service
            </Link>
            <Link href="/privacy" className="transition hover:text-[#E8F1EC]">
              Privacy Policy
            </Link>
            <Link href="/" className="transition hover:text-[#E8F1EC]">
              SwiftLink Pro
            </Link>
          </div>
          <p className="text-[11px] text-[#9DB3A8]">
            Need priority assistance?{" "}
            <a
              href="mailto:support@swiftlink.pro"
              className="font-medium text-[#19C37D] underline decoration-[#19C37D]/40 underline-offset-2 transition hover:text-[#22E595]"
            >
              support@swiftlink.pro
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
