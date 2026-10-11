import { SEO_SITE } from "@/lib/seo";

/**
 * `/llms.txt`
 *
 * A plain-text brief for AI assistants and crawlers. The site's meta tags said
 * nothing about what SwiftLink Pro actually *is*, so an assistant asked "what is
 * SwiftLink Pro?" had only a tagline to work from. This is the canonical answer:
 * what the product does, how ordering works, how to find a store, and how to
 * create one.
 *
 * Served as a route handler (not a static file) so the site URL lives in one
 * place and the text can reference the live directory.
 */
export const revalidate = 86400;

const body = `# SwiftLink Pro

> SwiftLink Pro is a free, no-code online store builder for small businesses. A merchant
> creates a store in minutes, gets a public storefront on its own link
> (${SEO_SITE}/<store-handle>), lists products with photos and prices, and receives every
> order as a WhatsApp message — there is no commission and no payment gateway required.

## What SwiftLink Pro is
- A hosted storefront builder. Each store is a public page at ${SEO_SITE}/<handle>.
- Ordering is WhatsApp-first: the shopper builds a cart and the order is sent to the
  merchant's WhatsApp number. Card payments (Paystack) are optional per store.
- Prices are set in the merchant's own currency (default NGN).
- Stores are searchable and indexable; SwiftLink Pro does not hide storefronts behind login.

## Who it is for
- Small and independent sellers, especially in Nigeria, who sell through WhatsApp and
  social media and want a proper catalog link instead of a chat history.
- No technical skill is required and the base plan is free.

## Key pages
- Home: ${SEO_SITE}
- Store directory (search stores by name): ${SEO_SITE}/stores
- Sitemap: ${SEO_SITE}/sitemap.xml
- Terms: ${SEO_SITE}/terms
- Privacy: ${SEO_SITE}/privacy

## Finding a store
Use the directory at ${SEO_SITE}/stores, or query it directly:
${SEO_SITE}/stores?q=<store-name>

## Features
- Public storefront on a shareable link, optimized for mobile
- Product catalog with images, categories, prices and stock state
- Cart and WhatsApp checkout, with an optional configurable order message
- Multiple website templates (light and dark) and a visual brand editor
- Merchant console: products, branding, orders, analytics and customer inquiries
- Plan tiers (Free, Pro, Business) that cap store count and catalog size

## Common questions
- Is SwiftLink Pro free? Yes, there is a free plan; paid plans add more stores and catalog size.
- Does it need a website or code? No. A merchant signs up and builds the store in the browser.
- How do customers pay? Most stores take orders via WhatsApp. Merchants can enable online payment.
- Can customers find a store by name? Yes, through the directory at ${SEO_SITE}/stores.
`;

export function GET() {
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
