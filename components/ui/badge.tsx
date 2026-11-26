import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "saffron"
    | "orange"
    | "amber"
    | "emerald"
    | "cyan"
    | "rose"
    | "purple"
    | "blue";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "border-transparent bg-foreground text-background",
    secondary: "border-transparent bg-muted/60 text-muted-foreground",
    outline: "border border-border text-foreground",
    saffron: "border-transparent bg-orange-500/10 text-orange-600 dark:text-orange-400",
    orange: "border-transparent bg-gradient-to-r from-orange-500/15 to-amber-500/15 text-orange-600 dark:text-orange-400 font-bold",
    amber: "border-transparent bg-amber-500/10 text-amber-600 dark:text-amber-400",
    emerald: "border-transparent bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    cyan: "border-transparent bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    rose: "border-transparent bg-rose-500/10 text-rose-600 dark:text-rose-400",
    purple: "border-transparent bg-purple-500/10 text-purple-600 dark:text-purple-400",
    blue: "border-transparent bg-orange-500/10 text-orange-600 dark:text-orange-400",
  }[variant];

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold font-mono tracking-wider transition-colors",
        variantStyles,
        className
      )}
      {...props}
    />
  );
}
