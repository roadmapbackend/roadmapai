"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "@/components/ui/icons";

interface TelemetryConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning";
  isLoading?: boolean;
  onConfirm: () => void;
}

export function TelemetryConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
  onConfirm,
}: TelemetryConfirmDialogProps) {
  const isDanger = variant === "danger";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" role="alertdialog" aria-modal="true" aria-label={title}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <AlertTriangle className={isDanger ? "size-5 text-rose-600 dark:text-rose-400" : "size-5 text-amber-600"} />
            {title}
          </DialogTitle>
          <DialogDescription className="pt-2 text-sm!">
            {description} {isDanger && "This can’t be undone."}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={isDanger ? "rose" : "amber"}
            onClick={onConfirm}
            disabled={isLoading}
            className="gap-2"
          >
            <Trash2 className="size-4" />
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

