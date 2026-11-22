// SICTACK 1.0 – Reusable Documentation Callout / Alert Box
// Direction A: Warm Editorial Software (Human-Centered Design)
import React from "react";
import { CalloutType } from "./types";

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}

const config = {
  info: {
    border: "border-[#CFDEEB]",
    bg: "bg-[#EEF4F8]",
    text: "text-[#18191B]",
    titleColor: "text-[#1D3557]",
    icon: (
      <svg className="h-4 w-4 shrink-0 text-[#1D3557]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  tip: {
    border: "border-[#D4E8DC]",
    bg: "bg-[#EDF5F0]",
    text: "text-[#18191B]",
    titleColor: "text-[#234E39]",
    icon: (
      <svg className="h-4 w-4 shrink-0 text-[#234E39]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  warning: {
    border: "border-[#FBE3C6]",
    bg: "bg-[#FEF6EC]",
    text: "text-[#18191B]",
    titleColor: "text-[#8D5B18]",
    icon: (
      <svg className="h-4 w-4 shrink-0 text-[#8D5B18]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  danger: {
    border: "border-[#F8D5D0]",
    bg: "bg-[#FDF1EF]",
    text: "text-[#18191B]",
    titleColor: "text-[#943425]",
    icon: (
      <svg className="h-4 w-4 shrink-0 text-[#943425]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

export function Callout({ type = "info", title, children }: CalloutProps) {
  const c = config[type] || config.info;

  return (
    <div className={`my-5 flex items-start gap-3 rounded-xl border p-4 text-xs leading-relaxed shadow-xs ${c.border} ${c.bg} ${c.text}`}>
      <div className="mt-0.5">{c.icon}</div>
      <div className="flex-1 space-y-1">
        {title && <div className={`font-semibold tracking-wide ${c.titleColor}`}>{title}</div>}
        <div className="text-[#56585D] [&>p]:leading-relaxed [&>a]:text-[#1D3557] [&>a]:underline [&>code]:font-mono [&>code]:text-[#18191B] [&>code]:bg-[#F4F3EE] [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:border [&>code]:border-[#E2E0D8]">
          {children}
        </div>
      </div>
    </div>
  );
}
