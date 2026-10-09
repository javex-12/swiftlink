import { NextResponse } from "next/server";

/**
 * Client error sink.
 *
 * Receives the payload from `lib/error-report.ts` and emits it as one structured
 * log line so it is searchable in the host's log viewer. Excluded from
 * `middleware.ts`: reporting must not depend on the auth stack, and it must not
 * be slowed down by a session refresh.
 *
 * This is deliberately a log sink rather than a store. It answers "did something
 * break for a real user, and where?" — which is the question that has been
 * unanswerable. Choosing a hosted error tracker later means forwarding this line
 * rather than re-instrumenting the app.
 */

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Cap the accepted body so an errant client cannot post a megabyte of stack. */
const MAX_BODY_BYTES = 16 * 1024;

function str(value: unknown, max: number): string | undefined {
  return typeof value === "string" && value.trim() ? value.slice(0, max) : undefined;
}

export async function POST(request: Request) {
  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  if (raw.length > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 413 });
  }

  let report: Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return new NextResponse(null, { status: 400 });
    }
    report = parsed as Record<string, unknown>;
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const context =
    report.context && typeof report.context === "object" && !Array.isArray(report.context)
      ? (report.context as Record<string, unknown>)
      : undefined;

  // One line, prefixed so it can be filtered apart from ordinary server errors.
  console.error(
    JSON.stringify({
      tag: "client-error",
      message: str(report.message, 800) ?? "unknown",
      name: str(report.name, 80),
      url: str(report.url, 500),
      stack: str(report.stack, 4000),
      userAgent: str(report.userAgent, 300),
      clientTimestamp: str(report.timestamp, 40),
      context,
      receivedAt: new Date().toISOString(),
    }),
  );

  // 204: the client needs no body and must not wait on one.
  return new NextResponse(null, { status: 204 });
}
