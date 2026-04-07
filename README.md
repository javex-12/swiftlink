# SwiftLink Pro

Next.js (App Router) storefront with Firebase (anonymous auth + Firestore) and Tailwind CSS.

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy `.env.example` to `.env.local` and fill in Firebase web app values (optional — public fallback matches the previous static build).

## Build

```bash
npm run build
npm start
```

**Note:** If `npm install` fails with `ENOTEMPTY` / `EPERM` under `node_modules`, OneDrive or another process may be locking files. Pause OneDrive sync for this folder or clone/run the project outside OneDrive, then delete `node_modules` and run `npm install` again.

## Routes

- `/` — merchant launcher (or `?shop=` / `?track=` for storefront / tracking)
- `/business` — store manager
- `/dispatch` — logistics / tracking creation
- `/[storeSlug]/[shopId]` — public storefront (slug + owner UID)

## Deploy

Deploy to Vercel; no SPA `rewrites` are required — Next.js handles routing.
