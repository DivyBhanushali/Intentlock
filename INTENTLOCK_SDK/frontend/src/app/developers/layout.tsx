import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SICTACK Developer Portal · Documentation & SDK Reference",
  description:
    "Developer-first documentation, Python SDK guides, and REST API reference for SICTACK: The Security Infrastructure for the Autonomous AI Economy.",
};

export default function DevelopersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
