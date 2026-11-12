"""
INTENTLOCK Reference Example: Email Assistant Agent Demonstration

Demonstrates:
1. Registering tools (read_email, summarize_email, delete_email, export_user_data)
2. Allowing read and summarize permissions
3. Explicitly denying delete permissions
4. Requiring human approval for high-sensitivity data export
5. Reviewing the complete append-only security audit log
"""

import sys
from pathlib import Path

# Add SDK src to path
sdk_src = str(Path(__file__).parent.parent.parent / "sdk" / "python" / "src")
if sdk_src not in sys.path:
    sys.path.insert(0, sdk_src)

from intentlock import SecureAgent, Config, Policy, RiskLevel
from intentlock.exceptions import PermissionDeniedError, ApprovalRequiredError


# -----------------------------------------------------------------------------
# Mock Tool Implementations
# -----------------------------------------------------------------------------

def mock_read_email(folder: str = "inbox", limit: int = 5) -> list[dict]:
    print(f"  [TOOL RUNNING] read_email(folder='{folder}', limit={limit})")
    return [
        {"id": "msg-101", "from": "boss@enterprise.com", "subject": "Q4 Priorities", "body": "Please prepare the report."},
        {"id": "msg-102", "from": "client@acme.com", "subject": "Invoice Inquiry", "body": "Need receipt for #9923."}
    ]


def mock_summarize_email(email_id: str) -> dict:
    print(f"  [TOOL RUNNING] summarize_email(email_id='{email_id}')")
    return {
        "email_id": email_id,
        "summary": "Sender requested preparation of Q4 priority report."
    }


def mock_delete_email(email_id: str) -> dict:
    print(f"  [TOOL RUNNING] delete_email(email_id='{email_id}')")
    return {"status": "success", "deleted_id": email_id}


def mock_export_user_data(format: str = "csv") -> dict:
    print(f"  [TOOL RUNNING] export_user_data(format='{format}')")
    return {
        "export_status": "COMPLETED",
        "record_count": 1420,
        "checksum": "sha256-8a7f9d..."
    }


# -----------------------------------------------------------------------------
# Main Demonstration Workflow
# -----------------------------------------------------------------------------

def main():
    print("=" * 70)
    print("  INTENTLOCK — AI Agent Security Middleware Demo")
    print("=" * 70)

    # 1. Initialize SecureAgent with custom security policy
    custom_policy = Policy(
        policy_id="email-assistant-v1",
        allowed_permissions=["read_email", "summarize_email"],
        denied_permissions=["delete_email"],
        require_approval_permissions=["export_user_data"],
        max_risk_level=RiskLevel.HIGH,
        max_sensitivity=8,
        description="Constrains agent to reading and summarization only"
    )

    config = Config(
        default_policy=custom_policy,
        fail_closed=True,
        approval_timeout_seconds=300
    )

    agent = SecureAgent(agent_id="support-agent-alpha", config=config)

    # 2. Register tools with the SecureAgent
    agent.register_tool(
        name="read_email",
        handler=mock_read_email,
        permission="read_email",
        description="Fetches recent emails from inbox",
        sensitivity=2
    )

    agent.register_tool(
        name="summarize_email",
        handler=mock_summarize_email,
        permission="summarize_email",
        description="Generates executive summary of an email",
        sensitivity=2
    )

    agent.register_tool(
        name="delete_email",
        handler=mock_delete_email,
        permission="delete_email",
        description="Permanently deletes an email from mailbox",
        sensitivity=8
    )

    agent.register_tool(
        name="export_user_data",
        handler=mock_export_user_data,
        permission="export_user_data",
        description="Exports customer database records",
        sensitivity=9
    )

    print("\n[STEP 1] Agent attempts permitted action: read_email")
    emails = agent.execute(
        user_request="Show me the unread emails from the inbox",
        tool_name="read_email",
        arguments={"folder": "inbox", "limit": 2}
    )
    print(f"  --> Result: Fetched {len(emails)} emails successfully.\n")

    print("[STEP 2] Agent attempts permitted action: summarize_email")
    summary = agent.execute(
        user_request="Summarize message 101",
        tool_name="summarize_email",
        arguments={"email_id": "msg-101"}
    )
    print(f"  --> Result: {summary['summary']}\n")

    print("[STEP 3] Agent attempts UNAUTHORIZED action: delete_email")
    try:
        agent.execute(
            user_request="Delete all emails older than 30 days",
            tool_name="delete_email",
            arguments={"email_id": "msg-101"}
        )
        print("  [ALERT] Action was NOT blocked! (Test failed)")
    except PermissionDeniedError as e:
        print(f"  --> [BLOCKED] INTENTLOCK intercepted & denied action:")
        print(f"      Tool: {e.tool_name}")
        print(f"      Reason: {e.reason}")
        print(f"      Handler was NEVER invoked.\n")

    print("[STEP 4] Agent attempts SENSITIVE action: export_user_data (Requires Human Approval)")
    pending_approval_id = None
    try:
        agent.execute(
            user_request="Export all customer records for analysis",
            tool_name="export_user_data",
            arguments={"format": "csv"}
        )
        print("  [ALERT] Action executed without approval! (Test failed)")
    except ApprovalRequiredError as e:
        pending_approval_id = e.approval_id
        print(f"  --> [HOLD] Action paused. Human approval required.")
        print(f"      Approval Token: {e.approval_id}")
        print(f"      Canonical Hash: {e.action_hash[:16]}...")
        print(f"      Tool execution suspended until approved.\n")

    print("[STEP 5] Human Supervisor reviews and APPROVES the pending action")
    agent.approve(pending_approval_id, approver_id="security-lead@company.com")
    print(f"  --> Token {pending_approval_id} approved by security-lead@company.com.\n")

    print("[STEP 6] Re-executing export_user_data WITH approved token")
    export_result = agent.execute_with_approval(
        approval_id=pending_approval_id,
        tool_name="export_user_data",
        arguments={"format": "csv"}
    )
    print(f"  --> Result: {export_result}\n")

    print("[STEP 7] Security Audit Trail Inspection")
    events = agent.get_audit_log(limit=10)
    print(f"  Total audit records recorded: {len(events)}")
    for ev in events:
        status_symbol = "✓" if ev.verdict.value == "ALLOW" else ("✗" if ev.verdict.value == "DENY" else "⏳")
        print(f"   [{status_symbol}] Verdict: {ev.verdict.value:<16} | Tool: {ev.tool_name:<18} | Reason: {ev.reason}")

    print("\n" + "=" * 70)
    print("  Demonstration completed successfully. INTENTLOCK enforcement verified.")
    print("=" * 70)


if __name__ == "__main__":
    main()

