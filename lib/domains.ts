/**
 * Custom-domain rules, shared by the settings UI, the verification route and the
 * routing layer.
 *
 * A hostname is normalised once, here, so `Shop.Example.com/` and
 * `shop.example.com` are the same domain everywhere — in the database, in the
 * CNAME instructions and in the middleware lookup. Anything that cannot be a
 * hostname (a scheme, a path, a bare label, an IP literal) is rejected rather
 * than stored and quietly failing to resolve later.
 */

/**
 * The host merchants' CNAMEs point at.
 *
 * Vercel's own documented target, not a vanity host of ours: `cname.swiftlink.pro`
 * would only work if that subdomain existed and pointed at Vercel, which means
 * owning a domain we do not need to own. `cname.vercel-dns.com` is the address
 * Vercel tells us to ask for on every custom domain, so a merchant can set the
 * record the moment they add the domain, with no extra DNS on our side.
 */
export function cnameTarget(): string {
  return (process.env.NEXT_PUBLIC_CNAME_TARGET || "cname.vercel-dns.com")
    .trim()
    .toLowerCase()
    .replace(/\.$/, "");
}

/** The TXT record name that carries the per-domain verification token. */
export function verificationRecordName(domain: string): string {
  return `_swiftlink-verify.${normalizeDomain(domain) ?? domain}`;
}

/**
 * Normalise user input into a bare hostname, or null when it is not one.
 *
 * Accepts what people actually paste — `https://shop.example.com/`, `www.x.com`,
 * a trailing dot — and returns `shop.example.com` / `x.com`.
 */
export function normalizeDomain(input: string | null | undefined): string | null {
  if (typeof input !== "string") return null;

  let value = input.trim().toLowerCase();
  if (!value) return null;

  // Strip a scheme and any path/query/fragment.
  value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
  value = value.split("/")[0].split("?")[0].split("#")[0];
  value = value.split(":")[0]; // port
  value = value.replace(/\.$/, ""); // absolute DNS name
  value = value.replace(/^www\./, "");

  if (!value || value.length > 253) return null;
  // At least two labels, each 1–63 chars, letters/digits/hyphens, no edge hyphen.
  const labels = value.split(".");
  if (labels.length < 2) return null;
  const labelOk = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
  if (!labels.every((label) => labelOk.test(label))) return null;

  // An IP literal is not a custom domain.
  if (/^\d+\.\d+\.\d+\.\d+$/.test(value)) return null;

  // The platform's own hostnames belong to us, not to a merchant.
  const target = cnameTarget();
  if (value === target || value.endsWith(`.${target}`)) return null;
  if (value.endsWith(".vercel.app") || value.endsWith(".supabase.co")) return null;

  return value;
}

/** Why a value was refused, for the form. Null when it is acceptable. */
export function domainProblem(input: string | null | undefined): string | null {
  if (!input || !input.trim()) return "Enter a domain, for example shop.yourbrand.com";
  if (!normalizeDomain(input)) {
    return "That is not a hostname. Enter just the domain, like shop.yourbrand.com — no https://, no path.";
  }
  return null;
}

/**
 * Whether a CNAME answer points at us.
 *
 * DNS answers carry a trailing dot and are case-insensitive, and a provider may
 * flatten the record into A records (Cloudflare's "proxied" mode does), which no
 * CNAME check can see — the caller is told to turn proxying off instead of being
 * left with a permanently unverifiable record.
 */
export function cnameMatches(answers: readonly string[], target = cnameTarget()): boolean {
  const normalizedTarget = target.toLowerCase().replace(/\.$/, "");
  return answers.some((answer) => {
    const value = String(answer).toLowerCase().replace(/\.$/, "");
    return value === normalizedTarget || value.endsWith(`.${normalizedTarget}`);
  });
}

/** What the merchant must create at their DNS provider. */
export function dnsInstructions(domain: string): { type: string; name: string; value: string }[] {
  const host = normalizeDomain(domain) ?? domain;
  return [
    { type: "CNAME", name: host, value: cnameTarget() },
    // Optional ownership proof; the CNAME itself is the primary check.
    { type: "TXT", name: verificationRecordName(host), value: "the token shown here" },
  ];
}
