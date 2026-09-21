/**
 * ESLint — the design-system guardrails from docs/01-DESIGN-SYSTEM.md §12.
 *
 * Scoped to **new code** (the UI kit and the token layer) on purpose. The rules
 * are exactly the ones that keep this from decaying back into what it was, but
 * turning them on repo-wide today would fail on ~16k lines of components mid-
 * migration. Instead they apply from the moment a file moves onto the foundation,
 * which is the guardrail recorded in docs/03-DECISIONS.md (D1).
 *
 * Growing these overrides as the migration proceeds is the plan; weakening them
 * is not.
 */
module.exports = {
  extends: "next/core-web-vitals",
  rules: {},
  overrides: [
    {
      files: ["components/ui/**/*.{ts,tsx}"],
      rules: {
        // The storefront and console use next/image. An avatar is the one
        // documented exception (arbitrary remote hosts) and disables this inline.
        "@next/next/no-img-element": "error",
        "no-restricted-syntax": [
          "error",
          {
            selector: "Literal[value=/#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?/]",
            message:
              "No hex literals in components/ui. Use or add a token from lib/theme (docs/01-DESIGN-SYSTEM.md §12.2).",
          },
          {
            selector: "Literal[value=/!important/]",
            message:
              "No !important in components/ui. Tenant and dark themes are token swaps, not overrides (docs/00-AUDIT.md F-17).",
          },
          {
            selector:
              "Literal[value=/(?:^|\\s)(?:w|h|min-w|min-h|max-w|max-h|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|rounded|text|bg|border|leading|tracking)-\\[/]",
            message:
              "No arbitrary Tailwind values in components/ui. If the scale lacks the value, add a token to lib/theme/tokens.ts.",
          },
        ],
      },
    },
    {
      // lib/theme is the single place a raw colour is written down, so it is
      // exempt from the hex rule — but even tokens never need !important.
      files: ["lib/theme/**/*.ts"],
      rules: {
        "no-restricted-syntax": [
          "error",
          {
            selector: "Literal[value=/!important/]",
            message: "Tokens never need !important — specificity here is structural, not forced.",
          },
        ],
      },
    },
  ],
};
