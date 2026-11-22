// SICTACK 1.0 – Reusable Code Block with Copy Action
// Direction A: Warm Editorial Software (Human-Centered Design)
"use client";

import { useState } from "react";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({
  code,
  language = "bash",
  filename,
  showLineNumbers = false,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is not available
      const textArea = document.createElement("textarea");
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const lines = code.trim().split("\n");

  return (
    <div className="my-5 w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-[#282A30] bg-[#141518] shadow-sm">
      {/* Top Header Bar (No fake OS dots; clean editorial layout) */}
      <div className="flex items-center justify-between border-b border-[#282A30] bg-[#1A1B1F] px-4 py-2 text-xs">
        <div className="flex items-center gap-2">
          {filename ? (
            <span className="font-mono text-[11px] font-medium text-[#EDEDEB]">
              {filename}
            </span>
          ) : (
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#A6A8B0]">
              {language}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Code copied to clipboard" : "Copy code snippet"}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#282A30] bg-[#141518] px-2.5 py-1 text-[11px] font-medium text-[#A6A8B0] hover:border-[#383A42] hover:text-[#EDEDEB] transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <svg className="h-3.5 w-3.5 text-[#488B68]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-[#488B68]">Copied</span>
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5 text-[#72747D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Text Area */}
      <div className="relative w-full min-w-0 max-w-full overflow-x-auto p-4 text-[13px] leading-relaxed font-mono">
        <pre className="text-[#EDEDEB] whitespace-pre min-w-0">
          <code className="block min-w-0">
            {showLineNumbers
              ? lines.map((line, idx) => (
                  <div key={idx} className="table-row">
                    <span className="table-cell pr-4 select-none text-right text-[#52545D] text-[11px]">
                      {idx + 1}
                    </span>
                    <span className="table-cell whitespace-pre">{line}</span>
                  </div>
                ))
              : lines.join("\n")}
          </code>
        </pre>
      </div>
    </div>
  );
}
