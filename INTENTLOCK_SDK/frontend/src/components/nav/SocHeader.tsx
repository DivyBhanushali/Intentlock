// SICTACK – Compact Global SOC Product Header
// Concept A: Editorial Infrastructure

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  ShieldIcon,
  TerminalIcon,
  ChevronDownIcon,
} from "@/components/icons";

interface SocHeaderProps {
  onMobileMenuToggle: () => void;
  mobileMenuOpen: boolean;
}

export function SocHeader({ onMobileMenuToggle, mobileMenuOpen }: SocHeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const workspaceName = isAuthenticated && user?.org_name ? user.org_name : "Demo Session";
  const userEmail = isAuthenticated && user?.email ? user.email : "Guest Operator";
  const userRole = isAuthenticated && user?.role ? user.role : "Guest";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E4E9E8] bg-[#FFFFFF] text-[#202629] font-sans">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Left: Mobile Toggle, Brand & Workspace Identity */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onMobileMenuToggle}
            aria-label="Toggle navigation sidebar"
            aria-expanded={mobileMenuOpen}
            className="lg:hidden rounded border border-[#E4E9E8] bg-[#F2F4F3] p-1.5 text-[#5A6063] hover:text-[#202629] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#485F84] cursor-pointer"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link
            href="/"
            className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#485F84] rounded"
          >
            <span className="font-bold tracking-tight text-base text-[#202629] group-hover:text-[#485F84] transition-colors">
              SICTACK
            </span>
            <span className="rounded bg-[#F2F4F3] px-1.5 py-0.5 text-[9px] font-mono font-medium text-[#787E81] border border-[#E4E9E8]">
              SOC
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-2.5 pl-3 border-l border-[#E4E9E8]">
            <span className="text-xs text-[#5A6063] font-medium max-w-[140px] truncate">
              {workspaceName}
            </span>
            {isAuthenticated ? (
              <span className="rounded px-2 py-0.5 text-[10px] font-mono font-semibold text-[#234E39] bg-[#EDF5F0] border border-[#D4E8DC]">
                POLICY ENGINE READY
              </span>
            ) : (
              <span className="rounded px-2 py-0.5 text-[10px] font-mono font-semibold text-[#8D5B18] bg-[#FEF6EC] border border-[#FBE3C6]">
                STANDALONE PREVIEW
              </span>
            )}
          </div>
        </div>

        {/* Right: Quick Links & User Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5 text-xs">
          <Link
            href="/test"
            className="hidden lg:inline-flex items-center gap-1.5 rounded border border-[#E4E9E8] bg-[#FFFFFF] px-2.5 py-1 text-xs font-medium text-[#5A6063] hover:text-[#202629] hover:bg-[#F2F4F3] transition-colors"
          >
            <TerminalIcon size={13} />
            <span>Playground</span>
          </Link>

          <Link
            href="/developers"
            className="hidden md:inline-flex items-center gap-1.5 rounded border border-[#E4E9E8] bg-[#FFFFFF] px-2.5 py-1 text-xs font-medium text-[#5A6063] hover:text-[#202629] hover:bg-[#F2F4F3] transition-colors"
          >
            <ShieldIcon size={13} />
            <span>Developer Docs</span>
          </Link>

          <div className="h-4 w-px bg-[#E4E9E8] hidden md:block" />

          {/* User Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-1.5 sm:gap-2 rounded border border-[#E4E9E8] bg-[#FFFFFF] px-2 py-1 text-xs font-medium text-[#202629] hover:bg-[#F2F4F3] transition-colors cursor-pointer"
            >
              <div className="h-5 w-5 rounded-full bg-[#485F84] text-white flex items-center justify-center font-bold text-[10px]">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline-block max-w-[100px] md:max-w-[130px] truncate text-[11px] font-mono text-[#5A6063]">
                {userEmail}
              </span>
              <ChevronDownIcon size={12} className="text-[#787E81]" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-1.5 w-56 rounded-lg border border-[#E4E9E8] bg-[#FFFFFF] p-2 shadow-lg z-50 text-xs">
                <div className="px-3 py-2 border-b border-[#E4E9E8] mb-1">
                  <div className="font-semibold text-[#202629]">Signed in as</div>
                  <div className="font-mono text-[11px] text-[#5A6063] truncate">
                    {userEmail}
                  </div>
                  <div className="text-[10px] text-[#787E81] mt-0.5">Role: {userRole}</div>
                </div>

                <Link
                  href="/team"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 rounded px-3 py-2 text-[#5A6063] hover:bg-[#F2F4F3] hover:text-[#202629] transition-colors"
                >
                  <span>Team & API Keys</span>
                </Link>

                <Link
                  href="/developers"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 rounded px-3 py-2 text-[#5A6063] hover:bg-[#F2F4F3] hover:text-[#202629] transition-colors"
                >
                  <span>Developer Portal</span>
                </Link>

                <div className="my-1 border-t border-[#E4E9E8]" />

                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    className="w-full text-left rounded px-3 py-2 text-[#943425] hover:bg-[#FDF1EF] transition-colors cursor-pointer font-medium"
                  >
                    Sign Out
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 rounded px-3 py-2 text-[#485F84] hover:bg-[#D5E3FF]/30 transition-colors font-medium"
                  >
                    <span>Sign In to Organization</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

