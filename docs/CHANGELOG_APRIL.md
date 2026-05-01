# Changelog — April 2026 (SwiftLink Pro v1.0)

## Core Features & Fixes

### 1. Modern Authentication
- Switched from full-page redirects to **Google One Tap** and **Popup Auth**.
- Implemented **Middleware Security** using `@supabase/ssr` to protect owner routes (/pro, /business, /dispatch).

### 2. Live Dispatch Tracking
- **Driver Portal**: Added `/dispatch/driver/[code]` for live GPS location streaming.
- **Customer Map**: Integrated **Leaflet.js** for real-time tracking of deliveries.
- **Dedicated Schema**: Moved tracking data to a separate `dispatch_tracking` table for performance and privacy.

### 3. Cleanup & Optimization
- **Firebase Eviction**: Completely removed all Firebase dependencies and logic.
- **Route Consolidation**: Standardized store URLs to `/store/[slug]`.
- **UI Refinement**: Upgraded system modals and toast notifications for a smoother UX.
- **Env Security**: Moved all sensitive keys to `.env.local` and removed hardcoded fallbacks.

## Database
- SQL migration script provided in `docs/SUPABASE_SETUP.sql`.