// SICTACK – Compact, Precision Security Stat Card
// Concept A: Editorial Infrastructure (Surface White & Calm Semantic Accents)

import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  accentColor?: "emerald" | "red" | "amber" | "blue" | "purple";
}

const accentMap = {
  emerald: "text-[#234E39] bg-[#EDF5F0] border-[#D4E8DC]",
  red: "text-[#943425] bg-[#FDF1EF] border-[#F8D5D0]",
  amber: "text-[#8D5B18] bg-[#FEF6EC] border-[#FBE3C6]",
  blue: "text-[#485F84] bg-[#D5E3FF]/40 border-[#485F84]/20",
  purple: "text-[#485F84] bg-[#F2F4F3] border-[#E4E9E8]",
};

export function StatCard({
  label,
  value,
  subtitle,
  icon,
  accentColor = "blue",
}: StatCardProps) {
  return (
    <div className="rounded-lg border border-[#E4E9E8] bg-[#FFFFFF] p-4.5 shadow-xs transition-all hover:border-[#ADB3B2] hover:shadow-sm font-sans">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-[#5A6063] font-mono">{label}</span>
        <div
          className={`flex h-7 w-7 items-center justify-center rounded border ${accentMap[accentColor]}`}
        >
          {icon}
        </div>
      </div>
      <div className="mt-2.5 flex items-baseline gap-2">
        <span className="text-2xl lg:text-3xl font-bold tracking-tight text-[#202629] font-mono">
          {value}
        </span>
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-[#787E81] truncate font-normal">{subtitle}</p>
      )}
    </div>
  );
}

