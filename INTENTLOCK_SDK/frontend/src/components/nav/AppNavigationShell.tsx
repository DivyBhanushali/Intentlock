// SICTACK – Route-Aware Application Navigation & Layout Shell
// Bridges public marketing homepage, Developer Portal, and dedicated SOC Shell

"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { PublicNavbar } from "@/components/nav/PublicNavbar";
import { SocLayout } from "@/components/nav/SocLayout";

interface AppNavigationShellProps {
  children: React.ReactNode;
}

export function AppNavigationShell({ children }: AppNavigationShellProps) {
  const pathname = usePathname();
  const isMarketingHome = pathname === "/" || pathname === "/core" || pathname === "/sentinel";
  const isDevelopers = pathname.startsWith("/developers");
  const isDesignPreview = pathname.startsWith("/design-preview");
  const isLogin = pathname === "/login";

  // Route 1: Public Marketing & Architecture Pages
  if (isMarketingHome) {
    return (
      <div
        data-theme="warm-light"
        className="min-h-screen bg-[#f8f9f8] text-[#202629] font-sans antialiased selection:bg-[#d5e3ff] selection:text-[#3c5276]"
      >
        <PublicNavbar />
        <main className="w-full">{children}</main>
      </div>
    );
  }

  // Route 2: Developer Portal (Owns its dedicated documentation topbar + sidebar shell)
  if (isDevelopers || isDesignPreview) {
    return (
      <div
        data-theme="warm-light"
        className="min-h-screen bg-[#FBFBF9] text-[#18191B] font-sans antialiased selection:bg-[#1D3557] selection:text-white"
      >
        <main className="w-full">{children}</main>
      </div>
    );
  }

  // Route 3: Login Screen (Clean Standalone)
  if (isLogin) {
    return (
      <div
        data-theme="warm-light"
        className="min-h-screen bg-[#FBFBF9] text-[#18191B] font-sans antialiased flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#1D3557] selection:text-white"
      >
        <main className="w-full">{children}</main>
      </div>
    );
  }

  // Route 4: Authenticated SOC Operations (/soc, /agents, /policies, /approvals, /audit, /intents, etc.)
  return <SocLayout>{children}</SocLayout>;
}
