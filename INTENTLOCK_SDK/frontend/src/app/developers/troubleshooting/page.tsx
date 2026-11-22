// SICTACK 1.0 – Troubleshooting & Diagnostics Guide
"use client";

import { DeveloperLayout } from "@/components/developers/DeveloperLayout";
import { CodeBlock } from "@/components/developers/CodeBlock";
import { Callout } from "@/components/developers/Callout";
import { PreviousNextNavigation } from "@/components/developers/PreviousNextNavigation";
import { TocItem } from "@/components/developers/types";

export default function TroubleshootingGuidePage() {
  const breadcrumbs = [
    { label: "Developers", href: "/developers" },
    { label: "Security & Operations", href: "/developers/troubleshooting" },
    { label: "Troubleshooting & FAQs", href: "/developers/troubleshooting" },
  ];

  const toc: TocItem[] = [
    { id: "sdk-python", title: "SDK Installation & Environment", level: 2 },
    { id: "onedrive-lock", title: "Windows OneDrive EPERM -4048 Build Lock", level: 2 },
    { id: "auth-keys", title: "Authentication & API Key Issues", level: 2 },
    { id: "policy-denials", title: "Permission Denials & Policy Debugging", level: 2 },
    { id: "approval-errors", title: "Approval Expiration & Replay Errors", level: 2 },
    { id: "backend-db", title: "Backend Connectivity & Database Errors", level: 2 },
    { id: "tenant-context", title: "Missing Organization Context", level: 2 },
    { id: "framework-adapters", title: "Framework Adapter Issues (LangChain, LangGraph, MCP)", level: 2 },
    { id: "matrix", title: "Quick Diagnostics Matrix", level: 2 },
  ];

  const importCollisionCode = `# How import shadowing occurs
# If your project directory contains a file named 'sictack.py' or 'intentlock.py':
import sictack  # Fails or loads the empty local file instead of the package!

# Solution:
# 1. Rename any local script named sictack.py or intentlock.py to test_agent.py or run_defense.py
# 2. Check the resolved module path:
python -c "import sictack; print(sictack.__file__)"
# Correct output: .../site-packages/sictack/__init__.py`;

  const onedriveConfigSnippet = `# Check file attributes in PowerShell without deleting files:
Get-Item -Path "frontend\\.next\\build\\chunks" | Format-List Attributes

# Safe workaround: Point Next.js build cache to a local directory outside OneDrive sync:
# In next.config.ts:
# distDir: process.env.NEXT_DIST_DIR || '.next'`;

  const approvalHandlingCode = `# LangChain Adapter: Distinguishing Tool Error Handling
from sictack.integrations.langchain import SecureTool

# Default behavior: handle_tool_error=True
# Returns string to LLM: "[SECURITY_ERROR: PermissionDeniedError] Action 'db_drop' denied"
safe_tool = SecureTool(tool=my_tool, agent=agent, handle_tool_error=True)

# Strict exception mode: handle_tool_error=False
# Raises PermissionDeniedError or ApprovalRequiredError directly to calling code
strict_tool = SecureTool(tool=my_tool, agent=agent, handle_tool_error=False)`;

  return (
    <DeveloperLayout breadcrumbs={breadcrumbs} toc={toc}>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-md bg-[#FEF6EC] border border-[#8D5B18]/20 px-2 py-0.5 text-xs font-mono font-medium text-[#8D5B18]">
              Diagnostics &amp; FAQs
            </span>
            <span className="text-xs text-[#787A80]">Self-Service Resolution</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#18191B] sm:text-4xl">
            Troubleshooting &amp; Diagnostics Guide
          </h1>
          <p className="mt-3 text-base text-[#56585D] leading-relaxed">
            Resolve common installation issues, authentication errors, approval lifecycle mismatches, framework adapter behaviors, and build-time filesystem quirks safely and predictably.
          </p>
        </div>

        {/* Section: SDK Python */}
        <section id="sdk-python" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            SDK Installation &amp; Python Environment Issues
          </h2>

          <div className="space-y-3 text-xs">
            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 space-y-2">
              <span className="font-semibold text-[#943425] font-mono">ERROR: Package &apos;sictack&apos; requires a different Python: &lt;version&gt; not in &apos;&gt;=3.12&apos;</span>
              <p className="text-[#56585D]">
                <strong>Root Cause:</strong> You are installing or executing with Python &le; 3.11. SICTACK specifies <code className="font-mono text-[#234E39]">requires-python = &quot;&gt;=3.12&quot;</code> in <code className="font-mono text-[#234E39]">pyproject.toml</code>.
              </p>
              <p className="text-[#56585D]">
                <strong>Fix:</strong> Upgrade your runtime environment to Python 3.12 or newer. Verify your active version with <code className="font-mono text-[#234E39]">python --version</code>.
              </p>
            </div>

            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 space-y-2">
              <span className="font-semibold text-[#8D5B18] font-mono">ModuleNotFoundError: No module named &apos;intentlock&apos;</span>
              <p className="text-[#56585D]">
                <strong>Root Cause:</strong> The SDK package is not installed in the active virtual environment.
              </p>
              <p className="text-[#56585D]">
                <strong>Fix:</strong> Install in editable mode from your local checkout:
              </p>
              <CodeBlock code="pip install -e /path/to/SICTACK_SDK/sdk/python" language="bash" filename="Terminal" />
            </div>

            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 space-y-2">
              <span className="font-semibold text-[#8D5B18] font-mono">AttributeError: module &apos;intentlock&apos; has no attribute &apos;SecureAgent&apos;</span>
              <p className="text-[#56585D]">
                <strong>Root Cause:</strong> <em>Import Shadowing</em>. A file or directory in your current working directory is named <code className="font-mono text-[#234E39]">intentlock.py</code> or <code className="font-mono text-[#234E39]">intentlock/</code>, intercepting the real package.
              </p>
              <CodeBlock code={importCollisionCode} language="python" filename="Diagnose Import Shadowing" />
            </div>
          </div>
        </section>

        {/* Section: OneDrive Lock */}
        <section id="onedrive-lock" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Windows OneDrive EPERM -4048 Build Lock
          </h2>
          <Callout type="info" title="Forensic Diagnosis for Windows Users">
            <p className="text-xs leading-relaxed">
              When building Next.js projects inside a folder synced by Microsoft OneDrive on Windows, the build may halt with:
              <br />
              <code className="font-mono text-[#943425] mt-1 block">Error: EPERM: operation not permitted, rmdir &apos;...\frontend\.next\build\chunks&apos;</code>
            </p>
          </Callout>

          <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-5 space-y-3 text-xs text-[#56585D]">
            <h3 className="text-sm font-semibold text-[#18191B]">Why This Happens</h3>
            <p className="text-[#56585D] leading-relaxed">
              Microsoft OneDrive continuously monitors directory changes in synchronized folders. When Next.js compiles chunks, OneDrive locks subdirectories (such as <code className="font-mono text-[#56585D]">.next/build/chunks</code>) to calculate file hashes and sync status, setting Windows file attributes (<code className="font-mono text-[#56585D]">ReparsePoint</code> and <code className="font-mono text-[#56585D]">ReadOnly</code>). Node.js <code className="font-mono text-[#56585D]">fs.rmdirSync</code> cannot unlink active OneDrive reparse points while the sync client holds an open lock.
            </p>

            <h3 className="text-sm font-semibold text-[#18191B] pt-2">Safe Remediation (Do NOT Unsafely Delete User Files)</h3>
            <ol className="list-decimal list-inside space-y-2 text-[#56585D]">
              <li>
                <strong>Pause OneDrive Sync During Builds:</strong> Right-click the OneDrive cloud icon in the Windows taskbar and select <em>&ldquo;Pause syncing &rarr; 2 hours&rdquo;</em> before running production builds.
              </li>
              <li>
                <strong>Exclude .next from Cloud Sync:</strong> Ensure <code className="font-mono text-[#234E39]">.next</code> is included in your project root <code className="font-mono text-[#234E39]">.gitignore</code>. In Windows PowerShell, clear readonly flags if locked:
                <CodeBlock code={onedriveConfigSnippet} language="powershell" filename="PowerShell" />
              </li>
              <li>
                <strong>Build Outside Synced Directory:</strong> In CI/CD or production environments, clone repositories into local directories outside cloud storage sync roots (e.g. <code className="font-mono text-[#56585D]">C:\dev\intentlock</code> or Linux containers).
              </li>
            </ol>
          </div>
        </section>

        {/* Section: Auth & Keys */}
        <section id="auth-keys" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Authentication &amp; API Key Issues
          </h2>

          <div className="space-y-3 text-xs">
            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 space-y-2">
              <span className="font-semibold text-[#943425] font-mono">HTTP 401 Unauthorized: Invalid API Key</span>
              <p className="text-[#56585D]">
                <strong>Check:</strong> API keys must be passed in the header <code className="font-mono text-[#234E39]">X-API-Key: ilk_live_...</code> (or <code className="font-mono text-[#234E39]">Authorization: Bearer &lt;key&gt;</code>).
              </p>
              <p className="text-[#56585D]">
                Confirm your key starts with <code className="font-mono text-[#234E39]">ilk_live_</code> or <code className="font-mono text-[#8D5B18]">ilk_test_</code>. If revoked, generate a replacement in the SOC dashboard.
              </p>
            </div>

            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 space-y-2">
              <span className="font-semibold text-[#943425] font-mono">HTTP 401 Unauthorized: Token has expired</span>
              <p className="text-[#56585D]">
                <strong>Check:</strong> Operator JWT tokens have a 24-hour expiration window (<code className="font-mono text-[#234E39]">ACCESS_TOKEN_EXPIRE_MINUTES=1440</code>). Re-authenticate via <code className="font-mono text-[#234E39]">POST /api/v1/auth/login</code> to obtain a fresh token.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Policy Denials */}
        <section id="policy-denials" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Permission Denials &amp; Policy Debugging
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            When a tool call returns <code className="font-mono text-[#943425]">DENY</code>, inspect the <code className="font-mono text-[#234E39]">reason</code> string in the <code className="font-mono text-[#234E39]">Decision</code> object:
          </p>

          <div className="rounded-xl border border-[#E2E0D8] overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#FFFFFF] border-b border-[#E2E0D8] text-[#56585D] font-mono">
                <tr>
                  <th className="p-3">Reason Code</th>
                  <th className="p-3">Trigger Condition</th>
                  <th className="p-3">How to Resolve</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E0D8] bg-[#FFFFFF] text-[#56585D]">
                <tr>
                  <td className="p-3 font-mono font-bold text-[#943425]">TOOL_NOT_REGISTERED</td>
                  <td className="p-3">The agent attempted to invoke a tool name not present in the registry.</td>
                  <td className="p-3 text-[#56585D]">Register the callable via <code className="font-mono text-[#234E39]">agent.register_tool()</code> or check tool name spelling.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-bold text-[#943425]">PERMISSION_DENIED</td>
                  <td className="p-3">The tool&apos;s required permission is present in <code className="font-mono text-[#56585D]">denied_permissions</code> or missing from <code className="font-mono text-[#56585D]">allowed_permissions</code>.</td>
                  <td className="p-3 text-[#56585D]">Update the policy in the dashboard or pass an updated <code className="font-mono text-[#234E39]">Policy</code> definition.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-bold text-[#943425]">SENSITIVITY_TOO_HIGH</td>
                  <td className="p-3">Tool sensitivity exceeds policy <code className="font-mono text-[#56585D]">max_sensitivity</code>.</td>
                  <td className="p-3 text-[#56585D]">Lower tool sensitivity or increase policy ceiling for authorized agents.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-bold text-[#943425]">RECIPIENT_NOT_ALLOWED</td>
                  <td className="p-3">Target recipient email domain does not match <code className="font-mono text-[#56585D]">allowed_recipients</code> pattern.</td>
                  <td className="p-3 text-[#56585D]">Add the authorized domain pattern (e.g. <code className="font-mono text-[#234E39]">*@partner.com</code>) to the policy.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-bold text-[#943425]">POLICY_MISSING_FAIL_CLOSED</td>
                  <td className="p-3">No active policy found for tenant or registered agent.</td>
                  <td className="p-3 text-[#56585D]">Create an organization default policy via <code className="font-mono text-[#234E39]">POST /api/v1/policies</code>.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section: Approval Errors */}
        <section id="approval-errors" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Approval Expiration &amp; Replay Errors
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 space-y-2">
              <span className="font-mono font-bold text-[#943425]">ApprovalExpiredError (410)</span>
              <p className="text-[#56585D]">
                The approval ticket exceeded its TTL (default 300s). The agent must re-request the operation to generate a new pending ticket.
              </p>
            </div>
            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 space-y-2">
              <span className="font-mono font-bold text-[#943425]">ApprovalMismatchError (400)</span>
              <p className="text-[#56585D]">
                The payload arguments executed by the agent differ from what the human operator approved. Check for modified variables or dynamic timestamps.
              </p>
            </div>
            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 space-y-2">
              <span className="font-mono font-bold text-[#943425]">ApprovalReplayError (409)</span>
              <p className="text-[#56585D]">
                The approval ticket has already been consumed. Approvals are strictly single-use nonces; subsequent calls require new tickets.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Backend & DB */}
        <section id="backend-db" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Backend Connectivity &amp; Database Errors
          </h2>

          <div className="space-y-3 text-xs">
            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 space-y-2">
              <span className="font-semibold text-[#8D5B18] font-mono">Render Free-Tier Cold Starts (HTTP 504 / Connection Timeout)</span>
              <p className="text-[#56585D]">
                <strong>Symptom:</strong> The first request to the backend after 15 minutes of inactivity takes 30&ndash;50 seconds to respond.
              </p>
              <p className="text-[#56585D]">
                <strong>Explanation:</strong> Free Render web services spin down on idle. In your client, configure a higher initial timeout (<code className="font-mono text-[#234E39]">timeout=60.0</code>) or upgrade to an always-on instance for production workloads.
              </p>
            </div>

            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 space-y-2">
              <span className="font-semibold text-[#943425] font-mono">FATAL: remaining connection slots are reserved for non-replication superuser connections</span>
              <p className="text-[#56585D]">
                <strong>Symptom:</strong> PostgreSQL connection pool exhaustion on Supabase.
              </p>
              <p className="text-[#56585D]">
                <strong>Fix:</strong> Switch your connection string from direct port 5432 to the Supabase Transaction Pooler port <code className="font-mono text-[#234E39]">6543</code>. Ensure your URL includes <code className="font-mono text-[#234E39]">?sslmode=require</code>.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Tenant Context */}
        <section id="tenant-context" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Missing Organization Context
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            In multi-tenant operations, requests without a resolved organization context fall back to the default organization. When explicitly required by strict endpoints:
          </p>
          <ul className="text-xs text-[#56585D] list-disc list-inside space-y-1">
            <li>Pass header: <code className="font-mono text-[#234E39]">X-Organization-ID: your-org-slug</code>.</li>
            <li>Or ensure your operator JWT token was minted with the <code className="font-mono text-[#234E39]">org_id</code> claim.</li>
          </ul>
        </section>

        {/* Section: Framework Adapters */}
        <section id="framework-adapters" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Framework Adapter Issues (LangChain, LangGraph, MCP)
          </h2>

          <div className="space-y-4 text-xs">
            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 space-y-3">
              <h3 className="font-semibold text-[#18191B]">LangChain: Tool Error Propagation</h3>
              <p className="text-[#56585D]">
                By default, <code className="font-mono text-[#234E39]">SecureTool</code> sets <code className="font-mono text-[#234E39]">handle_tool_error=True</code>. Instead of crashing your agent, security denials are caught and formatted as text for the LLM. If your application code needs typed exceptions, set it to <code className="font-mono text-[#234E39]">False</code>:
              </p>
              <CodeBlock code={approvalHandlingCode} language="python" filename="LangChain Error Handling" />
            </div>

            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 space-y-2">
              <h3 className="font-semibold text-[#18191B]">LangGraph: Missing Approval Exception</h3>
              <p className="text-[#56585D]">
                In LangGraph, <code className="font-mono text-[#234E39]">SecureGraphNode</code> does <strong>not</strong> raise <code className="font-mono text-[#56585D]">ApprovalRequiredError</code>. Instead, it captures the requirement and branches state by returning <code className="font-mono text-[#234E39]">{`{"_sictack_status": "REQUIRE_APPROVAL", "_approval_id": "..."}`}</code> (alongside legacy <code className="font-mono text-[#56585D]">_intentlock_status</code>). Verify that your graph includes a conditional edge routing this state to an approval node.
              </p>
            </div>

            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 space-y-2">
              <h3 className="font-semibold text-[#18191B]">Model Context Protocol: JSON-RPC Code -32603</h3>
              <p className="text-[#56585D]">
                When <code className="font-mono text-[#234E39]">MCPSecurityProxy</code> intercepts a disallowed tool call, it responds with a standard JSON-RPC 2.0 error object. Inspect the <code className="font-mono text-[#234E39]">error.data._sictack</code> dictionary (or legacy <code className="font-mono text-[#56585D]">_intentlock</code>) in client responses to view full verdict reasons.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Matrix */}
        <section id="matrix" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Quick Diagnostics Matrix
          </h2>
          <div className="rounded-xl border border-[#E2E0D8] overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#FFFFFF] border-b border-[#E2E0D8] text-[#56585D] font-mono">
                <tr>
                  <th className="p-3">Error Code / Exception</th>
                  <th className="p-3">Primary Cause</th>
                  <th className="p-3">Immediate Diagnostic Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E0D8] bg-[#FFFFFF] text-[#56585D]">
                <tr>
                  <td className="p-3 font-mono font-bold text-[#943425]">401 Unauthorized</td>
                  <td className="p-3">Invalid or missing API key / JWT</td>
                  <td className="p-3 text-[#56585D]">Check <code className="font-mono text-[#56585D]">X-API-Key</code> or re-login for new JWT.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-bold text-[#943425]">403 Forbidden</td>
                  <td className="p-3">Role insufficient or unapproved token</td>
                  <td className="p-3 text-[#56585D]">Check user role (<code className="font-mono text-[#56585D]">ADMIN</code> vs <code className="font-mono text-[#56585D]">VIEWER</code>).</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-bold text-[#943425]">409 Conflict</td>
                  <td className="p-3">Approval token already consumed (replay)</td>
                  <td className="p-3 text-[#56585D]">Request a new approval ticket for subsequent execution.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-bold text-[#943425]">410 Gone</td>
                  <td className="p-3">Approval token expired (TTL exceeded)</td>
                  <td className="p-3 text-[#56585D]">Increase timeout or approve before expiration window.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-bold text-[#8D5B18]">EPERM -4048</td>
                  <td className="p-3">OneDrive lock on .next/build/chunks</td>
                  <td className="p-3 text-[#56585D]">Pause OneDrive sync or build in unsynced directory.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Navigation */}
        <PreviousNextNavigation
          prev={{ title: "Production Deployment", href: "/developers/deployment" }}
          next={{ title: "Changelog & Releases", href: "/developers/changelog" }}
        />
      </div>
    </DeveloperLayout>
  );
}
