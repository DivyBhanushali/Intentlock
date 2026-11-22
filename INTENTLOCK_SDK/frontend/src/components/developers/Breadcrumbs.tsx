// SICTACK 1.0 – Contextual Breadcrumbs Navigation
// Direction A: Warm Editorial Software (Human-Centered Design)
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
    <nav aria-label="Breadcrumb" className="mb-6 flex items-center space-x-2 text-xs text-[#787A80]">
      <Link
        href="/developers"
        className="flex items-center gap-1 hover:text-[#1D3557] transition-colors"
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
            <svg className="h-3 w-3 text-[#CECBC0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-[#18191B] transition-colors text-[#56585D]">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "font-semibold text-[#18191B]" : "text-[#56585D]"}>
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
