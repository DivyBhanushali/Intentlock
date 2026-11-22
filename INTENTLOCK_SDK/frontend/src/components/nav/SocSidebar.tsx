// SICTACK – Dedicated SOC Navigation Sidebar
// Concept A: Editorial Infrastructure

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartIcon,
  UsersIcon,
  LockIcon,
  DocumentIcon,
  ClockIcon,
  ShieldIcon,
  ListIcon,
  TerminalIcon,
  BeakerIcon,
  GitBranchIcon,
} from "@/components/icons";

interface SocSidebarProps {
  onNavigate?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
  isExternal?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "OVERVIEW",
    items: [
      { href: "/soc", label: "Security Overview", icon: ChartIcon },
    ],
  },
  {
    title: "SECURITY ENGINES",
    items: [
      { href: "/soc/core", label: "CORE Interception", icon: ShieldIcon, badge: "Deterministic" },
      { href: "/soc/sentinel", label: "SENTINEL Radar", icon: BeakerIcon, badge: "Behavioral" },
    ],
  },
  {
    title: "GOVERNANCE",
    items: [
      { href: "/agents", label: "Agent Identity", icon: UsersIcon },
      { href: "/intents", label: "Intent Authorization", icon: LockIcon, badge: "IAM" },
      { href: "/policies", label: "Security Policies", icon: DocumentIcon },
      { href: "/approvals", label: "Human Approvals", icon: ClockIcon },
    ],
  },
  {
    title: "INVESTIGATION",
    items: [
      { href: "/threats", label: "Threat Intelligence", icon: ShieldIcon },
      { href: "/provenance", label: "Evidence Graph", icon: GitBranchIcon },
      { href: "/audit", label: "Security Audit Ledger", icon: ListIcon },
    ],
  },
  {
    title: "ENGINEERING",
    items: [
      { href: "/test", label: "Playground", icon: TerminalIcon },
      { href: "/benchmark", label: "Adversarial Benchmarks", icon: BeakerIcon },
      { href: "/developers", label: "Developer Portal", icon: TerminalIcon, badge: "Docs" },
    ],
  },
];

export function SocSidebar({ onNavigate }: SocSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col justify-between h-full font-sans select-none text-xs">
      <nav
        aria-label="SOC Navigation"
        className="w-full space-y-5 py-4"
      >
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <div className="px-3 text-[10px] font-mono font-semibold uppercase tracking-wider text-[#787E81]">
              {group.title}
            </div>
            <ul className="space-y-0.5" role="list">
              {group.items.map((item, iIdx) => {
                const isActive =
                  item.href === "/soc"
                    ? pathname === "/soc"
                    : pathname.startsWith(item.href);

                const Icon = item.icon;

                return (
                  <li key={iIdx}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      className={`group flex items-center justify-between rounded px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#485F84] min-h-[34px] ${
                        onNavigate ? "min-h-[44px]" : ""
                      } ${
                        isActive
                          ? "bg-[#485F84]/10 text-[#485F84] font-semibold border-l-2 border-[#485F84]"
                          : "text-[#5A6063] hover:bg-[#F2F4F3] hover:text-[#202629]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-1.5">
                        <Icon
                          size={15}
                          className={`shrink-0 ${
                            isActive
                              ? "text-[#485F84]"
                              : "text-[#787E81] group-hover:text-[#202629]"
                          }`}
                        />
                        <span className="truncate font-medium">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-wider ${
                            isActive
                              ? "bg-[#485F84]/20 text-[#485F84]"
                              : "bg-[#F2F4F3] text-[#787E81] group-hover:text-[#5A6063]"
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

      {/* Bottom Invariant Status Box */}
      <div className="pt-3 pb-4 border-t border-[#E4E9E8] mt-auto">
        <div className="rounded border border-[#E4E9E8] bg-[#F8F9F8] p-2.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold text-[#234E39]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#234E39] animate-pulse" />
              FAIL-CLOSED ACTIVE
            </span>
            <span className="text-[9px] font-mono text-[#787E81]">Python 3.12+</span>
          </div>
          <p className="text-[10px] text-[#5A6063] leading-snug">
            Deterministic tool evaluation at execution boundary.
          </p>
        </div>
      </div>
    </div>
  );
}

