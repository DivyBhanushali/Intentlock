// INTENTLOCK 2.0 – Accessible Multi-Language Code Tabs
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
    <div className="my-5 rounded-xl border border-slate-800 bg-[#06080e] shadow-xl overflow-hidden">
      {/* Tab Selector Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-[#0a0e17] px-2 pt-1.5">
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
                className={`flex items-center gap-1.5 rounded-t-lg px-3.5 py-2 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                  isActive
                    ? "border-t-2 border-emerald-400 bg-[#06080e] text-emerald-300 font-semibold"
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
        <span className="pr-3 text-[10px] font-mono uppercase tracking-wider text-slate-500">
          {activeTab.language}
        </span>
      </div>

      {/* Tab Panel */}
      <div
        id={`tabpanel-${activeTab.id}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab.id}`}
        className="-mt-4"
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
