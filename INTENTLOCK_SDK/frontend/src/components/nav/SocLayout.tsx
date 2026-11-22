// SICTACK – Dedicated SOC Shell with Global Header & Left Sidebar
// Concept A: Editorial Infrastructure

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getSafeRedirect } from "@/lib/safe-redirect";
import { SocHeader } from "./SocHeader";
import { SocSidebar } from "./SocSidebar";

interface SocLayoutProps {
  children: React.ReactNode;
}

export function SocLayout({ children }: SocLayoutProps) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Redirect to login if unauthenticated once hydration completes
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const safeTarget = getSafeRedirect(pathname);
      const target = safeTarget ? `/login?redirect=${encodeURIComponent(safeTarget)}` : "/login";
      router.replace(target);
    }
  }, [loading, isAuthenticated, pathname, router]);

  // Close mobile drawer on desktop resize
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile drawer on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const handleCloseMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // State 1: Hydrating session tokens from client storage
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9F8] text-[#202629] flex flex-col items-center justify-center font-sans antialiased p-4">
        <div className="w-full max-w-sm rounded-xl border border-[#E4E9E8] bg-[#FFFFFF] p-6 text-center shadow-xs">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#F2F4F3] border border-[#E4E9E8] text-[#485F84]">
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-[#202629]">Verifying Security Session</h2>
          <p className="mt-1 text-xs text-[#5A6063]">
            Validating authorization credentials and tenant context...
          </p>
        </div>
      </div>
    );
  }

  // State 2: Unauthenticated operator boundary
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8F9F8] text-[#202629] flex flex-col items-center justify-center font-sans antialiased p-4">
        <div className="w-full max-w-md rounded-xl border border-[#E4E9E8] bg-[#FFFFFF] p-8 text-center shadow-xs">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#FEF6EC] border border-[#FBE3C6] text-[#8D5B18]">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-[#202629]">Authentication Required</h2>
          <p className="mt-1 text-xs text-[#5A6063]">
            Access to this Security Operations Console requires a verified operator session token.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              href={`/login?redirect=${encodeURIComponent(getSafeRedirect(pathname))}`}
              className="inline-flex items-center justify-center rounded-lg bg-[#485F84] px-4 py-2.5 text-xs font-semibold text-[#FFFFFF] hover:bg-[#3C5276] transition-colors"
            >
              Sign In to Security Operations
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-[#E4E9E8] bg-[#FFFFFF] px-4 py-2 text-xs font-medium text-[#5A6063] hover:text-[#202629] hover:bg-[#F2F4F3] transition-colors"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // State 3: Authenticated SOC Session
  return (
    <div className="min-h-screen bg-[#F8F9F8] text-[#202629] flex flex-col font-sans antialiased selection:bg-[#D5E3FF] selection:text-[#3C5276]">
      {/* Compact Global Product Header */}
      <SocHeader
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        mobileMenuOpen={mobileMenuOpen}
      />

      <div className="flex flex-1 w-full max-w-[1536px] mx-auto">
        {/* Desktop Fixed Left Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-[#E4E9E8] bg-[#FFFFFF] px-3 overflow-y-auto max-h-[calc(100vh-3.5rem)] sticky top-14">
          <SocSidebar />
        </aside>

        {/* Mobile Slide-Over Drawer */}
        {mobileMenuOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Security Operations Navigation Menu"
            className="fixed inset-0 z-50 lg:hidden"
          >
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-[#202629]/40 backdrop-blur-xs transition-opacity"
              onClick={handleCloseMobileMenu}
              aria-hidden="true"
            />

            {/* Drawer */}
            <div className="fixed inset-y-0 left-0 w-72 bg-[#FFFFFF] border-r border-[#E4E9E8] p-4 overflow-y-auto z-10 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#E4E9E8]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-[#202629]">SICTACK</span>
                    <span className="rounded bg-[#F2F4F3] px-1.5 py-0.5 text-[9px] font-mono font-medium text-[#787E81] border border-[#E4E9E8]">
                      SOC
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseMobileMenu}
                    aria-label="Close navigation menu"
                    className="rounded p-1 text-[#5A6063] hover:text-[#202629] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#485F84] cursor-pointer"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <SocSidebar onNavigate={handleCloseMobileMenu} />
              </div>

              <div className="pt-3 border-t border-[#E4E9E8] text-[11px] text-[#787E81]">
                <div>SICTACK v1.0</div>
                <div>Fail-Closed Security Architecture</div>
              </div>
            </div>
          </div>
        )}

        {/* Central Content Area */}
        <main className="flex-1 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 min-w-0 max-w-[1440px] w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

