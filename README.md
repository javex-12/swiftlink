# SwiftLink Pro — Developer Handbook

> **WhatsApp commerce platform** — Turn any WhatsApp number into a professional online store with real-time inventory, dispatch tracking, and live ordering.

---

## 🗂 Project Structure

```
swiftlink/
├── app/
│   ├── layout.tsx              # Root layout (fonts, Firebase provider, AppChrome)
│   ├── page.tsx                # Landing page entry (HomeClient router)
│   ├── globals.css             # Global styles + Tailwind config
│   ├── signup/page.tsx         # Auth page (Google + email/password)
│   ├── pro/page.tsx            # Business command center (owner view)
│   ├── business/page.tsx       # Product & store management
│   ├── dispatch/page.tsx       # Dispatch & delivery management
│   └── [storeSlug]/page.tsx    # Customer storefront (public)
│
├── components/
│   ├── landing/
│   │   ├── LandingPage.tsx     # Marketing landing page
│   │   ├── ThreeScene.tsx      # Three.js hero (rings, sparkles, mouse-reactive)
│   │   ├── LivePreview.tsx     # Interactive phone mockup (5-screen iOS-style)
│   │   └── AnimatedText.tsx    # Word-by-word text reveal
│   ├── AppChrome.tsx           # Global shell (tour, loading overlay, cart)
│   ├── BusinessView.tsx        # Owner: product/store settings
│   ├── CustomerStorefront.tsx  # Customer: browse + cart + WhatsApp checkout
│   ├── DispatchView.tsx        # Owner: dispatch form + delivery list
│   └── ...
│
├── context/
│   └── SwiftLinkContext.tsx    # Global state (Firebase, cart, tour, deliveries)
│
└── lib/
    ├── firebase-client.ts      # Firebase singleton
    ├── types.ts                # Shared TypeScript types
    └── utils.ts                # Helpers
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v3 |
| Animations | Framer Motion v12 |
| 3D Graphics | Three.js + @react-three/fiber + drei |
| Backend / DB | Firebase Firestore (real-time) |
| Auth | Firebase Auth (Google OAuth + Email/Password) |

---

## 🔑 Firebase Setup

Project: **`swiftlinkpro-ec095`**. Config in `lib/firebase-client.ts`.

### ⚠️ Enable Google Sign-In (REQUIRED)
1. [Firebase Console → Auth → Sign-in method](https://console.firebase.google.com/project/swiftlinkpro-ec095/authentication/providers)
2. Click **Google** → **Enable**
3. Add support email + production domain under **Authorized domains**

### Environment Variables (`.env.local`)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### Recommended Firestore Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /swiftlink_stores/{uid} {
      allow read: if true;
      allow write: if request.auth.uid == uid;
    }
  }
}
```

---

## 🚀 Running Locally

```bash
cd swiftlink
npm install
npm run dev   # → http://localhost:3000
```

---

## 📱 Key User Flows

### Owner Flow
1. `/` landing → **Get Started** → `/signup`
2. Google sign-in or email/password → `/pro`
3. `/business` — add products, copy shop link
4. `/dispatch` — create delivery → share tracking URL

### Customer Flow
1. Opens shop link: `/?shop=<uid>` or `/<storeSlug>`
2. Browses, adds to cart → **Order via WhatsApp**

### Tracking
- URL: `/?track=<TRK-XXXXX>` — public, no auth needed

---

## 🛠 April 2026 Session — What Was Built

### Landing Page
- **ThreeScene** — New 3D hero: animated rings, orbiting spheres, particle sparkles, wireframe globe, mouse-reactive blob
- **LandingPage** — Fixed SSR hydration bug (hero text invisible due to `overflow-hidden` + `opacity:0` initial state). Full mobile responsiveness
- **LivePreview** — Full 5-screen interactive phone demo: Home, Product Detail, Search, Cart, Profile — all buttons work, WhatsApp order flow

### Auth / Sign-Up Page
- Dark glassmorphism design
- Google Sign-In via `signInWithPopup`
- Email/password with Sign Up ↔ Log In toggle
- Full Firebase error mapping
- Multi-device login (Firebase persistent sessions)
- Auto-creates Firestore store on first sign-in

### Bug Fixes
- Hero text invisible (SSR + `overflow-hidden` clipping) → replaced with `FadeUp` helper
- Grey whitespace before hero → body bg changed to white
- 2s black loading overlay on landing/signup → now skipped for those routes
- Hydration warning → `suppressHydrationWarning` on `<body>`
- Phone demo height collapse → explicit pixel height on container
- Added `scrollbar-hide` CSS utility

---

## 👥 Team Roles
| Role | Notes |
|---|---|
| Frontend Lead | Landing page, auth, demo |
| Firebase/Backend | Firestore, rules, functions |
| Design System | Emerald Green + Slate palette |
