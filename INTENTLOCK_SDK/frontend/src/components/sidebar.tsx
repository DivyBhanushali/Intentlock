// INTENTLOCK – Developer Security Sidebar

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldIcon,
  ChartIcon,
  UsersIcon,
  DocumentIcon,
  ClockIcon,
  ListIcon,
  BeakerIcon,
  LockIcon,
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
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-[#1a2233] bg-[#0a0e17]">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-[#1a2233] px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <LockIcon size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight text-slate-100">
                INTENTLOCK
              </span>
              <span className="rounded bg-emerald-500/15 px-1 py-0.2 text-[9px] font-semibold text-emerald-400 border border-emerald-500/30">
                SDK
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium tracking-wide">
              AGENT SECURITY LAYER
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
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
              className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-slate-400 hover:bg-[#121824] hover:text-slate-200 border border-transparent"
              }`}
            >
              <Icon
                size={16}
                className={isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"}
              />
              <div className="flex flex-col">
                <span className="font-semibold">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Engine Status Card in Footer */}
      <div className="border-t border-[#1a2233] p-4 bg-[#07090e]/60">
        <div className="rounded-lg border border-[#1a2233] bg-[#0d111a] p-3 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Gateway Guard</span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ACTIVE
            </span>
          </div>
          <div className="mt-1.5 text-[10px] text-slate-500 font-mono">
            Fail-Closed Mode: ON
          </div>
          <div className="mt-2 pt-2 border-t border-[#1a2233] flex justify-between items-center text-[10px]">
            <a
              href="https://intentlock-backend-ze2i.onrender.com/docs"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-emerald-400 transition-colors"
            >
              API Swagger Docs ↗
            </a>
            <span className="text-slate-600">v0.1.0</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
