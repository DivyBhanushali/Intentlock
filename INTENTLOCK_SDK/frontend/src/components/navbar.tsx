// INTENTLOCK – Ultra-Minimal Horizontal Navbar

"use client";

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
} from "@/components/icons";

const navItems = [
  { href: "/", label: "Overview", icon: ChartIcon },
  { href: "/agents", label: "Agents", icon: UsersIcon },
  { href: "/policies", label: "Policies", icon: DocumentIcon },
  { href: "/approvals", label: "Approvals", icon: ClockIcon },
  { href: "/audit", label: "Audit Log", icon: ListIcon },
  { href: "/test", label: "Playground", icon: BeakerIcon },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="il-navbar">
      <div className="il-navbar-inner">
        {/* Brand */}
        <Link href="/" className="il-brand">
          <div className="il-brand-icon">
            <LockIcon size={16} />
          </div>
          <div className="il-brand-text">
            <span className="il-brand-title">INTENTLOCK</span>
            <span className="il-brand-badge">ENTERPRISE</span>
          </div>
        </Link>

        {/* Horizontal Navigation Pills */}
        <nav className="il-nav-pills">
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
                className={`il-nav-link ${isActive ? "active" : ""}`}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Controls: Workspace / Auth & Status */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 rounded-lg bg-[#0d111a] border border-[#1a2233] px-2.5 py-1 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="font-semibold text-slate-200">{user.org_name}</span>
              <button
                onClick={logout}
                title="Sign Out"
                className="ml-1 text-[10px] text-slate-500 hover:text-rose-400 font-mono transition-colors"
              >
                [Exit]
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all"
            >
              <LockIcon size={12} />
              Sign In
            </Link>
          )}

          {/* Status Indicator */}
          <div className="il-status-badge">
            <span className="il-status-dot" />
            <span className="il-status-text">FAIL-CLOSED ACTIVE</span>
          </div>
        </div>
      </div>
    </header>
  );
}

