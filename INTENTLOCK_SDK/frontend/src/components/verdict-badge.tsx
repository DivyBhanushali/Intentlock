// SICTACK – Verdict badge component
// Concept A: Editorial Infrastructure (Calm Contrast & Accessible Status)

import React from "react";
import type { DecisionVerdict } from "@/lib/api";

const verdictLabels: Record<DecisionVerdict, string> = {
  ALLOW: "ALLOWED",
  DENY: "BLOCKED",
  REQUIRE_APPROVAL: "REQUIRE_APPROVAL",
};

export function VerdictBadge({ verdict }: { verdict: DecisionVerdict }) {
  const isAllow = verdict === "ALLOW";
  const isDeny = verdict === "DENY";

  const colorStyles = isAllow
    ? "bg-[#EDF5F0] text-[#234E39] border-[#D4E8DC]"
    : isDeny
    ? "bg-[#FDF1EF] text-[#943425] border-[#F8D5D0]"
    : "bg-[#FEF6EC] text-[#8D5B18] border-[#FBE3C6]";

  const dotColor = isAllow
    ? "bg-[#234E39]"
    : isDeny
    ? "bg-[#943425]"
    : "bg-[#8D5B18]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider ${colorStyles}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
      <span>{verdictLabels[verdict] || verdict}</span>
    </span>
  );
}

