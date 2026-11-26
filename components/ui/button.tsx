import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "saffron"
    | "orange"
    | "amber"
    | "emerald"
    | "rose"
    | "cyan"
    | "blue";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variantStyles = {
      default:
        "bg-foreground text-background hover:bg-foreground/90 shadow-xs font-bold text-xs uppercase tracking-wider rounded-full",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full",
      outline:
        "border border-border bg-card/60 hover:bg-muted text-foreground font-semibold rounded-full text-xs uppercase tracking-wider",
      secondary:
        "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground font-semibold rounded-full text-xs uppercase tracking-wider",
      ghost:
        "hover:bg-muted text-muted-foreground hover:text-foreground rounded-full text-xs uppercase tracking-wider",
      link: "text-orange-500 underline-offset-4 hover:underline",
      saffron:
        "bg-orange-500 hover:bg-orange-600 text-white shadow-[0_4px_20px_rgba(249,115,22,0.35)] border border-orange-400/30 font-bold text-xs uppercase tracking-wider rounded-full",
      orange:
        "bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white shadow-[0_4px_22px_rgba(249,115,22,0.4)] border border-orange-300/30 font-bold text-xs uppercase tracking-wider rounded-full",
      amber:
        "bg-amber-500 hover:bg-amber-600 text-white shadow-[0_4px_18px_rgba(245,158,11,0.35)] border border-amber-300/30 font-bold text-xs uppercase tracking-wider rounded-full",
      emerald:
        "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_4px_18px_rgba(16,185,129,0.35)] border border-emerald-400/30 font-bold text-xs uppercase tracking-wider rounded-full",
      rose:
        "bg-rose-600 hover:bg-rose-500 text-white shadow-[0_4px_18px_rgba(244,63,94,0.35)] border border-rose-400/30 font-bold text-xs uppercase tracking-wider rounded-full",
      cyan:
        "bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_4px_18px_rgba(6,182,212,0.35)] border border-cyan-400/30 font-bold text-xs uppercase tracking-wider rounded-full",
      blue:
        "bg-orange-500 hover:bg-orange-600 text-white shadow-[0_4px_20px_rgba(249,115,22,0.35)] border border-orange-400/30 font-bold text-xs uppercase tracking-wider rounded-full",
    }[variant];

    const sizeStyles = {
      default: "h-11 px-6",
      sm: "h-9 px-4 text-[11px]",
      lg: "h-12 px-8 text-sm",
      icon: "size-9 p-0",
    }[size];

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-95 select-none",
          variantStyles,
          sizeStyles,
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
