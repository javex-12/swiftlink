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
  const viewParam = searchParams.get("v");
  const forceLanding = viewParam === "landing";
  
  const { isOwner, user } = useSwiftLink();
  const router = useRouter();

  // Determine if we should show the landing page.
  // We show it if:
  // 1. Specifically requested via ?v=landing
  // 2. We are on the landing route and there is NO active user session
  const showLanding = forceLanding || (defaultView === "landing" && !user);

  useEffect(() => {
    // If we have a user and we AREN'T forcing the landing page, 
    // and we aren't viewing a specific shop/track, go to /pro
    if (user?.id && isOwner && !shop && !track && !forceLanding && defaultView === "landing") {
      router.replace("/pro");
    }
  }, [user?.id, isOwner, shop, track, router, forceLanding, defaultView]);

  if (track) return <TrackingView />;
  if (shop) return <CustomerStorefront shopId={shop} />;
  
  // If showLanding is true, show LandingPage. Otherwise, show the Dashboard (LauncherView).
  return showLanding ? <LandingPage /> : <LauncherView />;
}
