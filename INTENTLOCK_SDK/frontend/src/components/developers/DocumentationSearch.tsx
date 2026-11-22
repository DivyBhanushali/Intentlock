// SICTACK 1.0 – Accessible In-Memory Documentation Search Modal
// Direction A: Warm Editorial Software (Human-Centered Design)
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DOCS_SEARCH_INDEX } from "@/lib/docs-config";
import { SearchDocItem } from "./types";

export function DocumentationSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const resultsListRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(0);
    // Return focus to triggering button upon modal close (WCAG 2.2 AA)
    setTimeout(() => {
      triggerRef.current?.focus();
    }, 50);
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setSelectedIndex(0);
  }, []);

  // Filter search index based on query metadata
  const filteredResults: SearchDocItem[] = query.trim()
    ? DOCS_SEARCH_INDEX.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.keywords.some((k) => k.toLowerCase().includes(q))
        );
      })
    : [];

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(0);
  };

  // Scroll active item into view
  useEffect(() => {
    if (resultsListRef.current && filteredResults.length > 0) {
      const activeEl = resultsListRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex, filteredResults.length]);

  // Global Keyboard shortcut listener (Cmd+K or Ctrl+K)
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => {
          if (prev) {
            handleClose();
            return false;
          }
          return true;
        });
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        handleClose();
      }
    }
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, handleClose]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle arrow key and Enter navigation inside input
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (filteredResults.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % filteredResults.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (filteredResults.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % filteredResults.length);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredResults.length > 0 && filteredResults[selectedIndex]) {
        const targetHref = filteredResults[selectedIndex].href;
        handleClose();
        router.push(targetHref);
      }
    }
  };

  return (
    <>
      {/* Search Trigger Button */}
      <button
        ref={triggerRef}
        onClick={handleOpen}
        aria-label="Search documentation"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="flex items-center gap-2 rounded-lg border border-[#E2E0D8] bg-[#FFFFFF] px-3 py-1.5 text-xs text-[#787A80] hover:border-[#CECBC0] hover:text-[#18191B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D3557] transition-colors w-full sm:w-56 cursor-pointer shadow-xs"
      >
        <svg className="h-3.5 w-3.5 text-[#787A80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="flex-1 text-left">Search documentation...</span>
        <kbd className="hidden sm:inline-block rounded border border-[#E2E0D8] bg-[#F4F3EE] px-1.5 py-0.5 text-[10px] font-mono text-[#787A80]">
          ⌘K
        </kbd>
      </button>

      {/* Screen Reader Live Region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isOpen && query.trim() !== "" && (
          `${filteredResults.length} ${filteredResults.length === 1 ? "result" : "results"} found for ${query}`
        )}
      </div>

      {/* Modal Backdrop & Dialog */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Documentation search"
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-black/40 backdrop-blur-xs motion-safe:transition-opacity motion-reduce:transition-none"
        >
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0"
            onClick={handleClose}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-xl rounded-2xl border border-[#E2E0D8] bg-[#FFFFFF] shadow-2xl overflow-hidden z-10 motion-safe:transition-transform motion-reduce:transition-none">
            {/* Input Header */}
            <div className="flex items-center border-b border-[#E2E0D8] px-4 py-3">
              <svg className="h-4 w-4 text-[#1D3557] mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded={filteredResults.length > 0}
                aria-controls="search-results-list"
                aria-activedescendant={filteredResults.length > 0 ? `search-result-${selectedIndex}` : undefined}
                value={query}
                onChange={handleQueryChange}
                onKeyDown={handleInputKeyDown}
                placeholder="Search topics, SDK methods, REST endpoints..."
                className="w-full bg-transparent text-sm text-[#18191B] placeholder:text-[#787A80] focus:outline-none"
              />
              <button
                onClick={handleClose}
                aria-label="Close search dialog"
                className="rounded-md p-1 text-[#787A80] hover:text-[#18191B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D3557]"
              >
                <kbd className="rounded border border-[#E2E0D8] bg-[#F4F3EE] px-1.5 py-0.5 text-[10px] font-mono text-[#56585D]">
                  ESC
                </kbd>
              </button>
            </div>

            {/* Results Body */}
            <div
              id="search-results-list"
              ref={resultsListRef}
              role="listbox"
              aria-label="Search results"
              className="max-h-80 overflow-y-auto p-2"
            >
              {query.trim() === "" ? (
                <div className="p-6 text-center text-xs text-[#787A80]">
                  Type a command, method name (e.g. <span className="font-mono text-[#18191B]">register_tool</span>), or endpoint (e.g. <span className="font-mono text-[#18191B]">/intercept</span>) to search.
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#56585D]">
                  No matching documentation topics found for &ldquo;{query}&rdquo;.
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredResults.map((item, index) => {
                    const isSelected = index === selectedIndex;
                    return (
                      <Link
                        key={item.href}
                        id={`search-result-${index}`}
                        role="option"
                        aria-selected={isSelected}
                        href={item.href}
                        onClick={handleClose}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`block rounded-lg p-3 transition-colors ${
                          isSelected
                            ? "bg-[#1D3557]/10 text-[#18191B]"
                            : "hover:bg-[#F4F3EE] text-[#56585D]"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-semibold ${isSelected ? "text-[#1D3557]" : "text-[#18191B]"}`}>
                            {item.title}
                          </span>
                          <span className="rounded bg-[#F4F3EE] px-2 py-0.5 text-[10px] text-[#56585D] font-mono border border-[#E2E0D8]">
                            {item.category}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#56585D] line-clamp-1">
                          {item.summary}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer with keyboard guidance */}
            <div className="border-t border-[#282A30] bg-[#16171B] px-4 py-2 text-[11px] text-[#72747D] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span><kbd className="font-mono rounded border border-[#2E3037] bg-[#222328] px-1 text-[10px]">↑↓</kbd> Navigate</span>
                <span><kbd className="font-mono rounded border border-[#2E3037] bg-[#222328] px-1 text-[10px]">↵</kbd> Select</span>
                <span><kbd className="font-mono rounded border border-[#2E3037] bg-[#222328] px-1 text-[10px]">ESC</kbd> Close</span>
              </div>
              <span className="text-[10px] font-mono text-[#72747D]">Indexed Documentation</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
