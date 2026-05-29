"use client";

import { CustomerStorefront } from "@/components/CustomerStorefront";

export function CustomerStorefrontPage({ shopId }: { shopId: string }) {
  return <CustomerStorefront shopId={shopId} />;
}
