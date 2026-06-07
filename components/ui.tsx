import * as React from "react";
import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "forest" | "outline" | "ghost" | "danger" | "subtle";
  size?: "sm" | "md" | "lg";
}) {
  const variants: Record<string, string> = {
    primary:
      "bg-[var(--gold)] text-[var(--primary-foreground)] hover:bg-[var(--gold-dark)] hover:text-white shadow-sm",
    forest:
      "bg-[var(--forest)] text-[var(--background)] hover:bg-[var(--forest-soft)] shadow-sm",
    outline:
      "border border-[var(--border)] bg-white text-slate-700 hover:bg-[var(--surface)]",
    ghost: "text-slate-600 hover:bg-[var(--surface)]",
    danger: "bg-red-700 text-white hover:bg-red-800",
    subtle: "bg-[var(--surface)] text-slate-700 hover:bg-[var(--gold-soft)]",
  };
  const sizes: Record<string, string> = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-[var(--gold-soft)]",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-[var(--gold-soft)]",
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-slate-900 focus:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-[var(--gold-soft)]",
        className
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-slate-700", className)}
      {...props}
    />
  );
}

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border)] bg-white shadow-sm",
        className
      )}
      {...props}
    />
  );
}

export function Badge({
  children,
  color = "slate",
}: {
  children: React.ReactNode;
  color?: "slate" | "green" | "amber" | "red" | "indigo" | "gold";
}) {
  const colors: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-[#e3ebe2] text-[#2f5138]",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-700",
    indigo: "bg-[var(--gold-soft)] text-[var(--gold-dark)]",
    gold: "bg-[var(--gold-soft)] text-[var(--gold-dark)]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        colors[color]
      )}
    >
      {children}
    </span>
  );
}
