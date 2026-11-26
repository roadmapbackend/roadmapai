"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface QuotaDetail {
  currentUsed?: number;
  maxLimit?: number;
  resetDate?: string;
}

const number = new Intl.NumberFormat();

/** Opens when an AI request would go over the monthly limit */
export function QuotaExhaustedModal() {
  const [detail, setDetail] = useState<QuotaDetail | null>(null);

  useEffect(() => {
    const handleExceeded = (e: Event) => setDetail((e as CustomEvent<QuotaDetail>).detail ?? {});
    window.addEventListener("roadmap-token-quota-exceeded", handleExceeded);
    return () => window.removeEventListener("roadmap-token-quota-exceeded", handleExceeded);
  }, []);

  const close = () => setDetail(null);

  return (
    <Dialog open={detail !== null} onOpenChange={close}>
      <DialogContent className="sm:max-w-md" role="alertdialog" aria-modal="true" aria-label="Monthly limit reached">
        <DialogHeader>
          <DialogTitle>You&rsquo;ve reached this month&rsquo;s limit</DialogTitle>
          <DialogDescription className="pt-2 text-sm!">
            {detail?.currentUsed !== undefined && detail.maxLimit !== undefined
              ? `You have used ${number.format(detail.currentUsed)} of ${number.format(detail.maxLimit)} tokens, and this needs more than is left. `
              : "There isn't enough left for this. "}
            {detail?.resetDate && `It starts again on ${detail.resetDate}. `}
            Lessons you already have stay open.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2">
          <Link href="/billing" onClick={close}>
            <Button type="button" variant="ghost">
              See usage
            </Button>
          </Link>
          <Button type="button" variant="orange" onClick={close}>
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
