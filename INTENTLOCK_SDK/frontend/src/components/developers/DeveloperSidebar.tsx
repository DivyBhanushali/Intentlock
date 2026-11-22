// SICTACK 1.0 – Route-Aware Developer Portal Sidebar
// Direction A: Warm Editorial Software (Human-Centered Design)
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOCS_NAVIGATION } from "@/lib/docs-config";

interface DeveloperSidebarProps {
  onNavigate?: () => void;
}

export function DeveloperSidebar({ onNavigate }: DeveloperSidebarProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Developer Documentation" className="w-full space-y-7 text-xs select-none font-sans">
      {DOCS_NAVIGATION.map((section, sIdx) => (
        <div key={sIdx} className="space-y-1.5">
          <h3 className="px-3 text-[10px] font-mono font-semibold uppercase tracking-wider text-[#787A80]">
            {section.title}
          </h3>
          <ul className="space-y-0.5" role="list">
            {section.items.map((item, iIdx) => {
              const isActive = pathname === item.href;
              return (
                <li key={iIdx}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={isActive ? "page" : undefined}
                    className={`group flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D3557] min-h-[36px] ${
                      onNavigate ? "min-h-[44px]" : ""
                    } ${
                      isActive
                        ? "bg-[#1D3557]/10 text-[#1D3557] font-semibold border-l-2 border-[#1D3557] rounded-r-lg"
                        : "text-[#56585D] hover:bg-[#F4F3EE] hover:text-[#18191B] rounded-lg border-l-2 border-transparent"
                    }`}
                  >
                    <span className="truncate">{item.title}</span>
                    {item.badge && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider ${
                          isActive
                            ? "bg-[#1D3557]/15 text-[#1D3557]"
                            : "bg-[#F4F3EE] text-[#787A80] group-hover:text-[#56585D]"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
