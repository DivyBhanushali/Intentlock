// INTENTLOCK – Status badge for approval status

import type { ApprovalStatus } from "@/lib/api";

const statusStyles: Record<ApprovalStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  REJECTED: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  EXPIRED: "bg-slate-500/10 text-slate-400 border-slate-500/30",
};

export function StatusBadge({ status }: { status: ApprovalStatus }) {
  const isPending = status === "PENDING";
  const isApproved = status === "APPROVED";
  const isRejected = status === "REJECTED";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide ${statusStyles[status]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isPending
            ? "bg-amber-400 animate-pulse"
            : isApproved
            ? "bg-emerald-400"
            : isRejected
            ? "bg-rose-400"
            : "bg-slate-400"
        }`}
      />
      {status}
    </span>
  );
}
