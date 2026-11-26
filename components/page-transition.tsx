"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useTransition,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLenis } from "@/components/smooth-scroll";
import { markInternalNavigation } from "@/lib/navigation-tracker";

interface PageTransitionContextType {
  transitionTo: (url: string) => void;
  isTransitioning: boolean;
}

const PageTransitionContext = createContext<PageTransitionContextType>({
  transitionTo: () => {},
  isTransitioning: false,
});

export const usePageTransition = () => useContext(PageTransitionContext);

interface PageTransitionProps {
  children: React.ReactNode;
  /** Navigation that uses transitionTo() but must not blur with the page */
  chrome?: React.ReactNode;
}

export function PageTransition({ children, chrome }: PageTransitionProps) {
  const pathname = usePathname();
  const router = useRouter();
  const lenis = useLenis();
  const [, startTransition] = useTransition();

  // Navigation stages: 'idle' | 'exiting' | 'entering'
  const [stage, setStage] = useState<"idle" | "exiting" | "entering">("idle");
  const previousPathnameRef = useRef<string>(pathname);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isNavigatingRef = useRef<boolean>(false);

  // Transition to a target internal route with smooth blur-out -> navigate -> blur-in
  const transitionTo = useCallback(
    (targetUrl: string) => {
      if (isNavigatingRef.current) return;

      try {
        const dest = new URL(targetUrl, window.location.href);
        const currentFull = `${window.location.pathname}${window.location.search}`;
        const destFull = `${dest.pathname}${dest.search}`;

        // If exact same page without hash, ignore
        if (currentFull === destFull && !dest.hash) {
          return;
        }

        // If only hash is changing on the current page, allow instant smooth anchor scroll
        if (dest.pathname === window.location.pathname && dest.search === window.location.search && dest.hash) {
          window.location.hash = dest.hash;
          return;
        }

        isNavigatingRef.current = true;
        markInternalNavigation();
        setStage("exiting");

        // Wait 190ms for the blur-out animation, then push route
        transitionTimerRef.current = setTimeout(() => {
          startTransition(() => {
            router.push(targetUrl);
          });

          // Safety timeout fallback: if router takes longer than 1200ms, restore view
          setTimeout(() => {
            if (isNavigatingRef.current) {
              isNavigatingRef.current = false;
              setStage("idle");
            }
          }, 1200);
        }, 190);
      } catch (e) {
        console.error("Page transition error:", e);
        router.push(targetUrl);
      }
    },
    [router]
  );

  // Intercept all internal anchor clicks automatically
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Skip modified clicks (new tab / window) or secondary buttons
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

      // Skip external, target="_blank", downloads, or special protocols
      if (
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      ) {
        return;
      }

      try {
        const dest = new URL(anchor.href, window.location.href);
        if (dest.origin !== window.location.origin) return;

        // Skip in-page anchor jumps on the exact same page
        if (
          dest.pathname === window.location.pathname &&
          dest.search === window.location.search &&
          dest.hash
        ) {
          return;
        }

        // Skip clicking the exact same link
        if (
          dest.pathname === window.location.pathname &&
          dest.search === window.location.search &&
          !dest.hash
        ) {
          e.preventDefault();
          return;
        }

        // Intercept route change for cinematic blur transition
        e.preventDefault();
        transitionTo(anchor.href);
      } catch {
        // Fallback to native behavior
      }
    };

    document.addEventListener("click", handleDocumentClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleDocumentClick, { capture: true });
    };
  }, [transitionTo]);

  // Route Arrival: when pathname changes, animate blur-in
  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      previousPathnameRef.current = pathname;
      isNavigatingRef.current = false;

      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }

      // Reset scroll to top only if there is no target hash anchor
      const storedAnchor = typeof window !== "undefined" ? sessionStorage.getItem("roadmap_target_anchor") : null;
      const hasHash = (typeof window !== "undefined" && Boolean(window.location.hash)) || Boolean(storedAnchor);
      if (!hasHash) {
        if (lenis) {
          lenis.scrollTo(0, { immediate: true });
        } else {
          window.scrollTo(0, 0);
        }
      }

      // Set initial entering blurred state
      setStage("entering");

      // Animate smoothly into idle/sharp state on the next animation frame
      const frameId = requestAnimationFrame(() => {
        const timer = setTimeout(() => {
          setStage("idle");
        }, 16);
        return () => clearTimeout(timer);
      });

      return () => cancelAnimationFrame(frameId);
    }
  }, [pathname, lenis]);

  // Popstate (browser back/forward button) support
  useEffect(() => {
    const handlePopState = () => {
      markInternalNavigation();
      setStage("entering");
      requestAnimationFrame(() => {
        setTimeout(() => setStage("idle"), 20);
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const isTransitioning = stage !== "idle";

  return (
    <PageTransitionContext.Provider value={{ transitionTo, isTransitioning }}>
      {/* Sleek Top Glow Shimmer on Page Transition */}
      <div
        aria-hidden="true"
        className={`fixed top-0 left-0 right-0 h-[2px] z-[9999] pointer-events-none transition-opacity duration-200 ${
          isTransitioning ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="h-full w-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
      </div>

      {chrome}

      {/* Cinematic Content Wrapper */}
      <div className={`page-transition-wrapper stage-${stage}`}>
        {children}
      </div>
    </PageTransitionContext.Provider>
  );
}

