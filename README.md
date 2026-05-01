# SwiftLink Pro

SwiftLink Pro is a **WhatsApp-first storefront** for Nigerian small businesses. Merchants create a store, add products, share a public link, and customers place orders via WhatsApp with live dispatch tracking.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Database/Auth**: Supabase
- **Styling**: Tailwind CSS + Framer Motion
- **Maps**: Leaflet (Live Dispatch Tracking)

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

## Features

- **Store Editor**: Drag-and-drop management of products and branding.
- **WhatsApp Checkout**: Frictionless order flow straight to the merchant's phone.
- **Dispatch Tracking**: Driver portal for live GPS streaming and customer map view.
- **Modern Auth**: Google One Tap & Popup authentication.

## Deploying

Deploy on **Vercel** with the environment variables listed above. Ensure you have the `dispatch_tracking` table set up in your Supabase project (see `docs/SUPABASE_SETUP.sql`).