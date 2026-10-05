import { Suspense } from "react";
import { ProLayout } from "@/components/ProLayout";
import { OverviewView } from "@/components/dashboard/OverviewView";

export default function ProPage() {
  return (
    <ProLayout>
      <Suspense fallback={null}>
        <OverviewView />
      </Suspense>
    </ProLayout>
  );
}
