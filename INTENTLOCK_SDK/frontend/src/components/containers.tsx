// SICTACK 1.0 – Standardized Container Design System
// Direction A: Warm Editorial Software (Human-Centered Design)
"use client";

import React from "react";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * SurfaceCard: Standard warm-white surface card with hairline border
 * Used for primary content sections, overview panels, and item cards.
 */
export function SurfaceCard({ children, className = "" }: ContainerProps) {
  return (
    <div
      className={`rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-5 text-[#18191B] shadow-[0_1px_3px_rgba(24,25,27,0.04)] transition-all hover:border-[#CECBC0] hover:shadow-[0_2px_6px_rgba(24,25,27,0.06)] font-sans ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * InfoPanel: Semantic informative message container
 */
export function InfoPanel({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-[#CFDEEB] bg-[#EEF4F8] p-4 text-xs text-[#18191B] shadow-xs ${className}`}
    >
      {title && <div className="font-semibold text-[#1D3557] mb-1">{title}</div>}
      <div className="text-[#56585D] leading-relaxed">{children}</div>
    </div>
  );
}

/**
 * WarningPanel: Semantic caution / escalation notice container
 */
export function WarningPanel({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-[#FBE3C6] bg-[#FEF6EC] p-4 text-xs text-[#18191B] shadow-xs ${className}`}
    >
      {title && <div className="font-semibold text-[#8D5B18] mb-1">{title}</div>}
      <div className="text-[#56585D] leading-relaxed">{children}</div>
    </div>
  );
}

/**
 * DangerPanel: Semantic denial / security threat container
 */
export function DangerPanel({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-[#F8D5D0] bg-[#FDF1EF] p-4 text-xs text-[#18191B] shadow-xs ${className}`}
    >
      {title && <div className="font-semibold text-[#943425] mb-1">{title}</div>}
      <div className="text-[#56585D] leading-relaxed">{children}</div>
    </div>
  );
}

/**
 * TechnicalCodeBlock: Dark charcoal container strictly for code snippets & terminal outputs
 */
export function TechnicalCodeBlock({
  filename,
  children,
  className = "",
}: {
  filename?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-[#282A30] bg-[#141518] text-[#EDEDEB] shadow-sm font-mono text-xs ${className}`}
    >
      {filename && (
        <div className="border-b border-[#282A30] bg-[#1A1B1F] px-4 py-2 text-[11px] text-[#A6A8B0] font-medium">
          {filename}
        </div>
      )}
      <div className="p-4 overflow-x-auto">{children}</div>
    </div>
  );
}

/**
 * RawJsonViewer: Standard technical container for cryptographic payloads & JSON inspection
 */
export function RawJsonViewer({
  data,
  maxHeight = "max-h-60",
}: {
  data: unknown;
  maxHeight?: string;
}) {
  return (
    <pre
      className={`p-3 rounded-lg border border-[#282A30] bg-[#141518] text-[#EDEDEB] font-mono text-[11px] overflow-x-auto ${maxHeight}`}
    >
      {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
    </pre>
  );
}

/**
 * TableContainer: Standardized wrapper for tabular data with subtle borders
 */
export function TableContainer({ children, className = "" }: ContainerProps) {
  return (
    <div
      className={`rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] overflow-hidden shadow-xs ${className}`}
    >
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
