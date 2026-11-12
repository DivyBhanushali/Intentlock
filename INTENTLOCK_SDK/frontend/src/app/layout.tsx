import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "INTENTLOCK · Security Dashboard",
  description:
    "Developer Security Dashboard for the IntentLock AI Agent Security Middleware",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="il-body">
        <Navbar />
        <main className="il-main-container">
          {children}
        </main>
      </body>
    </html>
  );
}
