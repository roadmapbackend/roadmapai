"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AFTER_SIGN_IN } from "@/lib/auth-redirect";
import { explainAuthError } from "@/lib/auth-errors";
import { AuthError, AuthShell, AuthSubmit, AuthTitle, PasswordField, authLink, type AuthStop } from "@/components/auth/auth-shell";
import { showTelemetryToast } from "@/components/ui/telemetry-toast";
import { Loader2 } from "@/components/ui/icons";

const STOPS: AuthStop[] = [
  { label: "Forgot password", note: "Link sent", state: "done" },
  { label: "Open the link in your email", note: "Done", state: "done" },
  { label: "Choose a new password", note: "You are here", state: "here" },
];

export function ResetPassword() {
  const router = useRouter();
  // The link in the email signs the person in, so a session is what proves it was theirs
  const [access, setAccess] = useState<"checking" | "ok" | "none">("checking");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    createClient()
      .auth.getUser()
      .then(({ data }) => active && setAccess(data.user ? "ok" : "none"))
      .catch(() => active && setAccess("none"));
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { error } = await createClient().auth.updateUser({ password });
      if (error) throw error;
      showTelemetryToast({ type: "success", title: "Password changed", message: "Use the new one from now on." });
      router.push(AFTER_SIGN_IN);
      router.refresh();
    } catch (err) {
      setError(explainAuthError(err));
      setBusy(false);
    }
  };

  if (access === "none") {
    return (
      <AuthShell stops={[STOPS[0], { ...STOPS[1], note: "The link didn't work", state: "here" }, { ...STOPS[2], note: "Then you are back in", state: "next" }]}>
        <AuthTitle>This link didn&rsquo;t work</AuthTitle>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          It may have expired or been used already. Links also have to be opened in the browser you asked from.
        </p>
        <p className="mt-6 text-sm">
          <Link href="/forgot-password" className={authLink}>
            Send a new link
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell stops={STOPS}>
      <AuthTitle>Choose a new password</AuthTitle>
      {access === "checking" ? (
        <p className="mt-8 flex items-center gap-2.5 text-base text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-orange-500" />
          Checking your link
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <PasswordField label="New password" value={password} onChange={setPassword} isNew />
          <AuthError message={error} />
          <AuthSubmit busy={busy} label="Save password" busyLabel="Saving" />
        </form>
      )}
    </AuthShell>
  );
}
