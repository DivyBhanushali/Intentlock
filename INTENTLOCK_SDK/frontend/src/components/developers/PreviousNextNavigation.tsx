// INTENTLOCK 2.0 – Previous and Next Documentation Navigation
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
    <div className="mt-12 flex flex-col sm:flex-row gap-4 border-t border-slate-800/80 pt-6">
      {prev ? (
        <Link
          href={prev.href}
          className="group flex-1 rounded-xl border border-slate-800/80 bg-[#0a0e17] p-4 transition-all hover:border-slate-700 hover:bg-slate-900/60"
        >
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 group-hover:text-emerald-400">
            <svg className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Previous</span>
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-200 group-hover:text-white">
            {prev.title}
          </div>
        </Link>
      ) : (
        <div className="hidden sm:block flex-1" />
      )}

      {next ? (
        <Link
          href={next.href}
          className="group flex-1 rounded-xl border border-slate-800/80 bg-[#0a0e17] p-4 text-right transition-all hover:border-slate-700 hover:bg-slate-900/60"
        >
          <div className="flex items-center justify-end gap-1.5 text-[11px] font-medium text-slate-400 group-hover:text-emerald-400">
            <span>Next</span>
            <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-200 group-hover:text-white">
            {next.title}
          </div>
        </Link>
      ) : (
        <div className="hidden sm:block flex-1" />
      )}
    </div>
  );
}
