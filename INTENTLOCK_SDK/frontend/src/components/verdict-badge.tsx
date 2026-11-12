// INTENTLOCK – Verdict badge component

import type { DecisionVerdict } from "@/lib/api";

const verdictStyles: Record<DecisionVerdict, string> = {
  ALLOW: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  DENY: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  REQUIRE_APPROVAL: "bg-amber-500/10 text-amber-400 border-amber-500/30",
};

const verdictLabels: Record<DecisionVerdict, string> = {
  ALLOW: "ALLOW",
  DENY: "DENY",
  REQUIRE_APPROVAL: "REQ_APPROVAL",
};

export function VerdictBadge({ verdict }: { verdict: DecisionVerdict }) {
  const isAllow = verdict === "ALLOW";
  const isDeny = verdict === "DENY";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wider ${verdictStyles[verdict]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isAllow ? "bg-emerald-400" : isDeny ? "bg-rose-400" : "bg-amber-400"
        }`}
      />
      {verdictLabels[verdict]}
    </span>
  );
}
