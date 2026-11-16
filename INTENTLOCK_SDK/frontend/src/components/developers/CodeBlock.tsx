// INTENTLOCK 2.0 – Reusable Code Block with Copy Action
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
    <div className="my-4 overflow-hidden rounded-xl border border-slate-800 bg-[#06080e] shadow-xl">
      {/* Top Header / Tab Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#0a0e17] px-4 py-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-700/50" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-700/50" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-700/50" />
          </div>
          {filename ? (
            <span className="ml-2 font-mono text-[11px] font-medium text-slate-300">
              {filename}
            </span>
          ) : (
            <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-slate-400">
              {language}
            </span>
          )}
        </div>

        <button
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
          className="flex items-center gap-1.5 rounded-md border border-slate-700/60 bg-slate-800/80 px-2 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-700 hover:text-white"
        >
          {copied ? (
            <>
              <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Area */}
      <div className="relative overflow-x-auto p-4 text-[13px] leading-relaxed font-mono">
        <pre className="text-slate-200">
          <code>
            {showLineNumbers
              ? lines.map((line, idx) => (
                  <div key={idx} className="table-row">
                    <span className="table-cell pr-4 select-none text-right text-slate-600 text-[11px]">
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
