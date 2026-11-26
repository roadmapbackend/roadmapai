"use client";

import React, { useState, useEffect, useRef } from "react";

export interface SiteOpeningAnimationProps {
  onRevealStart?: () => void;
  onComplete?: () => void;
}

export function SiteOpeningAnimation({
  onRevealStart,
  onComplete,
}: SiteOpeningAnimationProps) {
  // Stages:
  // "centered"  -> logo in center of blank screen, scales & blurs in
  // "gliding"   -> logo glides smoothly to top center
  // "paused"    -> logo holds at top center, screen is blank for 0.5 seconds
  // "revealing" -> the full-screen picture blurs into focus
  // "done"      -> animation complete, smoothly finished
  const [stage, setStage] = useState<"centered" | "gliding" | "paused" | "revealing" | "done">("centered");
  const [logoEntered, setLogoEntered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const onRevealStartRef = useRef(onRevealStart);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onRevealStartRef.current = onRevealStart;
    onCompleteRef.current = onComplete;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 640) {
        setIsMobile(true);
      }
    }

    // Expose dev testing hook to replay on demand
    if (typeof window !== "undefined") {
      (window as any).__replaySiteOpeningAnimation = () => {
        window.dispatchEvent(new CustomEvent("roadmap-replay-site-intro"));
        setStage("centered");
        setLogoEntered(false);
        const t0 = setTimeout(() => setLogoEntered(true), 60);
        const t1 = setTimeout(() => setStage("gliding"), 1300);
        const t2 = setTimeout(() => setStage("paused"), 2150);
        const t3 = setTimeout(() => {
          setStage("revealing");
          onRevealStartRef.current?.();
        }, 2650); // 2150ms + 500ms exact pause
        const t4 = setTimeout(() => {
          setStage("done");
          onCompleteRef.current?.();
        }, 3750); // 2650ms + 1100ms blur-in, matches .intro-reveal
        timersRef.current = [t0, t1, t2, t3, t4];
      };
    }

    // Choreographed Animation Timeline:
    // Stage 1: Logo blurs and scales into center
    const t0 = setTimeout(() => {
      setLogoEntered(true);
    }, 60);

    // Stage 2: Logo holds in center for ~1.2s, then glides smoothly to top center
    const t1 = setTimeout(() => {
      setStage("gliding");
    }, 1300);

    // Stage 3: Logo reaches top-center. Screen stays blank for exactly 0.5s!
    const t2 = setTimeout(() => {
      setStage("paused");
    }, 2150);

    // Stage 4: 0.5-second pause ends! The page starts blurring into focus
    const t3 = setTimeout(() => {
      setStage("revealing");
      onRevealStartRef.current?.();
    }, 2650); // 2150ms + 500ms pause

    // Stage 5: Reveal completes
    const t4 = setTimeout(() => {
      setStage("done");
      onCompleteRef.current?.();
    }, 3750); // 2650ms + 1100ms blur-in, matches .intro-reveal

    timersRef.current = [t0, t1, t2, t3, t4];

    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
    };
  }, []);

  // Keyboard shortcut to skip immediately (Escape, Space, Enter)
  useEffect(() => {
    if (stage === "done") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        timersRef.current.forEach((t) => clearTimeout(t));
        setStage("done");
        onComplete?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stage, onComplete]);

  if (stage === "done") {
    return null;
  }

  const isGlidingOrBeyond = stage === "gliding" || stage === "paused" || stage === "revealing";

  // Target coordinates in Navbar:
  const targetTop = isMobile ? "20px" : "24px";
  const targetSize = isMobile ? "28px" : "32px";

  // Initial center size (254px desktop, 184px mobile):
  const centerSize = isMobile ? "184px" : "254px";

  return (
    <>
      {/* Moving Logo: Glides from screen center to exact top-center position without any backdrop overlay */}
      <div
        className="fixed left-1/2 flex items-center justify-center will-change-transform z-[95] pointer-events-none"
        style={{
          top: isGlidingOrBeyond ? targetTop : "50%",
          transform: isGlidingOrBeyond
            ? "translate(-50%, 0) scale(1)"
            : logoEntered
            ? "translate(-50%, -50%) scale(1)"
            : "translate(-50%, -50%) scale(0.7)",
          width: isGlidingOrBeyond ? targetSize : centerSize,
          height: isGlidingOrBeyond ? targetSize : centerSize,
          opacity: logoEntered ? 1 : 0,
          filter: logoEntered ? "blur(0px)" : "blur(14px)",
          transition: isGlidingOrBeyond
            ? "top 850ms cubic-bezier(0.16, 1, 0.3, 1), transform 850ms cubic-bezier(0.16, 1, 0.3, 1), width 850ms cubic-bezier(0.16, 1, 0.3, 1), height 850ms cubic-bezier(0.16, 1, 0.3, 1)"
            : "transform 800ms cubic-bezier(0.16, 1, 0.3, 1), opacity 800ms ease, filter 800ms ease",
        }}
      >
        {/* Light Mode Logo */}
        <img
          src="/images/logo-light.png"
          alt="Daari Logo"
          className={`w-full h-full object-contain block dark:hidden select-none transition-[filter] duration-700 ${
            stage === "revealing" ? "invert" : ""
          }`}
        />
        {/* Dark Mode Logo */}
        <img
          src="/images/logo-dark.png"
          alt="Daari Logo"
          className="w-full h-full object-contain hidden dark:block select-none"
        />
      </div>

      {/* Discreet skip instruction during center pause */}
      {stage !== "revealing" && (
        <span
          className={`fixed bottom-6 inset-x-0 text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 transition-opacity duration-300 pointer-events-none z-[96] ${
            logoEntered ? "opacity-100" : "opacity-0"
          }`}
        >
          Press Esc to skip
        </span>
      )}
    </>
  );
}

export default SiteOpeningAnimation;
