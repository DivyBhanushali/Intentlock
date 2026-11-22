// SICTACK 1.0 – Error Handling Documentation Page
import { DeveloperLayout } from "@/components/developers/DeveloperLayout";
import { CodeBlock } from "@/components/developers/CodeBlock";
import { PreviousNextNavigation } from "@/components/developers/PreviousNextNavigation";
import { TocItem } from "@/components/developers/types";

export default function SdkErrorsPage() {
  const breadcrumbs = [
    { label: "Developers", href: "/developers" },
    { label: "Python SDK", href: "/developers/sdk" },
    { label: "Error Handling", href: "/developers/sdk/errors" },
  ];

  const toc: TocItem[] = [
    { id: "hierarchy", title: "Exception Hierarchy", level: 2 },
    { id: "structured-context", title: "Structured Context Attributes", level: 2 },
    { id: "policy-errors", title: "Policy & Registry Errors", level: 2 },
    { id: "approval-errors", title: "Approval Security Errors", level: 2 },
    { id: "validation-errors", title: "Validation & Replay Errors", level: 2 },
    { id: "handling-pattern", title: "Recommended Catch Pattern", level: 2 },
  ];

  const hierarchyCode = `IntentLockError (Base)
├── PolicyError
├── ToolNotRegisteredError
├── PermissionDeniedError
├── ApprovalRequiredError
├── ApprovalExpiredError
├── ApprovalReplayError
├── ApprovalMismatchError
├── ArgumentValidationError
├── ReplayDetectedError
└── AuditError`;

  const structuredHandlingCode = `from sictack.exceptions import (
    IntentLockError,
    PermissionDeniedError,
    ApprovalRequiredError,
    ApprovalExpiredError,
    ApprovalReplayError,
    ApprovalMismatchError,
    ToolNotRegisteredError,
    ArgumentValidationError,
)

try:
    result = agent.execute(tool_call)
except ApprovalRequiredError as e:
    # Trigger operator approval flow
    print(f"Action suspended. Approval ID: {e.approval_id}")
    print(f"Tool: {e.tool_name}, Hash: {e.action_hash}")

except PermissionDeniedError as e:
    # Deterministic policy denial
    print(f"Action denied by policy '{e.policy_id}': {e.reason}")

except ApprovalExpiredError as e:
    # Approval token exceeded TTL
    print(f"Approval {e.approval_id} has expired. A new request must be created.")

except ApprovalReplayError as e:
    # Security violation: token reuse attempt
    print(f"SECURITY ALERT: Approval {e.approval_id} has already been consumed.")

except ApprovalMismatchError as e:
    # Security violation: parameters tampered
    print(f"SECURITY ALERT: Parameter mismatch! Expected {e.expected_hash}, got {e.actual_hash}")

except ToolNotRegisteredError as e:
    print(f"Tool '{e.tool_name}' is not registered with this agent.")

except ArgumentValidationError as e:
    print(f"Invalid tool arguments for '{e.tool_name}': {e.errors}")

except IntentLockError as e:
    # Catch-all for any other SICTACK runtime exceptions
    print(f"SICTACK security fault: {e.message}")`;

  return (
    <DeveloperLayout breadcrumbs={breadcrumbs} toc={toc}>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-md bg-[#EDF5F0] border border-[#234E39]/20 px-2 py-0.5 text-xs font-mono font-medium text-[#234E39]">
              Python SDK
            </span>
            <span className="text-xs text-[#787A80]">Exceptions Reference</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#18191B] sm:text-4xl">
            Error Handling &amp; Exceptions
          </h1>
          <p className="mt-3 text-base text-[#56585D] leading-relaxed">
            SICTACK provides an exhaustive, typed exception hierarchy. Every exception carries structured attributes for programmatic inspection without parsing error message strings.
          </p>
        </div>

        {/* Section: Hierarchy */}
        <section id="hierarchy" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Exception Hierarchy
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            All SDK exceptions inherit from <code className="text-[#234E39] font-mono">IntentLockError</code>:
          </p>

          <CodeBlock code={hierarchyCode} language="text" filename="Exception Tree" />
        </section>

        {/* Section: Structured Context */}
        <section id="structured-context" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Structured Context Attributes
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            You never need to regex parse error messages. Exceptions dynamically store contextual arguments as typed instance attributes:
          </p>

          <div className="overflow-x-auto rounded-xl border border-[#E2E0D8]">
            <table className="w-full text-left text-xs text-[#56585D]">
              <thead className="bg-[#FFFFFF] text-[#18191B] border-b border-[#E2E0D8] font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Exception Class</th>
                  <th className="py-2.5 px-4">Context Attributes</th>
                  <th className="py-2.5 px-4">Trigger Condition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E0D8] font-mono text-xs">
                <tr>
                  <td className="py-2.5 px-4 text-[#234E39]">PermissionDeniedError</td>
                  <td className="py-2.5 px-4 text-[#56585D]">.tool_name, .policy_id, .action_hash, .reason</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">Action blocked by explicit &quot;deny&quot; rule or fail-closed default.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#8D5B18]">ApprovalRequiredError</td>
                  <td className="py-2.5 px-4 text-[#56585D]">.approval_id, .action_hash, .tool_name</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">Tool execution suspended awaiting human operator approval.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#943425]">ApprovalExpiredError</td>
                  <td className="py-2.5 px-4 text-[#56585D]">.approval_id</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">Approval ticket presented after its TTL expiration.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#943425]">ApprovalReplayError</td>
                  <td className="py-2.5 px-4 text-[#56585D]">.approval_id</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">Attempted reuse of an already-consumed single-use approval token.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#943425]">ApprovalMismatchError</td>
                  <td className="py-2.5 px-4 text-[#56585D]">.approval_id, .expected_hash, .actual_hash</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">Action parameters altered after approval token was issued.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#56585D]">ToolNotRegisteredError</td>
                  <td className="py-2.5 px-4 text-[#56585D]">.tool_name</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">Agent attempted to call a tool not registered in its registry.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#56585D]">ArgumentValidationError</td>
                  <td className="py-2.5 px-4 text-[#56585D]">.tool_name, .errors</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">Supplied arguments fail schema validation.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#943425]">ReplayDetectedError</td>
                  <td className="py-2.5 px-4 text-[#56585D]">.action_hash, .tool_name</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">Exact duplicate action hash detected in non-idempotent context.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section: Recommended Catch Pattern */}
        <section id="handling-pattern" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Recommended Catch Pattern
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            Handle expected security states gracefully while alerting on replay or tampering anomalies:
          </p>

          <CodeBlock code={structuredHandlingCode} language="python" filename="robust_exception_handling.py" />
        </section>

        {/* Navigation */}
        <PreviousNextNavigation
          prev={{ title: "Decisions & Approvals", href: "/developers/sdk/decisions" }}
          next={{ title: "API Reference", href: "/developers/api" }}
        />
      </div>
    </DeveloperLayout>
  );
}
