// SICTACK 1.0 – Production Navigation Bar
// Direction A: Warm Editorial Software (Human-Centered Design)

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  SparklesIcon,
} from "@/components/icons";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
}

const primaryNav: NavItem[] = [
  { href: "/soc", label: "Overview", icon: ChartIcon },
  { href: "/intents", label: "Intents", icon: LockIcon, badge: "Core" },
  { href: "/threats", label: "Threat Intel", icon: ShieldIcon },
  { href: "/policies", label: "Policies", icon: DocumentIcon },
  { href: "/approvals", label: "Approvals", icon: ClockIcon },
  { href: "/audit", label: "Audit Ledger", icon: ListIcon },
  { href: "/developers", label: "Developers", icon: TerminalIcon, badge: "Docs" },
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
  {
    href: "/agents",
    title: "Registered AI Agents",
    desc: "Autonomous runtime identities bound to policy scopes",
    icon: UsersIcon,
  },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toolsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setToolsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (
        mobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        mobileToggleRef.current &&
        !mobileToggleRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  // Keyboard navigation & Escape key dismissal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (toolsOpen) setToolsOpen(false);
        if (profileOpen) setProfileOpen(false);
        if (mobileMenuOpen) {
          setMobileMenuOpen(false);
          mobileToggleRef.current?.focus();
        }
      }
    },
    [toolsOpen, profileOpen, mobileMenuOpen]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const isToolActive = secondaryTools.some((t) => pathname.startsWith(t.href));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#282A30] bg-[#121316]/95 backdrop-blur-md text-[#EDEDEB] font-sans">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left Section: Brand & Workspace */}
        <div className="flex items-center gap-3 lg:gap-4 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B8AC4] rounded"
          >
            {/* Restrained Architectural Emblem */}
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1D3557] border border-[#2E486F] text-white shadow-xs group-hover:border-[#5B8AC4] transition-colors">
              <span className="font-mono font-bold text-xs">SC</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold tracking-tight text-sm text-[#EDEDEB] group-hover:text-white transition-colors">
                SICTACK
              </span>
              <span className="rounded bg-[#1A1B1F] px-1.5 py-0.5 text-[9px] font-bold text-[#A6A8B0] border border-[#2E3037] font-mono">
                v1.0
              </span>
            </div>
          </Link>

          {/* Organization Tenant Tag */}
          <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-[#282A30] text-xs text-[#A6A8B0]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#488B68]" />
            <span className="font-medium text-[#EDEDEB] max-w-[140px] truncate">
              {user?.org_name || "Enterprise Workspace"}
            </span>
          </div>
        </div>

        {/* Center Section: Primary Navigation Tabs */}
        <nav aria-label="Primary Navigation" className="hidden md:flex items-center gap-1">
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
                aria-current={isActive ? "page" : undefined}
                className={`relative flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B8AC4] ${
                  isActive
                    ? "bg-[#1A1B1F] text-[#EDEDEB] border border-[#2E3037] shadow-xs"
                    : "text-[#A6A8B0] hover:text-[#EDEDEB] hover:bg-[#1A1B1F]/60"
                }`}
              >
                <Icon
                  size={14}
                  className={isActive ? "text-[#5B8AC4]" : "text-[#72747D]"}
                />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="rounded bg-[#222328] px-1 py-0.2 text-[8px] font-mono font-bold text-[#A6A8B0] border border-[#2E3037]">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-[-1px] left-2.5 right-2.5 h-[2px] rounded-full bg-[#5B8AC4]" />
                )}
              </Link>
            );
          })}

          {/* Tools & Diagnostics Dropdown */}
          <div className="relative" ref={toolsRef}>
            <button
              type="button"
              onClick={() => setToolsOpen(!toolsOpen)}
              aria-expanded={toolsOpen}
              aria-haspopup="true"
              className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B8AC4] ${
                isToolActive || toolsOpen
                  ? "bg-[#1A1B1F] text-[#EDEDEB] border border-[#2E3037]"
                  : "text-[#A6A8B0] hover:text-[#EDEDEB] hover:bg-[#1A1B1F]/60"
              }`}
            >
              <SparklesIcon size={13} className="text-[#5B8AC4]" />
              <span>Tools</span>
              <ChevronDownIcon
                size={12}
                className={`text-[#72747D] transition-transform duration-150 ${
                  toolsOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {toolsOpen && (
              <div
                className="absolute right-0 mt-2 w-72 rounded-xl border border-[#2E3037] bg-[#1A1B1F] p-2 shadow-2xl z-50 animate-in fade-in duration-100"
                role="menu"
              >
                <div className="px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-[#72747D] border-b border-[#26272D] mb-1">
                  Diagnostics & Forensics
                </div>
                <div className="mt-1 space-y-0.5">
                  {secondaryTools.map((tool) => {
                    const isToolCurrent = pathname.startsWith(tool.href);
                    const ToolIcon = tool.icon;
                    return (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        onClick={() => setToolsOpen(false)}
                        className={`flex items-start gap-2.5 rounded-lg p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B8AC4] ${
                          isToolCurrent
                            ? "bg-[#222328] border border-[#2E3037] text-[#EDEDEB]"
                            : "hover:bg-[#222328] text-[#A6A8B0] hover:text-[#EDEDEB]"
                        }`}
                        role="menuitem"
                      >
                        <div className="mt-0.5 rounded-md bg-[#26272D] p-1.5 text-[#A6A8B0]">
                          <ToolIcon size={14} />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[#EDEDEB]">{tool.title}</div>
                          <div className="text-[10px] text-[#72747D] line-clamp-1">
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

        {/* Right Section: Developers Link, Profile / Sign In, & Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Developer Portal Pill */}
          <Link
            href="/developers"
            className={`hidden sm:inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B8AC4] ${
              pathname.startsWith("/developers")
                ? "border-[#2E486F] bg-[#1D3557]/60 text-white font-semibold shadow-xs"
                : "border-[#282A30] bg-[#1A1B1F] text-[#A6A8B0] hover:text-[#EDEDEB] hover:border-[#383A42]"
            }`}
          >
            <TerminalIcon size={12} className={pathname.startsWith("/developers") ? "text-[#5B8AC4]" : "text-[#72747D]"} />
            <span>Developer Docs</span>
          </Link>

          {/* Auth State / Profile */}
          {isAuthenticated && user ? (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                aria-expanded={profileOpen}
                aria-haspopup="true"
                className="flex items-center gap-2 rounded-lg border border-[#282A30] bg-[#1A1B1F] px-2.5 py-1 text-xs text-[#EDEDEB] hover:border-[#383A42] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B8AC4]"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1D3557] border border-[#2E486F] text-[10px] font-bold text-white font-mono">
                  {user.email.slice(0, 2).toUpperCase()}
                </div>
                <span className="max-w-[100px] truncate font-medium text-xs hidden sm:inline">
                  {user.full_name || user.email.split("@")[0]}
                </span>
                <ChevronDownIcon size={11} className="text-[#72747D]" />
              </button>

              {profileOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-[#2E3037] bg-[#1A1B1F] p-3 shadow-2xl z-50 text-xs animate-in fade-in duration-100"
                  role="menu"
                >
                  <div className="border-b border-[#282A30] pb-2">
                    <p className="font-semibold text-[#EDEDEB] truncate">
                      {user.full_name || "Authenticated Operator"}
                    </p>
                    <p className="text-[10px] font-mono text-[#A6A8B0] truncate">
                      {user.email}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="rounded bg-[#222328] border border-[#2E3037] px-1.5 py-0.2 text-[9px] font-mono font-bold text-[#5B8AC4]">
                        {user.role}
                      </span>
                      <span className="text-[10px] text-[#72747D] truncate">
                        {user.org_name || "Enterprise"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 space-y-1">
                    <Link
                      href="/team"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[#A6A8B0] hover:bg-[#222328] hover:text-[#EDEDEB] transition-colors"
                      role="menuitem"
                    >
                      <UsersIcon size={13} />
                      <span>Workspace & API Keys</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-[#D15A47] hover:bg-[#2B1815] transition-colors cursor-pointer"
                      role="menuitem"
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#2E486F] bg-[#1D3557] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#14243B] transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B8AC4]"
            >
              <LockIcon size={12} />
              <span>Sign In</span>
            </Link>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            ref={mobileToggleRef}
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
            aria-controls="navbar-mobile-drawer"
            className="md:hidden p-2 rounded-md border border-[#282A30] bg-[#1A1B1F] text-[#EDEDEB] hover:bg-[#222328] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B8AC4]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* ─── MOBILE DRAWER (RESPONSIVE 375px - 768px) ─── */}
      {mobileMenuOpen && (
        <div
          id="navbar-mobile-drawer"
          ref={mobileMenuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          className="md:hidden border-b border-[#282A30] bg-[#1A1B1F] p-4 space-y-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#72747D]">
            Security Console Navigation
          </div>
          <div className="space-y-1">
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
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium min-h-[44px] transition-colors ${
                    isActive
                      ? "bg-[#222328] text-white border border-[#2E3037]"
                      : "text-[#A6A8B0] hover:bg-[#222328] hover:text-[#EDEDEB]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={15} className={isActive ? "text-[#5B8AC4]" : "text-[#72747D]"} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#26272D] text-[#A6A8B0]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#26272D] space-y-1">
            <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#72747D] px-3 pb-1">
              Tools & Diagnostics
            </div>
            {secondaryTools.map((tool) => {
              const isToolCurrent = pathname.startsWith(tool.href);
              const ToolIcon = tool.icon;
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium min-h-[44px] transition-colors ${
                    isToolCurrent
                      ? "bg-[#222328] text-white border border-[#2E3037]"
                      : "text-[#A6A8B0] hover:bg-[#222328] hover:text-[#EDEDEB]"
                  }`}
                >
                  <ToolIcon size={15} className={isToolCurrent ? "text-[#5B8AC4]" : "text-[#72747D]"} />
                  <span>{tool.title}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Footer Auth / Profile */}
          <div className="pt-3 border-t border-[#26272D]">
            {isAuthenticated && user ? (
              <div className="flex items-center justify-between px-3 py-2 bg-[#222328] rounded-lg border border-[#2E3037]">
                <div className="truncate">
                  <div className="text-xs font-semibold text-[#EDEDEB] truncate">
                    {user.full_name || user.email.split("@")[0]}
                  </div>
                  <div className="text-[10px] font-mono text-[#72747D] truncate">
                    {user.email}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="text-xs text-[#D15A47] hover:underline cursor-pointer shrink-0 ml-2"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 rounded-md text-xs font-medium text-white bg-[#1D3557] hover:bg-[#14243B] min-h-[44px] flex items-center justify-center transition-colors shadow-xs"
              >
                Sign In to Security Console
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
