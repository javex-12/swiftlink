"use client";

import { CustomerStorefront } from "@/components/CustomerStorefront";
import { useParams } from "next/navigation";

export default function StorePage() {
  const params = useParams<{ shopId: string }>();
  return <CustomerStorefront shopId={params.shopId} />;
}
