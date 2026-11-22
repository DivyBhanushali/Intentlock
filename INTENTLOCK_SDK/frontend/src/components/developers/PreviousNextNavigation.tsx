// SICTACK 1.0 – Previous and Next Documentation Navigation
// Direction A: Warm Editorial Software (Human-Centered Design)
import Link from "next/link";

interface PageLink {
  title: string;
  href: string;
}

interface PreviousNextNavigationProps {
  prev?: PageLink;
  next?: PageLink;
}

export function PreviousNextNavigation({ prev, next }: PreviousNextNavigationProps) {
  if (!prev && !next) {
    return null;
  }

  return (
    <div className="mt-12 flex flex-col sm:flex-row gap-4 border-t border-[#E2E0D8] pt-6 text-xs font-sans">
      {prev ? (
        <Link
          href={prev.href}
          className="group flex-1 rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 transition-all hover:border-[#CECBC0] hover:shadow-[0_2px_8px_rgba(24,25,27,0.06)] shadow-[0_1px_3px_rgba(24,25,27,0.04)]"
        >
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#787A80] group-hover:text-[#1D3557] transition-colors">
            <svg className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Previous</span>
          </div>
          <div className="mt-1 text-sm font-semibold text-[#18191B] group-hover:text-[#1D3557]">
            {prev.title}
          </div>
        </Link>
      ) : (
        <div className="hidden sm:block flex-1" />
      )}

      {next ? (
        <Link
          href={next.href}
          className="group flex-1 rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 text-right transition-all hover:border-[#CECBC0] hover:shadow-[0_2px_8px_rgba(24,25,27,0.06)] shadow-[0_1px_3px_rgba(24,25,27,0.04)]"
        >
          <div className="flex items-center justify-end gap-1.5 text-[11px] font-medium text-[#787A80] group-hover:text-[#1D3557] transition-colors">
            <span>Next</span>
            <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div className="mt-1 text-sm font-semibold text-[#18191B] group-hover:text-[#1D3557]">
            {next.title}
          </div>
        </Link>
      ) : (
        <div className="hidden sm:block flex-1" />
      )}
    </div>
  );
}
