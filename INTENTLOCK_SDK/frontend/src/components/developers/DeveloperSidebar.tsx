// INTENTLOCK 2.0 – Route-Aware Developer Portal Sidebar
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
    <nav aria-label="Developer Documentation" className="w-full space-y-7 text-xs select-none">
      {DOCS_NAVIGATION.map((section, sIdx) => (
        <div key={sIdx} className="space-y-2">
          <h3 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
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
                    className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                      isActive
                        ? "bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20"
                        : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                    }`}
                  >
                    <span className="truncate">{item.title}</span>
                    {item.badge && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider ${
                          isActive
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-slate-800 text-slate-400 group-hover:bg-slate-700"
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
