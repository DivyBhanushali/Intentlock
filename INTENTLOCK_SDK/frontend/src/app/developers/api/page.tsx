// INTENTLOCK 2.0 – REST API Overview Page
import Link from "next/link";
import { DeveloperLayout } from "@/components/developers/DeveloperLayout";
import { CodeBlock } from "@/components/developers/CodeBlock";
import { Callout } from "@/components/developers/Callout";
import { PreviousNextNavigation } from "@/components/developers/PreviousNextNavigation";
import { TocItem } from "@/components/developers/types";

export default function ApiOverviewPage() {
  const breadcrumbs = [
    { label: "Developers", href: "/developers" },
    { label: "REST API", href: "/developers/api" },
  ];

  const toc: TocItem[] = [
    { id: "base-urls", title: "Base URLs & Environments", level: 2 },
    { id: "versioning", title: "Versioning & Prefix", level: 2 },
    { id: "conventions", title: "Request & Response Conventions", level: 2 },
    { id: "auth-overview", title: "Authentication Overview", level: 2 },
    { id: "tenancy-scope", title: "Multi-Tenancy & Org Scoping", level: 2 },
    { id: "status-codes", title: "HTTP Status Codes & Errors", level: 2 },
    { id: "rate-limits", title: "Rate Limits & Concurrency", level: 2 },
    { id: "next-steps", title: "Next Steps", level: 2 },
  ];

  const healthCurlCode = `# Verify API gateway connectivity
curl -X GET "https://intentlock-backend-ze2i.onrender.com/health"`;

  const healthResponseCode = `{
  "status": "healthy",
  "service": "INTENTLOCK API",
  "version": "2.0.0",
  "database": "postgresql"
}`;

  const standardErrorCode = `{
  "detail": "Action denied by security policy: tool 'drop_table' is forbidden."
}`;

  return (
    <DeveloperLayout breadcrumbs={breadcrumbs} toc={toc}>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-mono font-medium text-emerald-400">
              REST API
            </span>
            <span className="text-xs text-slate-500">v1 Specification</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            REST API Overview
          </h1>
          <p className="mt-3 text-base text-slate-400 leading-relaxed">
            The INTENTLOCK REST API provides centralized policy management, human-in-the-loop approval triage, machine-to-machine tool interception, and tamper-evident audit logging for distributed AI agent deployments.
          </p>
        </div>

        {/* Base URLs */}
        <section id="base-urls" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Base URLs &amp; Environments
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            All API requests must be transmitted over HTTPS in production. Unencrypted HTTP traffic is rejected.
          </p>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0e1420] text-slate-200 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Environment</th>
                  <th className="py-2.5 px-4">Base URL</th>
                  <th className="py-2.5 px-4">Usage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-white">Production (Cloud)</td>
                  <td className="py-2.5 px-4 text-emerald-400">https://intentlock-backend-ze2i.onrender.com</td>
                  <td className="py-2.5 px-4 font-sans text-slate-400">Live multi-tenant API gateway backed by PostgreSQL.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-white">Local Development</td>
                  <td className="py-2.5 px-4 text-slate-300">http://localhost:8000</td>
                  <td className="py-2.5 px-4 font-sans text-slate-400">Local FastAPI instance backed by SQLite or local PostgreSQL.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed pt-2">
            Test gateway connectivity with the unauthenticated health check endpoint:
          </p>
          <CodeBlock code={healthCurlCode} language="bash" filename="Terminal" />
          <CodeBlock code={healthResponseCode} language="json" filename="Response" />
        </section>

        {/* Versioning */}
        <section id="versioning" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Versioning &amp; Path Prefix
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            All functional operations are versioned under the <code className="text-emerald-300 font-mono">/api/v1</code> path prefix. Backward-incompatible changes will be introduced under future version prefixes (<code className="text-slate-400 font-mono">/api/v2</code>).
          </p>
        </section>

        {/* Conventions */}
        <section id="conventions" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Request &amp; Response Conventions
          </h2>
          <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
            <li><strong className="text-white">Content-Type</strong>: All POST, PUT, and PATCH request bodies must be JSON encoded with <code className="text-emerald-300 font-mono">Content-Type: application/json</code>.</li>
            <li><strong className="text-white">Date-Time Formatting</strong>: All timestamps in requests and responses conform to ISO 8601 UTC strings (e.g. <code className="text-slate-200 font-mono">2026-11-16T12:00:00Z</code>).</li>
            <li><strong className="text-white">Deterministic Field Naming</strong>: Request and response property keys strictly follow <code className="text-slate-200 font-mono">snake_case</code> (e.g. <code className="text-emerald-300 font-mono">action_hash</code>, <code className="text-emerald-300 font-mono">risk_score</code>).</li>
          </ul>
        </section>

        {/* Auth Overview */}
        <section id="auth-overview" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Authentication Overview
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            INTENTLOCK uses dual authentication channels:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-800 bg-[#0a0e17] p-4">
              <span className="text-xs font-mono font-bold text-sky-400">HUMAN / DASHBOARD USERS</span>
              <h3 className="text-sm font-bold text-white mt-1">JWT Bearer Session Tokens</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Obtained via <code className="text-slate-200 font-mono">POST /api/v1/auth/login</code>. Transmitted in the standard <code className="text-slate-200 font-mono">Authorization: Bearer &lt;token&gt;</code> header.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0a0e17] p-4">
              <span className="text-xs font-mono font-bold text-emerald-400">MACHINE-TO-MACHINE AGENTS</span>
              <h3 className="text-sm font-bold text-white mt-1">INTENTLOCK API Keys</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Scoped API keys prefixed with <code className="text-slate-200 font-mono">ilk_live_...</code>. Transmitted via the <code className="text-slate-200 font-mono">X-API-Key: &lt;key&gt;</code> header.
              </p>
            </div>
          </div>

          <div className="pt-1">
            <Link
              href="/developers/api/authentication"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Read the complete Authentication &amp; RBAC Guide &rarr;
            </Link>
          </div>
        </section>

        {/* Multi-Tenancy Scope */}
        <section id="tenancy-scope" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Multi-Tenancy &amp; Organization Scoping
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Every user account and API key is associated with an organization (<code className="text-emerald-300 font-mono">org_id</code>). All policies, agents, approvals, intent contexts, audit records, and threat detections are partitioned by organization ID.
          </p>
          <Callout type="info" title="Tenant Scoping &amp; Baseline Policies">
            <p className="text-xs leading-relaxed">
              INTENTLOCK scopes policies, audit logs, agents, and approvals by tenant <code className="font-mono text-emerald-300">org_id</code>. Shared default templates and baseline policies exist under <code className="font-mono text-slate-300">default-org</code>. In local development environments, unauthenticated requests fall back to <code className="font-mono text-slate-300">default-org</code> for backward-compatible demonstration.
            </p>
          </Callout>
        </section>

        {/* HTTP Status Codes */}
        <section id="status-codes" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            HTTP Status Codes &amp; Error Format
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Errors return standardized JSON objects containing a <code className="text-emerald-300 font-mono">detail</code> property:
          </p>

          <CodeBlock code={standardErrorCode} language="json" filename="403 Forbidden" />

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0e1420] text-slate-200 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Meaning</th>
                  <th className="py-2 px-3">Typical Cause</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                <tr>
                  <td className="py-2 px-3 text-emerald-400">200 OK</td>
                  <td className="py-2 px-3 font-sans text-slate-300">Success</td>
                  <td className="py-2 px-3 font-sans text-slate-400">Request completed successfully.</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-emerald-400">201 Created</td>
                  <td className="py-2 px-3 font-sans text-slate-300">Created</td>
                  <td className="py-2 px-3 font-sans text-slate-400">Resource created (e.g. policy, agent, API key).</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-300">204 No Content</td>
                  <td className="py-2 px-3 font-sans text-slate-300">No Content</td>
                  <td className="py-2 px-3 font-sans text-slate-400">Resource successfully deleted or revoked.</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-amber-400">400 Bad Request</td>
                  <td className="py-2 px-3 font-sans text-slate-300">Client Error</td>
                  <td className="py-2 px-3 font-sans text-slate-400">Malformed syntax or invalid query parameters.</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-rose-400">401 Unauthorized</td>
                  <td className="py-2 px-3 font-sans text-slate-300">Unauthenticated</td>
                  <td className="py-2 px-3 font-sans text-slate-400">Missing or expired Bearer token or invalid API key.</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-rose-400">403 Forbidden</td>
                  <td className="py-2 px-3 font-sans text-slate-300">Permission Denied</td>
                  <td className="py-2 px-3 font-sans text-slate-400">User lacks required RBAC role (e.g. ADMIN required).</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-400">404 Not Found</td>
                  <td className="py-2 px-3 font-sans text-slate-300">Not Found</td>
                  <td className="py-2 px-3 font-sans text-slate-400">Requested resource does not exist in your organization.</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-amber-400">422 Unprocessable</td>
                  <td className="py-2 px-3 font-sans text-slate-300">Schema Validation</td>
                  <td className="py-2 px-3 font-sans text-slate-400">Pydantic validation failure on request payload.</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-rose-500">500 Server Error</td>
                  <td className="py-2 px-3 font-sans text-slate-300">Internal Error</td>
                  <td className="py-2 px-3 font-sans text-slate-400">Unexpected server fault (internal traces sanitized).</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Rate Limits */}
        <section id="rate-limits" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Rate Limits &amp; Concurrency
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            The INTENTLOCK backend currently does not enforce application-level token bucket rate limits in code. Rate limiting is not active by default in the application layer. For production deployments with high volume, configure a rate-limiting reverse proxy, API gateway, or cloud firewall (e.g. Cloudflare, AWS WAF, or Nginx) in front of the FastAPI backend.
          </p>
        </section>

        {/* Next Steps */}
        <section id="next-steps" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/developers/api/authentication"
              className="group rounded-xl border border-slate-800/80 bg-[#0a0e17] p-5 transition-all hover:border-emerald-500/30 hover:bg-slate-900/60"
            >
              <div className="text-sm font-semibold text-slate-200 group-hover:text-emerald-400">
                Authentication &amp; RBAC Guide &rarr;
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Learn how JWT session tokens and API keys work with ADMIN, APPROVER, and VIEWER roles.
              </p>
            </Link>

            <Link
              href="/developers/api/reference"
              className="group rounded-xl border border-slate-800/80 bg-[#0a0e17] p-5 transition-all hover:border-emerald-500/30 hover:bg-slate-900/60"
            >
              <div className="text-sm font-semibold text-slate-200 group-hover:text-emerald-400">
                OpenAPI Endpoint Reference &rarr;
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Explore all 48 interactive endpoints across all 11 resource groups.
              </p>
            </Link>
          </div>
        </section>

        {/* Navigation */}
        <PreviousNextNavigation
          prev={{ title: "Error Handling", href: "/developers/sdk/errors" }}
          next={{ title: "Authentication Guide", href: "/developers/api/authentication" }}
        />
      </div>
    </DeveloperLayout>
  );
}
