"use client";

import React from "react";
import { isFeatureEnabled } from "@/lib/flags";
import { StoreEditorV2 } from "./StoreEditorV2";
import { BusinessView } from "@/components/BusinessView";

export function StoreEditorRouter() {
  return <StoreEditorV2 />;
}
