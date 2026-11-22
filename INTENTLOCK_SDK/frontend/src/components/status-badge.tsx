// SICTACK – Status Badge for Human Approval Tokens
// Concept A: Editorial Infrastructure

import type { ApprovalStatus } from "@/lib/api";

const statusConfig: Record<
  ApprovalStatus,
  {
    classes: string;
    dotColor: string;
    label: string;
  }
> = {
  PENDING: {
    classes: "text-[#8D5B18] bg-[#FEF6EC] border-[#FBE3C6]",
    dotColor: "bg-[#8D5B18]",
    label: "PENDING REVIEW",
  },
  APPROVED: {
    classes: "text-[#234E39] bg-[#EDF5F0] border-[#D4E8DC]",
    dotColor: "bg-[#234E39]",
    label: "APPROVED",
  },
  REJECTED: {
    classes: "text-[#943425] bg-[#FDF1EF] border-[#F8D5D0]",
    dotColor: "bg-[#943425]",
    label: "REJECTED",
  },
  EXPIRED: {
    classes: "text-[#787E81] bg-[#F2F4F3] border-[#E4E9E8]",
    dotColor: "bg-[#787E81]",
    label: "EXPIRED",
  },
};

export function StatusBadge({ status }: { status: ApprovalStatus }) {
  const config = statusConfig[status] || statusConfig.EXPIRED;
  const isPending = status === "PENDING";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider border ${config.classes}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full shrink-0 ${config.dotColor} ${
          isPending ? "animate-pulse" : ""
        }`}
        aria-hidden="true"
      />
      <span>{config.label}</span>
    </span>
  );
}

