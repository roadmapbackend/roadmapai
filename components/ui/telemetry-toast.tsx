"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, Terminal, X } from "@/components/ui/icons";

export interface ToastItem {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  duration?: number; // ms
}

// Global dispatcher function for easy firing from anywhere
export function showTelemetryToast(toast: Omit<ToastItem, "id">) {
  if (typeof window !== "undefined") {
    const event = new CustomEvent("telemetry-toast", {
      detail: {
        ...toast,
        id: Math.random().toString(36).substring(2, 9),
      },
    });
    window.dispatchEvent(event);
  }
}

export function TelemetryToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    function handleToastEvent(e: Event) {
      const customEvent = e as CustomEvent<ToastItem>;
      if (!customEvent.detail) return;

      const newToast = customEvent.detail;
      setToasts((prev) => [...prev, newToast]);

      // Auto dismiss
      const duration = newToast.duration || 4500;
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== newToast.id));
      }, duration);
    }

    window.addEventListener("telemetry-toast", handleToastEvent);
    return () => window.removeEventListener("telemetry-toast", handleToastEvent);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none select-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === "success";
        const isError = toast.type === "error";
        const isWarning = toast.type === "warning";
        const isInfo = toast.type === "info";

        const borderStyle = isSuccess
          ? "border-[#d4f934]/40 shadow-[0_12px_36px_rgba(212,249,52,0.15)]"
          : isError
          ? "border-rose-500/40 shadow-[0_12px_36px_rgba(244,63,94,0.15)]"
          : isWarning
          ? "border-amber-500/40 shadow-[0_12px_36px_rgba(245,158,11,0.15)]"
          : "border-orange-500/40 shadow-[0_12px_36px_rgba(249,115,22,0.15)]";

        const accentColor = isSuccess
          ? "#d4f934"
          : isError
          ? "#f43f5e"
          : isWarning
          ? "#fbbf24"
          : "#f97316";

        const Icon = isSuccess
          ? CheckCircle2
          : isError || isWarning
          ? AlertTriangle
          : Terminal;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl bg-[#090b0e]/95 backdrop-blur-2xl border ${borderStyle} text-white font-mono animate-in slide-in-from-right-8 duration-200 relative overflow-hidden`}
          >
            {/* Top laser accent line */}
            <div
              className="absolute top-0 inset-x-0 h-[2px]"
              style={{ backgroundColor: accentColor }}
            />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0" style={{ color: accentColor }}>
                  <Icon className="size-4" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <span>{toast.title}</span>
                    <span
                      className="text-[9px] px-1 py-0.2 rounded font-mono uppercase tracking-widest"
                      style={{
                        backgroundColor: `${accentColor}20`,
                        color: accentColor,
                      }}
                    >
                      {toast.type}
                    </span>
                  </div>
                  {toast.message && (
                    <p className="text-xs text-white/60 mt-1 leading-relaxed font-normal">
                      {toast.message}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-white/40 hover:text-white transition-colors p-1 cursor-pointer shrink-0"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

