import type { Metadata } from "next";
import { UsagePage } from "@/components/usage/usage-page";

export const metadata: Metadata = { title: "Usage | Daari" };

export default function BillingPage() {
  return <UsagePage />;
}
