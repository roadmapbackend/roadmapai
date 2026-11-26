"use client";

import React, { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { explainAuthError } from "@/lib/auth-errors";
import { AuthError, AuthField, AuthShell, AuthSubmit, AuthTitle, authLink, type AuthStop } from "@/components/auth/auth-shell";

const STOPS: AuthStop[] = [
  { label: "Forgot password", note: "You are here", state: "here" },
  { label: "Open the link in your email", note: "Use this same browser", state: "next" },
  { label: "Choose a new password", note: "Then you are back in", state: "next" },
];

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { error } = await createClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?redirectedFrom=${encodeURIComponent("/reset-password")}`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(explainAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const stops: AuthStop[] = sent
    ? [{ ...STOPS[0], note: "Link sent", state: "done" }, { ...STOPS[1], note: "You are here", state: "here" }, STOPS[2]]
    : STOPS;

  return (
    <AuthShell stops={stops}>
      {sent ? (
        <div role="status">
          <AuthTitle>Check your email</AuthTitle>
          {/* Never says whether the account exists */}
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            If there is an account for <span className="font-semibold text-foreground">{email}</span>, a link is on its way.
            Open it in this browser to choose a new password.
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Nothing after a few minutes? Look in your spam folder. If you joined with Google, you don&rsquo;t need a password.
          </p>
          <p className="mt-6 flex gap-6 text-sm">
            <button type="button" onClick={() => setSent(false)} className={`cursor-pointer ${authLink}`}>
              Try again
            </button>
            <Link href="/login" className={authLink}>
              Back to sign in
            </Link>
          </p>
        </div>
      ) : (
        <>
          <AuthTitle>Forgot your password?</AuthTitle>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Enter your email and we&rsquo;ll send a link to choose a new one.
          </p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <AuthField label="Email" name="email" type="email" autoComplete="email" value={email} onChange={setEmail} />
            <AuthError message={error} />
            <AuthSubmit busy={busy} label="Send the link" busyLabel="Sending" />
          </form>
          <p className="mt-6 text-sm text-muted-foreground">
            Remembered it?{" "}
            <Link href="/login" className={authLink}>
              Sign in
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
