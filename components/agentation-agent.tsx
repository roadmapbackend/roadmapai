"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { showTelemetryToast } from "@/components/ui/telemetry-toast";

// Dynamically import Agentation to ensure clean client-side rendering without SSR hydration mismatches
const Agentation = dynamic(
  () => import("agentation").then((mod) => mod.Agentation),
  { ssr: false }
);

export function AgentationAgent() {
  const [mounted, setMounted] = useState(false);
  const [cleanupKey, setCleanupKey] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Utility to purge a deleted annotation ID across all possible local storage keys
  const purgeAnnotationFromStorage = useCallback((annotationId: string) => {
    if (typeof window === "undefined") return;
    try {
      const keysToInspect: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("feedback-annotations-")) {
          keysToInspect.push(k);
        }
      }

      for (const k of keysToInspect) {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        try {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const filtered = list.filter((item: any) => item && item.id !== annotationId);
            if (filtered.length !== list.length) {
              if (filtered.length > 0) {
                localStorage.setItem(k, JSON.stringify(filtered));
              } else {
                localStorage.removeItem(k);
              }
            }
          }
        } catch {
          // ignore parsing error on corrupt entry
        }
      }
    } catch (e) {
      console.warn("[Agentation] Storage purge error:", e);
    }
  }, []);

  // Utility to purge all annotations across workspace & current routes
  const clearAllAnnotationsFromStorage = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith("feedback-annotations-") || k.startsWith("agentation-design-"))) {
          keysToRemove.push(k);
        }
      }
      for (const k of keysToRemove) {
        localStorage.removeItem(k);
      }
    } catch (e) {
      console.warn("[Agentation] Storage clear error:", e);
    }
  }, []);

  // Expose global window helper and keyboard shortcut listener for guaranteed recovery
  useEffect(() => {
    if (typeof window === "undefined") return;

    (window as any).__clearAgentationAnnotations = () => {
      clearAllAnnotationsFromStorage();
      setCleanupKey((k) => k + 1);
      showTelemetryToast({
        type: "success",
        title: "AGENTATION // CACHE PURGED",
        message: "All visual annotations cleared from studio and browser storage.",
      });
    };

    const handleCustomClear = () => {
      clearAllAnnotationsFromStorage();
      setCleanupKey((k) => k + 1);
    };

    window.addEventListener("agentation:clear", handleCustomClear);

    // Global keyboard listener: Alt + Shift + C or Alt + C clears annotations if ever stuck
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        (window as any).__clearAgentationAnnotations?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("agentation:clear", handleCustomClear);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [clearAllAnnotationsFromStorage]);

  if (!mounted) return null;

  // Key the Agentation component with both pathname and cleanupKey so route changes or deletion
  // force an immediate, clean state re-synchronization with local storage.
  const activeRouteKey = `${pathname || "/"}-${cleanupKey}`;

  return (
    <div className="agentation-workflow-wrapper z-[999999] relative pointer-events-auto">
      <Agentation
        key={activeRouteKey}
        appName="Daari"
        useHashLocation={true}
        enableKeyboardShortcuts={true}
        onAnnotationDelete={(annotation) => {
          console.log("[Agentation] Annotation deleted:", annotation.id);
          purgeAnnotationFromStorage(annotation.id);
          // Trigger immediate microtask re-mount to clean any stuck marker DOM nodes
          setTimeout(() => {
            setCleanupKey((k) => k + 1);
          }, 50);
          showTelemetryToast({
            type: "info",
            title: "AGENTATION // POINT REMOVED",
            message: `Point deleted. Remaining points synchronized.`,
            duration: 2500,
          });
        }}
        onAnnotationsClear={(cleared) => {
          console.log("[Agentation] Annotations cleared:", cleared.length);
          clearAllAnnotationsFromStorage();
          setCleanupKey((k) => k + 1);
          showTelemetryToast({
            type: "info",
            title: "AGENTATION // ALL POINTS CLEARED",
            message: `Cleared ${cleared.length} visual annotations from studio.`,
            duration: 2500,
          });
        }}
        onSubmit={(output, annotations) => {
          console.log("[Agentation] Feedback dispatched to agent workflow:", { output, annotations });
          showTelemetryToast({
            type: "success",
            title: "AGENTATION // FEEDBACK DISPATCHED",
            message: `Captured ${annotations.length} visual UI annotations. Formatted markdown ready for agent execution.`,
          });
        }}
        onCopy={() => {
          showTelemetryToast({
            type: "info",
            title: "AGENTATION // MARKDOWN COPIED",
            message: "UI element selectors & style telemetry copied to clipboard.",
          });
        }}
      />
    </div>
  );
}

