"use client";

import React, { useState } from "react";

export function SocNavPreview() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeRoute, setActiveRoute] = useState("/policies");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState("Acme Financial Corp (Prod)");

  const navSections = [
    {
      group: "Live Operations",
      items: [
        {
          id: "/",
          label: "SOC Overview",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          ),
        },
        {
          id: "/intents",
          label: "Autonomous Intents",
          badge: "Active",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          ),
        },
        {
          id: "/threats",
          label: "Threat Intelligence",
          badge: "1 New",
          badgeVariant: "denied",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
        },
      ],
    },
    {
      group: "Policy & Governance",
      items: [
        {
          id: "/policies",
          label: "Security Policies",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
        },
        {
          id: "/approvals",
          label: "Human Approvals",
          badge: "3 Pending",
          badgeVariant: "approval",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
      ],
    },
    {
      group: "Audit & Forensics",
      items: [
        {
          id: "/audit",
          label: "Audit Ledger",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          ),
        },
        {
          id: "/provenance",
          label: "Provenance Graph",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          ),
        },
      ],
    },
    {
      group: "Diagnostics & Config",
      items: [
        {
          id: "/test",
          label: "Security Playground",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
            </svg>
          ),
        },
        {
          id: "/benchmark",
          label: "Adversarial Benchmark",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          ),
        },
        {
          id: "/team",
          label: "Workspace & API Keys",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        },
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
      {/* ─── COMPACT APPLICATION HEADER (52px) ─── */}
      <header
        style={{
          backgroundColor: "var(--surface-card)",
          borderBottom: "1px solid var(--border-default)",
          height: "52px",
        }}
        className="w-full px-4 flex items-center justify-between gap-4 shrink-0"
      >
        {/* Left: Mobile Toggle + Tenant Selector */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="md:hidden p-1.5 rounded border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            aria-label="Toggle SOC menu"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Desktop Sidebar Collapse Toggle */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 rounded hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h10M4 18h7" />
            </svg>
          </button>

          {/* Tenant Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setTenantDropdownOpen(!tenantDropdownOpen)}
              style={{
                backgroundColor: "var(--surface-subtle)",
                borderColor: "var(--border-default)",
              }}
              className="px-2.5 py-1 rounded-md border flex items-center gap-2 text-xs font-medium cursor-pointer hover:bg-[var(--surface-hover)] transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              <span className="font-semibold text-[var(--text-primary)] truncate max-w-[160px] sm:max-w-[220px]">
                {selectedTenant}
              </span>
              <svg className="w-3 h-3 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {tenantDropdownOpen && (
              <div
                style={{
                  backgroundColor: "var(--surface-card)",
                  borderColor: "var(--border-default)",
                  boxShadow: "var(--shadow-lg)",
                }}
                className="absolute left-0 mt-1.5 w-64 rounded-lg border p-1 z-50 text-xs"
              >
                <div className="px-2.5 py-1 text-[10px] font-mono text-[var(--text-tertiary)] uppercase font-semibold">
                  Switch Workspace
                </div>
                {[
                  "Acme Financial Corp (Prod)",
                  "Acme Staging (us-west-2)",
                  "Autonomous Sandbox (Local)",
                ].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setSelectedTenant(t);
                      setTenantDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[var(--surface-subtle)] text-[var(--text-primary)] flex items-center justify-between"
                  >
                    <span>{t}</span>
                    {selectedTenant === t && <span className="text-[var(--accent-brand)]">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Breadcrumbs */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-[var(--text-tertiary)] pl-2 border-l border-[var(--border-subtle)]">
            <span>SOC Console</span>
            <span>/</span>
            <span className="text-[var(--text-primary)] font-medium">
              {activeRoute === "/policies"
                ? "Security Policies"
                : activeRoute === "/approvals"
                ? "Human Approvals"
                : "Live Guardrails"}
            </span>
          </div>
        </div>

        {/* Right: Quick Search + Operator Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Command trigger */}
          <button
            type="button"
            style={{
              backgroundColor: "var(--surface-subtle)",
              borderColor: "var(--border-default)",
              color: "var(--text-secondary)",
            }}
            className="hidden sm:flex items-center gap-3 px-2.5 py-1 rounded-md border text-xs cursor-pointer hover:border-[var(--border-strong)] transition-colors"
          >
            <span>Filter events...</span>
            <span className="text-[10px] font-mono px-1 rounded bg-[var(--surface-card)] border border-[var(--border-subtle)]">
              ⌘K
            </span>
          </button>

          {/* Operator Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-[var(--border-subtle)]">
            <div
              style={{
                backgroundColor: "var(--accent-brand)",
                color: "#FFFFFF",
              }}
              className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold"
            >
              EV
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold leading-tight text-[var(--text-primary)]">
                E. Vance
              </div>
              <div className="text-[10px] font-mono text-[var(--text-tertiary)]">
                SecOps Lead
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── APPLICATION BODY: SIDEBAR + CONTENT VIEWPORT ─── */}
      <div className="flex flex-1 min-h-[460px]">
        {/* DESKTOP SIDEBAR */}
        <aside
          style={{
            backgroundColor: "var(--surface-card)",
            borderRight: "1px solid var(--border-default)",
            width: collapsed ? "64px" : "240px",
          }}
          className="hidden md:flex flex-col justify-between py-4 transition-all duration-200 shrink-0"
        >
          <div className="space-y-6 px-2">
            {navSections.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                {!collapsed && (
                  <div className="px-3 text-[10px] font-mono uppercase tracking-wider font-semibold text-[var(--text-tertiary)]">
                    {group.group}
                  </div>
                )}
                {group.items.map((item) => {
                  const isActive = activeRoute === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveRoute(item.id)}
                      style={{
                        backgroundColor: isActive ? "var(--surface-subtle)" : "transparent",
                        color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] transition-colors cursor-pointer group ${
                        collapsed ? "justify-center px-0" : ""
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <div
                        style={{
                          color: isActive ? "var(--accent-brand)" : "var(--text-tertiary)",
                        }}
                        className="group-hover:text-[var(--text-primary)] transition-colors"
                      >
                        {item.icon}
                      </div>

                      {!collapsed && (
                        <div className="flex-1 flex items-center justify-between text-left truncate">
                          <span className={isActive ? "font-semibold" : ""}>{item.label}</span>
                          {item.badge && (
                            <span
                              style={{
                                backgroundColor:
                                  item.badgeVariant === "approval"
                                    ? "var(--status-approval-bg)"
                                    : item.badgeVariant === "denied"
                                    ? "var(--status-denied-bg)"
                                    : "var(--status-allowed-bg)",
                                color:
                                  item.badgeVariant === "approval"
                                    ? "var(--status-approval)"
                                    : item.badgeVariant === "denied"
                                    ? "var(--status-denied)"
                                    : "var(--status-allowed)",
                                borderColor:
                                  item.badgeVariant === "approval"
                                    ? "var(--status-approval-border)"
                                    : item.badgeVariant === "denied"
                                    ? "var(--status-denied-border)"
                                    : "var(--status-allowed-border)",
                              }}
                              className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold border"
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Bottom Sidebar Status */}
          <div className="px-3 pt-3 border-t border-[var(--border-subtle)]">
            {!collapsed ? (
              <div className="text-[11px] font-mono text-[var(--text-tertiary)] flex items-center justify-between">
                <span>SICTACK SOC</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">LIVE</span>
              </div>
            ) : (
              <div className="w-2 h-2 rounded-full bg-emerald-500 mx-auto" />
            )}
          </div>
        </aside>

        {/* MOBILE DRAWER */}
        {mobileDrawerOpen && (
          <div
            style={{
              backgroundColor: "var(--surface-card)",
              borderColor: "var(--border-default)",
            }}
            className="md:hidden fixed inset-y-0 left-0 w-64 border-r p-4 z-50 shadow-2xl flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-[var(--border-subtle)]">
                <span className="font-semibold text-xs text-[var(--text-primary)]">
                  SOC Operations Menu
                </span>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                >
                  ✕
                </button>
              </div>

              {navSections.map((group, gIdx) => (
                <div key={gIdx} className="space-y-1">
                  <div className="text-[10px] font-mono uppercase text-[var(--text-tertiary)] font-semibold">
                    {group.group}
                  </div>
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveRoute(item.id);
                        setMobileDrawerOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded text-xs text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] min-h-[44px]"
                    >
                      <div className="flex items-center gap-2">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] font-mono font-semibold px-1 rounded bg-[var(--surface-subtle)]">
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
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                {activeRoute === "/policies"
                  ? "Active Security Policies & Guardrails"
                  : activeRoute === "/approvals"
                  ? "Human Approval Action Queue"
                  : "SOC Operational Telemetry"}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Simulated destination view for navigation state verification
              </p>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
              Route: {activeRoute}
            </span>
          </div>

          <div
            style={{
              backgroundColor: "var(--surface-subtle)",
              borderColor: "var(--border-subtle)",
            }}
            className="p-4 rounded-lg border text-xs text-[var(--text-secondary)] leading-relaxed"
          >
            This viewport demonstrates that the SOC Dashboard application navigation maintains
            strict visual rhythm, clear hierarchical groupings, and immediate route feedback
            without relying on neon glows or cramped layouts.
          </div>
        </div>
      </div>
    </div>
  );
}
