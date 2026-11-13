import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "INTENTLOCK · Enterprise Security Operations Center",
  description:
    "Zero-Trust Security Middleware & IAM Execution Guard for Autonomous AI Agents",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="il-body">
        <AuthProvider>
          <Navbar />
          <main className="il-main-container">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
