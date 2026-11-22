import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth";
import { AppNavigationShell } from "@/components/nav/AppNavigationShell";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SICTACK · The Security Infrastructure for the Autonomous AI Economy",
  description:
    "SICTACK — Secure the action. Protect the intention. Runtime authorization, threat detection, and session security for autonomous AI agents.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="warm-light">
      <body className="il-body bg-[#FBFBF9] text-[#18191B]">
        <AuthProvider>
          <AppNavigationShell>{children}</AppNavigationShell>
        </AuthProvider>
      </body>
    </html>
  );
}
