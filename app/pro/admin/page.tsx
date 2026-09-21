import { ProLayout } from "@/components/ProLayout";
import { AdminView } from "@/components/AdminView";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/supabase/server";

/**
 * Server-side admin gate. Middleware already blocks this path for non-admins;
 * this is defence in depth so the console never renders for a non-admin even if
 * the matcher changes (docs/00-AUDIT.md F-01/F-06).
 */
export default async function AdminPage() {
  await requireAdmin();

  return (
    <ProLayout>
      <Suspense
        fallback={
          <div className="flex-1 flex flex-col items-center justify-center p-12 min-h-[60vh]">
            <div className="animate-spin text-emerald-500 w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Loading Command Center...
            </p>
          </div>
        }
      >
        <AdminView />
      </Suspense>
    </ProLayout>
  );
}
