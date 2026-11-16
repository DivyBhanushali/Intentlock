// INTENTLOCK 2.0 – Developer Portal Layout Shell
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
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col">
      {/* Sub-header / Topbar for Documentation */}
      <div className="sticky top-14 z-40 border-b border-slate-800/80 bg-[#090d15]/95 backdrop-blur-md">
        <div className="mx-auto flex h-13 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle Button */}
            <button
              ref={mobileToggleRef}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle developer navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="developer-mobile-drawer"
              className="lg:hidden rounded-lg border border-slate-800 p-1.5 text-slate-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Portal Title & SDK Version Badge */}
            <div className="flex items-center gap-2">
              <Link
                href="/developers"
                className="font-bold text-sm tracking-tight text-slate-200 hover:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 transition-colors"
              >
                Developer Portal
              </Link>
              <span className="hidden sm:inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-400">
                SDK v0.1.0
              </span>
            </div>
          </div>

          {/* Search Trigger & External Links */}
          <div className="flex items-center gap-2.5">
            <DocumentationSearch />
            <Link
              href="/test"
              className="hidden md:inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-[#0c1019] px-2.5 py-1.5 text-xs text-slate-300 hover:border-slate-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 transition-colors"
            >
              <span>Playground</span>
              <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
            <a
              href="https://intentlock-backend-ze2i.onrender.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-[#0c1019] px-2.5 py-1.5 text-xs text-slate-400 hover:border-slate-700 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 transition-colors"
              title="Open raw FastAPI OpenAPI / Swagger interactive documentation"
            >
              <span>Swagger UI</span>
              <svg className="h-3 w-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Main Documentation Grid */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 px-4 sm:px-6">
        {/* Desktop Fixed Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-800/80 py-8 pr-6 overflow-y-auto max-h-[calc(100vh-6.75rem)] sticky top-27">
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
              className="fixed inset-0 bg-black/80 backdrop-blur-xs motion-safe:transition-opacity motion-reduce:transition-none"
              onClick={handleCloseMobileMenu}
              aria-hidden="true"
            />
            <div className="fixed inset-y-0 left-0 w-72 bg-[#090d15] border-r border-slate-800 p-5 overflow-y-auto z-10 shadow-2xl motion-safe:transition-transform motion-reduce:transition-none">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <span className="font-bold text-sm text-slate-100">Developer Portal</span>
                <button
                  onClick={handleCloseMobileMenu}
                  aria-label="Close navigation menu"
                  className="rounded-lg p-1 text-slate-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <DeveloperSidebar onNavigate={handleCloseMobileMenu} />
            </div>
          </div>
        )}

        {/* Central Content Area */}
        <main className="flex-1 py-8 lg:px-10 max-w-4xl min-w-0">
          {breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
          {children}
        </main>

        {/* Right-Hand In-Page Table of Contents */}
        {toc.length > 0 && <TableOfContents items={toc} />}
      </div>
    </div>
  );
}
