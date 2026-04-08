import { Suspense } from "react";
import { HomeClient } from "@/components/HomeClient";

export default function ProPage() {
  return (
    <Suspense fallback={null}>
      <HomeClient defaultView="launcher" />
    </Suspense>
  );
}