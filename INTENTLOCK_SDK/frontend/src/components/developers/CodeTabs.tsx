// SICTACK 1.0 – Accessible Multi-Language Code Tabs
// Direction A: Warm Editorial Software (Human-Centered Design)
"use client";

import { useState, useRef } from "react";
import { CodeBlock } from "./CodeBlock";
import { CodeTabItem } from "./types";

interface CodeTabsProps {
  tabs: CodeTabItem[];
  defaultTabId?: string;
}

export function CodeTabs({ tabs, defaultTabId }: CodeTabsProps) {
  const [activeTabId, setActiveTabId] = useState<string>(
    defaultTabId || (tabs.length > 0 ? tabs[0].id : "")
  );
  const tabListRef = useRef<HTMLDivElement>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const activeIndex = tabs.findIndex((t) => t.id === activeTab.id);

  if (!tabs || tabs.length === 0) {
    return null;
  }

  // Keyboard navigation for tabs (ArrowLeft / ArrowRight)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextIndex = (activeIndex + 1) % tabs.length;
      setActiveTabId(tabs[nextIndex].id);
      const nextBtn = tabListRef.current?.children[nextIndex] as HTMLButtonElement;
      nextBtn?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIndex = (activeIndex - 1 + tabs.length) % tabs.length;
      setActiveTabId(tabs[prevIndex].id);
      const prevBtn = tabListRef.current?.children[prevIndex] as HTMLButtonElement;
      prevBtn?.focus();
    }
  };

  return (
    <div className="my-6 w-full min-w-0 max-w-full rounded-xl border border-[#282A30] bg-[#141518] shadow-sm overflow-hidden">
      {/* Tab Selector Header */}
      <div className="flex items-center justify-between border-b border-[#282A30] bg-[#1A1B1F] px-2 pt-1.5">
        <div
          ref={tabListRef}
          role="tablist"
          aria-label="Code language options"
          onKeyDown={handleKeyDown}
          className="flex space-x-1"
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTabId(tab.id)}
                className={`flex items-center gap-1.5 rounded-t-lg px-3.5 py-2 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B8AC4] cursor-pointer ${
                  isActive
                    ? "border-b-2 border-[#5B8AC4] bg-[#141518] text-[#EDEDEB] font-semibold"
                    : "text-[#72747D] hover:bg-[#1E2024] hover:text-[#A6A8B0]"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
        <span className="pr-3 text-[10px] font-mono uppercase tracking-wider text-[#72747D]">
          {activeTab.language}
        </span>
      </div>

      {/* Tab Panel */}
      <div
        id={`tabpanel-${activeTab.id}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab.id}`}
        className="-mt-5 w-full min-w-0 max-w-full"
      >
        <CodeBlock
          code={activeTab.code}
          language={activeTab.language}
          showLineNumbers={false}
        />
      </div>
    </div>
  );
}
