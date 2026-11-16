// INTENTLOCK 2.0 – Contextual Breadcrumbs Navigation
import Link from "next/link";
import { BreadcrumbItem } from "./types";

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex items-center space-x-2 text-xs text-slate-400">
      <Link
        href="/developers"
        className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span>Docs</span>
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={index} className="flex items-center space-x-2">
            <svg className="h-3 w-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-slate-200 transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "font-medium text-slate-200" : ""}>
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
