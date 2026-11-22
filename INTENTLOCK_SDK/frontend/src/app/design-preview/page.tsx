import { Metadata } from "next";
import { notFound } from "next/navigation";
import { DesignSystemPreview } from "@/components/design-system/DesignSystemPreview";

export const metadata: Metadata = {
  title: "Design System Preview (Internal Audit) | SICTACK",
  description:
    "Internal visual proof of concept for the SICTACK Human-Centered Redesign (Direction A: Warm Editorial Software).",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DesignPreviewPage() {
  // Access control: prevent public exposure in production environments
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DESIGN_PREVIEW !== "true") {
    notFound();
  }
  return <DesignSystemPreview />;
}
