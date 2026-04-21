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
    // If user is accessing the landing page, and they already own a store (state.id exists OR user is logged in)
    // and they are not specifically viewing another shop, push them to their dashboard
    const hasStore = state?.id || user?.id;
    if (defaultView === "landing" && hasStore && isOwner && !shop) {
      router.replace("/pro");
    }
  }, [defaultView, state?.id, user?.id, isOwner, shop, router]);

  if (track) return <TrackingView />;
  if (shop) return <CustomerStorefront />;
  
  return defaultView === "landing" ? <LandingPage /> : <LauncherView />;
}
