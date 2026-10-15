"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setOauthLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || "Google sign-in failed.");
      setOauthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col justify-center items-center px-6 py-12 selection:bg-indigo-500 selection:text-white font-sans">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/25">
              R
            </div>
            <span className="font-bold text-2xl tracking-tight text-white">Roadmap.ai</span>
          </Link>
          <h2 className="text-xl font-semibold text-white mt-4">Welcome Back</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Sign in to access your personalized learning roadmaps
          </p>
        </div>

        {/* Card Container */}
        <div className="p-8 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-2xl backdrop-blur-xl">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed">
              {errorMsg}
            </div>
          )}

          {/* Primary Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={oauthLoading}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            {oauthLoading ? (
              <span className="h-4 w-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <span className="relative bg-zinc-900 px-3 text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
              Or sign in with email
            </span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                "Sign In with Email"
              )}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-zinc-400 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-indigo-400 hover:underline font-semibold">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
