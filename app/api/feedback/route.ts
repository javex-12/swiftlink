import { NextRequest, NextResponse } from "next/server";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "Expected JSON object." }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const message = typeof record.message === "string" ? record.message.trim() : "";
  const email = typeof record.email === "string" ? record.email.trim() : "";

  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { ok: false, error: `Message must be between 1 and ${MAX_MESSAGE_LENGTH} characters.` },
      { status: 400 },
    );
  }

  if (email && (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email))) {
    return NextResponse.json({ ok: false, error: "Invalid email address." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
