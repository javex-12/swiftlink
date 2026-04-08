# SwiftLink Pro – Developer Changelog & Architecture Notes

## 1. PWA Integration (Progressive Web App)
- **Library**: Added `@ducanh2912/next-pwa` to `next.config.ts`.
- **Manifest**: Created `public/manifest.json` defining the app's name, theme colors (`#10b981`), and offline icons (`/logo.png`).
- **Layout Meta**: Injected `<link rel="manifest">` and standard `theme-color` meta tags.
- **Smart Install Prompt**: Built `components/PWAInstallPrompt.tsx`. It intelligently hooks into the browser API (`beforeinstallprompt`) and displays an elegant UI popup at the bottom of the screen prompting desktop/Android users to "Add to Homescreen" for native app behaviour.

## 2. Terms and Conditions
- **Page Added**: Created `app/terms/page.tsx`.
- **Legal Content**: Includes 5 distinct sections detailing account registration rules, content liability, payment terms (or lack thereof), and standard modifications clauses.
- **Navigation**: Integrated heavily into the new signup page UI so users are natively consenting before account creation.

## 3. Firebase Auth & reCAPTCHA OTP Flow
- **The Flow**: Migrated the signup screen from standard Email/Password directly into a strict verified 2-step process. 
  - Step 1: Base info + Phone Number collection.
  - Step 2: An invisible reCAPTCHA verifies the user is human, and Firebase sends a real 6-digit OTP code to the phone number via `signInWithPhoneNumber`. Upon entering the valid code, the Email account is created and explicitly linked logically.
- **Issue: `401 (Unauthorized)` / `POST pat?k=...`**:
  - **CAUSE**: The `401 Unauthorized` thrown by the `google.com/recaptcha` API is an external Cloud Console rejection. **Our code logic is flawless**, but the API Key in the Firebase project (`swiftlinkpro-ec095`) is strictly restricting `localhost:3002` from utilizing reCAPTCHA Enterprise features, OR Phone Authentication has not been actively switched on in your Firebase Project Console.
  - **HOW TO FIX IN DEV**: 
    1. Go to Firebase Console → Authentication → Sign-in method.
    2. Click "Add New Provider" → "Phone".
    3. Ensure your domain `localhost` is present under the "Authorized Domains" section below it.
    4. If the error persists, open Google Cloud Console natively, find your Web API Key, edit its `HTTP Referrers`, and explicitly allow `http://localhost:*`.
- **Issue: `reCAPTCHA Timeout`**: 
  - This happens right after the 401 fail because React preserves the invisible Recaptcha DOM div across states but Firebase internal `RecaptchaVerifier` fails to resolve, leaving the timeout hanging. A `try/catch` and teardown mechanism was added to reset `window.recaptchaVerifier` if an error occurs. 

## 4. Design Aesthetics (April Updates)
- Landing page rebuilt from `overflow-hidden` blocks that crashed SSR hydration into smooth, explicitly sized `FadeUp` blocks.
- The `LivePreview.tsx` phone frame was decoupled from nested HTML `<button>` violations, utilizing proper accessible `<div role="button">` wrappers to eliminate the red Next.js stack trace.
- Global background bleeds (grey borders on white containers) were eliminated across the board.
