// SICTACK 1.0 – OpenAPI Endpoint Reference Page
"use client";

import { useState, useMemo } from "react";
import { DeveloperLayout } from "@/components/developers/DeveloperLayout";
import { EndpointCard } from "@/components/developers/EndpointCard";
import { Callout } from "@/components/developers/Callout";
import { PreviousNextNavigation } from "@/components/developers/PreviousNextNavigation";
import { TocItem } from "@/components/developers/types";
import { API_ENDPOINTS, API_TAG_GROUPS } from "@/lib/api-reference-data";

export default function ApiReferencePage() {
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const breadcrumbs = [
    { label: "Developers", href: "/developers" },
    { label: "REST API", href: "/developers/api" },
    { label: "Reference", href: "/developers/api/reference" },
  ];

  // Dynamic in-page Table of Contents based on tags
  const toc: TocItem[] = useMemo(() => {
    return API_TAG_GROUPS.map((tag) => ({
      id: `tag-${tag.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      title: tag,
      level: 2,
    }));
  }, []);

  // Filter endpoints
  const filteredEndpoints = useMemo(() => {
    return API_ENDPOINTS.filter((ep) => {
      const matchesTag = selectedTag === "all" || ep.tag === selectedTag;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        ep.path.toLowerCase().includes(q) ||
        ep.method.toLowerCase().includes(q) ||
        ep.summary.toLowerCase().includes(q) ||
        (ep.description ? ep.description.toLowerCase().includes(q) : false) ||
        ep.tag.toLowerCase().includes(q);
      return matchesTag && matchesSearch;
    });
  }, [selectedTag, searchQuery]);

  // Group filtered endpoints by tag
  const groupedEndpoints = useMemo(() => {
    const groups: Record<string, typeof API_ENDPOINTS> = {};
    for (const ep of filteredEndpoints) {
      if (!groups[ep.tag]) {
        groups[ep.tag] = [];
      }
      groups[ep.tag].push(ep);
    }
    return groups;
  }, [filteredEndpoints]);

  return (
    <DeveloperLayout breadcrumbs={breadcrumbs} toc={toc}>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-md bg-[#EDF5F0] border border-[#234E39]/20 px-2 py-0.5 text-xs font-mono font-medium text-[#234E39]">
              REST API
            </span>
            <span className="text-xs text-[#787A80]">48 Operations Registered</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#18191B] sm:text-4xl">
              OpenAPI Endpoint Reference
            </h1>
            <a
              href="https://intentlock-backend-ze2i.onrender.com/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E0D8] bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-[#18191B] hover:border-slate-600 hover:text-[#18191B] transition-colors"
            >
              <span>Open Swagger UI</span>
              <svg className="h-3.5 w-3.5 text-[#56585D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          <p className="mt-3 text-base text-[#56585D] leading-relaxed">
            Deterministic reference for all 48 operations across the SICTACK backend, auto-generated directly from the FastAPI application and OpenAPI 3.1.0 specification.
          </p>
        </div>

        {/* Search & Tag Filter Controls */}
        <div className="space-y-4 rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4">
          <div className="relative">
            <svg
              className="absolute left-3.5 top-3 h-4 w-4 text-[#787A80]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by endpoint path, method, or summary (e.g. /intercept, policies, POST)..."
              className="w-full rounded-lg border border-[#E2E0D8] bg-[#07090e] py-2 pl-10 pr-4 text-xs text-[#18191B] placeholder-slate-500 focus:border-[#234E39]/20 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-medium text-[#56585D] mr-1">Resource Groups:</span>
            <button
              onClick={() => setSelectedTag("all")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedTag === "all"
                  ? "bg-emerald-500/20 text-[#234E39] border border-[#234E39]/20"
                  : "bg-slate-900 text-[#56585D] hover:text-[#18191B] border border-[#E2E0D8]"
              }`}
            >
              All ({API_ENDPOINTS.length})
            </button>
            {API_TAG_GROUPS.map((tag) => {
              const count = API_ENDPOINTS.filter((ep) => ep.tag === tag).length;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    selectedTag === tag
                      ? "bg-emerald-500/20 text-[#234E39] border border-[#234E39]/20"
                      : "bg-slate-900 text-[#56585D] hover:text-[#18191B] border border-[#E2E0D8]"
                  }`}
                >
                  {tag} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between text-xs text-[#56585D] px-1">
          <span>
            Showing <strong className="text-[#18191B]">{filteredEndpoints.length}</strong> of {API_ENDPOINTS.length} operations
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-[#234E39] hover:underline"
            >
              Clear search
            </button>
          )}
        </div>

        {/* Grouped Endpoints */}
        {Object.keys(groupedEndpoints).length === 0 ? (
          <Callout type="warning" title="No endpoints found">
            <p className="text-xs leading-relaxed">
              No registered API operations matched your search query &quot;{searchQuery}&quot;. Try adjusting your keywords.
            </p>
          </Callout>
        ) : (
          Object.entries(groupedEndpoints).map(([groupTag, endpoints]) => {
            const tagId = `tag-${groupTag.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
            return (
              <section key={groupTag} id={tagId} className="space-y-4 pt-6">
                <div className="flex items-center justify-between border-b border-[#E2E0D8] pb-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold tracking-tight text-[#18191B]">{groupTag}</h2>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-mono font-medium text-[#56585D]">
                      {endpoints.length} {endpoints.length === 1 ? "operation" : "operations"}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {endpoints.map((ep) => (
                    <div key={`${ep.method}-${ep.path}`} className="space-y-1">
                      {ep.requiredRole && ep.requiredRole !== "None" && (
                        <div className="flex items-center gap-1.5 text-[11px] text-[#56585D] px-1">
                          <span className="text-[#787A80] font-mono">RBAC Role Required:</span>
                          <span className="font-mono text-[#234E39] font-semibold">{ep.requiredRole}</span>
                        </div>
                      )}
                      <EndpointCard
                        method={ep.method}
                        path={ep.path}
                        summary={ep.summary}
                        auth={ep.auth}
                        description={ep.description}
                        headers={ep.headers}
                        parameters={ep.parameters}
                        requestBody={ep.requestBody}
                        responses={ep.responses}
                      />
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}

        {/* Navigation */}
        <PreviousNextNavigation
          prev={{ title: "Authentication Guide", href: "/developers/api/authentication" }}
          next={{ title: "Framework Integrations", href: "/developers/integrations" }}
        />
      </div>
    </DeveloperLayout>
  );
}
