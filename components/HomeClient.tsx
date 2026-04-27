"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { CustomerStorefront } from "@/components/CustomerStorefront";
import { LauncherView } from "@/components/LauncherView";
import { TrackingView } from "@/components/TrackingView";
import LandingPage from "@/components/landing/LandingPage";
import { useSwiftLink } from "@/context/SwiftLinkContext";

export function HomeClient({ defaultView = "launcher" }: { defaultView?: "launcher" | "landing" }) {
  const searchParams = useSearchParams();
  const track = searchParams.get("track");
  const shop = searchParams.get("shop");
  const { state, isOwner, user } = useSwiftLink();
  const router = useRouter();

  useEffect(() => {
    // STRICT PRODUCTION LOGIC: 
    // Only redirect to /pro if we have a verified Supabase User session.
    // We ignore localStorage state for the initial landing-to-pro transition.
    if (defaultView === "landing" && user?.id && isOwner && !shop) {
      router.replace("/pro");
    }
  }, [defaultView, user?.id, isOwner, shop, router]);

  if (track) return <TrackingView />;
  if (shop) return <CustomerStorefront shopId={shop} />;
  
  return defaultView === "landing" ? <LandingPage /> : <LauncherView />;
}
