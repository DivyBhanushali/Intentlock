// INTENTLOCK 2.0 – Reusable Documentation Callout / Alert Box
import React from "react";
import { CalloutType } from "./types";

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}

const config = {
  info: {
    border: "border-sky-500/30",
    bg: "bg-sky-950/20",
    text: "text-sky-300",
    titleColor: "text-sky-200",
    icon: (
      <svg className="h-4 w-4 shrink-0 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  tip: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-950/20",
    text: "text-emerald-300",
    titleColor: "text-emerald-200",
    icon: (
      <svg className="h-4 w-4 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  warning: {
    border: "border-amber-500/30",
    bg: "bg-amber-950/20",
    text: "text-amber-300",
    titleColor: "text-amber-200",
    icon: (
      <svg className="h-4 w-4 shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  danger: {
    border: "border-rose-500/30",
    bg: "bg-rose-950/25",
    text: "text-rose-300",
    titleColor: "text-rose-200",
    icon: (
      <svg className="h-4 w-4 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

export function Callout({ type = "info", title, children }: CalloutProps) {
  const c = config[type] || config.info;

  return (
    <div className={`my-4 flex items-start gap-3 rounded-xl border p-4 text-xs leading-relaxed ${c.border} ${c.bg} ${c.text}`}>
      <div className="mt-0.5">{c.icon}</div>
      <div className="flex-1 space-y-1">
        {title && <div className={`font-semibold tracking-wide ${c.titleColor}`}>{title}</div>}
        <div className="text-slate-300 [&>p]:leading-relaxed [&>a]:text-emerald-400 [&>a]:underline">{children}</div>
      </div>
    </div>
  );
}
