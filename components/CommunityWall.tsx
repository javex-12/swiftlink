"use client";

// CommunityWall is now powered by SocialHub — a full mini social media experience.
// The old Supabase realtime bug (double-subscribe in Strict Mode) is fixed inside SocialHub
// via a channelRef that cleans up before re-subscribing.
export { SocialHub as CommunityWall } from "./SocialHub";
