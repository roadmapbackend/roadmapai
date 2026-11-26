"use client";

import React from "react";
import { DaariWordmark } from "@/components/daari-wordmark";

export function SiteFooter() {
  return (
    <footer className="w-full bg-card dark:bg-[#08090b] text-foreground border-t border-border/60 dark:border-white/10 relative overflow-hidden select-none font-sans z-10">
      {/* Subtle Background Radial Glow */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-gradient-to-t from-orange-500/[0.04] via-transparent to-transparent blur-[140px]" />

      <div className="max-w-[1340px] mx-auto px-6 sm:px-10 lg:px-12 pt-12 sm:pt-14 pb-8 sm:pb-10 relative z-10 flex flex-col items-center justify-between">
        {/* Social Channels: X (Twitter) and Instagram */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {/* X / Twitter */}
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow Daari on X"
            className="size-10 rounded-xl bg-black/[0.03] hover:bg-black/[0.07] text-zinc-600 hover:text-zinc-950 border border-black/10 hover:border-black/25 dark:bg-white/[0.04] dark:hover:bg-white/[0.1] dark:text-zinc-300 dark:hover:text-white dark:border-white/10 dark:hover:border-white/25 flex items-center justify-center transition-all group cursor-pointer"
          >
            <svg className="size-4 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>

          {/* Instagram */}
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow Daari on Instagram"
            className="size-10 rounded-xl bg-black/[0.03] hover:bg-black/[0.07] text-zinc-600 hover:text-zinc-950 border border-black/10 hover:border-black/25 dark:bg-white/[0.04] dark:hover:bg-white/[0.1] dark:text-zinc-300 dark:hover:text-white dark:border-white/10 dark:hover:border-white/25 flex items-center justify-center transition-all group cursor-pointer"
          >
            <svg className="size-4.5 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>
        </div>

        {/* Iconic Sui-Style Massive Brand Emblem & Fully Visible Wordmark */}
        <div className="w-full pt-4 pb-6 flex flex-col items-center justify-center relative group">
          {/* Center Official Brand Emblem / Logo (Large with subtle aura) */}
          <div className="relative mb-3 flex items-center justify-center">
            {/* Ambient Aura behind logo */}
            <div className="absolute inset-0 rounded-full bg-orange-500/20 blur-2xl scale-150 pointer-events-none" />

            {/* Light Mode Emblem */}
            <img
              src="/images/logo-light.png"
              alt="Daari Logo"
              className="size-16 sm:size-20 md:size-24 object-contain block dark:hidden relative z-10 transition-transform duration-500 group-hover:scale-105"
            />
            {/* Dark Mode Emblem */}
            <img
              src="/images/logo-dark.png"
              alt="Daari Logo"
              className="size-16 sm:size-20 md:size-24 object-contain hidden dark:block relative z-10 transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          {/* Perfectly Sized Full-Width Sculptural Typographic Anchor - Completely Seen */}
          <div className="w-full max-w-full text-center overflow-hidden px-2">
            <DaariWordmark
              className="mx-auto h-auto w-full max-w-3xl overflow-visible"
              lettersClassName="text-zinc-200 dark:text-zinc-800 transition-colors duration-500 group-hover:text-zinc-300 dark:group-hover:text-zinc-700"
              accentClassName="text-orange-200 dark:text-orange-900 transition-colors duration-500 group-hover:text-orange-300 dark:group-hover:text-orange-800"
            />
          </div>
        </div>

        {/* Bottom Legal Bar - Clean & Centered Copyright */}
        <div className="w-full pt-6 border-t border-border/40 dark:border-white/10 flex items-center justify-center text-[11px] font-mono tracking-wider uppercase text-zinc-600 dark:text-zinc-500 text-center">
          <div>
            © {new Date().getFullYear()} DAARI. ALL RIGHTS RESERVED.
          </div>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
