// SICTACK – Developer Security Sidebar
// Direction A: Warm Editorial Software (Human-Centered Design)

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartIcon,
  UsersIcon,
  DocumentIcon,
  ClockIcon,
  ListIcon,
  BeakerIcon,
} from "@/components/icons";

const navItems = [
  { href: "/", label: "Overview", icon: ChartIcon, description: "Security metrics & live events" },
  { href: "/agents", label: "Agents", icon: UsersIcon, description: "Registered AI runtime agents" },
  { href: "/policies", label: "Policies", icon: DocumentIcon, description: "Deterministic authorization rules" },
  { href: "/approvals", label: "Approvals", icon: ClockIcon, description: "Human-in-the-loop queue" },
  { href: "/audit", label: "Audit Log", icon: ListIcon, description: "Immutable security trail" },
  { href: "/test", label: "Playground", icon: BeakerIcon, description: "Interactive intercept simulator" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-[#282A30] bg-[#121316] text-[#EDEDEB] font-sans">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-[#282A30] px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1D3557] border border-[#2E486F] text-white">
            <span className="font-mono font-bold text-xs">SC</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold tracking-tight text-[#EDEDEB]">
                SICTACK
              </span>
              <span className="rounded bg-[#1A1B1F] px-1.5 py-0.2 text-[9px] font-mono font-semibold text-[#A6A8B0] border border-[#2E3037]">
                SDK
              </span>
            </div>
            <p className="text-[10px] text-[#72747D] font-mono tracking-wide">
              RUNTIME SECURITY
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav aria-label="Sidebar Navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <div className="px-3 pb-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-[#72747D]">
          Security Console
        </div>
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B8AC4] ${
                isActive
                  ? "bg-[#1A1B1F] text-[#EDEDEB] border border-[#2E3037] shadow-xs"
                  : "text-[#A6A8B0] hover:bg-[#1A1B1F]/60 hover:text-[#EDEDEB] border border-transparent"
              }`}
            >
              <Icon
                size={16}
                className={isActive ? "text-[#5B8AC4]" : "text-[#72747D] group-hover:text-[#A6A8B0]"}
              />
              <div className="flex flex-col">
                <span className={isActive ? "font-semibold text-white" : ""}>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* System Status in Footer */}
      <div className="border-t border-[#282A30] p-4 bg-[#16171B]">
        <div className="rounded-lg border border-[#2E3037] bg-[#1A1B1F] p-3 text-[11px] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#A6A8B0] font-medium">Policy Engine</span>
            <span className="text-[10px] font-mono font-semibold text-[#488B68]">
              DETERMINISTIC
            </span>
          </div>
          <div className="text-[10px] text-[#72747D] font-mono">
            Fail-Closed Mode: ACTIVE
          </div>
          <div className="pt-2 border-t border-[#282A30] flex justify-between items-center text-[10px]">
            <a
              href="https://intentlock-backend-ze2i.onrender.com/docs"
              target="_blank"
              rel="noreferrer"
              className="text-[#72747D] hover:text-[#A6A8B0] transition-colors"
            >
              API OpenAPI Schema ↗
            </a>
            <span className="font-mono text-[#72747D]">Python 3.12+</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
