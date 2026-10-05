/**
 * Feature Flags Configuration.
 * 
 * Allows safely gating redesigns and experimental features behind toggles.
 * Can be overridden in client-side testing via URL parameter, e.g.:
 *   ?ff_landingV2=true or ?ff_landingV2=false
 */

export const FEATURE_FLAGS = {
  landingV2: process.env.NEXT_PUBLIC_FEATURE_LANDING_V2 !== "false", // enabled by default
  storeEditorV2: process.env.NEXT_PUBLIC_FEATURE_STORE_EDITOR_V2 !== "false", // enabled by default
};

export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  if (typeof window !== "undefined") {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const param = urlParams.get(`ff_${flag}`);
      if (param === "true") return true;
      if (param === "false") return false;
    } catch {
      // fallback to config
    }
  }
  return FEATURE_FLAGS[flag];
}
