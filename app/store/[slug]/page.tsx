"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { normalizeStoreUsername } from "@/lib/utils";
import { CustomerStorefront } from "@/components/CustomerStorefront";
import { Loader2 } from "lucide-react";

function StoreNotFound({ slug, error }: { slug: string, error?: string }) {
  const isPermissionError = error?.toLowerCase().includes("permission") || error?.toLowerCase().includes("access");
  
  return (
    <main className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 px-6">
      <div className="max-w-md w-full text-center">
        <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">
          {isPermissionError ? "Database Access Denied" : "Store not found"}
        </div>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 font-medium">
          {isPermissionError 
            ? "Your Supabase RLS Rules are blocking public access. Please set your rules to allow public reads on 'slugs' and 'stores' tables."
            : `We couldn't find a SwiftLink store with the handle "${slug}".`}
        </p>
        <div className="flex flex-col gap-3 mt-8">
            <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl px-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[11px] uppercase tracking-widest shadow-xl"
            >
            Back to SwiftLink
            </Link>
        </div>
      </div>
    </main>
  );
}

function StoreResolving() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
         <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
         <div className="text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Resolving Handle…</div>
      </div>
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
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (shopFromQuery) return;
    if (!slug) {
      setStatus("not_found");
      return;
    }

    let cancelled = false;
    setStatus("resolving");
    (async () => {
      try {
        const { data, error } = await supabase
          .from('slugs')
          .select('shop_id')
          .eq('slug', slug)
          .single();

        if (cancelled) return;

        if (data?.shop_id) {
          router.replace(`/store/${slug}?shop=${encodeURIComponent(data.shop_id)}`);
          return;
        }
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is not found
           console.error("Supabase Error:", error);
           setErrorMsg(error.message);
        }
        
        setStatus("not_found");
      } catch (err: any) {
        console.error("Slug Resolution Error:", err);
        if (!cancelled) {
            setStatus("not_found");
            setErrorMsg(err.message || "Access Denied");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, shopFromQuery, slug]);

  if (shopFromQuery) return <CustomerStorefront shopId={shopFromQuery} />;
  if (status === "not_found") return <StoreNotFound slug={slug || "unknown"} error={errorMsg} />;
  return <StoreResolving />;
}
