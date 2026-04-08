"use client";

import { useSearchParams } from "next/navigation";
import { CustomerStorefront } from "@/components/CustomerStorefront";
import { LauncherView } from "@/components/LauncherView";
import { TrackingView } from "@/components/TrackingView";
import LandingPage from "@/components/landing/LandingPage";

export function HomeClient({ defaultView = "launcher" }: { defaultView?: "launcher" | "landing" }) {
  const searchParams = useSearchParams();
  const track = searchParams.get("track");
  const shop = searchParams.get("shop");

  if (track) return <TrackingView />;
  if (shop) return <CustomerStorefront />;
  
  return defaultView === "landing" ? <LandingPage /> : <LauncherView />;
}
