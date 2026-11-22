// SICTACK – Public Marketing Navigation Bar
// Approved Concept A: Editorial Infrastructure (Stripe Press / Linear)

"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { IconTerminal, IconCode, IconArrowForward, IconMenu, IconClose } from "@/components/ui/Icons";

export function PublicNavbar() {
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);

  // Close mobile drawer on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
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

  // Escape key handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
        mobileToggleRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#f8f9f8]/95 backdrop-blur-md border-b border-[#e4e9e8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-6 lg:gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 group flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#485f84] rounded"
          >
            <span className="text-primary font-bold tracking-tight flex items-center">
              <IconTerminal className="w-5 h-5 text-[#485f84] mr-1.5" />
              <span className="text-lg font-bold text-[#202629] tracking-tighter">
                SICTACK
              </span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#ebeeed] text-[#56585d] font-medium border border-[#e4e9e8]">
              v1.0.0
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-5 text-sm tracking-tight font-sans">
            <Link
              href="/#overview"
              className="text-[#202629] font-semibold hover:text-[#485f84] transition-colors duration-150"
            >
              Overview
            </Link>
            <Link
              href="/core"
              className="text-[#56585d] font-medium hover:text-[#485f84] transition-colors duration-150"
            >
              SICTACK CORE
            </Link>
            <Link
              href="/sentinel"
              className="text-[#56585d] font-medium hover:text-[#485f84] transition-colors duration-150"
            >
              SICTACK SENTINEL
            </Link>
            <Link
              href="/soc"
              className="text-[#56585d] font-medium hover:text-[#485f84] transition-colors duration-150"
            >
              SOC Console
            </Link>
            <Link
              href="/developers"
              className="text-[#56585d] font-medium hover:text-[#485f84] transition-colors duration-150"
            >
              Documentation
            </Link>
            <Link
              href="/benchmark"
              className="text-[#56585d] font-medium hover:text-[#485f84] transition-colors duration-150"
            >
              Benchmarks
            </Link>
          </nav>
        </div>

        {/* Right CTAs */}
        <div className="flex items-center gap-3 sm:gap-4 text-sm flex-shrink-0">
          {/* GitHub Link (Unverified star count removed) */}
          <a
            className="hidden sm:inline-flex items-center gap-1.5 text-[#56585d] hover:text-[#202629] transition-colors duration-150 font-medium text-xs py-1 px-2 rounded hover:bg-[#ebeeed]"
            href="https://github.com/sictack/sictack"
            rel="noreferrer"
            target="_blank"
            title="View source on GitHub"
          >
            <IconCode className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>

          {/* User Sign In / Profile */}
          {isAuthenticated && user ? (
            <Link
              href="/team"
              className="inline-flex items-center gap-2 text-xs text-[#56585d] hover:text-[#202629] transition-colors px-2 py-1 rounded"
            >
              <div className="w-5 h-5 rounded-full bg-[#485f84] text-white flex items-center justify-center text-[10px] font-mono font-bold">
                {user.email.slice(0, 2).toUpperCase()}
              </div>
              <span className="hidden xl:inline max-w-[110px] truncate text-xs font-mono">
                {user.org_name || user.email.split("@")[0]}
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-[#56585d] hover:text-[#202629] font-medium transition duration-150 ease-in-out active:scale-95 text-xs px-2 py-1 rounded"
            >
              Sign In
            </Link>
          )}

          {/* Primary Action Button (Navy with accessible white text) */}
          <Link
            href="/soc"
            className="hidden sm:inline-flex bg-[#485f84] text-[#ffffff] hover:bg-[#3c5377] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#485f84] focus-visible:ring-offset-2 px-3.5 py-1.5 rounded font-medium text-xs transition duration-150 ease-in-out active:scale-95 shadow-sm items-center gap-1"
          >
            <span>Get Started</span>
            <IconArrowForward className="w-3.5 h-3.5 text-[#ffffff]" />
          </Link>

          {/* Mobile Menu Button */}
          <button
            ref={mobileToggleRef}
            type="button"
            aria-label="Toggle navigation"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded text-[#202629] hover:bg-[#ebeeed] transition-colors flex items-center justify-center"
          >
            {mobileMenuOpen ? (
              <IconClose className="w-5 h-5 text-[#202629]" />
            ) : (
              <IconMenu className="w-5 h-5 text-[#202629]" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          id="mobile-menu"
          className="lg:hidden fixed inset-x-0 top-16 bg-[#ffffff] border-b border-[#e4e9e8] z-40 p-5 shadow-lg flex flex-col gap-2 font-sans text-sm animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <Link
            href="/#overview"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2.5 px-3 rounded text-[#202629] hover:bg-[#f2f4f3] flex justify-between items-center"
          >
            <span>Overview</span>
            <IconArrowForward className="w-3.5 h-3.5 text-[#757c7b]" />
          </Link>
          <Link
            href="/core"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2.5 px-3 rounded text-[#202629] hover:bg-[#f2f4f3] flex justify-between items-center"
          >
            <span>SICTACK CORE Deterministic Engine</span>
            <IconArrowForward className="w-3.5 h-3.5 text-[#757c7b]" />
          </Link>
          <Link
            href="/sentinel"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2.5 px-3 rounded text-[#202629] hover:bg-[#f2f4f3] flex justify-between items-center"
          >
            <span>SICTACK SENTINEL Behavioral Radar</span>
            <IconArrowForward className="w-3.5 h-3.5 text-[#757c7b]" />
          </Link>
          <Link
            href="/soc"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2.5 px-3 rounded text-[#202629] hover:bg-[#f2f4f3] flex justify-between items-center"
          >
            <span>SOC Console</span>
            <IconArrowForward className="w-3.5 h-3.5 text-[#757c7b]" />
          </Link>
          <Link
            href="/developers"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2.5 px-3 rounded text-[#202629] hover:bg-[#f2f4f3] flex justify-between items-center"
          >
            <span>SDK &amp; Documentation</span>
            <IconArrowForward className="w-3.5 h-3.5 text-[#757c7b]" />
          </Link>
          <Link
            href="/benchmark"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2.5 px-3 rounded text-[#202629] hover:bg-[#f2f4f3] flex justify-between items-center"
          >
            <span>Adversarial Benchmarks</span>
            <IconArrowForward className="w-3.5 h-3.5 text-[#757c7b]" />
          </Link>

          <div className="pt-3 border-t border-[#e4e9e8] flex flex-col gap-2">
            {!isAuthenticated && (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2 px-3 text-center text-xs font-medium text-[#202629] bg-[#f2f4f3] rounded border border-[#e4e9e8]"
              >
                Sign In
              </Link>
            )}
            <Link
              href="/soc"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2 px-3 text-center text-xs font-medium text-[#ffffff] bg-[#485f84] hover:bg-[#3c5377] rounded shadow-sm"
            >
              Open Live Console
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
