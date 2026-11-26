import React from "react";

/*
 * The Daari wordmark, built from ದಾರಿ: both a's hang from one head line, as ದಾ does, and end in
 * the curl of the long-aa sign. The i carries the loop of ರಿ.
 */

interface WordmarkProps {
  className?: string;
  /** Colors must be opaque, as the strokes overlap */
  lettersClassName?: string;
  accentClassName?: string;
}

/** Full version, for 28px tall and above */
export function DaariWordmark({ className, lettersClassName, accentClassName = "text-saffron" }: WordmarkProps) {
  return (
    <svg viewBox="0 -4 353 140" aria-hidden="true" className={className}>
      <g className={lettersClassName}>
        <g fill="none" stroke="currentColor" strokeWidth={18}>
          <ellipse cx="45.0" cy="89.0" rx="36.0" ry="36.0" />
          <path d="M81.0 2.0 V134.0" />
          <path d="M130.0 53.0 H133.96 C157.76 53.0 170.0 65.0 170.0 86.0 V134.0" />
          <path d="M170.0 109.0 C161.0 121.0 149.6 125.0 136.68 125.0 C119.0 125.0 111.0 116.0 111.0 104.0 C111.0 93.0 118.0 86.0 129.0 87.0" />
          <path d="M219.0 53.0 H222.96 C246.76 53.0 259.0 65.0 259.0 86.0 V134.0" />
          <path d="M259.0 109.0 C250.0 121.0 238.6 125.0 225.68 125.0 C208.0 125.0 200.0 116.0 200.0 104.0 C200.0 93.0 207.0 86.0 218.0 87.0" />
          <path d="M289.0 44.0 V134.0 M289.0 91.0 C289.0 61.0 304.0 53.0 325.0 53.0" />
          <path d="M344.0 44.0 V134.0" />
        </g>
        <g fill="currentColor">
          <circle cx="133.0" cy="97.0" r="11.5" />
          <circle cx="222.0" cy="97.0" r="11.5" />
        </g>
      </g>
      <g fill="none" className={accentClassName} stroke="currentColor">
        <path d="M102.0 53.0 H222.96" strokeWidth="18.8" />
        <path d="M344.0 31 C346.0 17 338.0 7 327.0 7 C316.0 7 311.0 18 317.0 27" strokeWidth="12.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** Heavier, in one color, for small sizes such as the navbar */
export function DaariWordmarkSmall({ className, lettersClassName }: Omit<WordmarkProps, "accentClassName">) {
  return (
    <svg viewBox="0 -4 365.9 140" aria-hidden="true" className={className}>
      <g className={lettersClassName}>
        <g fill="none" stroke="currentColor" strokeWidth={21}>
          <ellipse cx="45.0" cy="89.0" rx="34.5" ry="34.5" />
          <path d="M79.5 2.0 V134.0" />
          <path d="M130.0 54.5 H135.23 C159.97 54.5 172.7 66.5 172.7 87.5 V134.0" />
          <path d="M172.7 107.5 C163.7 119.5 151.49 123.5 138.06 123.5 C119.67 123.5 112.5 114.5 112.5 102.5 C112.5 91.5 119.5 84.5 130.5 85.5" />
          <path d="M223.2 54.5 H228.43 C253.17 54.5 265.9 66.5 265.9 87.5 V134.0" />
          <path d="M265.9 107.5 C256.9 119.5 244.69 123.5 231.26 123.5 C212.88 123.5 205.7 114.5 205.7 102.5 C205.7 91.5 212.7 84.5 223.7 85.5" />
          <path d="M298.9 44.0 V134.0 M298.9 91.0 C298.9 62.5 313.9 54.5 334.9 54.5" />
          <path d="M355.4 44.0 V134.0" />
        </g>
        <g fill="currentColor">
          <circle cx="134.5" cy="95.5" r="10" />
          <circle cx="227.7" cy="95.5" r="10" />
        </g>
      </g>
      <g fill="none" className={lettersClassName} stroke="currentColor">
        <path d="M102.0 54.5 H228.43" strokeWidth="21" />
        <path d="M355.4 31 C357.4 17 349.4 7 338.4 7 C327.4 7 322.4 18 328.4 27" strokeWidth="15" strokeLinecap="round" />
      </g>
    </svg>
  );
}
