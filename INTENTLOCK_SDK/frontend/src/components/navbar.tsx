// INTENTLOCK 2.0 – Enterprise Cyber Navigation Bar

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  ShieldIcon,
  ChartIcon,
  UsersIcon,
  DocumentIcon,
  ClockIcon,
  ListIcon,
  BeakerIcon,
  LockIcon,
  TerminalIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  SparklesIcon,
} from "@/components/icons";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
}

const primaryNav: NavItem[] = [
  { href: "/", label: "Overview", icon: ChartIcon },
  { href: "/intents", label: "Intents", icon: LockIcon, badge: "Core" },
  { href: "/threats", label: "Threat Intel", icon: ShieldIcon },
  { href: "/policies", label: "Policies", icon: DocumentIcon },
  { href: "/approvals", label: "Approvals", icon: ClockIcon },
  { href: "/audit", label: "Audit Ledger", icon: ListIcon },
];

const secondaryTools = [
  {
    href: "/provenance",
    title: "Provenance & Evidence Graph",
    desc: "Causal trace reconstruction linking intent to tool decisions",
    icon: DocumentIcon,
  },
  {
    href: "/benchmark",
    title: "Adversarial Benchmark",
    desc: "Automated 25-vector penetration evaluation suite",
    icon: BeakerIcon,
  },
  {
    href: "/test",
    title: "Security Playground",
    desc: "Simulate live agent tool interceptions and payload attacks",
    icon: TerminalIcon,
  },
  {
    href: "/team",
    title: "Workspace & API Keys",
    desc: "Manage team member RBAC roles and programmatic keys",
    icon: UsersIcon,
  },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const toolsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setToolsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isToolActive = secondaryTools.some((t) => pathname.startsWith(t.href));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#080b12]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left Section: Brand & Workspace */}
        <div className="flex items-center gap-3 lg:gap-4 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 group-hover:border-emerald-400/40 transition-colors shadow-xs">
              <LockIcon size={16} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-sm text-slate-100 group-hover:text-emerald-300 transition-colors">
                INTENTLOCK
              </span>
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/20 font-mono">
                v2.0
              </span>
            </div>
          </Link>

          {/* Organization Tenant Tag */}
          <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-slate-800 text-xs text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
            <span className="font-medium text-slate-300 max-w-[140px] truncate">
              {user?.org_name || "Enterprise Workspace"}
            </span>
          </div>
        </div>

        {/* Center Section: Primary Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1">
          {primaryNav.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-slate-800/80 text-emerald-400 shadow-xs"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                <Icon
                  size={14}
                  className={isActive ? "text-emerald-400" : "text-slate-400"}
                />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="rounded bg-emerald-500/15 px-1 py-0.2 text-[8px] font-bold text-emerald-400">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-2.5 right-2.5 h-[2px] rounded-full bg-emerald-400" />
                )}
              </Link>
            );
          })}

          {/* Tools & Diagnostics Dropdown */}
          <div className="relative" ref={toolsRef}>
            <button
              onClick={() => setToolsOpen(!toolsOpen)}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
                isToolActive || toolsOpen
                  ? "bg-slate-800/80 text-slate-200"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <SparklesIcon size={13} className="text-indigo-400" />
              <span>Tools</span>
              <ChevronDownIcon
                size={12}
                className={`transition-transform duration-150 ${
                  toolsOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {toolsOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-800 bg-[#0d111a] p-2 shadow-2xl backdrop-blur-xl z-50">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Security Intelligence & Tools
                </div>
                <div className="mt-1 space-y-1">
                  {secondaryTools.map((tool) => {
                    const isToolCurrent = pathname.startsWith(tool.href);
                    const ToolIcon = tool.icon;
                    return (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        onClick={() => setToolsOpen(false)}
                        className={`flex items-start gap-2.5 rounded-lg p-2 transition-all ${
                          isToolCurrent
                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                            : "hover:bg-slate-800/60 text-slate-300 hover:text-slate-100"
                        }`}
                      >
                        <div className="mt-0.5 rounded-md bg-slate-800 p-1.5 text-slate-300">
                          <ToolIcon size={14} />
                        </div>
                        <div>
                          <div className="text-xs font-semibold">{tool.title}</div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">
                            {tool.desc}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Right Section: Telemetry Status & Account */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Status Guard Badge */}
          <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-[11px] font-mono text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-[10px]">8-STAGE GUARD ACTIVE</span>
          </div>

          {/* API Docs Button */}
          <a
            href="https://intentlock-backend-ze2i.onrender.com/docs"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900/60 px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
          >
            <span>API Docs</span>
            <ExternalLinkIcon size={11} />
          </a>

          {/* Auth State / Profile */}
          {isAuthenticated && user ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-lg border border-slate-800 bg-[#0d111a] px-2.5 py-1 text-xs text-slate-200 hover:border-slate-700 transition-colors"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-[10px] font-bold text-slate-950">
                  {user.email.slice(0, 2).toUpperCase()}
                </div>
                <span className="max-w-[100px] truncate font-medium text-xs hidden sm:inline">
                  {user.full_name || user.email.split("@")[0]}
                </span>
                <ChevronDownIcon size={11} className="text-slate-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-[#0d111a] p-3 shadow-2xl z-50 text-xs">
                  <div className="border-b border-slate-800/80 pb-2">
                    <p className="font-semibold text-slate-100 truncate">
                      {user.full_name || "Operator"}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400 truncate">
                      {user.email}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="rounded bg-indigo-500/15 border border-indigo-500/30 px-1.5 py-0.2 text-[9px] font-mono font-bold text-indigo-400">
                        {user.role}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {user.org_name}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 space-y-1">
                    <Link
                      href="/team"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-slate-300 hover:bg-slate-800/60 hover:text-slate-100 transition-colors"
                    >
                      <UsersIcon size={13} />
                      <span>Workspace & API Keys</span>
                    </Link>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <LockIcon size={13} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-xs"
            >
              <LockIcon size={12} />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
