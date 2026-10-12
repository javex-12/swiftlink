import { ImageResponse } from "next/og";
import { getPublicStoreByHandle } from "@/lib/store-lookup";
import { SEO_SITE } from "@/lib/seo";

export const runtime = "nodejs";
export const alt = "Store preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const store = await getPublicStoreByHandle(storeSlug);

  const bizName = store?.bizName || "SwiftLink Store";
  const state = store?.state || {};
  const tagline = state.tagline || state.bio || "Order directly on WhatsApp";
  const location = state.location || "";
  const productCount = (state.products || []).filter((p) => p?.visible !== false).length;
  const accent = state.accentColor || "#10b981";
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
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 18, color: "#71717a" }}>
            Powered by <span style={{ color: "#10b981", fontWeight: 800 }}>SwiftLink Pro</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
