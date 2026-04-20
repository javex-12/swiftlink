# SwiftLink Pro

SwiftLink Pro is a **WhatsApp-first storefront**: merchants create a store, add products, share a public link, and customers place orders via WhatsApp.

## Quick start

```bash
cd swiftlink
npm install
npm run dev
```

Open `http://localhost:3000`.

## Tech stack

- **Next.js** (App Router) + **React**
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion**
- **Firebase**: Auth, Firestore, Storage

## App routes (high level)

- **Landing**: `/`
- **Auth**: `/signup`
- **Owner** (command center): `/pro`
- **Owner** (store editor): `/business`
- **Owner** (dispatch): `/dispatch`
- **Public storefront**: `/store/[handle]`
- **Cart**: `/cart`
- **Terms**: `/terms`

## Environment variables

Create `swiftlink/.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

## Firebase data model (important)

- **Store documents** live at `swiftlink_stores/{uid}`.
- **Public store handles** are resolved via `swiftlink_slugs/{slug}` where the doc contains:
  - `shopId`: the owner UID
  - `updatedAt`: ISO string

This is what makes `/store/[slug]` load the **correct owner store** for both logged-in and anonymous users.

## Security (must do in Firebase Console)

Client-side code cannot “secure Firebase” by itself. The real security is your **Firestore Rules** and **Storage Rules**.

### Firestore Rules (recommended starting point)

Paste into Firebase Console → Firestore → Rules:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    // Public storefront data is readable by anyone.
    match /swiftlink_stores/{uid} {
      allow read: if true;
      allow create, update, delete: if isSignedIn() && request.auth.uid == uid;
    }

    // Public handle registry: readable by anyone, writable only by the owner of that UID.
    match /swiftlink_slugs/{slug} {
      allow read: if true;
      allow create: if isSignedIn() && request.resource.data.shopId == request.auth.uid;
      allow update, delete: if isSignedIn()
        && resource.data.shopId == request.auth.uid
        && request.resource.data.shopId == request.auth.uid;
    }
  }
}
```

### Storage Rules (recommended starting point)

Paste into Firebase Console → Storage → Rules:

```txt
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /stores/{uid}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## Build & deploy

```bash
cd swiftlink
npm run build
npm run start
```

For production, deploy on Vercel and configure the same `NEXT_PUBLIC_FIREBASE_*` env vars in the Vercel project settings.

## Contributing

- Keep UI copy **honest** (avoid fake stats/claims).
- Avoid dead links / placeholder buttons.
- Run `npm run build` before pushing.
