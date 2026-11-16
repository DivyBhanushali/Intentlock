// INTENTLOCK 2.0 – Reusable REST API Endpoint Specification Card
"use client";

import { useState } from "react";
import { EndpointCardProps } from "./types";
import { CodeBlock } from "./CodeBlock";

export function EndpointCard({
  method,
  path,
  summary,
  auth,
  description,
  headers,
  parameters,
  requestBody,
  responses,
}: EndpointCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const methodColors = {
    GET: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    POST: "border-sky-500/30 bg-sky-500/10 text-sky-400",
    PUT: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    PATCH: "border-indigo-500/30 bg-indigo-500/10 text-indigo-400",
    DELETE: "border-rose-500/30 bg-rose-500/10 text-rose-400",
  };

  const authBadges = {
    "Bearer Token": "border-slate-700 bg-slate-800/80 text-slate-300",
    "API Key": "border-emerald-500/20 bg-emerald-950/30 text-emerald-300",
    "Public": "border-teal-500/20 bg-teal-950/30 text-teal-300",
    "Admin Only": "border-amber-500/20 bg-amber-950/30 text-amber-300",
    "Approver or Admin": "border-indigo-500/20 bg-indigo-950/30 text-indigo-300",
  };

  const copyPath = async () => {
    try {
      await navigator.clipboard.writeText(path);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="my-6 rounded-xl border border-slate-800 bg-[#0a0e17] shadow-lg transition-all hover:border-slate-700/80 overflow-hidden">
      {/* Endpoint Header Bar */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={`rounded-md border px-2.5 py-1 text-xs font-mono font-bold tracking-wider ${
                methodColors[method] || "border-slate-700 text-slate-300"
              }`}
            >
              {method}
            </span>

            <button
              onClick={copyPath}
              title="Copy endpoint path"
              className="group flex items-center gap-1.5 font-mono text-sm font-semibold text-slate-100 hover:text-emerald-300 transition-colors"
            >
              <span>{path}</span>
              {copied ? (
                <span className="text-[10px] text-emerald-400 font-sans font-medium">Copied!</span>
              ) : (
                <svg className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-medium ${
                authBadges[auth] || "border-slate-700 text-slate-400"
              }`}
            >
              {auth}
            </span>

            <button
              onClick={() => setExpanded(!expanded)}
              className="rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800 transition-colors"
            >
              {expanded ? "Collapse" : "Details"}
            </button>
          </div>
        </div>

        <p className="mt-2 text-xs text-slate-300 font-medium">{summary}</p>
        {description && (
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">{description}</p>
        )}
      </div>

      {/* Expanded Details Section */}
      {expanded && (
        <div className="border-t border-slate-800/80 bg-[#06080e] p-4 sm:p-5 space-y-5 text-xs">
          {/* Headers */}
          {headers && headers.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Request Headers
              </h4>
              <div className="overflow-x-auto rounded-lg border border-slate-800 bg-[#0a0e17]">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                    <tr>
                      <th className="py-2 px-3">Header</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Required</th>
                      <th className="py-2 px-3 font-sans">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {headers.map((h, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 text-emerald-400">{h.name}</td>
                        <td className="py-2 px-3 text-slate-400">{h.type}</td>
                        <td className="py-2 px-3 text-amber-400">{h.required ? "Yes" : "No"}</td>
                        <td className="py-2 px-3 font-sans text-slate-300">{h.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Parameters */}
          {parameters && parameters.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Parameters
              </h4>
              <div className="overflow-x-auto rounded-lg border border-slate-800 bg-[#0a0e17]">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                    <tr>
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3">Location</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3 font-sans">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {parameters.map((p, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 text-emerald-400">{p.name}</td>
                        <td className="py-2 px-3 text-slate-400">{p.location || "query"}</td>
                        <td className="py-2 px-3 text-slate-400">{p.type}</td>
                        <td className="py-2 px-3 font-sans text-slate-300">{p.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Request Body */}
          {requestBody && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Request Body ({requestBody.contentType})
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">{requestBody.schema}</span>
              </div>
              {requestBody.example && (
                <CodeBlock code={requestBody.example} language="json" />
              )}
            </div>
          )}

          {/* Responses */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Responses
            </h4>
            <div className="space-y-3">
              {responses.map((resp, i) => (
                <div key={i} className="rounded-lg border border-slate-800 bg-[#0a0e17] p-3">
                  <div className="flex items-center gap-2 font-mono text-xs mb-1.5">
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold ${
                        resp.status < 300
                          ? "bg-emerald-500/15 text-emerald-400"
                          : resp.status < 500
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-rose-500/15 text-rose-400"
                      }`}
                    >
                      {resp.status}
                    </span>
                    <span className="text-slate-300 font-sans">{resp.description}</span>
                  </div>
                  {resp.example && (
                    <CodeBlock code={resp.example} language="json" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
