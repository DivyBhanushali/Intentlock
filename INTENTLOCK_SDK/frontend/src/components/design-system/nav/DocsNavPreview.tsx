"use client";

import React, { useState } from "react";

export function DocsNavPreview() {
  const [activeDoc, setActiveDoc] = useState("/developers/sdk/initialization");
  const [mobileDocsDrawerOpen, setMobileDocsDrawerOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const docsTree = [
    {
      group: "Getting Started",
      items: [
        { href: "/developers", title: "Overview", badge: "" },
        { href: "/developers/quickstart", title: "Quickstart", badge: "5m" },
        { href: "/developers/installation", title: "Installation", badge: "" },
        { href: "/developers/architecture", title: "Architecture", badge: "" },
      ],
    },
    {
      group: "Core Concepts",
      items: [
        { href: "/developers/concepts", title: "Security Model", badge: "" },
        { href: "/developers/concepts#state", title: "Deterministic State", badge: "" },
        { href: "/developers/concepts#replay", title: "Replay Protection", badge: "" },
      ],
    },
    {
      group: "Python SDK Reference",
      items: [
        { href: "/developers/sdk", title: "SDK Overview", badge: "" },
        { href: "/developers/sdk/initialization", title: "Client Initialization", badge: "Core" },
        { href: "/developers/sdk/tool-protection", title: "Tool Protection", badge: "" },
        { href: "/developers/sdk/decisions", title: "Decision Handling", badge: "" },
        { href: "/developers/sdk/errors", title: "Exceptions & Codes", badge: "" },
      ],
    },
    {
      group: "Agent Integrations",
      items: [
        { href: "/developers/integrations/langchain", title: "LangChain", badge: "" },
        { href: "/developers/integrations/langgraph", title: "LangGraph", badge: "" },
        { href: "/developers/integrations/mcp", title: "Model Context Protocol (MCP)", badge: "New" },
      ],
    },
    {
      group: "API Reference",
      items: [
        { href: "/developers/api", title: "REST Endpoints", badge: "v1" },
        { href: "/developers/api/authentication", title: "Authentication", badge: "" },
        { href: "/developers/api/reference", title: "Full OpenAPI Schema", badge: "" },
      ],
    },
    {
      group: "Operations & Guides",
      items: [
        { href: "/developers/deployment", title: "Production Deployment", badge: "" },
        { href: "/developers/security", title: "Security Architecture", badge: "" },
        { href: "/developers/troubleshooting", title: "Troubleshooting", badge: "" },
        { href: "/developers/changelog", title: "Changelog", badge: "v1.0.0" },
      ],
    },
  ];

  return (
    <div
      style={{
        backgroundColor: "var(--surface-canvas)",
        color: "var(--text-primary)",
      }}
      className="w-full rounded-xl border border-[var(--border-default)] overflow-hidden shadow-sm flex flex-col font-sans"
    >
      {/* ─── DOCUMENTATION HEADER (56px) ─── */}
      <header
        style={{
          backgroundColor: "var(--surface-card)",
          borderBottom: "1px solid var(--border-default)",
          height: "56px",
        }}
        className="w-full px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0"
      >
        {/* Left: Brand + Console Return Link */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setMobileDocsDrawerOpen(!mobileDocsDrawerOpen)}
            className="md:hidden p-1.5 rounded border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            aria-label="Toggle Documentation menu"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <span
              style={{
                backgroundColor: "var(--accent-brand)",
                color: "#FFFFFF",
              }}
              className="w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-[10px]"
            >
              IL
            </span>
            <span className="font-semibold text-xs tracking-tight text-[var(--text-primary)]">
              Developer Portal
            </span>
            <span
              style={{
                backgroundColor: "var(--surface-subtle)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-tertiary)",
              }}
              className="text-[10px] font-mono px-1.5 py-0.2 rounded border hidden sm:inline-block"
            >
              v1.0.0
            </span>
          </div>

          <div className="hidden lg:flex items-center text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer pl-3 border-l border-[var(--border-subtle)] transition-colors">
            <span>← Return to SOC Console</span>
          </div>
        </div>

        {/* Center: Search Trigger */}
        <div className="flex-1 max-w-md hidden sm:block">
          <div
            tabIndex={0}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              backgroundColor: "var(--surface-canvas)",
              borderColor: searchFocused
                ? "var(--focus-ring)"
                : "var(--border-default)",
            }}
            className="flex items-center justify-between px-3 py-1.5 rounded-md border text-xs transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search docs, endpoints, SDK methods...</span>
            </div>
            <kbd
              style={{
                backgroundColor: "var(--surface-subtle)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-tertiary)",
              }}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded border"
            >
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: Version + GitHub Link */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Python 3.12+</span>
          </div>

          <button
            type="button"
            style={{
              backgroundColor: "var(--surface-subtle)",
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
            }}
            className="px-2.5 py-1 text-xs font-medium rounded-md border hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>GitHub</span>
            <span className="text-[10px] font-mono text-[var(--text-tertiary)]">1.4k ★</span>
          </button>
        </div>
      </header>

      {/* ─── DOCS BODY: SIDEBAR + CONTENT VIEWPORT ─── */}
      <div className="flex flex-1 min-h-[460px]">
        {/* DESKTOP DOCS SIDEBAR */}
        <aside
          style={{
            backgroundColor: "var(--surface-card)",
            borderRight: "1px solid var(--border-default)",
            width: "260px",
          }}
          className="hidden md:flex flex-col justify-between py-4 px-3 overflow-y-auto shrink-0"
        >
          <div className="space-y-6">
            {docsTree.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1">
                <div className="px-3 text-[10px] font-mono uppercase tracking-wider font-semibold text-[var(--text-tertiary)]">
                  {section.group}
                </div>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = activeDoc === item.href;
                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => setActiveDoc(item.href)}
                        style={{
                          backgroundColor: isActive ? "var(--surface-subtle)" : "transparent",
                          color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                          borderColor: isActive ? "var(--border-subtle)" : "transparent",
                        }}
                        className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium text-left hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] transition-colors cursor-pointer border"
                      >
                        <span className={`truncate ${isActive ? "font-semibold text-[var(--accent-brand)]" : ""}`}>
                          {item.title}
                        </span>
                        {item.badge && (
                          <span
                            style={{
                              backgroundColor: "var(--surface-muted)",
                              color: "var(--text-tertiary)",
                            }}
                            className="px-1.5 py-0.2 rounded text-[9px] font-mono"
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[var(--border-subtle)] px-2 text-[11px] font-mono text-[var(--text-tertiary)]">
            <span>SICTACK SDK DOCS · v1.0.0</span>
          </div>
        </aside>

        {/* MOBILE DOCS DRAWER */}
        {mobileDocsDrawerOpen && (
          <div
            style={{
              backgroundColor: "var(--surface-card)",
              borderColor: "var(--border-default)",
            }}
            className="md:hidden fixed inset-y-0 left-0 w-72 border-r p-4 z-50 shadow-2xl overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-4">
              <span className="font-semibold text-xs text-[var(--text-primary)]">
                Documentation Navigation
              </span>
              <button
                type="button"
                onClick={() => setMobileDocsDrawerOpen(false)}
                className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              {docsTree.map((section, sIdx) => (
                <div key={sIdx} className="space-y-1">
                  <div className="text-[10px] font-mono uppercase text-[var(--text-tertiary)] font-semibold">
                    {section.group}
                  </div>
                  {section.items.map((item) => (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => {
                        setActiveDoc(item.href);
                        setMobileDocsDrawerOpen(false);
                      }}
                      className="w-full text-left py-2 px-3 rounded text-xs text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] min-h-[44px] flex items-center justify-between"
                    >
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="text-[10px] font-mono px-1 rounded bg-[var(--surface-muted)]">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SIMULATED CONTENT VIEWPORT */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <div>
              <div className="text-[11px] font-mono text-[var(--text-tertiary)] mb-1">
                Developer Portal / {activeDoc}
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                {activeDoc.includes("initialization")
                  ? "Client Initialization & Configuration"
                  : activeDoc.includes("quickstart")
                  ? "5-Minute Quickstart Guide"
                  : "Developer Documentation"}
              </h3>
            </div>
            <span
              style={{
                backgroundColor: "var(--surface-subtle)",
                color: "var(--text-tertiary)",
              }}
              className="text-[10px] font-mono px-2 py-0.5 rounded border border-[var(--border-subtle)] hidden sm:inline-block"
            >
              Markdown Source Verified
            </span>
          </div>

          <div
            style={{
              backgroundColor: "var(--surface-muted)",
              borderColor: "var(--border-subtle)",
            }}
            className="p-4 rounded-lg border font-mono text-xs text-[var(--text-secondary)] leading-relaxed"
          >
            {`# Initialization example
from sictack import SictackClient

client = SictackClient(
    api_key="sck_live_sample...",
    fail_closed=True,
    timeout_ms=500
)`}
          </div>
        </div>
      </div>
    </div>
  );
}
