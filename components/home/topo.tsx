import React from "react";
import { cn } from "@/lib/utils";

const BAND_DARK = "#0d0b09";

/**
 * The contour map. Near a faded edge the lines go soft and blurry, then disappear, so the
 * map never ends on a hard line.
 */
export function Topo({
  className,
  fadeTop = false,
  fadeBottom = false,
}: {
  className?: string;
  fadeTop?: boolean;
  fadeBottom?: boolean;
}) {
  const top = fadeTop ? "transparent 0%, black 30%" : "black 0%";
  const bottom = fadeBottom ? "black 70%, transparent 100%" : "black 100%";
  const sharp = `linear-gradient(to bottom, ${top}, ${bottom})`;

  // The blurred copy only shows in the edge zones, where the sharp lines are fading out
  const blurTop = fadeTop ? "transparent 0%, black 14%, transparent 34%" : "transparent 0%";
  const blurBottom = fadeBottom ? "transparent 66%, black 86%, transparent 100%" : "transparent 100%";
  const blurred = `linear-gradient(to bottom, ${blurTop}, ${blurBottom})`;

  const img = cn("absolute inset-0 h-full w-full object-cover", className);
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/home/topo.svg" alt="" className={img} style={{ maskImage: sharp, WebkitMaskImage: sharp }} />
      {(fadeTop || fadeBottom) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/images/home/topo.svg"
          alt=""
          className={cn(img, "blur-[3px]")}
          style={{ maskImage: blurred, WebkitMaskImage: blurred }}
        />
      )}
    </div>
  );
}

/** A soft hand-over between a dark band and the page background */
export function BandFade({ to }: { to: "dark" | "page" }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none h-[26vh] min-h-32 w-full shrink-0", to === "page" ? "band-fade-out" : "band-fade-in")}
      style={{ ["--band-dark" as string]: BAND_DARK }}
    />
  );
}
