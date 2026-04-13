import { Suspense } from "react";
import { HomeClient } from "@/components/HomeClient";
import { ProLayout } from "@/components/ProLayout";
import { LauncherView } from "@/components/LauncherView";

export default function ProPage() {
  return (
    <ProLayout>
      <Suspense fallback={null}>
        <LauncherView />
      </Suspense>
    </ProLayout>
  );
}
