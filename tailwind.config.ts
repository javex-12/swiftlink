import type { Config } from "tailwindcss";

/**
 * Tailwind is configured to *consume tokens*, never to declare colors.
 *
 * Every entry below resolves to a CSS custom property from `styles/tokens.css`.
 * That means a merchant theme (which re-declares `--t-*` on a scope element) and
 * dark mode (which re-declares `--app-*` on `.dark`) are theme *swaps* rather
 * than new class names — the structural fix for the `!important` class hijack in
 * `docs/00-AUDIT.md` F-17.
 *
 * Two namespaces, never mixed (docs/01-DESIGN-SYSTEM.md §1):
 *   `app-*` → SwiftLink's own console chrome
 *   `t-*`   → the tenant's storefront brand
 *
 * This is written with `theme.extend`, so all of Tailwind's default palette and
 * scale still resolve while the existing 16k lines of components are migrated
 * incrementally. Nothing here is a hard-coded hex; that is enforced for
 * `components/ui/**` by the rules in `.eslintrc.json`.
 */

const app = {
  bg: "var(--app-bg)",
  surface: "var(--app-surface)",
  "surface-2": "var(--app-surface-2)",
  border: "var(--app-border)",
  "border-strong": "var(--app-border-strong)",
  text: "var(--app-text)",
  "text-muted": "var(--app-text-muted)",
  "text-subtle": "var(--app-text-subtle)",
  accent: "var(--app-accent)",
  "accent-hover": "var(--app-accent-hover)",
  "accent-fg": "var(--app-accent-fg)",
  "accent-subtle": "var(--app-accent-subtle)",
  "accent-text": "var(--app-accent-text)",
  ring: "var(--app-ring)",
  success: "var(--app-success)",
  "success-subtle": "var(--app-success-subtle)",
  warning: "var(--app-warning)",
  "warning-subtle": "var(--app-warning-subtle)",
  danger: "var(--app-danger)",
  "danger-fg": "var(--app-danger-fg)",
  "danger-subtle": "var(--app-danger-subtle)",
  info: "var(--app-info)",
  "info-subtle": "var(--app-info-subtle)",
  overlay: "var(--app-overlay)",
} as const;

const storefront = {
  bg: "var(--t-bg)",
  surface: "var(--t-surface)",
  "surface-alt": "var(--t-surface-alt)",
  text: "var(--t-text)",
  "text-muted": "var(--t-text-muted)",
  border: "var(--t-border)",
  accent: "var(--t-accent)",
  "accent-hover": "var(--t-accent-hover)",
  "accent-fg": "var(--t-accent-fg)",
  "accent-text": "var(--t-accent-text)",
  "accent-subtle": "var(--t-accent-subtle)",
} as const;

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: { app, t: storefront },

      /* Radii resolve to tokens so a theme's `radius` setting moves every
         component coherently — the old `buttonRadius` only reached some buttons. */
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "t-sm": "var(--t-radius-sm)",
        "t-md": "var(--t-radius)",
        "t-lg": "var(--t-radius-lg)",
        "t-pill": "var(--t-radius-pill)",
      },

      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
        "t-display": ["var(--t-font-display)"],
        "t-body": ["var(--t-font-body)"],
      },

      fontSize: {
        "display-3": ["var(--text-display-3)", { lineHeight: "1.15" }],
        "display-2": ["var(--text-display-2)", { lineHeight: "1.08" }],
        "display-1": ["var(--text-display-1)", { lineHeight: "1.02" }],
      },

      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },

      transitionDuration: {
        fast: "var(--duration-fast)",
        base: "var(--duration-base)",
        slow: "var(--duration-slow)",
      },

      transitionTimingFunction: {
        out: "var(--ease-out)",
        spring: "var(--ease-spring)",
      },

      zIndex: {
        dropdown: "var(--z-dropdown)",
        sticky: "var(--z-sticky)",
        overlay: "var(--z-overlay)",
        modal: "var(--z-modal)",
        toast: "var(--z-toast)",
        tooltip: "var(--z-tooltip)",
      },

      ringColor: { DEFAULT: "var(--app-ring)" },
      ringWidth: { DEFAULT: "var(--ring-width)" },
      ringOffsetColor: { DEFAULT: "var(--app-surface)" },
      ringOffsetWidth: { DEFAULT: "var(--ring-offset)" },

      /* Motion on the storefront is opt-in and always respects reduced motion. */
      keyframes: {
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up var(--duration-slow) var(--ease-out) backwards",
      },
    },
  },
  plugins: [],
};

export default config;
