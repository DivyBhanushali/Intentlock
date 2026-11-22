// SICTACK 1.0 – Standard Documentation Overview & Structured Phase Stub
import React from "react";
import Link from "next/link";
import { DeveloperLayout } from "./DeveloperLayout";
import { BreadcrumbItem, TocItem } from "./types";
import { Callout } from "./Callout";
import { PreviousNextNavigation } from "./PreviousNextNavigation";

interface DocumentationPageStubProps {
  title: string;
  category: string;
  description: string;
  phaseScheduled: string;
  breadcrumbs: BreadcrumbItem[];
  toc?: TocItem[];
  prev?: { title: string; href: string };
  next?: { title: string; href: string };
  children?: React.ReactNode;
}

export function DocumentationPageStub({
  title,
  category,
  description,
  phaseScheduled,
  breadcrumbs,
  toc = [],
  prev,
  next,
  children,
}: DocumentationPageStubProps) {
  const defaultToc: TocItem[] = [
    { id: "overview", title: "Overview", level: 2 },
    { id: "status", title: "Documentation Status", level: 2 },
    ...(toc || []),
  ];

  return (
    <DeveloperLayout breadcrumbs={breadcrumbs} toc={defaultToc}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-0.5 text-[10px] font-mono text-slate-300">
              {category}
            </span>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-mono text-emerald-400">
              {phaseScheduled}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
            {title}
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-3xl">
            {description}
          </p>
        </div>

        {/* Overview Anchor */}
        <section id="overview" className="space-y-4">
          {children}
        </section>

        {/* Status Callout */}
        <section id="status" className="pt-4">
          <Callout type="info" title="Implementation Roadmap Notice">
            Full step-by-step guides, interactive parameters, and verified copyable examples for this topic are scheduled for delivery in <strong>{phaseScheduled}</strong>. Refer to the{" "}
            <Link href="/developers" className="text-emerald-400 underline font-medium">
              Developer Portal Overview
            </Link>{" "}
            or test tool execution live in the{" "}
            <Link href="/test" className="text-emerald-400 underline font-medium">
              Security Playground
            </Link>.
          </Callout>
        </section>

        {/* Sequential Navigation */}
        <PreviousNextNavigation prev={prev} next={next} />
      </div>
    </DeveloperLayout>
  );
}
