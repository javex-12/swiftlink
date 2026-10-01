import type { ShopState } from "./schema";

/**
 * The merchant setup journey.
 *
 * `docs/03-DECISIONS.md` D5 asks for "a visible setup checklist" instead of the
 * dead-end dashboard (and `docs/00-AUDIT.md` F-21 flags the substring heuristic
 * that decided onboarding with `bizName.includes("store")`). This module is the
 * single, pure definition of what "set up" means: it reads a `ShopState` and
 * reports which steps are done, which is next, and how far along the merchant is.
 *
 * It is deliberately free of React and of the store blob's history so it can be
 * unit-tested (see `lib/__tests__/setup-guide.test.ts`) and reused anywhere a
 * "what's next" prompt is needed — dashboard, editor, empty states.
 */

export type SetupStepId = "details" | "handle" | "whatsapp" | "products" | "design";

export interface SetupStep {
  id: SetupStepId;
  /** Plain-language title, phrased as the outcome. */
  title: string;
  /** One sentence explaining why it matters. */
  description: string;
  done: boolean;
  /** Where the merchant goes to complete it. */
  href: string;
  /** Button label for the step. */
  cta: string;
}

export interface SetupGuide {
  steps: SetupStep[];
  completed: number;
  total: number;
  /** 0–100, rounded, for the progress bar. */
  percent: number;
  isComplete: boolean;
  /** First step that is not done, or `null` when everything is complete. */
  nextStep: SetupStep | null;
}

/**
 * Values `defaultShopState()` ships with. A stored state that still matches one
 * of these has not been customised, which is how the "design" step is detected
 * without adding a flag to the blob.
 */
const DEFAULT_ACCENT = "#10b981";
const DEFAULT_BUTTON_RADIUS = "rounded";
const DEFAULT_HERO_TEMPLATE = "hero-1";
const DEFAULT_CATALOG_TEMPLATE = "catalog-1";
const DEFAULT_ABOUT_TEMPLATE = "about-1";

/**
 * Names that are placeholders rather than a real business name. `defaultShopState()`
 * ships `bizName: ""`, but older/live stores carry the literal words below, so the
 * check covers both. Replaces the broken `includes("store")` test that made
 * "Storehouse Foods" permanently "un-onboarded" (docs/00-AUDIT.md F-21).
 */
const PLACEHOLDER_STORE_NAMES = new Set([
  "",
  "store",
  "my store",
  "your store",
  "my business",
  "business",
  "swiftlink",
  "swiftlink pro",
]);

export function hasRealStoreName(name?: string | null): boolean {
  const normalized = (name ?? "").trim().toLowerCase();
  return !PLACEHOLDER_STORE_NAMES.has(normalized);
}

/** A number good enough to receive WhatsApp orders: at least 7 digits. */
export function hasWhatsAppNumber(phone?: string | null): boolean {
  return (phone ?? "").replace(/\D/g, "").length >= 7;
}

/** True once the merchant has moved any design setting off its default. */
export function hasCustomizedDesign(state: ShopState): boolean {
  if (state.websiteTemplateId) return true;
  if (state.storefrontTheme && Object.keys(state.storefrontTheme).length > 0) return true;
  if (state.accentColor && state.accentColor.toLowerCase() !== DEFAULT_ACCENT) return true;
  if (state.buttonRadius && state.buttonRadius !== DEFAULT_BUTTON_RADIUS) return true;
  if (state.heroTemplateId && state.heroTemplateId !== DEFAULT_HERO_TEMPLATE) return true;
  if (state.catalogTemplateId && state.catalogTemplateId !== DEFAULT_CATALOG_TEMPLATE) return true;
  if (state.aboutTemplateId && state.aboutTemplateId !== DEFAULT_ABOUT_TEMPLATE) return true;
  return false;
}

/** Build the ordered checklist, progress and next step for a store. */
export function buildSetupGuide(state: ShopState): SetupGuide {
  const steps: SetupStep[] = [
    {
      id: "details",
      title: "Name your business",
      description: "Give your store a real name customers will recognise.",
      done: hasRealStoreName(state.bizName),
      href: "/account",
      cta: "Edit name",
    },
    {
      id: "handle",
      title: "Claim your store link",
      description: "Pick the handle customers use to find and share your store.",
      done: Boolean(state.storeUsername && state.storeUsername.trim()),
      href: "/account",
      cta: "Set handle",
    },
    {
      id: "whatsapp",
      title: "Connect WhatsApp",
      description: "Orders are sent here, so customers can check out in one tap.",
      done: hasWhatsAppNumber(state.phone),
      href: "/account",
      cta: "Add number",
    },
    {
      id: "products",
      title: "Add your first products",
      description: "A store with at least one product is ready to sell.",
      done: state.products.length > 0,
      href: "/business",
      cta: "Add products",
    },
    {
      id: "design",
      title: "Make it yours",
      description: "Choose colors and a layout so the store looks like your brand.",
      done: hasCustomizedDesign(state),
      href: "/business",
      cta: "Customize",
    },
  ];

  const completed = steps.filter((step) => step.done).length;
  const total = steps.length;

  return {
    steps,
    completed,
    total,
    percent: total === 0 ? 100 : Math.round((completed / total) * 100),
    isComplete: completed === total,
    nextStep: steps.find((step) => !step.done) ?? null,
  };
}
