import { promises as dns } from "node:dns";
import { NextRequest, NextResponse } from "next/server";
import { currentSessionUser, serviceClient } from "@/lib/billing-server";
import { cnameMatches, cnameTarget, normalizeDomain, verificationRecordName } from "@/lib/domains";

/**
 * Verify a custom domain.
 *
 * The merchant proves control by pointing a CNAME at the platform. This route
 * checks that from the **server**, because the browser cannot see DNS and a claim
 * made by the client is worthless: getting this wrong would let any merchant
 * serve their store on a hostname they do not own.
 *
 * Vercel is where the certificate is actually issued. When `VERCEL_TOKEN` and
 * `VERCEL_PROJECT_ID` are set, the domain is attached to the project here; when
 * they are not, verification still succeeds and the response says plainly that
 * the hosting side is not linked yet. Reporting a certificate that was never
 * requested would be worse than saying so.
 */

export const runtime = "nodejs";

type AttachResult = { attached: boolean; message: string };

async function attachToVercel(domain: string): Promise<AttachResult> {
  const token = process.env.VERCEL_TOKEN?.trim();
  const projectId = process.env.VERCEL_PROJECT_ID?.trim();
  if (!token || !projectId) {
    return {
      attached: false,
      message:
        "DNS is correct. The platform certificate is issued when the hostname is added to the hosting project (set VERCEL_TOKEN and VERCEL_PROJECT_ID to automate this).",
    };
  }

  const teamId = process.env.VERCEL_TEAM_ID?.trim();
  const url = new URL(`https://api.vercel.com/v10/projects/${projectId}/domains`);
  if (teamId) url.searchParams.set("teamId", teamId);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: domain }),
    });
    const payload = (await response.json().catch(() => null)) as
      | { error?: { code?: string; message?: string } }
      | null;

    // Already attached is success for this purpose: the certificate exists or is
    // being issued, and a retry should not look like a failure.
    if (response.ok || payload?.error?.code === "domain_already_in_use" || payload?.error?.code === "domain_exists") {
      return { attached: true, message: "Verified. The certificate is being issued." };
    }
    return {
      attached: false,
      message:
        payload?.error?.message ||
        "DNS is correct, but the hostname could not be added to the hosting project.",
    };
  } catch (error) {
    return {
      attached: false,
      message:
        error instanceof Error
          ? `DNS is correct; hosting said: ${error.message}`
          : "DNS is correct, but the hosting API could not be reached.",
    };
  }
}

export async function POST(request: NextRequest) {
  const user = await currentSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { domain?: unknown } | null;
  const domain = normalizeDomain(typeof body?.domain === "string" ? body.domain : "");
  if (!domain) {
    return NextResponse.json({ error: "That is not a valid domain." }, { status: 400 });
  }

  const db = serviceClient();
  if (!db) {
    return NextResponse.json({ error: "Domains are not configured." }, { status: 503 });
  }

  const { data: row, error } = await db
    .from("store_domains")
    .select("id, domain, verification_token, verified_at")
    .eq("domain", domain)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "Add that domain first." }, { status: 404 });

  // ── DNS: the CNAME is the proof of control ────────────────────────────────
  let answers: string[] = [];
  try {
    answers = await dns.resolveCname(domain);
  } catch (lookupError) {
    const code = (lookupError as NodeJS.ErrnoException)?.code;
    if (code === "ENOTFOUND" || code === "ENODATA") {
      // A flattened/proxied record answers with A records instead of a CNAME.
      const hasAddresses = await dns.resolve4(domain).then(
        (list) => list.length > 0,
        () => false,
      );
      return NextResponse.json(
        {
          verified: false,
          error: hasAddresses
            ? `That domain resolves, but not with a CNAME. If your DNS provider proxies the record (Cloudflare orange cloud), turn proxying off so the CNAME to ${cnameTarget()} is visible.`
            : `No CNAME found yet. Create one pointing ${domain} at ${cnameTarget()}, then verify again — DNS changes can take a few minutes.`,
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { verified: false, error: `Could not read DNS for ${domain}: ${code ?? "unknown error"}` },
      { status: 502 },
    );
  }

  if (!cnameMatches(answers)) {
    return NextResponse.json(
      {
        verified: false,
        error: `Found ${answers.join(", ")}, but it must point at ${cnameTarget()}.`,
      },
      { status: 409 },
    );
  }

  const attach = await attachToVercel(domain);

  const { error: updateError } = await db
    .from("store_domains")
    .update({
      verified_at: new Date().toISOString(),
      ssl_status: attach.attached ? "pending" : "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    verified: true,
    attached: attach.attached,
    message: attach.attached
      ? "Verified. Your store is live on this domain once the certificate is issued."
      : attach.message,
    txtRecord: { name: verificationRecordName(domain), value: row.verification_token },
  });
}
