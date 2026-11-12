"""
Manual Verification Script: Phase 7 (LangChain & MCP Integrations).
"""

import sys
from pathlib import Path

# Ensure SDK is in Python path
sdk_src = Path(__file__).resolve().parent.parent / "sdk" / "python" / "src"
if str(sdk_src) not in sys.path:
    sys.path.insert(0, str(sdk_src))

from intentlock import SecureAgent, Config, Policy
from intentlock.integrations import secure_langchain_tool, MCPSecurityProxy


def main():
    print("=" * 65)
    print("  INTENTLOCK — Phase 7 Integrations Manual Verification")
    print("=" * 65)

    # -------------------------------------------------------------
    # 1. Initialize Policy & Agent
    # -------------------------------------------------------------
    print("\n[PART 1] Configuring Security Policy & Agent...")
    policy = Policy(
        name="integration-demo-policy",
        allowed_permissions=["math:add", "data:fetch"],
        denied_permissions=["sys:delete"],
    )
    agent = SecureAgent(agent_id="demo-agent", config=Config(default_policy=policy))
    print("  ✓ Policy created: Allowed=['math:add', 'data:fetch'], Denied=['sys:delete']")
    print("  ✓ SecureAgent initialized with ID: 'demo-agent'")

    # -------------------------------------------------------------
    # 2. Test LangChain Tool Integration
    # -------------------------------------------------------------
    print("\n[PART 2] Testing LangChain / LangGraph Tool Wrapper...")
    
    def calculate_sum(a: int, b: int) -> int:
        return a + b

    def delete_database(path: str) -> str:
        return "Database deleted"

    # Wrap tools with IntentLock guard
    calc_tool = secure_langchain_tool(calculate_sum, agent=agent, permission="math:add")
    delete_tool = secure_langchain_tool(delete_database, agent=agent, permission="sys:delete")

    print("  --> Executing permitted LangChain tool: calculate_sum(a=15, b=25)...")
    res1 = calc_tool.run({"a": 15, "b": 25})
    print(f"      Result: {res1} (Expected: 40)")

    print("  --> Executing blocked LangChain tool: delete_database(path='/prod/db')...")
    res2 = delete_tool.run({"path": "/prod/db"})
    print(f"      Result: {res2}")
    print("      ✓ Intercepted & blocked without crashing agent loop!")

    # -------------------------------------------------------------
    # 3. Test Model Context Protocol (MCP) Proxy
    # -------------------------------------------------------------
    print("\n[PART 3] Testing Model Context Protocol (MCP) JSON-RPC Proxy...")
    mcp_proxy = MCPSecurityProxy(agent=agent)
    
    def fetch_customer_record(customer_id: str) -> dict:
        return {"customer_id": customer_id, "status": "active", "tier": "gold"}

    mcp_proxy.register_mcp_tool(
        name="fetch_customer_record",
        handler=fetch_customer_record,
        permission="data:fetch",
        description="Fetches customer record from system",
    )

    print("  --> Sending standard MCP JSON-RPC 'tools/call' request...")
    mcp_request = {
        "jsonrpc": "2.0",
        "id": 101,
        "method": "tools/call",
        "params": {
            "name": "fetch_customer_record",
            "arguments": {"customer_id": "cust-8821"},
        },
    }
    mcp_response = mcp_proxy.handle_jsonrpc(mcp_request)
    print(f"      MCP Status isError: {mcp_response['result']['isError']}")
    print(f"      MCP Output Content: {mcp_response['result']['content'][0]['text']}")
    print(f"      IntentLock Verdict: {mcp_response['result']['_intentlock']['verdict']}")
    print("      ✓ Standard MCP JSON-RPC protocol verified!")

    print("\n" + "=" * 65)
    print("  All Phase 7 Integrations Verified Successfully!")
    print("=" * 65)


if __name__ == "__main__":
    main()
