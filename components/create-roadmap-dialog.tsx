"use client";

import React, { useEffect, useState } from "react";
import { saveRoadmapToSupabase } from "@/lib/supabase-roadmap";
import { useCurrentUser } from "@/lib/use-current-user";
import { usePageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberStepper } from "@/components/ui/number-stepper";
import { CustomDropdown } from "@/components/ui/custom-dropdown";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowRight, Loader2 } from "@/components/ui/icons";
import { showTelemetryToast } from "@/components/ui/telemetry-toast";

export interface PathPreset {
  subject?: string;
  days?: number;
  hours?: number;
}

type SkillLevel = "beginner" | "intermediate" | "advanced";

const OPEN_EVENT = "open-deploy-modal";
/** Keeps what a visitor typed while they sign in */
export const PENDING_PATH_KEY = "daari_pending_path";

/** Opens the "start a path" dialog from anywhere */
export function startPath(preset: PathPreset = {}) {
  window.dispatchEvent(new CustomEvent<PathPreset>(OPEN_EVENT, { detail: preset }));
}

export function CreateRoadmapDialog() {
  const user = useCurrentUser();
  const { transitionTo } = usePageTransition();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [days, setDays] = useState(14);
  const [hours, setHours] = useState(2);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("intermediate");
  const [isBuilding, setIsBuilding] = useState(false);

  const userId = user?.id;

  useEffect(() => {
    const show = (preset: PathPreset) => {
      if (preset.subject) setSubject(preset.subject);
      if (preset.days) setDays(preset.days);
      if (preset.hours) setHours(preset.hours);
      setOpen(true);
    };

    const handleOpen = (e: Event) => {
      const preset = (e as CustomEvent<PathPreset | null>).detail ?? {};
      if (userId) {
        show(preset);
        return;
      }
      try {
        sessionStorage.setItem(PENDING_PATH_KEY, JSON.stringify(preset));
      } catch {
        // the visitor retypes it
      }
      transitionTo(`/login?redirectedFrom=${encodeURIComponent("/studio")}`);
    };

    if (userId) {
      try {
        const pending = sessionStorage.getItem(PENDING_PATH_KEY);
        if (pending) {
          sessionStorage.removeItem(PENDING_PATH_KEY);
          show(JSON.parse(pending));
        }
      } catch {
        // nothing to resume
      }
    }

    window.addEventListener(OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_EVENT, handleOpen);
  }, [userId, transitionTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSubject = subject.trim();
    if (!cleanSubject || !userId || isBuilding) return;

    setIsBuilding(true);
    showTelemetryToast({
      type: "info",
      title: "Building your path",
      message: "Longer paths can take several minutes, so keep this tab open.",
    });

    try {
      const result = await saveRoadmapToSupabase(userId, cleanSubject, days, hours, skillLevel);
      setOpen(false);
      setSubject("");
      transitionTo(`/workspace?id=${result.roadmap.id}`);
    } catch (err) {
      console.error("Creating the path failed:", err);
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      const isQuota =
        (err instanceof Error && err.name === "TokenQuotaExceededError") || /AI usage is used up|quota/i.test(message);
      if (isQuota) setOpen(false);
      showTelemetryToast({
        type: "error",
        title: isQuota ? "Usage limit reached" : "Could not build the path",
        message,
      });
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md" role="dialog" aria-modal="true" aria-label="Start a path">
        <DialogHeader>
          <DialogTitle>Start a path</DialogTitle>
          <DialogDescription>What do you want to learn, and how much time do you have?</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5 text-sm">
          <label className="block">
            <span className="mb-1.5 block font-medium">Subject</span>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Classical guitar" required autoFocus />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="mb-1.5 block font-medium">Days</span>
              <NumberStepper label="Days" value={days} onChange={setDays} min={1} max={90} />
            </div>
            <div>
              <span className="mb-1.5 block font-medium">Hours a day</span>
              <NumberStepper label="Hours a day" value={hours} onChange={setHours} min={0.5} max={12} step={0.5} />
            </div>
          </div>

          <div>
            <span className="mb-1.5 block font-medium">Where are you starting from?</span>
            <CustomDropdown<SkillLevel>
              value={skillLevel}
              onChange={setSkillLevel}
              accentColor="orange"
              className="w-full"
              triggerClassName="w-full h-10"
              menuClassName="w-full"
              options={[
                { value: "beginner", label: "Beginner", sublabel: "New to this" },
                { value: "intermediate", label: "Intermediate", sublabel: "I know the basics" },
                { value: "advanced", label: "Advanced", sublabel: "I want the hard parts" },
              ]}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="orange" disabled={isBuilding} className="gap-2">
              {isBuilding ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Building
                </>
              ) : (
                <>
                  Start
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
