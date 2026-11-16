import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "INTENTLOCK Developer Portal · Documentation & SDK Reference",
  description:
    "Developer-first documentation, Python SDK guides, and REST API reference for the INTENTLOCK Zero-Trust AI Agent Security Middleware.",
};

export default function DevelopersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
