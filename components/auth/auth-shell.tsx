"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2 } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface AuthStop {
  label: string;
  note: string;
  state: "done" | "here" | "next";
}

/** The layout of every account page: where you are on the path, and the form beside it */
export function AuthShell({ stops, children }: { stops: AuthStop[]; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans transition-colors duration-200">
      <main className="mx-auto grid w-full max-w-5xl flex-1 content-center items-center gap-16 px-6 pb-16 pt-40 sm:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-24 lg:pt-32">
        <ol aria-label="Your path so far" className="hidden lg:block">
          {stops.map((stop, i) => (
            <li
              key={stop.label}
              aria-current={stop.state === "here" ? "step" : undefined}
              className="relative pb-14 pl-12 last:pb-0"
            >
              {i < stops.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute -bottom-2 left-[11px] top-2 w-0.5",
                    stop.state === "done" ? "bg-saffron" : "bg-foreground/15"
                  )}
                />
              )}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-1 top-1.5 size-4 rounded-full border-[3px] bg-background",
                  stop.state === "done" && "border-saffron bg-saffron",
                  stop.state === "here" &&
                    "border-saffron shadow-[0_0_0_6px_color-mix(in_oklab,var(--saffron)_22%,transparent)]",
                  stop.state === "next" && "border-foreground/25"
                )}
              />
              <p
                className={cn(
                  "break-words text-2xl font-bold leading-snug tracking-tight",
                  stop.state === "next" ? "text-muted-foreground" : "text-foreground"
                )}
              >
                {stop.label}
              </p>
              <p className="mt-1 text-base text-muted-foreground">{stop.note}</p>
            </li>
          ))}
        </ol>

        <div className="w-full max-w-md lg:max-w-none">{children}</div>
      </main>
    </div>
  );
}

export function AuthTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="text-3xl font-bold tracking-tight [word-spacing:0.12em]">{children}</h1>;
}

interface FieldProps {
  label: string;
  name: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email";
}

export function AuthField({ label, name, autoComplete, value, onChange, type = "text" }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      <Input
        type={type}
        name={name}
        autoComplete={autoComplete}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 bg-card! text-base!"
      />
    </label>
  );
}

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** A password being chosen rather than entered */
  isNew?: boolean;
  /** Shown at the end of the label row */
  aside?: React.ReactNode;
}

export function PasswordField({ label, value, onChange, isNew, aside }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-4 text-sm">
        <label htmlFor="password" className="font-semibold">
          {label}
        </label>
        {aside}
      </div>
      <div className="relative">
        <Input
          id="password"
          type={visible ? "text" : "password"}
          name="password"
          autoComplete={isNew ? "new-password" : "current-password"}
          required
          minLength={isNew ? 6 : undefined}
          aria-describedby={isNew ? "password-help" : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 bg-card! pr-20! text-base!"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-1 right-1 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {isNew && (
        <p id="password-help" className="mt-1.5 text-sm text-muted-foreground">
          At least 6 characters.
        </p>
      )}
    </div>
  );
}

export function AuthError({ message }: { message: string | null }) {
  return (
    <div aria-live="polite">
      {message && (
        <p className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm leading-relaxed text-rose-700 dark:text-rose-300">
          {message}
        </p>
      )}
    </div>
  );
}

export function AuthSubmit({ busy, disabled, label, busyLabel }: { busy: boolean; disabled?: boolean; label: string; busyLabel: string }) {
  return (
    <button
      type="submit"
      disabled={busy || disabled}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-orange-500 text-base font-semibold text-black transition-colors hover:bg-orange-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:opacity-70 cursor-pointer disabled:cursor-default"
    >
      {busy ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {busyLabel}
        </>
      ) : (
        <>
          {label}
          <ArrowRight className="size-4" />
        </>
      )}
    </button>
  );
}

export const authLink =
  "font-semibold text-foreground underline underline-offset-4 hover:text-orange-600 dark:hover:text-orange-400";
