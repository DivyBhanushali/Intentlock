// SICTACK 1.0 – Developer Portal Layout Shell
// Direction A: Warm Editorial Software (Human-Centered Design)
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { DeveloperSidebar } from "./DeveloperSidebar";
import { DocumentationSearch } from "./DocumentationSearch";
import { TableOfContents } from "./TableOfContents";
import { TocItem, BreadcrumbItem } from "./types";
import { Breadcrumbs } from "./Breadcrumbs";

interface DeveloperLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  toc?: TocItem[];
}

export function DeveloperLayout({
  children,
  breadcrumbs = [],
  toc = [],
}: DeveloperLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile drawer on Escape key and return focus
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

  const handleCloseMobileMenu = () => {
    setMobileMenuOpen(false);
    mobileToggleRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-[#FBFBF9] text-[#18191B] flex flex-col font-sans">
      {/* Topbar for Documentation */}
      <header className="sticky top-0 z-40 w-full border-b border-[#E2E0D8] bg-[#FFFFFF]/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle Button */}
            <button
              ref={mobileToggleRef}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle developer navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="developer-mobile-drawer"
              className="lg:hidden rounded-lg border border-[#E2E0D8] bg-[#FFFFFF] p-1.5 text-[#56585D] hover:text-[#18191B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D3557] shadow-xs"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Portal Title & Return Link */}
            <div className="flex items-center gap-3">
              <Link
                href="/developers"
                className="font-semibold text-sm tracking-tight text-[#18191B] hover:text-[#1D3557] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D3557] transition-colors"
              >
                Developer Portal
              </Link>
              <Link
                href="/soc"
                className="hidden md:inline-flex items-center text-xs text-[#787A80] hover:text-[#18191B] transition-colors pl-3 border-l border-[#E2E0D8]"
              >
                ← Return to Console
              </Link>
            </div>

            {/* SDK & Runtime Compatibility Badges */}
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="inline-flex items-center rounded-md border border-[#E2E0D8] bg-[#F4F3EE] px-2 py-0.5 text-[10px] font-mono font-medium text-[#56585D]">
                Python 3.12+
              </span>
              <span className="inline-flex items-center rounded-md border border-[#E2E0D8] bg-[#F4F3EE] px-2 py-0.5 text-[10px] font-mono font-medium text-[#787A80]">
                SDK v1.0.0
              </span>
            </div>
          </div>

          {/* Search Trigger & External Links */}
          <div className="flex items-center gap-2.5">
            <DocumentationSearch />
            <Link
              href="/test"
              className="hidden md:inline-flex items-center gap-1 rounded-lg border border-[#E2E0D8] bg-[#FFFFFF] px-2.5 py-1.5 text-xs text-[#56585D] hover:border-[#CECBC0] hover:text-[#18191B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D3557] transition-colors shadow-xs"
            >
              <span>Playground</span>
              <svg className="h-3 w-3 text-[#787A80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
            <a
              href="https://intentlock-backend-ze2i.onrender.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1 rounded-lg border border-[#E2E0D8] bg-[#FFFFFF] px-2.5 py-1.5 text-xs text-[#787A80] hover:border-[#CECBC0] hover:text-[#18191B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D3557] transition-colors shadow-xs"
              title="Open raw FastAPI OpenAPI / Swagger interactive documentation"
            >
              <span>Swagger UI</span>
              <svg className="h-3 w-3 text-[#787A80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      {/* Main Documentation Grid */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 px-4 sm:px-6">
        {/* Desktop Fixed Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-[#E2E0D8] py-8 pr-6 overflow-y-auto max-h-[calc(100vh-3.5rem)] sticky top-14">
          <DeveloperSidebar />
        </aside>

        {/* Mobile Slide-Over Drawer */}
        {mobileMenuOpen && (
          <div
            id="developer-mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Developer Navigation Menu"
            className="fixed inset-0 z-50 lg:hidden"
          >
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs motion-safe:transition-opacity motion-reduce:transition-none"
              onClick={handleCloseMobileMenu}
              aria-hidden="true"
            />
            <div className="fixed inset-y-0 left-0 w-72 bg-[#FFFFFF] border-r border-[#E2E0D8] p-5 overflow-y-auto z-10 shadow-2xl motion-safe:transition-transform motion-reduce:transition-none">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E2E0D8]">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-[#18191B]">Developer Portal</span>
                  <span className="rounded bg-[#F4F3EE] px-1.5 py-0.2 text-[9px] font-mono text-[#56585D] border border-[#E2E0D8]">
                    Python 3.12+
                  </span>
                </div>
                <button
                  onClick={handleCloseMobileMenu}
                  aria-label="Close navigation menu"
                  className="rounded-lg p-1 text-[#787A80] hover:text-[#18191B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D3557]"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Mobile Return to Console link */}
              <div className="mb-4 pb-3 border-b border-[#E2E0D8]">
                <Link
                  href="/soc"
                  onClick={handleCloseMobileMenu}
                  className="flex items-center gap-2 text-xs font-semibold text-[#1D3557] hover:underline min-h-[44px]"
                >
                  ← Return to Security Console
                </Link>
              </div>

              <DeveloperSidebar onNavigate={handleCloseMobileMenu} />
            </div>
          </div>
        )}

        {/* Central Content Area */}
        <main className="flex-1 py-8 lg:px-10 max-w-4xl min-w-0 w-full">
          {breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
          {children}
        </main>

        {/* Right-Hand In-Page Table of Contents */}
        {toc.length > 0 && <TableOfContents items={toc} />}
      </div>
    </div>
  );
}
