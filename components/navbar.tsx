"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { ArrowUpRight, Plus } from "@/components/ui/icons";
import { DaariWordmarkSmall } from "@/components/daari-wordmark";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import { usePageTransition } from "@/components/page-transition";
import { useLenis } from "@/components/smooth-scroll";
import { startPath } from "@/components/create-roadmap-dialog";
import { isInternalNavigation, markInternalNavigation } from "@/lib/navigation-tracker";

export interface NavbarProps {
  currentUser?: any;
  onOpenDeployModal?: () => void;
  onSignOut?: () => void;
}

export function Navbar({
  currentUser: propsUser,
  onOpenDeployModal,
  onSignOut,
}: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { transitionTo } = usePageTransition();
  const lenis = useLenis();
  const supabase = createClient();
  const [internalUser, setInternalUser] = useState<any>(propsUser ?? null);
  const [overDarkHero, setOverDarkHero] = useState(false);

  // The home hero and agents band are dark in both themes. While the navigation sits on it, use the
  // dark-theme styling so the boxes contrast with what is behind them.
  useEffect(() => {
    if (pathname !== "/") return;
    const update = () => {
      // Any band marked data-nav-dark (the opening map, the agents band) that sits under the bar
      const bands = document.querySelectorAll<HTMLElement>("[data-nav-dark]");
      setOverDarkHero(
        Array.from(bands).some((el) => {
          const r = el.getBoundingClientRect();
          return r.top <= 40 && r.bottom > 60;
        })
      );
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname]);
  const invertNav = pathname === "/" && overDarkHero;

  const [navVisible, setNavVisible] = useState(() => {
    if (pathname !== "/") return true;
    if (isInternalNavigation()) return true;
    return false;
  });

  useEffect(() => {
    if (pathname !== "/" || isInternalNavigation()) {
      setNavVisible(true);
      return;
    }

    const handleReveal = () => setNavVisible(true);
    const handleReplay = () => setNavVisible(false);

    window.addEventListener("roadmap-reveal-start", handleReveal);
    window.addEventListener("roadmap-replay-site-intro", handleReplay);

    return () => {
      window.removeEventListener("roadmap-reveal-start", handleReveal);
      window.removeEventListener("roadmap-replay-site-intro", handleReplay);
    };
  }, [pathname]);

  const handleBrandClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(0, { duration: 1.2 });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      if (window.location.hash) {
        window.history.pushState(null, "", "/");
      }
    } else {
      e.preventDefault();
      markInternalNavigation();
      transitionTo("/");
    }
  };

  const handleCurriculaClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (pathname === "/") {
      const portfolio = document.getElementById("portfolio");
      if (portfolio) {
        if (lenis) {
          lenis.scrollTo(portfolio, { offset: -60, duration: 1.0 });
        } else {
          portfolio.scrollIntoView({ behavior: "smooth" });
        }
        window.history.pushState(null, "", "/#portfolio");
      }
    } else {
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("roadmap_target_anchor", "portfolio");
        } catch {
          // non-fatal
        }
      }
      transitionTo("/#portfolio");
    }
  };

  const handleQuotaClick = (e: React.MouseEvent) => {
    if (pathname === "/billing") {
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(0, { duration: 1.0 });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      e.preventDefault();
      transitionTo("/billing");
    }
  };

  const handleStudioClick = (e: React.MouseEvent) => {
    if (pathname === "/studio") {
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(0, { duration: 1.0 });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      e.preventDefault();
      transitionTo("/studio");
    }
  };

  // Self-contained auth detection if currentUser is not passed explicitly
  useEffect(() => {
    if (propsUser !== undefined) {
      setInternalUser(propsUser);
      return;
    }

    let isMounted = true;
    async function checkAuth() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (isMounted) setInternalUser(user);
      } catch {
        // non-fatal
      }
    }
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (isMounted) setInternalUser(session?.user ?? null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("roadmap-auth-state-changed", { detail: { event, session } })
        );
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [propsUser, supabase]);

  const handleSignOut = async () => {
    if (onSignOut) {
      onSignOut();
      return;
    }
    try {
      await supabase.auth.signOut();
      setInternalUser(null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("roadmap-auth-state-changed", { detail: { event: "SIGNED_OUT" } })
        );
      }
      transitionTo("/");
      router.refresh();
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const handleDeployClick = () => {
    if (onOpenDeployModal) {
      onOpenDeployModal();
      return;
    }
    startPath();
  };

  return (
    <div className={invertNav ? "dark contents" : "contents"}>
      {/* Left Wing: Vertical formation sticking to the left (No horizontal dividing line) */}
      <nav
        aria-label="Primary Navigation"
        className={`fixed top-5 left-5 sm:top-6 sm:left-8 z-50 flex flex-col items-start gap-1.5 font-mono text-xs select-none transition-opacity duration-700 ease-out ${
          navVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Brandmark */}
        <Link
          href="/"
          onClick={handleBrandClick}
          className="inline-flex items-center justify-center h-8.5 px-3.5 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border border-zinc-950 dark:border-white shadow-sm hover:opacity-90 transition-all mb-0.5 select-none cursor-pointer"
        >
          <span className="sr-only">Daari, home</span>
          <DaariWordmarkSmall className="h-5 w-auto" />
        </Link>

        {/* Small Navigation Buttons Listed in Vertical Formation */}
        <div className="flex flex-col items-start gap-1 font-body">
          <Link
            href="/#portfolio"
            onClick={handleCurriculaClick}
            className="px-2.5 py-1 rounded-md bg-transparent hover:bg-foreground hover:text-background text-muted-foreground hover:text-background text-xs uppercase tracking-wider font-medium leading-tight transition-all cursor-pointer"
          >
            Paths
          </Link>

          <Link
            href="/billing"
            onClick={handleQuotaClick}
            className="px-2.5 py-1 rounded-md bg-transparent hover:bg-foreground hover:text-background text-muted-foreground hover:text-background text-xs uppercase tracking-wider font-medium leading-tight transition-all cursor-pointer"
          >
            Usage
          </Link>

          <button
            type="button"
            onClick={handleDeployClick}
            className="px-2.5 py-1 rounded-md bg-orange-500/15 hover:bg-orange-500 text-orange-600 dark:text-orange-400 hover:text-black text-xs uppercase tracking-wider font-bold leading-tight transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer font-body"
          >
            <Plus className="size-3 stroke-[2.5]" />
            <span>Start</span>
          </button>
        </div>
      </nav>

      {/* Center Crest: Top Center Iconic Logo */}
      <div
        className={`fixed top-5 sm:top-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center select-none pointer-events-auto transition-opacity duration-300 ${
          navVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <Link
          href="/"
          onClick={handleBrandClick}
          className="flex items-center justify-center size-8 sm:size-9 rounded-xl hover:opacity-80 active:scale-95 transition-all cursor-pointer group"
          aria-label="Home"
          title="Return to Home"
        >
          {/* Light mode: black icon */}
          <Image
            src="/images/logo-light.png"
            alt="Site Logo"
            width={36}
            height={36}
            className="size-7 sm:size-8 object-contain block dark:hidden transition-transform duration-200 group-hover:scale-105"
            priority
          />
          {/* Dark mode: white icon */}
          <Image
            src="/images/logo-dark.png"
            alt="Site Logo"
            width={36}
            height={36}
            className="size-7 sm:size-8 object-contain hidden dark:block transition-transform duration-200 group-hover:scale-105"
            priority
          />
        </Link>
      </div>

      {/* Right Wing: Vertical formation sticking to the right (Identical structure to Left Wing) */}
      <nav
        aria-label="User Actions"
        className={`fixed top-5 right-5 sm:top-6 sm:right-8 z-50 flex flex-col items-end gap-1.5 font-mono text-xs select-none transition-opacity duration-700 ease-out ${
          navVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Studio Pill */}
        <Link
          href="/studio"
          onClick={handleStudioClick}
          className="inline-flex items-center justify-center gap-1.5 h-8.5 pl-2.5 pr-3 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border border-zinc-950 dark:border-white shadow-sm hover:opacity-90 transition-all mb-0.5 group select-none cursor-pointer"
        >
          <ArrowUpRight className="size-3.5 text-orange-500 dark:text-orange-600 shrink-0 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
          <span className="text-sm font-black tracking-[-0.03em] font-display uppercase leading-none text-center">
            STUDIO
          </span>
        </Link>

        {/* Small Navigation Buttons Listed in Vertical Formation */}
        <div className="flex flex-col items-end gap-1 font-body">
          <Link
            href="/about"
            aria-current={pathname === "/about" ? "page" : undefined}
            className={`px-2.5 py-1 rounded-md bg-transparent hover:bg-foreground hover:text-background text-xs uppercase tracking-wider font-medium leading-tight transition-all cursor-pointer ${
              pathname === "/about" ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"
            }`}
          >
            About
          </Link>

          {internalUser ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="px-2.5 py-1 rounded-md bg-transparent hover:bg-red-600 hover:text-white text-muted-foreground text-xs uppercase tracking-wider font-medium leading-tight transition-all cursor-pointer"
              title="Sign out of account"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="px-2.5 py-1 rounded-md bg-transparent hover:bg-foreground hover:text-background text-muted-foreground text-xs uppercase tracking-wider font-medium leading-tight transition-all flex items-center"
            >
              Sign In
            </Link>
          )}

          <ThemeToggle variant="pill" />
        </div>
      </nav>
    </div>
  );
}

export { Navbar as KotoNavbar };
export default Navbar;
