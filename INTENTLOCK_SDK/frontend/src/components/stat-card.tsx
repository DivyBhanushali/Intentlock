// INTENTLOCK – Compact, Precision Security Stat Card

import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  accentColor?: "emerald" | "red" | "amber" | "blue" | "purple";
}

const accentMap = {
  emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  red: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  blue: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  purple: "text-violet-400 bg-violet-500/10 border-violet-500/20",
};

export function StatCard({
  label,
  value,
  subtitle,
  icon,
  accentColor = "blue",
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-[#1a2233] bg-[#0d111a] p-4 transition-all hover:border-[#2b3a55]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg border ${accentMap[accentColor]}`}
        >
          {icon}
        </div>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-100 font-mono">
          {value}
        </span>
      </div>
      {subtitle && (
        <p className="mt-1 text-[11px] text-slate-500">{subtitle}</p>
      )}
    </div>
  );
}
