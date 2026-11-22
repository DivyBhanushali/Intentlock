// SICTACK 1.0 – API Authentication & RBAC Guide
import { DeveloperLayout } from "@/components/developers/DeveloperLayout";
import { CodeBlock } from "@/components/developers/CodeBlock";
import { Callout } from "@/components/developers/Callout";
import { PreviousNextNavigation } from "@/components/developers/PreviousNextNavigation";
import { TocItem } from "@/components/developers/types";

export default function AuthenticationGuidePage() {
  const breadcrumbs = [
    { label: "Developers", href: "/developers" },
    { label: "REST API", href: "/developers/api" },
    { label: "Authentication", href: "/developers/api/authentication" },
  ];

  const toc: TocItem[] = [
    { id: "overview", title: "Dual Authentication Model", level: 2 },
    { id: "user-jwt", title: "1. User Authentication (JWT)", level: 2 },
    { id: "jwt-login", title: "Login & Token Issuance", level: 3 },
    { id: "jwt-usage", title: "Using JWT in Requests", level: 3 },
    { id: "rbac", title: "Role-Based Access Control (RBAC)", level: 3 },
    { id: "machine-api-keys", title: "2. Machine Authentication (API Keys)", level: 2 },
    { id: "key-format", title: "Key Format & Headers", level: 3 },
    { id: "key-creation", title: "Creating & Revoking Keys", level: 3 },
    { id: "key-storage", title: "Secret Storage & Hashing", level: 3 },
    { id: "security-rules", title: "Key Security Rules", level: 2 },
  ];

  const loginCurlCode = `curl -X POST "https://intentlock-backend-ze2i.onrender.com/api/v1/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "security-lead@company.com",
    "password": "YOUR_STRONG_PASSWORD"
  }'`;

  const loginResponseCode = `{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "usr_9912",
    "email": "security-lead@company.com",
    "name": "Alex Mercer",
    "role": "ADMIN",
    "org_id": "org_enterprise_01"
  }
}`;

  const jwtAuthCurlCode = `curl -X GET "https://intentlock-backend-ze2i.onrender.com/api/v1/policies" \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`;

  const createApiKeyCurlCode = `curl -X POST "https://intentlock-backend-ze2i.onrender.com/api/v1/auth/api-keys" \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Production Agent Fleet Key",
    "agent_id": "financial-reconciler-01"
  }'`;

  const createApiKeyResponseCode = `{
  "id": "key_77192",
  "name": "Production Agent Fleet Key",
  "key": "sck_live_8f92b7c1a93847e6d5c2104928374a5b",
  "key_prefix": "sck_live_8f92",
  "agent_id": "financial-reconciler-01",
  "created_at": "2026-11-16T12:00:00Z"
}`;

  const interceptCurlCode = `curl -X POST "https://intentlock-backend-ze2i.onrender.com/api/v1/intercept" \\
  -H "X-API-Key: sck_live_8f92b7c1a93847e6d5c2104928374a5b" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_id": "financial-reconciler-01",
    "tool_name": "transfer_funds",
    "arguments": {
      "recipient": "ACC-9921",
      "amount": 250.0
    }
  }'`;

  return (
    <DeveloperLayout breadcrumbs={breadcrumbs} toc={toc}>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-md bg-[#EDF5F0] border border-[#234E39]/20 px-2 py-0.5 text-xs font-mono font-medium text-[#234E39]">
              REST API
            </span>
            <span className="text-xs text-[#787A80]">Security Architecture</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#18191B] sm:text-4xl">
            API Authentication &amp; RBAC
          </h1>
          <p className="mt-3 text-base text-[#56585D] leading-relaxed">
            SICTACK enforces strict boundaries between interactive dashboard operators and autonomous machine agents. Learn how JWT sessions, API keys, and Role-Based Access Control work.
          </p>
        </div>

        {/* Overview */}
        <section id="overview" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Dual Authentication Model
          </h2>
          <div className="overflow-x-auto rounded-xl border border-[#E2E0D8]">
            <table className="w-full text-left text-xs text-[#56585D]">
              <thead className="bg-[#FFFFFF] text-[#18191B] border-b border-[#E2E0D8] font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Subject Type</th>
                  <th className="py-2.5 px-4">Credential</th>
                  <th className="py-2.5 px-4">Header</th>
                  <th className="py-2.5 px-4">Permitted Endpoints</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E0D8] font-mono text-xs">
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-[#18191B]">Human Operators</td>
                  <td className="py-2.5 px-4 text-[#1D3557]">JWT Access Token</td>
                  <td className="py-2.5 px-4 text-[#56585D]">Authorization: Bearer &lt;token&gt;</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">Dashboard, Policies, Approvals, Team Management, API Keys</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-[#18191B]">Machine Agents</td>
                  <td className="py-2.5 px-4 text-[#234E39]">API Key (<code className="text-[#234E39]">ilk_live_...</code>)</td>
                  <td className="py-2.5 px-4 text-[#56585D]">X-API-Key: &lt;key&gt;</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">Interception Gateway, Intent Contexts, Agents, Read Policies</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section: User JWT */}
        <section id="user-jwt" className="scroll-mt-20 space-y-6">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            1. User Authentication (JWT)
          </h2>

          <div id="jwt-login" className="space-y-3">
            <h3 className="text-lg font-semibold text-[#18191B]">Login &amp; Token Issuance</h3>
            <p className="text-sm text-[#56585D] leading-relaxed">
              Operators obtain an access token by authenticating with email and password:
            </p>
            <CodeBlock code={loginCurlCode} language="bash" filename="Terminal" />
            <p className="text-xs text-[#56585D]">Response contains the JWT token and user profile:</p>
            <CodeBlock code={loginResponseCode} language="json" filename="Response" />
          </div>

          <div id="jwt-usage" className="space-y-3">
            <h3 className="text-lg font-semibold text-[#18191B]">Using JWT in Requests</h3>
            <p className="text-sm text-[#56585D] leading-relaxed">
              Pass the token in the standard HTTP <code className="text-[#234E39] font-mono">Authorization</code> header:
            </p>
            <CodeBlock code={jwtAuthCurlCode} language="bash" filename="Terminal" />
          </div>

          <div id="rbac" className="space-y-3">
            <h3 className="text-lg font-semibold text-[#18191B]">Role-Based Access Control (RBAC)</h3>
            <p className="text-sm text-[#56585D] leading-relaxed">
              User tokens carry one of three discrete roles:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-[#8D5B18]/20 bg-[#FFFFFF] p-4">
                <span className="text-xs font-mono font-bold text-[#8D5B18]">ADMIN</span>
                <p className="mt-2 text-xs text-[#56585D]">
                  Full control over organization settings, team members, API key issuance/revocation, and policy creation/deletion.
                </p>
              </div>

              <div className="rounded-xl border border-indigo-500/30 bg-[#FFFFFF] p-4">
                <span className="text-xs font-mono font-bold text-indigo-400">APPROVER</span>
                <p className="mt-2 text-xs text-[#56585D]">
                  Authorized to approve or reject pending human-in-the-loop tool requests and view audit trails. Cannot invite members or delete policies.
                </p>
              </div>

              <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4">
                <span className="text-xs font-mono font-bold text-[#56585D]">VIEWER</span>
                <p className="mt-2 text-xs text-[#56585D]">
                  Read-only visibility into dashboard analytics, active agents, benchmark results, and audit events. Cannot approve requests or modify policies.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Machine API Keys */}
        <section id="machine-api-keys" className="scroll-mt-20 space-y-6 pt-4 border-t border-[#E2E0D8]">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            2. Machine Authentication (API Keys)
          </h2>

          <div id="key-format" className="space-y-3">
            <h3 className="text-lg font-semibold text-[#18191B]">Key Format &amp; Transmission</h3>
            <p className="text-sm text-[#56585D] leading-relaxed">
              SICTACK API keys are formatted as <code className="text-[#234E39] font-mono">ilk_live_&lt;32-char-random-hex&gt;</code>. Pass the key in the <code className="text-[#234E39] font-mono">X-API-Key</code> header:
            </p>
            <CodeBlock code={interceptCurlCode} language="bash" filename="Terminal" />

            <Callout type="tip" title="Dual Header Compatibility">
              <p className="text-xs leading-relaxed">
                For HTTP clients that strictly use the Authorization header, SICTACK also accepts API keys passed as <code className="font-mono text-[#234E39]">Authorization: Bearer ilk_live_...</code>.
              </p>
            </Callout>

            <Callout type="warning" title="No Access to User Management Endpoints">
              <p className="text-xs leading-relaxed">
                API keys are strictly intended for agent runtime operations (e.g. <code className="font-mono text-[#234E39]">/api/v1/intercept</code>, <code className="font-mono text-[#234E39]">/api/v1/intents</code>). API keys <strong>cannot</strong> be used to manage team members, delete policies, approve requests, or issue other API keys. Any attempt by an API key to access endpoints requiring user authentication receives an immediate <code className="font-mono text-[#943425]">HTTP 401 Unauthorized</code> response.
              </p>
            </Callout>
          </div>

          <div id="key-creation" className="space-y-3">
            <h3 className="text-lg font-semibold text-[#18191B]">Creating &amp; Revoking API Keys</h3>
            <p className="text-sm text-[#56585D] leading-relaxed">
              Administrators create API keys for AI agent fleets via the REST API or Dashboard:
            </p>
            <CodeBlock code={createApiKeyCurlCode} language="bash" filename="Terminal" />
            <p className="text-xs text-[#56585D]">Response contains the raw key shown once:</p>
            <CodeBlock code={createApiKeyResponseCode} language="json" filename="Response" />
          </div>

          <div id="key-storage" className="space-y-3">
            <h3 className="text-lg font-semibold text-[#18191B]">Cryptographic Secret Storage</h3>
            <p className="text-sm text-[#56585D] leading-relaxed">
              SICTACK stores API keys using one-way cryptographic hashing (<code className="text-[#234E39] font-mono">hash_api_key(key)</code>). The plaintext key is never written to disk or the database. If an API key is lost, it cannot be recovered—a new key must be generated.
            </p>
          </div>
        </section>

        {/* Section: Security Rules */}
        <section id="security-rules" className="scroll-mt-20 space-y-4 pt-4 border-t border-[#E2E0D8]">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Non-Negotiable Key Security Rules
          </h2>

          <div className="space-y-3">
            <Callout type="danger" title="Server-Side Secrets Only">
              <p className="text-xs leading-relaxed">
                Never embed SICTACK API keys into browser code, mobile client bundles, or frontend JavaScript. Tool call interception must happen on your secure backend server.
              </p>
            </Callout>

            <Callout type="warning" title="No Query Parameters">
              <p className="text-xs leading-relaxed">
                Never pass API keys or JWT tokens inside URL query strings (e.g. <code className="font-mono text-[#18191B]">?api_key=...</code>). URL query parameters are captured in server access logs and browser histories. Always use request headers.
              </p>
            </Callout>
          </div>
        </section>

        {/* Navigation */}
        <PreviousNextNavigation
          prev={{ title: "REST API Overview", href: "/developers/api" }}
          next={{ title: "OpenAPI Endpoint Reference", href: "/developers/api/reference" }}
        />
      </div>
    </DeveloperLayout>
  );
}
