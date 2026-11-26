"use client";

import React, { Suspense, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { safeRedirect } from "@/lib/auth-redirect";
import { PENDING_PATH_KEY, type PathPreset } from "@/components/create-roadmap-dialog";
import { explainAuthError } from "@/lib/auth-errors";
import {
  AuthError,
  AuthField,
  AuthShell,
  AuthSubmit,
  AuthTitle,
  PasswordField,
  authLink,
  type AuthStop,
} from "@/components/auth/auth-shell";
import { Loader2 } from "@/components/ui/icons";

type Mode = "login" | "signup";

const COPY = {
  login: {
    title: "Sign in",
    submit: "Sign in",
    busy: "Signing in",
    switchText: "New to Daari?",
    switchLink: "Create an account",
    switchHref: "/signup",
  },
  signup: {
    title: "Create your account",
    submit: "Create account",
    busy: "Creating your account",
    switchText: "Already have an account?",
    switchLink: "Sign in",
    switchHref: "/login",
  },
} as const;

const noSubscription = () => () => {};

/** What the visitor typed on the home page before being asked to sign in */
function usePendingPath(): PathPreset | null {
  const raw = useSyncExternalStore(
    noSubscription,
    () => {
      try {
        return sessionStorage.getItem(PENDING_PATH_KEY);
      } catch {
        return null;
      }
    },
    () => null
  );
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function AuthContent({ mode }: { mode: Mode }) {
  const copy = COPY[mode];
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get("redirectedFrom");
  const target = safeRedirect(requested);
  const pending = usePendingPath();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"form" | "google" | null>(null);
  const [checkInbox, setCheckInbox] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "auth_callback_failed"
      ? "That sign-in link didn't work. It may have expired, so please try again."
      : null
  );

  const callbackUrl = () => `${window.location.origin}/auth/callback?redirectedFrom=${encodeURIComponent(target)}`;
  const switchHref = `${copy.switchHref}${requested ? `?redirectedFrom=${encodeURIComponent(target)}` : ""}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy("form");
    setError(null);
    const { auth } = createClient();

    try {
      if (mode === "login") {
        const { error } = await auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName.trim() }, emailRedirectTo: callbackUrl() },
        });
        if (error) throw error;
        // Supabase answers "success" for a known email, but without any identity
        if (data.user?.identities?.length === 0) throw { code: "user_already_exists" };
        if (!data.session) {
          setCheckInbox(true);
          setBusy(null);
          return;
        }
      }
      // Stays busy until the next page takes over
      router.push(target);
      router.refresh();
    } catch (err) {
      setError(explainAuthError(err));
      setBusy(null);
    }
  };

  const handleGoogle = async () => {
    if (busy) return;
    setBusy("google");
    setError(null);
    try {
      const { error } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl(),
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(explainAuthError(err));
      setBusy(null);
    }
  };

  return (
    <AuthShell stops={stopsFor(mode, pending)}>
      {checkInbox ? (
        <div role="status">
          <AuthTitle>Check your email</AuthTitle>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            We sent a link to <span className="font-semibold text-foreground">{email}</span>. Open it to finish creating your
            account.
          </p>
          <button type="button" onClick={() => setCheckInbox(false)} className={`mt-6 text-sm cursor-pointer ${authLink}`}>
            Use a different email
          </button>
        </div>
      ) : (
        <>
          <AuthTitle>{copy.title}</AuthTitle>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy !== null}
            className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-full border border-border bg-card text-base font-semibold transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:opacity-60 cursor-pointer disabled:cursor-default"
          >
            {busy === "google" ? <Loader2 className="size-4 animate-spin" /> : <GoogleMark />}
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or with email
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <AuthField label="Your name" name="name" autoComplete="name" value={fullName} onChange={setFullName} />
            )}
            <AuthField label="Email" name="email" type="email" autoComplete="email" value={email} onChange={setEmail} />
            <PasswordField
              label="Password"
              value={password}
              onChange={setPassword}
              isNew={mode === "signup"}
              aside={
                mode === "login" && (
                  <Link href="/forgot-password" className={authLink}>
                    Forgot password?
                  </Link>
                )
              }
            />
            <AuthError message={error} />
            <AuthSubmit busy={busy === "form"} disabled={busy !== null} label={copy.submit} busyLabel={copy.busy} />
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
            {copy.switchText}{" "}
            <Link href={switchHref} className={authLink}>
              {copy.switchLink}
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}

function stopsFor(mode: Mode, pending: PathPreset | null): AuthStop[] {
  const here: AuthStop = { label: COPY[mode].title, note: "You are here", state: "here" };
  const last: AuthStop = { label: "Take one topic at a time", note: "And prove it to yourself", state: "next" };
  if (pending?.subject) {
    const time = pending.days ? `${pending.days} days, ${pending.hours ?? 2} hours a day. ` : "";
    return [
      { label: pending.subject, note: `${time}Kept for you.`, state: "done" },
      here,
      { label: "See the whole way", note: "Daari lays out the days", state: "next" },
      last,
    ];
  }
  return mode === "login"
    ? [here, { label: "Pick up where you stopped", note: "Your paths are in the Studio", state: "next" }, last]
    : [here, { label: "Say where you want to get to", note: "Any subject, at any pace", state: "next" }, last];
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

export function AuthPage({ mode }: { mode: Mode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="size-7 animate-spin text-orange-500" />
        </div>
      }
    >
      <AuthContent mode={mode} />
    </Suspense>
  );
}
