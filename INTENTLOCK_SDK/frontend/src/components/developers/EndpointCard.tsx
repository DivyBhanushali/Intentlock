// SICTACK 1.0 – Reusable REST API Endpoint Specification Card
// Direction A: Warm Editorial Software (Human-Centered Design)
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

  const methodColors: Record<string, string> = {
    GET: "border-[#D4E8DC] bg-[#EDF5F0] text-[#234E39]",
    POST: "border-[#CFDEEB] bg-[#EEF4F8] text-[#1D3557]",
    PUT: "border-[#FBE3C6] bg-[#FEF6EC] text-[#8D5B18]",
    PATCH: "border-[#DFD5ED] bg-[#F3EFF8] text-[#4A3B69]",
    DELETE: "border-[#F8D5D0] bg-[#FDF1EF] text-[#943425]",
  };

  const authBadges: Record<string, string> = {
    "Bearer Token": "border-[#E2E0D8] bg-[#F4F3EE] text-[#18191B]",
    "API Key": "border-[#D4E8DC] bg-[#EDF5F0] text-[#234E39]",
    "Public": "border-[#E2E0D8] bg-[#F4F3EE] text-[#787A80]",
    "Admin Only": "border-[#FBE3C6] bg-[#FEF6EC] text-[#8D5B18]",
    "Approver or Admin": "border-[#CFDEEB] bg-[#EEF4F8] text-[#1D3557]",
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
    <div className="my-6 rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] shadow-[0_1px_3px_rgba(24,25,27,0.04)] transition-all hover:border-[#CECBC0] overflow-hidden">
      {/* Endpoint Header Bar */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={`rounded-md border px-2.5 py-1 text-xs font-mono font-bold tracking-wider ${
                methodColors[method] || "border-[#E2E0D8] text-[#56585D]"
              }`}
            >
              {method}
            </span>

            <button
              type="button"
              onClick={copyPath}
              title="Copy endpoint path"
              className="group flex items-center gap-1.5 font-mono text-sm font-semibold text-[#18191B] hover:text-[#1D3557] transition-colors cursor-pointer"
            >
              <span>{path}</span>
              {copied ? (
                <span className="text-[10px] text-[#234E39] font-sans font-medium">Copied!</span>
              ) : (
                <svg className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 text-[#787A80] transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-medium ${
                authBadges[auth] || "border-[#E2E0D8] text-[#787A80]"
              }`}
            >
              {auth}
            </span>

            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="rounded-lg border border-[#E2E0D8] bg-[#FFFFFF] px-2.5 py-1 text-xs font-medium text-[#56585D] hover:text-[#18191B] hover:border-[#CECBC0] transition-colors cursor-pointer shadow-xs"
            >
              {expanded ? "Collapse" : "Details"}
            </button>
          </div>
        </div>

        <p className="mt-2 text-xs text-[#18191B] font-medium">{summary}</p>
        {description && (
          <p className="mt-1 text-xs text-[#56585D] leading-relaxed">{description}</p>
        )}
      </div>

      {/* Expanded Endpoint Details */}
      {expanded && (
        <div className="border-t border-[#E2E0D8] bg-[#FAF9F5] p-4 sm:p-5 space-y-6 text-xs">
          {/* Headers */}
          {headers && headers.length > 0 && (
            <div>
              <h4 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#787A80] mb-2">
                Request Headers
              </h4>
              <div className="rounded-lg border border-[#E2E0D8] bg-[#FFFFFF] overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F4F3EE] text-[#56585D] font-mono text-[10px] uppercase border-b border-[#E2E0D8]">
                    <tr>
                      <th className="px-3 py-2">Header</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Required</th>
                      <th className="px-3 py-2">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E0D8]">
                    {headers.map((h, i) => (
                      <tr key={i} className="hover:bg-[#FAF9F5]">
                        <td className="px-3 py-2 font-mono text-[#18191B]">{h.name}</td>
                        <td className="px-3 py-2 font-mono text-[#787A80]">{h.type}</td>
                        <td className="px-3 py-2">
                          {h.required ? (
                            <span className="text-[#943425] font-mono font-semibold">yes</span>
                          ) : (
                            <span className="text-[#787A80] font-mono">no</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-[#56585D]">{h.description}</td>
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
              <h4 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#787A80] mb-2">
                Path &amp; Query Parameters
              </h4>
              <div className="rounded-lg border border-[#E2E0D8] bg-[#FFFFFF] overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F4F3EE] text-[#56585D] font-mono text-[10px] uppercase border-b border-[#E2E0D8]">
                    <tr>
                      <th className="px-3 py-2">Parameter</th>
                      <th className="px-3 py-2">Location</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Required</th>
                      <th className="px-3 py-2">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E0D8]">
                    {parameters.map((p, i) => (
                      <tr key={i} className="hover:bg-[#FAF9F5]">
                        <td className="px-3 py-2 font-mono text-[#1D3557] font-semibold">{p.name}</td>
                        <td className="px-3 py-2 font-mono text-[#787A80]">{p.location || "query"}</td>
                        <td className="px-3 py-2 font-mono text-[#18191B]">{p.type}</td>
                        <td className="px-3 py-2">
                          {p.required ? (
                            <span className="text-[#943425] font-mono font-semibold">yes</span>
                          ) : (
                            <span className="text-[#787A80] font-mono">no</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-[#56585D]">{p.description}</td>
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
              <h4 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#787A80] mb-2">
                Request Body ({requestBody.contentType})
              </h4>
              {requestBody.example && (
                <CodeBlock
                  code={requestBody.example}
                  language="json"
                  filename="request-payload.json"
                />
              )}
            </div>
          )}

          {/* Responses */}
          {responses && responses.length > 0 && (
            <div>
              <h4 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#787A80] mb-2">
                Responses
              </h4>
              <div className="space-y-3">
                {responses.map((r, i) => {
                  const isSuccess = r.status >= 200 && r.status < 300;
                  const isClientError = r.status >= 400 && r.status < 500;
                  return (
                    <div
                      key={i}
                      className="rounded-lg border border-[#E2E0D8] bg-[#FFFFFF] p-3 space-y-2 shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                            isSuccess
                              ? "bg-[#EDF5F0] text-[#234E39] border border-[#D4E8DC]"
                              : isClientError
                              ? "bg-[#FEF6EC] text-[#8D5B18] border border-[#FBE3C6]"
                              : "bg-[#FDF1EF] text-[#943425] border border-[#F8D5D0]"
                          }`}
                        >
                          {r.status}
                        </span>
                        <span className="text-xs text-[#18191B] font-medium">
                          {r.description}
                        </span>
                      </div>
                      {r.example && (
                        <CodeBlock
                          code={r.example}
                          language="json"
                          filename={`response-${r.status}.json`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
