import { ImageResponse } from "next/og";
import { getPublicStoreByHandle } from "@/lib/store-lookup";
import { resolveMerchantOgImage, SEO_SITE } from "@/lib/seo";

export const runtime = "nodejs";
/**
 * These describe the generated card, which is what this route returns when the
 * merchant has not uploaded a social image. Their own upload keeps whatever size
 * they gave it, and `generateMetadata` in `page.tsx` drops the declared
 * dimensions in that case rather than claiming 1200x630 for something else.
 */
export const alt = "Store preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

/**
 * A link preview is fetched by a crawler with a short patience, and an 8 MB hero
 * shot is not a preview card, so the merchant's upload is bounded on both ends.
 * Anything slow, non-image, oversized or broken falls through to the generated
 * card — an unpublished custom image must never cost the store its preview.
 */
const MERCHANT_IMAGE_TIMEOUT_MS = 4000;
const MAX_MERCHANT_IMAGE_BYTES = 8 * 1024 * 1024;

/*
 * Why proxy instead of pointing `og:image` straight at the uploaded file:
 * Supabase Storage answers every public object with `x-robots-tag: none`
 * (verified against the live bucket), which is enough for Facebook and WhatsApp
 * to discard the image. Streaming the bytes from our own origin drops that
 * header, pins the content type, and leaves a single URL shape to debug.
 */
async function merchantImageResponse(url: string): Promise<Response | null> {
  try {
    const upstream = await fetch(url, {
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(MERCHANT_IMAGE_TIMEOUT_MS),
    });
    if (!upstream.ok) return null;

    const contentType = (upstream.headers.get("content-type") || "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (!contentType.startsWith("image/")) return null;

    const bytes = await upstream.arrayBuffer();
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_MERCHANT_IMAGE_BYTES) return null;

    return new Response(bytes, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(bytes.byteLength),
        // The `?v=` token is the store's last write, so a replaced image is only
        // ever stale until the merchant saves the store again.
        "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return null;
  }
}

export default async function Image({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const store = await getPublicStoreByHandle(storeSlug);

  const state = store?.state || {};

  // The image the merchant set in SEO settings is the preview they expect to
  // see, so it wins over the generated card whenever it can be served.
  const merchantOgImage = resolveMerchantOgImage(state);
  if (merchantOgImage) {
    const response = await merchantImageResponse(merchantOgImage);
    if (response) return response;
  }

  const bizName = store?.bizName || "SwiftLink Store";
  const tagline = state.tagline || state.bio || "Order directly on WhatsApp";
  const location = state.location || "";
  const productCount = (state.products || []).filter((p) => p?.visible !== false).length;
  const accent = state.accentColor || "#10b981";
  /*
   * The generated card is the merchant's link preview on WhatsApp and Facebook,
   * so for a Business store it must not credit the platform: the card is the
   * first thing a customer sees, and "Powered by SwiftLink Pro" there would
   * undo the white-label storefront behind it.
   */
  const whiteLabel = store?.plan === "business";
  const hostLabel = `${SEO_SITE.replace(/^https?:\/\//, "").replace(/\/$/, "")}/${
    store?.handle || storeSlug
  }`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#09090b",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, #18181b 2%, transparent 0%), radial-gradient(circle at 75px 75px, #18181b 2%, transparent 0%)",
          backgroundSize: "100px 100px",
          color: "#f4f4f5",
          padding: "60px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                backgroundColor: accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontWeight: 900,
                color: "#04140D",
              }}
            >
              {bizName.slice(0, 1).toUpperCase()}
            </div>
            {/* A `<div>` with more than one child must declare an explicit
                `display`, or satori throws and the whole card 500s. The mixed
                text + expression here was two children: `hostLabel` is
                precomputed into one. */}
            <div
              style={{
                display: "flex",
                fontSize: 24,
                fontWeight: 700,
                color: "#a1a1aa",
                letterSpacing: 0.5,
              }}
            >
              {hostLabel}
            </div>
          </div>
          <div
            style={{
              padding: "8px 22px",
              borderRadius: 999,
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              border: `1.5px solid ${accent}`,
              color: accent,
              fontSize: 16,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            WhatsApp Store
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              maxWidth: 1000,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {bizName}
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#d4d4d8",
              lineHeight: 1.4,
              maxWidth: 900,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {tagline}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #27272a",
            paddingTop: 32,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {productCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 20, color: "#a1a1aa" }}>
                <span style={{ fontWeight: 800, color: "#ffffff" }}>{productCount}</span> Products in Catalog
              </div>
            )}
            {location && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 20, color: "#a1a1aa" }}>
                Location: <span style={{ fontWeight: 700, color: "#ffffff" }}>{location}</span>
              </div>
            )}
          </div>
          {!whiteLabel && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 18, color: "#71717a" }}>
              Powered by <span style={{ color: "#10b981", fontWeight: 800 }}>SwiftLink Pro</span>
            </div>
          )}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
