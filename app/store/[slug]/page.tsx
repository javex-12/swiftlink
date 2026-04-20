"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase-client";
import { normalizeStoreUsername } from "@/lib/utils";
import { CustomerStorefront } from "@/components/CustomerStorefront";

function StoreNotFound({ slug }: { slug: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="max-w-md w-full text-center">
        <div className="text-2xl font-black text-slate-900 tracking-tight">
          Store not found
        </div>
        <p className="mt-3 text-sm text-slate-500 font-medium">
          We couldn&apos;t find a SwiftLink store with the handle{" "}
          <span className="font-black text-slate-800">{slug}</span>.
        </p>
        <Link
          href="/"
          className="inline-flex mt-6 items-center justify-center rounded-2xl px-6 py-3 bg-slate-900 text-white font-black text-sm"
        >
          Back to SwiftLink
        </Link>
      </div>
    </main>
  );
}

function StoreResolving() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-slate-500 font-bold text-sm">Loading store…</div>
    </main>
  );
}

export default function StoreByHandlePage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();

  const shopFromQuery = searchParams.get("shop");
  const slug = useMemo(
    () => normalizeStoreUsername(String(params?.slug || "")),
    [params?.slug],
  );

  const [status, setStatus] = useState<"idle" | "resolving" | "not_found">(
    shopFromQuery ? "idle" : "resolving",
  );

  useEffect(() => {
    if (shopFromQuery) return;
    if (!slug) {
      setStatus("not_found");
      return;
    }
    const { db } = getFirebase();
    if (!db) {
      setStatus("not_found");
      return;
    }

    let cancelled = false;
    setStatus("resolving");
    (async () => {
      const snap = await getDoc(doc(db, "swiftlink_slugs", slug));
      const shopId = snap.exists() ? (snap.data() as any)?.shopId : null;
      if (cancelled) return;
      if (shopId) {
        router.replace(`/store/${slug}?shop=${encodeURIComponent(shopId)}`);
        return;
      }
      setStatus("not_found");
    })().catch(() => {
      if (!cancelled) setStatus("not_found");
    });

    return () => {
      cancelled = true;
    };
  }, [router, shopFromQuery, slug]);

  if (shopFromQuery) return <CustomerStorefront shopId={shopFromQuery} />;
  if (status === "not_found") return <StoreNotFound slug={slug || "unknown"} />;
  return <StoreResolving />;
}
