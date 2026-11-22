"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

export function PublicNavbarPreview() {
  const [productOpen, setProductOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("overview");

  const productDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target as Node)
      ) {
        setProductOpen(false);
      }
      if (
        mobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  // Escape key handler for accessible dismissal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (productOpen) setProductOpen(false);
        if (mobileMenuOpen) setMobileMenuOpen(false);
      }
    },
    [productOpen, mobileMenuOpen]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const productLinks = [
    {
      title: "Deterministic Guardrails",
      desc: "Intercept LLM tool calls and enforce strict security boundaries in real time",
      href: "#guardrails",
    },
    {
      title: "Replay & Drift Protection",
      desc: "Cryptographic state verification preventing hallucinated or replayed agent commands",
      href: "#replay",
    },
    {
      title: "Adversarial Benchmark",
      desc: "Automated 25-vector penetration testing for autonomous AI workflows",
      href: "#benchmark",
    },
    {
      title: "Cryptographic Audit Ledger",
      desc: "Immutable SHA-256 tamper-evident logs for enterprise SOC compliance",
      href: "#audit",
    },
  ];

  return (
    <div className="w-full relative font-sans">
      <header
        style={{
          backgroundColor: "var(--surface-card)",
          borderBottom: "1px solid var(--border-default)",
          height: "64px",
        }}
        className="w-full flex items-center justify-between px-4 sm:px-6 lg:px-8 transition-colors"
        role="banner"
      >
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 cursor-pointer">
            {/* Restrained Architectural Logo Mark */}
            <div
              style={{
                backgroundColor: "var(--accent-brand)",
                color: "#FFFFFF",
              }}
              className="w-7 h-7 rounded-md flex items-center justify-center font-mono font-bold text-xs shadow-xs"
              aria-hidden="true"
            >
              IL
            </div>
            <div className="flex items-baseline gap-1.5">
              <span
                style={{
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-display)",
                }}
                className="font-semibold text-base tracking-tight"
              >
                SICTACK
              </span>
              <span
                style={{
                  color: "var(--text-tertiary)",
                  backgroundColor: "var(--surface-subtle)",
                  borderColor: "var(--border-subtle)",
                }}
                className="text-[10px] font-mono px-1.5 py-0.2 rounded border font-medium hidden sm:inline-block"
              >
                v2.0
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Main Navigation"
            className="hidden md:flex items-center gap-1 text-xs font-medium"
          >
            {/* Product Dropdown Trigger */}
            <div className="relative" ref={productDropdownRef}>
              <button
                type="button"
                onClick={() => setProductOpen(!productOpen)}
                aria-expanded={productOpen}
                aria-haspopup="true"
                style={{
                  color:
                    productOpen || activeItem === "product"
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                  backgroundColor: productOpen ? "var(--surface-subtle)" : "transparent",
                }}
                className="px-3 py-1.5 rounded-md hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Product</span>
                <svg
                  className={`w-3 h-3 transition-transform duration-150 ${
                    productOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Product Dropdown Menu */}
              {productOpen && (
                <div
                  style={{
                    backgroundColor: "var(--surface-card)",
                    borderColor: "var(--border-default)",
                    boxShadow: "var(--shadow-lg)",
                  }}
                  className="absolute left-0 mt-2 w-80 rounded-xl border p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-100"
                  role="menu"
                >
                  <div className="px-3 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--text-tertiary)] border-b border-[var(--border-subtle)] mb-1">
                    Security Platform
                  </div>
                  <div className="space-y-0.5">
                    {productLinks.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setActiveItem("product");
                          setProductOpen(false);
                        }}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-[var(--surface-subtle)] transition-colors group cursor-pointer"
                        role="menuitem"
                      >
                        <div className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-brand)] transition-colors">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 line-clamp-1 leading-normal">
                          {item.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Standard Nav Items */}
            {[
              { id: "security", label: "Security & SOC 2" },
              { id: "developers", label: "Developers" },
              { id: "enterprise", label: "Enterprise" },
            ].map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => setActiveItem(link.id)}
                style={{
                  color:
                    activeItem === link.id
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                  backgroundColor:
                    activeItem === link.id ? "var(--surface-subtle)" : "transparent",
                }}
                className="px-3 py-1.5 rounded-md hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right: Actions & Sign In */}
        <div className="flex items-center gap-3">
          {/* Restrained Status Pill */}
          <div
            style={{
              backgroundColor: "var(--status-allowed-bg)",
              borderColor: "var(--status-allowed-border)",
              color: "var(--status-allowed)",
            }}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono font-medium"
          >
            <span
              style={{ backgroundColor: "var(--status-allowed)" }}
              className="w-1.5 h-1.5 rounded-full"
            />
            <span>Gateway Online</span>
          </div>

          <button
            type="button"
            style={{ color: "var(--text-secondary)" }}
            className="hidden sm:inline-block text-xs font-medium hover:text-[var(--text-primary)] transition-colors px-2.5 py-1.5 cursor-pointer"
          >
            Sign In
          </button>

          {/* Restrained "Open Console" Primary Action */}
          <button
            type="button"
            style={{
              backgroundColor: "var(--accent-brand)",
              color: "#FFFFFF",
            }}
            className="px-3.5 py-1.5 text-xs font-medium rounded-md hover:opacity-95 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span>Open Console</span>
            <span className="text-[10px] font-mono opacity-80">→</span>
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
            style={{
              borderColor: "var(--border-default)",
              backgroundColor: "var(--surface-subtle)",
              color: "var(--text-primary)",
            }}
            className="md:hidden p-2 rounded-md border hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* ─── MOBILE DRAWER (RESPONSIVE 375px - 768px) ─── */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          style={{
            backgroundColor: "var(--surface-card)",
            borderBottom: "1px solid var(--border-default)",
            boxShadow: "var(--shadow-lg)",
          }}
          className="md:hidden border-b p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150 z-40"
          role="dialog"
          aria-label="Mobile Navigation"
        >
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Navigation Menu
          </div>
          <div className="space-y-1">
            {[
              { label: "Product & Guardrails", href: "#" },
              { label: "Security & SOC 2 Compliance", href: "#" },
              { label: "Developer Documentation", href: "#" },
              { label: "Enterprise Architecture", href: "#" },
              { label: "Adversarial Benchmark", href: "#" },
            ].map((link, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-left py-2 px-3 rounded-md text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors min-h-[44px] flex items-center"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2">
            <button
              type="button"
              className="w-full py-2.5 px-4 rounded-md text-sm font-medium text-[var(--text-primary)] bg-[var(--surface-subtle)] border border-[var(--border-default)] min-h-[44px]"
            >
              Sign In to Account
            </button>
            <button
              type="button"
              style={{
                backgroundColor: "var(--accent-brand)",
                color: "#FFFFFF",
              }}
              className="w-full py-2.5 px-4 rounded-md text-sm font-medium min-h-[44px]"
            >
              Open Security Console
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
