"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Topo } from "@/components/home/topo";

// The route climbs from the valley to the summit drawn into /images/home/topo.svg (1600 x 1000)
type Stop = { x: number; y: number; label: string; note?: string };
const SUMMIT = { x: 1214, y: 268 };

const WIDE = {
  route: "M 1360 730 C 1355 680, 1310 660, 1310 610 S 1345 530, 1330 490 S 1270 430, 1265 380 S 1225 300, 1214 268",
  stops: [
    { x: 1360, y: 730, label: "Day 1", note: "Start" },
    { x: 1310, y: 610, label: "Day 5" },
    { x: 1330, y: 490, label: "Day 9" },
    { x: 1265, y: 380, label: "Day 12" },
  ] as Stop[],
};

// On a phone the text takes the lower half, so the climb is shorter and steeper
const NARROW = {
  route: "M 1410 520 C 1400 490, 1330 480, 1330 450 S 1380 400, 1365 380 S 1300 350, 1285 325 S 1225 290, 1214 268",
  stops: [
    { x: 1410, y: 520, label: "Day 1", note: "Start" },
    { x: 1330, y: 450, label: "Day 5" },
    { x: 1365, y: 380, label: "Day 9" },
    { x: 1285, y: 325, label: "Day 12" },
  ] as Stop[],
};

function Overlay({ drawn, align, way }: { drawn: boolean; align: "xMidYMid" | "xMaxYMid"; way: typeof WIDE }) {
  return (
    <svg
      viewBox="0 0 1600 1000"
      preserveAspectRatio={`${align} slice`}
      aria-hidden="true"
      className={cn("absolute inset-0 h-full w-full", drawn && "is-drawn")}
    >
      {/* A soft glow under the route */}
      <path d={way.route} pathLength={1} className="home-route home-route-glow" />
      <path d={way.route} pathLength={1} className="home-route" />

      {way.stops.map((s, i) => (
        <g key={s.label} className="home-stop" style={{ animationDelay: `${700 + i * 380}ms` }}>
          <circle cx={s.x} cy={s.y} r={7} className="fill-[#0d0b09] stroke-saffron" strokeWidth={3} />
          <text x={s.x + 18} y={s.y + 5} className="fill-[#e9dfd2] font-mono text-[15px] uppercase tracking-[0.14em]">
            {s.label}
          </text>
          {s.note && (
            <text x={s.x + 18} y={s.y + 26} className="fill-[#e9dfd2]/55 text-[15px]">
              {s.note}
            </text>
          )}
        </g>
      ))}

      <g className="home-stop" style={{ animationDelay: "2300ms" }}>
        <circle cx={SUMMIT.x} cy={SUMMIT.y} r={26} className="home-summit-ring fill-none stroke-saffron" strokeWidth={1.5} />
        <circle cx={SUMMIT.x} cy={SUMMIT.y} r={10} className="fill-saffron" />
        <text x={SUMMIT.x + 40} y={SUMMIT.y - 4} className="fill-[#f6efe6] font-mono text-[15px] uppercase tracking-[0.14em]">
          Day 14
        </text>
        <text x={SUMMIT.x + 40} y={SUMMIT.y + 18} className="fill-[#e9dfd2]/60 text-[15px]">
          You know it
        </text>
      </g>
    </svg>
  );
}

/** A trail map: contour lines with one route drawn up to the summit */
export function HeroMap({ drawn }: { drawn: boolean }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
      <Topo fadeBottom className="object-right opacity-70 sm:object-center" />
      {/* Keeps the headline side quiet */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_70%,rgba(13,11,9,0.92)_0%,rgba(13,11,9,0.55)_45%,transparent_75%)]" />
      <div className="absolute inset-0 hidden sm:block">
        <Overlay drawn={drawn} align="xMidYMid" way={WIDE} />
      </div>
      <div className="absolute inset-0 sm:hidden">
        <Overlay drawn={drawn} align="xMaxYMid" way={NARROW} />
      </div>
    </div>
  );
}
