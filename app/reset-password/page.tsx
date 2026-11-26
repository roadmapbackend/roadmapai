import type { Metadata } from "next";
import { ResetPassword } from "@/components/auth/reset-password";

export const metadata: Metadata = { title: "Choose a new password | Daari" };

export default function ResetPasswordPage() {
  return <ResetPassword />;
}
