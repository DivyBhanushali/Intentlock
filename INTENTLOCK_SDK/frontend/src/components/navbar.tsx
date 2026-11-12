// INTENTLOCK – Ultra-Minimal Horizontal Navbar

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
  { href: "/", label: "Overview", icon: ChartIcon },
  { href: "/agents", label: "Agents", icon: UsersIcon },
  { href: "/policies", label: "Policies", icon: DocumentIcon },
  { href: "/approvals", label: "Approvals", icon: ClockIcon },
  { href: "/audit", label: "Audit Log", icon: ListIcon },
  { href: "/test", label: "Playground", icon: BeakerIcon },
];

export function Navbar() {
  const pathname = usePathname();

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
            <span className="il-brand-badge">SDK</span>
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

        {/* Status Indicator */}
        <div className="il-status-badge">
          <span className="il-status-dot" />
          <span className="il-status-text">FAIL-CLOSED ACTIVE</span>
        </div>
      </div>
    </header>
  );
}

