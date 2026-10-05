"use client";

import { ProLayout } from "@/components/ProLayout";
import { OverviewView } from "@/components/dashboard/OverviewView";

/**
 * Merchant Home Dashboard — renders the unified ProLayout shell and OverviewView body.
 * Dark-only, token-driven, anti-slop, and fully aligned with the design specification.
 */
export function LauncherView() {
  return (
    <ProLayout>
      <OverviewView />
    </ProLayout>
  );
}
