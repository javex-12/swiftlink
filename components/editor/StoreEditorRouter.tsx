"use client";

import React from "react";
import { isFeatureEnabled } from "@/lib/flags";
import { StoreEditorV2 } from "./StoreEditorV2";
import { BusinessView } from "@/components/BusinessView";

export function StoreEditorRouter() {
  const useV2 = isFeatureEnabled("storeEditorV2");

  if (useV2) {
    return <StoreEditorV2 />;
  }

  return <BusinessView />;
}
