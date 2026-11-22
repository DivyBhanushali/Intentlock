// SICTACK – Auto-Generated OpenAPI Endpoint Reference Catalog
// Generated deterministically from FastAPI application and OpenAPI 3.1.0 specification.
// Total Operations: 96

import { EndpointCardProps } from "@/components/developers/types";

export interface ApiEndpointItem extends EndpointCardProps {
  tag: string;
  requiredRole: string;
  operationId: string;
}

export const API_ENDPOINTS: ApiEndpointItem[] = [
  {
    "path": "/api/v1/agents",
    "method": "GET",
    "summary": "List Agents",
    "description": "List all registered AI agents for the caller's tenant.",
    "tag": "Agents",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "skip",
        "type": "integer",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "limit",
        "type": "integer",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "Response List Agents Api V1 Agents Get",
        "example": "[\n  {\n    \"id\": \"sample_id_99\",\n    \"name\": \"sample_string\",\n    \"description\": \"sample_string\",\n    \"policy_id\": {},\n    \"parent_agent_id\": {},\n    \"role\": {},\n    \"created_at\": \"2026-11-16T12:00:00Z\",\n    \"last_active_at\": \"2026-11-16T12:00:00Z\"\n  }\n]"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "list_agents_api_v1_agents_get"
  },
  {
    "path": "/api/v1/agents",
    "method": "POST",
    "summary": "Register Agent",
    "description": "Register an AI agent and optionally bind it to a security policy.",
    "tag": "Agents",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 201,
        "description": "Successful Response",
        "schema": "AgentResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"name\": \"sample_string\",\n  \"description\": \"sample_string\",\n  \"policy_id\": {},\n  \"parent_agent_id\": {},\n  \"role\": {},\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"last_active_at\": \"2026-11-16T12:00:00Z\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "register_agent_api_v1_agents_post",
    "requestBody": {
      "contentType": "application/json",
      "schema": "AgentCreate",
      "example": "{\n  \"id\": \"sample_id_99\",\n  \"name\": \"sample_string\",\n  \"description\": \"sample_string\",\n  \"policy_id\": {}\n}"
    }
  },
  {
    "path": "/api/v1/agents/delegations/{delegation_id}/revoke",
    "method": "POST",
    "summary": "Revoke Delegation",
    "description": "Instantly revoke an active delegation token and cascade revocation to sub-delegations.",
    "tag": "Agents",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "delegation_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "DelegationResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"org_id\": \"sample_id_99\",\n  \"parent_agent_id\": \"sample_id_99\",\n  \"child_agent_id\": \"sample_id_99\",\n  \"parent_session_id\": {},\n  \"delegated_permissions\": [\n    \"sample_string\"\n  ],\n  \"delegated_tools\": [\n    \"sample_string\"\n  ],\n  \"delegated_resources\": [\n    \"sample_string\"\n  ],\n  \"allocated_budget\": 1,\n  \"executions_count\": 1,\n  \"depth\": 1,\n  \"issued_at\": \"2026-11-16T12:00:00Z\",\n  \"expires_at\": {},\n  \"revoked\": true,\n  \"revocation_reason\": {},\n  \"signature\": \"sample_string\",\n  \"delegation_metadata\": {}\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "revoke_delegation_api_v1_agents_delegations__delegation_id__revoke_post",
    "requestBody": {
      "contentType": "application/json",
      "schema": "Payload",
      "example": "{}"
    }
  },
  {
    "path": "/api/v1/agents/onboard",
    "method": "POST",
    "summary": "Onboard Agent",
    "description": "Guided onboarding for an AI agent: creates/binds policy from template and registers agent.",
    "tag": "Agents",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 201,
        "description": "Successful Response",
        "schema": "AgentResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"name\": \"sample_string\",\n  \"description\": \"sample_string\",\n  \"policy_id\": {},\n  \"parent_agent_id\": {},\n  \"role\": {},\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"last_active_at\": \"2026-11-16T12:00:00Z\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "onboard_agent_api_v1_agents_onboard_post",
    "requestBody": {
      "contentType": "application/json",
      "schema": "AgentOnboardRequest",
      "example": "{\n  \"agent_id\": \"sample_id_99\",\n  \"name\": \"sample_string\",\n  \"description\": {},\n  \"template_key\": {},\n  \"policy_id\": {},\n  \"environment\": {},\n  \"tools\": {}\n}"
    }
  },
  {
    "path": "/api/v1/agents/{agent_id}",
    "method": "GET",
    "summary": "Get Agent",
    "description": "Retrieve details for a specific registered agent.",
    "tag": "Agents",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "agent_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "AgentResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"name\": \"sample_string\",\n  \"description\": \"sample_string\",\n  \"policy_id\": {},\n  \"parent_agent_id\": {},\n  \"role\": {},\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"last_active_at\": \"2026-11-16T12:00:00Z\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "get_agent_api_v1_agents__agent_id__get"
  },
  {
    "path": "/api/v1/agents/{agent_id}/delegations",
    "method": "GET",
    "summary": "List Agent Delegations",
    "description": "List delegations where agent is parent, child, or either.",
    "tag": "Agents",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "agent_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "direction",
        "type": "string",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "Response List Agent Delegations Api V1 Agents  Agent Id  Delegations Get",
        "example": "[\n  {\n    \"id\": \"sample_id_99\",\n    \"org_id\": \"sample_id_99\",\n    \"parent_agent_id\": \"sample_id_99\",\n    \"child_agent_id\": \"sample_id_99\",\n    \"parent_session_id\": {},\n    \"delegated_permissions\": [\n      \"sample_string\"\n    ],\n    \"delegated_tools\": [\n      \"sample_string\"\n    ],\n    \"delegated_resources\": [\n      \"sample_string\"\n    ],\n    \"allocated_budget\": 1,\n    \"executions_count\": 1,\n    \"depth\": 1,\n    \"issued_at\": \"2026-11-16T12:00:00Z\",\n    \"expires_at\": {},\n    \"revoked\": true,\n    \"revocation_reason\": {},\n    \"signature\": \"sample_string\",\n    \"delegation_metadata\": {}\n  }\n]"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "list_agent_delegations_api_v1_agents__agent_id__delegations_get"
  },
  {
    "path": "/api/v1/agents/{agent_id}/delegations",
    "method": "POST",
    "summary": "Create Delegation",
    "description": "Issue a cryptographically signed capability delegation token from parent to child agent.\nEnforces least-privilege capability bounds and privilege escalation defense.",
    "tag": "Agents",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "agent_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 201,
        "description": "Successful Response",
        "schema": "DelegationResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"org_id\": \"sample_id_99\",\n  \"parent_agent_id\": \"sample_id_99\",\n  \"child_agent_id\": \"sample_id_99\",\n  \"parent_session_id\": {},\n  \"delegated_permissions\": [\n    \"sample_string\"\n  ],\n  \"delegated_tools\": [\n    \"sample_string\"\n  ],\n  \"delegated_resources\": [\n    \"sample_string\"\n  ],\n  \"allocated_budget\": 1,\n  \"executions_count\": 1,\n  \"depth\": 1,\n  \"issued_at\": \"2026-11-16T12:00:00Z\",\n  \"expires_at\": {},\n  \"revoked\": true,\n  \"revocation_reason\": {},\n  \"signature\": \"sample_string\",\n  \"delegation_metadata\": {}\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "create_delegation_api_v1_agents__agent_id__delegations_post",
    "requestBody": {
      "contentType": "application/json",
      "schema": "DelegationCreateRequest",
      "example": "{\n  \"child_agent_id\": \"sample_id_99\",\n  \"delegated_permissions\": [\n    \"sample_string\"\n  ],\n  \"delegated_tools\": {},\n  \"delegated_resources\": {},\n  \"allocated_budget\": 1,\n  \"ttl_seconds\": 1,\n  \"parent_session_id\": {},\n  \"metadata\": {}\n}"
    }
  },
  {
    "path": "/api/v1/agents/{agent_id}/diagnostics",
    "method": "GET",
    "summary": "Get Agent Diagnostics",
    "description": "Retrieve operational health, policy binding, and runtime telemetry diagnostics for an agent.",
    "tag": "Agents",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "agent_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "AgentDiagnosticsResponse",
        "example": "{\n  \"agent_id\": \"sample_id_99\",\n  \"org_id\": \"sample_id_99\",\n  \"status\": \"sample_string\",\n  \"policy_id\": {},\n  \"policy_name\": {},\n  \"policy_version\": {},\n  \"total_interceptions\": 1,\n  \"blocked_interceptions\": 1,\n  \"active_sessions_count\": 1,\n  \"recent_threat_count\": 1,\n  \"last_active_at\": {}\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "get_agent_diagnostics_api_v1_agents__agent_id__diagnostics_get"
  },
  {
    "path": "/api/v1/agents/{agent_id}/hierarchy",
    "method": "GET",
    "summary": "Get Agent Hierarchy",
    "description": "Retrieve tree of parent-child delegated agent relationships rooted at agent_id.",
    "tag": "Agents",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "agent_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "AgentHierarchyNode",
        "example": "{\n  \"agent_id\": \"sample_id_99\",\n  \"name\": \"sample_string\",\n  \"role\": \"sample_string\",\n  \"policy_id\": {},\n  \"parent_agent_id\": {},\n  \"children\": [\n    {\n      \"agent_id\": {},\n      \"name\": {},\n      \"role\": {},\n      \"policy_id\": {},\n      \"parent_agent_id\": {},\n      \"children\": {}\n    }\n  ]\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "get_agent_hierarchy_api_v1_agents__agent_id__hierarchy_get"
  },
  {
    "path": "/api/v1/approvals",
    "method": "GET",
    "summary": "List Approvals",
    "description": "List approval requests with optional status filtering for the tenant.",
    "tag": "Approvals",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "status",
        "type": "string",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "agent_id",
        "type": "string",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "skip",
        "type": "integer",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "limit",
        "type": "integer",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "Response List Approvals Api V1 Approvals Get",
        "example": "[\n  {\n    \"id\": \"sample_id_99\",\n    \"action_hash\": \"sample_string\",\n    \"tool_name\": \"sample_string\",\n    \"agent_id\": \"sample_id_99\",\n    \"status\": \"PENDING\",\n    \"created_at\": \"2026-11-16T12:00:00Z\",\n    \"expires_at\": \"2026-11-16T12:00:00Z\",\n    \"resolved_at\": {},\n    \"resolved_by\": {},\n    \"consumed\": true,\n    \"arguments_json\": {}\n  }\n]"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "list_approvals_api_v1_approvals_get"
  },
  {
    "path": "/api/v1/approvals/{approval_id}",
    "method": "GET",
    "summary": "Get Approval",
    "description": "Retrieve details for a specific approval request.",
    "tag": "Approvals",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "approval_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "ApprovalResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"action_hash\": \"sample_string\",\n  \"tool_name\": \"sample_string\",\n  \"agent_id\": \"sample_id_99\",\n  \"status\": \"PENDING\",\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"expires_at\": \"2026-11-16T12:00:00Z\",\n  \"resolved_at\": {},\n  \"resolved_by\": {},\n  \"consumed\": true,\n  \"arguments_json\": {}\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "get_approval_api_v1_approvals__approval_id__get"
  },
  {
    "path": "/api/v1/approvals/{approval_id}/approve",
    "method": "POST",
    "summary": "Approve Request",
    "description": "Grant human approval for a pending tool action.",
    "tag": "Approvals",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "approval_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "ApprovalResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"action_hash\": \"sample_string\",\n  \"tool_name\": \"sample_string\",\n  \"agent_id\": \"sample_id_99\",\n  \"status\": \"PENDING\",\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"expires_at\": \"2026-11-16T12:00:00Z\",\n  \"resolved_at\": {},\n  \"resolved_by\": {},\n  \"consumed\": true,\n  \"arguments_json\": {}\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "approve_request_api_v1_approvals__approval_id__approve_post",
    "requestBody": {
      "contentType": "application/json",
      "schema": "ApprovalActionRequest",
      "example": "{\n  \"approver_id\": \"sample_id_99\",\n  \"notes\": {}\n}"
    }
  },
  {
    "path": "/api/v1/approvals/{approval_id}/reject",
    "method": "POST",
    "summary": "Reject Request",
    "description": "Reject a pending tool action.",
    "tag": "Approvals",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "approval_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "ApprovalResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"action_hash\": \"sample_string\",\n  \"tool_name\": \"sample_string\",\n  \"agent_id\": \"sample_id_99\",\n  \"status\": \"PENDING\",\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"expires_at\": \"2026-11-16T12:00:00Z\",\n  \"resolved_at\": {},\n  \"resolved_by\": {},\n  \"consumed\": true,\n  \"arguments_json\": {}\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "reject_request_api_v1_approvals__approval_id__reject_post",
    "requestBody": {
      "contentType": "application/json",
      "schema": "ApprovalActionRequest",
      "example": "{\n  \"approver_id\": \"sample_id_99\",\n  \"notes\": {}\n}"
    }
  },
  {
    "path": "/api/v1/audit",
    "method": "GET",
    "summary": "List Audit Events",
    "description": "Query the security audit trail with multi-field filtering.",
    "tag": "Audit",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "agent_id",
        "type": "string",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "tool_name",
        "type": "string",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "verdict",
        "type": "string",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "skip",
        "type": "integer",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "limit",
        "type": "integer",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "Response List Audit Events Api V1 Audit Get",
        "example": "[\n  {\n    \"id\": \"sample_id_99\",\n    \"timestamp\": \"2026-11-16T12:00:00Z\",\n    \"agent_id\": {},\n    \"tool_name\": {},\n    \"verdict\": \"ALLOW\",\n    \"reason\": \"sample_string\",\n    \"policy_id\": {},\n    \"action_hash\": {},\n    \"approval_id\": {},\n    \"risk_score\": 0.95,\n    \"execution_success\": {},\n    \"execution_error\": {},\n    \"metadata_json\": {}\n  }\n]"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "list_audit_events_api_v1_audit_get"
  },
  {
    "path": "/api/v1/audit/events",
    "method": "GET",
    "summary": "List Audit Events",
    "description": "Query the security audit trail with multi-field filtering.",
    "tag": "Audit",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "agent_id",
        "type": "string",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "tool_name",
        "type": "string",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "verdict",
        "type": "string",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "skip",
        "type": "integer",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "limit",
        "type": "integer",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "Response List Audit Events Api V1 Audit Events Get",
        "example": "[\n  {\n    \"id\": \"sample_id_99\",\n    \"timestamp\": \"2026-11-16T12:00:00Z\",\n    \"agent_id\": {},\n    \"tool_name\": {},\n    \"verdict\": \"ALLOW\",\n    \"reason\": \"sample_string\",\n    \"policy_id\": {},\n    \"action_hash\": {},\n    \"approval_id\": {},\n    \"risk_score\": 0.95,\n    \"execution_success\": {},\n    \"execution_error\": {},\n    \"metadata_json\": {}\n  }\n]"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "list_audit_events_api_v1_audit_events_get"
  },
  {
    "path": "/api/v1/audit/events/{event_id}",
    "method": "GET",
    "summary": "Get Audit Event",
    "description": "Retrieve full details of a single immutable audit event.",
    "tag": "Audit",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "event_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "AuditEventResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"timestamp\": \"2026-11-16T12:00:00Z\",\n  \"agent_id\": {},\n  \"tool_name\": {},\n  \"verdict\": \"ALLOW\",\n  \"reason\": \"sample_string\",\n  \"policy_id\": {},\n  \"action_hash\": {},\n  \"approval_id\": {},\n  \"risk_score\": 0.95,\n  \"execution_success\": {},\n  \"execution_error\": {},\n  \"metadata_json\": {}\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "get_audit_event_api_v1_audit_events__event_id__get"
  },
  {
    "path": "/api/v1/audit/stats",
    "method": "GET",
    "summary": "Get Audit Stats",
    "description": "Get aggregated metrics and counts for the security dashboard.",
    "tag": "Audit",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "AuditStatsResponse",
        "example": "{\n  \"total_events\": 1,\n  \"allowed_count\": 1,\n  \"denied_count\": 1,\n  \"require_approval_count\": 1,\n  \"active_agents_count\": 1\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "get_audit_stats_api_v1_audit_stats_get"
  },
  {
    "path": "/api/v1/audit/verify",
    "method": "GET",
    "summary": "Verify Audit Log Chain",
    "description": "Cryptographically verify the SHA-256 sequential hash chain of the audit trail.\nDetects any tampering, deletion, modification, or sequence corruption.",
    "tag": "Audit",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "AuditVerifyResponse",
        "example": "{\n  \"verified\": true,\n  \"total_records\": 1,\n  \"valid_records\": 1,\n  \"corrupted_records\": 1,\n  \"first_corrupted_id\": {},\n  \"details\": \"sample_string\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "verify_audit_log_chain_api_v1_audit_verify_get"
  },
  {
    "path": "/api/v1/auth/api-keys",
    "method": "GET",
    "summary": "List Api Keys",
    "description": "List all API keys for the current organization.",
    "tag": "Authentication & Workspaces",
    "auth": "Bearer Token",
    "requiredRole": "ADMIN, APPROVER, VIEWER",
    "headers": [
      {
        "name": "Authorization",
        "type": "string",
        "required": true,
        "description": "Bearer JWT session token obtained via /api/v1/auth/login",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "Response List Api Keys Api V1 Auth Api Keys Get",
        "example": "[\n  {\n    \"id\": \"sample_id_99\",\n    \"name\": \"sample_string\",\n    \"key_prefix\": \"sample_id_99\",\n    \"is_active\": true,\n    \"created_at\": \"2026-11-16T12:00:00Z\",\n    \"last_used_at\": {},\n    \"raw_key\": {}\n  }\n]"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "list_api_keys_api_v1_auth_api_keys_get"
  },
  {
    "path": "/api/v1/auth/api-keys",
    "method": "POST",
    "summary": "Create New Api Key",
    "description": "Generate a new Stripe-style API key for connecting an AI agent.",
    "tag": "Authentication & Workspaces",
    "auth": "Bearer Token",
    "requiredRole": "ADMIN, APPROVER, VIEWER",
    "headers": [
      {
        "name": "Authorization",
        "type": "string",
        "required": true,
        "description": "Bearer JWT session token obtained via /api/v1/auth/login",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 201,
        "description": "Successful Response",
        "schema": "ApiKeyResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"name\": \"sample_string\",\n  \"key_prefix\": \"sample_id_99\",\n  \"is_active\": true,\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"last_used_at\": {},\n  \"raw_key\": {}\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "create_new_api_key_api_v1_auth_api_keys_post",
    "requestBody": {
      "contentType": "application/json",
      "schema": "ApiKeyCreateRequest",
      "example": "{\n  \"name\": \"sample_string\"\n}"
    }
  },
  {
    "path": "/api/v1/auth/api-keys/{key_id}",
    "method": "DELETE",
    "summary": "Revoke Api Key",
    "description": "Revoke an active API key.",
    "tag": "Authentication & Workspaces",
    "auth": "Bearer Token",
    "requiredRole": "ADMIN, APPROVER, VIEWER",
    "headers": [
      {
        "name": "Authorization",
        "type": "string",
        "required": true,
        "description": "Bearer JWT session token obtained via /api/v1/auth/login",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "key_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 204,
        "description": "Successful Response",
        "schema": "object"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "revoke_api_key_api_v1_auth_api_keys__key_id__delete"
  },
  {
    "path": "/api/v1/auth/login",
    "method": "POST",
    "summary": "Login",
    "description": "Authenticate with email and password to receive a JWT session token.",
    "tag": "Authentication & Workspaces",
    "auth": "Public",
    "requiredRole": "None",
    "headers": [],
    "parameters": [],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "AuthResponse",
        "example": "{\n  \"access_token\": \"sample_string\",\n  \"token_type\": \"sample_string\",\n  \"user\": {\n    \"id\": \"sample_id_99\",\n    \"email\": \"developer@company.com\",\n    \"full_name\": \"sample_string\",\n    \"role\": \"sample_string\",\n    \"org_id\": \"sample_id_99\",\n    \"org_name\": \"sample_string\",\n    \"plan\": \"sample_string\"\n  },\n  \"initial_api_key\": {}\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "login_api_v1_auth_login_post",
    "requestBody": {
      "contentType": "application/json",
      "schema": "LoginRequest",
      "example": "{\n  \"email\": \"developer@company.com\",\n  \"password\": \"sample_string\"\n}"
    }
  },
  {
    "path": "/api/v1/auth/me",
    "method": "GET",
    "summary": "Get Current User Profile",
    "description": "Get the currently logged in user profile and active workspace.",
    "tag": "Authentication & Workspaces",
    "auth": "Bearer Token",
    "requiredRole": "ADMIN, APPROVER, VIEWER",
    "headers": [
      {
        "name": "Authorization",
        "type": "string",
        "required": true,
        "description": "Bearer JWT session token obtained via /api/v1/auth/login",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "UserResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"email\": \"developer@company.com\",\n  \"full_name\": \"sample_string\",\n  \"role\": \"sample_string\",\n  \"org_id\": \"sample_id_99\",\n  \"org_name\": \"sample_string\",\n  \"plan\": \"sample_string\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "get_current_user_profile_api_v1_auth_me_get"
  },
  {
    "path": "/api/v1/auth/members",
    "method": "GET",
    "summary": "List Team Members",
    "description": "List all registered team members in the current organization.",
    "tag": "Authentication & Workspaces",
    "auth": "Bearer Token",
    "requiredRole": "ADMIN, APPROVER, VIEWER",
    "headers": [
      {
        "name": "Authorization",
        "type": "string",
        "required": true,
        "description": "Bearer JWT session token obtained via /api/v1/auth/login",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "Response List Team Members Api V1 Auth Members Get",
        "example": "[\n  {\n    \"id\": \"sample_id_99\",\n    \"email\": \"developer@company.com\",\n    \"full_name\": \"sample_string\",\n    \"role\": \"sample_string\",\n    \"org_id\": \"sample_id_99\",\n    \"created_at\": \"2026-11-16T12:00:00Z\",\n    \"last_login_at\": {}\n  }\n]"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "list_team_members_api_v1_auth_members_get"
  },
  {
    "path": "/api/v1/auth/members",
    "method": "POST",
    "summary": "Invite Team Member",
    "description": "Add / invite a new team member to the organization with assigned RBAC role.",
    "tag": "Authentication & Workspaces",
    "auth": "Admin Only",
    "requiredRole": "ADMIN",
    "headers": [
      {
        "name": "Authorization",
        "type": "string",
        "required": true,
        "description": "Bearer JWT session token obtained via /api/v1/auth/login",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 201,
        "description": "Successful Response",
        "schema": "MemberResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"email\": \"developer@company.com\",\n  \"full_name\": \"sample_string\",\n  \"role\": \"sample_string\",\n  \"org_id\": \"sample_id_99\",\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"last_login_at\": {}\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "invite_team_member_api_v1_auth_members_post",
    "requestBody": {
      "contentType": "application/json",
      "schema": "MemberInviteRequest",
      "example": "{\n  \"email\": \"developer@company.com\",\n  \"password\": \"sample_string\",\n  \"full_name\": \"sample_string\",\n  \"role\": \"sample_string\"\n}"
    }
  },
  {
    "path": "/api/v1/auth/members/{user_id}",
    "method": "DELETE",
    "summary": "Remove Team Member",
    "description": "Remove a team member from the organization.",
    "tag": "Authentication & Workspaces",
    "auth": "Admin Only",
    "requiredRole": "ADMIN",
    "headers": [
      {
        "name": "Authorization",
        "type": "string",
        "required": true,
        "description": "Bearer JWT session token obtained via /api/v1/auth/login",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "user_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 204,
        "description": "Successful Response",
        "schema": "object"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "remove_team_member_api_v1_auth_members__user_id__delete"
  },
  {
    "path": "/api/v1/auth/members/{user_id}",
    "method": "PATCH",
    "summary": "Update Team Member",
    "description": "Update a team member's role or display name.",
    "tag": "Authentication & Workspaces",
    "auth": "Admin Only",
    "requiredRole": "ADMIN",
    "headers": [
      {
        "name": "Authorization",
        "type": "string",
        "required": true,
        "description": "Bearer JWT session token obtained via /api/v1/auth/login",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "user_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "MemberResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"email\": \"developer@company.com\",\n  \"full_name\": \"sample_string\",\n  \"role\": \"sample_string\",\n  \"org_id\": \"sample_id_99\",\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"last_login_at\": {}\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "update_team_member_api_v1_auth_members__user_id__patch",
    "requestBody": {
      "contentType": "application/json",
      "schema": "MemberUpdateRequest",
      "example": "{\n  \"role\": {},\n  \"full_name\": {}\n}"
    }
  },
  {
    "path": "/api/v1/auth/register",
    "method": "POST",
    "summary": "Register",
    "description": "Register a new customer organization and its primary administrator account.",
    "tag": "Authentication & Workspaces",
    "auth": "Public",
    "requiredRole": "None",
    "headers": [],
    "parameters": [],
    "responses": [
      {
        "status": 201,
        "description": "Successful Response",
        "schema": "AuthResponse",
        "example": "{\n  \"access_token\": \"sample_string\",\n  \"token_type\": \"sample_string\",\n  \"user\": {\n    \"id\": \"sample_id_99\",\n    \"email\": \"developer@company.com\",\n    \"full_name\": \"sample_string\",\n    \"role\": \"sample_string\",\n    \"org_id\": \"sample_id_99\",\n    \"org_name\": \"sample_string\",\n    \"plan\": \"sample_string\"\n  },\n  \"initial_api_key\": {}\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "register_api_v1_auth_register_post",
    "requestBody": {
      "contentType": "application/json",
      "schema": "RegisterRequest",
      "example": "{\n  \"email\": \"developer@company.com\",\n  \"password\": \"sample_string\",\n  \"full_name\": \"sample_string\",\n  \"company_name\": \"sample_string\"\n}"
    }
  },
  {
    "path": "/api/v1/enterprise/agents/{agent_id}/ownership",
    "method": "POST",
    "summary": "Assign Agent Ownership",
    "description": "Binds an agent to an owner user, security policy, and operational status.",
    "tag": "Enterprise Administration & Entitlements",
    "auth": "Bearer Token",
    "requiredRole": "ADMIN, APPROVER, VIEWER",
    "headers": [
      {
        "name": "Authorization",
        "type": "string",
        "required": true,
        "description": "Bearer JWT session token obtained via /api/v1/auth/login",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "agent_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "Response Assign Agent Ownership Api V1 Enterprise Agents  Agent Id  Ownership Post"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "assign_agent_ownership_api_v1_enterprise_agents__agent_id__ownership_post",
    "requestBody": {
      "contentType": "application/json",
      "schema": "AgentOwnershipUpdate",
      "example": "{\n  \"owner_user_id\": {},\n  \"policy_id\": {},\n  \"status\": {}\n}"
    }
  },
  {
    "path": "/api/v1/enterprise/correlations",
    "method": "GET",
    "summary": "Get Security Event Correlations",
    "description": "Returns tenant-scoped security timeline correlating high-risk audit events\nwith detected behavioral anomalies and security incidents.",
    "tag": "Enterprise Administration & Entitlements",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "limit",
        "type": "integer",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "Response Get Security Event Correlations Api V1 Enterprise Correlations Get",
        "example": "[\n  {}\n]"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "get_security_event_correlations_api_v1_enterprise_correlations_get"
  },
  {
    "path": "/api/v1/enterprise/entitlements",
    "method": "GET",
    "summary": "Get Entitlements",
    "description": "Retrieves current entitlement limits, agent counts, and monthly consumption.",
    "tag": "Enterprise Administration & Entitlements",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "EntitlementsResponse",
        "example": "{\n  \"org_id\": \"sample_id_99\",\n  \"plan\": \"sample_string\",\n  \"status\": \"sample_string\",\n  \"max_agents\": 1,\n  \"active_agents\": 1,\n  \"max_monthly_actions\": 1,\n  \"consumed_monthly_actions\": 1,\n  \"utilization_pct\": 0.95,\n  \"rate_limit_per_minute\": 1,\n  \"within_limits\": true\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "get_entitlements_api_v1_enterprise_entitlements_get"
  },
  {
    "path": "/api/v1/enterprise/keys/rotate",
    "method": "POST",
    "summary": "Rotate Api Key",
    "description": "Seamless zero-downtime API key rotation.\n1. Verifies existing key belongs to tenant and is active.\n2. Provisions new key with fresh cryptographic secret (`sck_live_...`).\n3. Links `rotated_to_key_id` on previous key and sets a graceful expiry window.\n4. Returns new key details along with old key expiry.",
    "tag": "Enterprise Administration & Entitlements",
    "auth": "Bearer Token",
    "requiredRole": "ADMIN, APPROVER, VIEWER",
    "headers": [
      {
        "name": "Authorization",
        "type": "string",
        "required": true,
        "description": "Bearer JWT session token obtained via /api/v1/auth/login",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "KeyRotationResponse",
        "example": "{\n  \"message\": \"sample_string\",\n  \"old_key_id\": \"sample_id_99\",\n  \"old_key_expires_at\": \"sample_id_99\",\n  \"new_key_id\": \"sample_id_99\",\n  \"new_key_prefix\": \"sample_id_99\",\n  \"new_secret_key\": \"sample_id_99\",\n  \"name\": \"sample_string\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "rotate_api_key_api_v1_enterprise_keys_rotate_post",
    "requestBody": {
      "contentType": "application/json",
      "schema": "KeyRotationRequest",
      "example": "{\n  \"key_id\": \"sample_id_99\",\n  \"grace_period_hours\": 1\n}"
    }
  },
  {
    "path": "/api/v1/enterprise/members",
    "method": "GET",
    "summary": "List Members",
    "description": "Lists team members belonging to the current tenant.",
    "tag": "Enterprise Administration & Entitlements",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "Response List Members Api V1 Enterprise Members Get",
        "example": "[\n  {}\n]"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "list_members_api_v1_enterprise_members_get"
  },
  {
    "path": "/api/v1/enterprise/members",
    "method": "POST",
    "summary": "Create Member",
    "description": "Provisions a new member in the organization. Requires OWNER or SECURITY_ADMIN.",
    "tag": "Enterprise Administration & Entitlements",
    "auth": "Bearer Token",
    "requiredRole": "ADMIN, APPROVER, VIEWER",
    "headers": [
      {
        "name": "Authorization",
        "type": "string",
        "required": true,
        "description": "Bearer JWT session token obtained via /api/v1/auth/login",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 201,
        "description": "Successful Response",
        "schema": "Response Create Member Api V1 Enterprise Members Post"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "create_member_api_v1_enterprise_members_post",
    "requestBody": {
      "contentType": "application/json",
      "schema": "MemberCreate",
      "example": "{\n  \"email\": \"developer@company.com\",\n  \"full_name\": \"sample_string\",\n  \"password\": \"sample_string\",\n  \"role\": \"sample_string\"\n}"
    }
  },
  {
    "path": "/api/v1/enterprise/members/{user_id}",
    "method": "DELETE",
    "summary": "Delete Member",
    "description": "Deletes a member from the organization. Requires OWNER role.",
    "tag": "Enterprise Administration & Entitlements",
    "auth": "Bearer Token",
    "requiredRole": "ADMIN, APPROVER, VIEWER",
    "headers": [
      {
        "name": "Authorization",
        "type": "string",
        "required": true,
        "description": "Bearer JWT session token obtained via /api/v1/auth/login",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "user_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "Response Delete Member Api V1 Enterprise Members  User Id  Delete"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "delete_member_api_v1_enterprise_members__user_id__delete"
  },
  {
    "path": "/api/v1/enterprise/members/{user_id}",
    "method": "PATCH",
    "summary": "Update Member",
    "description": "Updates team member role or active status. Requires OWNER or SECURITY_ADMIN.",
    "tag": "Enterprise Administration & Entitlements",
    "auth": "Bearer Token",
    "requiredRole": "ADMIN, APPROVER, VIEWER",
    "headers": [
      {
        "name": "Authorization",
        "type": "string",
        "required": true,
        "description": "Bearer JWT session token obtained via /api/v1/auth/login",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "user_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "Response Update Member Api V1 Enterprise Members  User Id  Patch"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "update_member_api_v1_enterprise_members__user_id__patch",
    "requestBody": {
      "contentType": "application/json",
      "schema": "MemberUpdate",
      "example": "{\n  \"full_name\": {},\n  \"role\": {},\n  \"is_active\": {}\n}"
    }
  },
  {
    "path": "/api/v1/enterprise/organization",
    "method": "GET",
    "summary": "Get Organization Details",
    "description": "Retrieves organization details for the current tenant.",
    "tag": "Enterprise Administration & Entitlements",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "Response Get Organization Details Api V1 Enterprise Organization Get"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "get_organization_details_api_v1_enterprise_organization_get"
  },
  {
    "path": "/api/v1/enterprise/organization",
    "method": "PATCH",
    "summary": "Update Organization",
    "description": "Updates organization configuration. Requires OWNER or SECURITY_ADMIN.",
    "tag": "Enterprise Administration & Entitlements",
    "auth": "Bearer Token",
    "requiredRole": "ADMIN, APPROVER, VIEWER",
    "headers": [
      {
        "name": "Authorization",
        "type": "string",
        "required": true,
        "description": "Bearer JWT session token obtained via /api/v1/auth/login",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "Response Update Organization Api V1 Enterprise Organization Patch"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "update_organization_api_v1_enterprise_organization_patch",
    "requestBody": {
      "contentType": "application/json",
      "schema": "OrganizationUpdate",
      "example": "{\n  \"name\": {},\n  \"plan\": {},\n  \"status\": {},\n  \"max_agents\": {},\n  \"max_monthly_actions\": {},\n  \"rate_limit_per_minute\": {}\n}"
    }
  },
  {
    "path": "/api/v1/enterprise/overview",
    "method": "GET",
    "summary": "Get Enterprise Overview",
    "description": "Retrieves enterprise overview metrics for the current tenant.",
    "tag": "Enterprise Administration & Entitlements",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "Response Get Enterprise Overview Api V1 Enterprise Overview Get"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "get_enterprise_overview_api_v1_enterprise_overview_get"
  },
  {
    "path": "/api/v1/enterprise/telemetry",
    "method": "GET",
    "summary": "Get Enterprise Security Telemetry",
    "description": "Aggregates unified CORE decision metrics and SENTINEL threat telemetry\nspecifically for the authenticated organization tenant.",
    "tag": "Enterprise Administration & Entitlements",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "Response Get Enterprise Security Telemetry Api V1 Enterprise Telemetry Get"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "get_enterprise_security_telemetry_api_v1_enterprise_telemetry_get"
  },
  {
    "path": "/api/v1/integrity/records",
    "method": "GET",
    "summary": "List Execution Integrity Records",
    "description": "List immutable execution integrity validation records for this tenant.",
    "tag": "Execution Integrity & TOCTOU Defense",
    "auth": "Bearer Token",
    "requiredRole": "ADMIN, APPROVER, VIEWER",
    "headers": [
      {
        "name": "Authorization",
        "type": "string",
        "required": true,
        "description": "Bearer JWT session token obtained via /api/v1/auth/login",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "agent_id",
        "type": "string",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "session_id",
        "type": "string",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "tool_name",
        "type": "string",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "status",
        "type": "string",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "limit",
        "type": "integer",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "Response List Execution Integrity Records Api V1 Integrity Records Get",
        "example": "[\n  {\n    \"id\": \"sample_id_99\",\n    \"org_id\": \"sample_id_99\",\n    \"agent_id\": \"sample_id_99\",\n    \"session_id\": \"sample_id_99\",\n    \"tool_name\": \"sample_string\",\n    \"request_digest\": \"sample_string\",\n    \"policy_version\": 1,\n    \"status\": \"sample_string\",\n    \"rejection_reason\": {},\n    \"nonce\": \"sample_string\",\n    \"created_at\": \"2026-11-16T12:00:00Z\"\n  }\n]"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "list_execution_integrity_records_api_v1_integrity_records_get"
  },
  {
    "path": "/api/v1/integrity/validate",
    "method": "POST",
    "summary": "Validate Execution Integrity",
    "description": "Validates execution request parameters against approved digest, checks nonce uniqueness,\nand logs immutable execution integrity audit record.",
    "tag": "Execution Integrity & TOCTOU Defense",
    "auth": "Bearer Token",
    "requiredRole": "ADMIN, APPROVER, VIEWER",
    "headers": [
      {
        "name": "Authorization",
        "type": "string",
        "required": true,
        "description": "Bearer JWT session token obtained via /api/v1/auth/login",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "ExecutionIntegrityResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"org_id\": \"sample_id_99\",\n  \"agent_id\": \"sample_id_99\",\n  \"session_id\": \"sample_id_99\",\n  \"tool_name\": \"sample_string\",\n  \"request_digest\": \"sample_string\",\n  \"policy_version\": 1,\n  \"status\": \"sample_string\",\n  \"rejection_reason\": {},\n  \"nonce\": \"sample_string\",\n  \"created_at\": \"2026-11-16T12:00:00Z\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "validate_execution_integrity_api_v1_integrity_validate_post",
    "requestBody": {
      "contentType": "application/json",
      "schema": "ExecutionIntegrityValidateRequest",
      "example": "{\n  \"agent_id\": \"sample_id_99\",\n  \"session_id\": {},\n  \"tool_name\": \"sample_string\",\n  \"arguments\": {},\n  \"approved_digest\": {},\n  \"nonce\": \"sample_string\",\n  \"policy_version\": 1,\n  \"approval_token\": {}\n}"
    }
  },
  {
    "path": "/api/v1/provenance",
    "method": "GET",
    "summary": "List Provenance Traces",
    "description": "List grouped execution traces with intent context correlation.",
    "tag": "Execution Provenance & Evidence",
    "auth": "Bearer Token",
    "requiredRole": "ADMIN, APPROVER, VIEWER",
    "headers": [
      {
        "name": "Authorization",
        "type": "string",
        "required": true,
        "description": "Bearer JWT session token obtained via /api/v1/auth/login",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "agent_id",
        "type": "string",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "limit",
        "type": "integer",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "Response List Provenance Traces Api V1 Provenance Get",
        "example": "[\n  {\n    \"trace_id\": \"sample_id_99\",\n    \"org_id\": \"sample_id_99\",\n    \"agent_id\": {},\n    \"intent_id\": {},\n    \"authorized_objective\": {},\n    \"total_actions\": 1,\n    \"allowed_count\": 1,\n    \"denied_count\": 1,\n    \"require_approval_count\": 1,\n    \"started_at\": \"2026-11-16T12:00:00Z\",\n    \"latest_at\": \"2026-11-16T12:00:00Z\",\n    \"final_verdict\": \"sample_string\"\n  }\n]"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "list_provenance_traces_api_v1_provenance_get"
  },
  {
    "path": "/api/v1/provenance/records",
    "method": "GET",
    "summary": "List Data Provenance Records",
    "description": "List signed data provenance records for the organization with optional filtering.",
    "tag": "Execution Provenance & Evidence",
    "auth": "Bearer Token",
    "requiredRole": "ADMIN, APPROVER, VIEWER",
    "headers": [
      {
        "name": "Authorization",
        "type": "string",
        "required": true,
        "description": "Bearer JWT session token obtained via /api/v1/auth/login",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "agent_id",
        "type": "string",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "session_id",
        "type": "string",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "source_type",
        "type": "string",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "trust_level",
        "type": "string",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "limit",
        "type": "integer",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "Response List Data Provenance Records Api V1 Provenance Records Get",
        "example": "[\n  {\n    \"id\": \"sample_id_99\",\n    \"org_id\": \"sample_id_99\",\n    \"session_id\": \"sample_id_99\",\n    \"agent_id\": \"sample_id_99\",\n    \"source_type\": \"sample_string\",\n    \"source_identifier\": \"sample_id_99\",\n    \"input_hash\": \"sample_string\",\n    \"output_hash\": \"sample_string\",\n    \"data_classification\": \"sample_string\",\n    \"trust_level\": \"sample_string\",\n    \"parent_provenance_ids_json\": [\n      \"sample_string\"\n    ],\n    \"transformation_type\": {},\n    \"decision_id\": {},\n    \"incident_id\": {},\n    \"signature\": \"sample_string\",\n    \"created_at\": \"2026-11-16T12:00:00Z\"\n  }\n]"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "list_data_provenance_records_api_v1_provenance_records_get"
  },
  {
    "path": "/api/v1/provenance/records",
    "method": "POST",
    "summary": "Record Data Provenance",
    "description": "Ingest and store an immutable cryptographically signed data provenance record.",
    "tag": "Execution Provenance & Evidence",
    "auth": "Bearer Token",
    "requiredRole": "ADMIN, APPROVER, VIEWER",
    "headers": [
      {
        "name": "Authorization",
        "type": "string",
        "required": true,
        "description": "Bearer JWT session token obtained via /api/v1/auth/login",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 201,
        "description": "Successful Response",
        "schema": "DataProvenanceResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"org_id\": \"sample_id_99\",\n  \"session_id\": \"sample_id_99\",\n  \"agent_id\": \"sample_id_99\",\n  \"source_type\": \"sample_string\",\n  \"source_identifier\": \"sample_id_99\",\n  \"input_hash\": \"sample_string\",\n  \"output_hash\": \"sample_string\",\n  \"data_classification\": \"sample_string\",\n  \"trust_level\": \"sample_string\",\n  \"parent_provenance_ids_json\": [\n    \"sample_string\"\n  ],\n  \"transformation_type\": {},\n  \"decision_id\": {},\n  \"incident_id\": {},\n  \"signature\": \"sample_string\",\n  \"created_at\": \"2026-11-16T12:00:00Z\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "record_data_provenance_api_v1_provenance_records_post",
    "requestBody": {
      "contentType": "application/json",
      "schema": "DataProvenanceCreateRequest",
      "example": "{\n  \"agent_id\": \"sample_id_99\",\n  \"session_id\": {},\n  \"source_type\": \"sample_string\",\n  \"source_identifier\": \"sample_id_99\",\n  \"input_hash\": \"sample_string\",\n  \"output_hash\": \"sample_string\",\n  \"data_classification\": \"sample_string\",\n  \"trust_level\": \"sample_string\",\n  \"parent_provenance_ids\": [\n    \"sample_string\"\n  ],\n  \"transformation_type\": {},\n  \"decision_id\": {},\n  \"incident_id\": {},\n  \"signature\": \"sample_string\"\n}"
    }
  },
  {
    "path": "/api/v1/provenance/records/{record_id}",
    "method": "GET",
    "summary": "Get Data Provenance Record",
    "description": "Retrieve a single data provenance record by ID.",
    "tag": "Execution Provenance & Evidence",
    "auth": "Bearer Token",
    "requiredRole": "ADMIN, APPROVER, VIEWER",
    "headers": [
      {
        "name": "Authorization",
        "type": "string",
        "required": true,
        "description": "Bearer JWT session token obtained via /api/v1/auth/login",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "record_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "DataProvenanceResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"org_id\": \"sample_id_99\",\n  \"session_id\": \"sample_id_99\",\n  \"agent_id\": \"sample_id_99\",\n  \"source_type\": \"sample_string\",\n  \"source_identifier\": \"sample_id_99\",\n  \"input_hash\": \"sample_string\",\n  \"output_hash\": \"sample_string\",\n  \"data_classification\": \"sample_string\",\n  \"trust_level\": \"sample_string\",\n  \"parent_provenance_ids_json\": [\n    \"sample_string\"\n  ],\n  \"transformation_type\": {},\n  \"decision_id\": {},\n  \"incident_id\": {},\n  \"signature\": \"sample_string\",\n  \"created_at\": \"2026-11-16T12:00:00Z\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "get_data_provenance_record_api_v1_provenance_records__record_id__get"
  },
  {
    "path": "/api/v1/provenance/records/{record_id}/lineage",
    "method": "GET",
    "summary": "Get Data Provenance Lineage",
    "description": "Traverse causal ancestry DAG from record_id upwards with loop detection.",
    "tag": "Execution Provenance & Evidence",
    "auth": "Bearer Token",
    "requiredRole": "ADMIN, APPROVER, VIEWER",
    "headers": [
      {
        "name": "Authorization",
        "type": "string",
        "required": true,
        "description": "Bearer JWT session token obtained via /api/v1/auth/login",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "record_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "max_depth",
        "type": "integer",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "ProvenanceLineageNodeResponse",
        "example": "{\n  \"record_id\": \"sample_id_99\",\n  \"source_type\": \"sample_string\",\n  \"source_identifier\": \"sample_id_99\",\n  \"trust_level\": \"sample_string\",\n  \"data_classification\": \"sample_string\",\n  \"input_hash\": \"sample_string\",\n  \"output_hash\": \"sample_string\",\n  \"transformation_type\": {},\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"parent_nodes\": [\n    {}\n  ]\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "get_data_provenance_lineage_api_v1_provenance_records__record_id__lineage_get"
  },
  {
    "path": "/api/v1/provenance/verify-trust",
    "method": "POST",
    "summary": "Verify Data Trust Elevation",
    "description": "Validates whether claimed trust level satisfies strict non-elevation invariants.\nUntrusted external data can never elevate to TRUSTED_CONTROL or AUTHENTICATED_USER_INPUT.",
    "tag": "Execution Provenance & Evidence",
    "auth": "Bearer Token",
    "requiredRole": "ADMIN, APPROVER, VIEWER",
    "headers": [
      {
        "name": "Authorization",
        "type": "string",
        "required": true,
        "description": "Bearer JWT session token obtained via /api/v1/auth/login",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "TrustVerificationResponse",
        "example": "{\n  \"is_valid\": true,\n  \"effective_trust_level\": \"sample_string\",\n  \"reason\": \"sample_string\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "verify_data_trust_elevation_api_v1_provenance_verify_trust_post",
    "requestBody": {
      "contentType": "application/json",
      "schema": "TrustVerificationRequest",
      "example": "{\n  \"claimed_trust_level\": \"sample_string\",\n  \"parent_provenance_ids\": [\n    \"sample_string\"\n  ],\n  \"is_authoritative_component\": true\n}"
    }
  },
  {
    "path": "/api/v1/provenance/{trace_id}",
    "method": "GET",
    "summary": "Get Trace Provenance Detail",
    "description": "Get full end-to-end evidence graph and causal explanation for a specific trace.\nConnects Authorized Objective \u2192 Intent Context \u2192 Policy Rules \u2192 Approvals \u2192 Execution Outcomes.",
    "tag": "Execution Provenance & Evidence",
    "auth": "Bearer Token",
    "requiredRole": "ADMIN, APPROVER, VIEWER",
    "headers": [
      {
        "name": "Authorization",
        "type": "string",
        "required": true,
        "description": "Bearer JWT session token obtained via /api/v1/auth/login",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "trace_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "ProvenanceDetail",
        "example": "{\n  \"trace_id\": \"sample_id_99\",\n  \"org_id\": \"sample_id_99\",\n  \"agent_id\": {},\n  \"intent_context\": {},\n  \"policy_snapshot\": {},\n  \"timeline\": [\n    {\n      \"event_id\": {},\n      \"timestamp\": {},\n      \"tool_name\": {},\n      \"verdict\": {},\n      \"reason\": {},\n      \"risk_score\": {},\n      \"action_hash\": {},\n      \"execution_success\": {},\n      \"policy_id\": {},\n      \"approval_id\": {},\n      \"approval_status\": {},\n      \"sanitized_metadata\": {}\n    }\n  ],\n  \"causal_summary\": \"sample_string\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "get_trace_provenance_detail_api_v1_provenance__trace_id__get"
  },
  {
    "path": "/api/v1/intents",
    "method": "GET",
    "summary": "List Intent Contexts",
    "description": "List intent authorization contexts scoped to caller's organization.",
    "tag": "Intent Authorization",
    "auth": "Bearer Token",
    "requiredRole": "ADMIN, APPROVER, VIEWER",
    "headers": [
      {
        "name": "Authorization",
        "type": "string",
        "required": true,
        "description": "Bearer JWT session token obtained via /api/v1/auth/login",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "agent_id",
        "type": "string",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "status",
        "type": "string",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "skip",
        "type": "integer",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "limit",
        "type": "integer",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "Response List Intent Contexts Api V1 Intents Get",
        "example": "[\n  {\n    \"id\": \"sample_id_99\",\n    \"org_id\": \"sample_id_99\",\n    \"user_id\": \"sample_id_99\",\n    \"agent_id\": \"sample_id_99\",\n    \"authorized_objective\": \"sample_string\",\n    \"allowed_actions\": [\n      \"sample_string\"\n    ],\n    \"denied_actions\": [\n      \"sample_string\"\n    ],\n    \"allowed_permissions\": [\n      \"sample_string\"\n    ],\n    \"allowed_resources\": [\n      \"sample_string\"\n    ],\n    \"allowed_recipients\": [\n      \"sample_string\"\n    ],\n    \"sensitivity_ceiling\": 1,\n    \"execution_scope\": \"sample_string\",\n    \"expiration_timestamp\": \"2026-11-16T12:00:00Z\",\n    \"context_status\": \"sample_string\",\n    \"authorization_version\": 1,\n    \"revoked_at\": {},\n    \"revoked_reason\": {},\n    \"created_at\": \"2026-11-16T12:00:00Z\"\n  }\n]"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "list_intent_contexts_api_v1_intents_get"
  },
  {
    "path": "/api/v1/intents",
    "method": "POST",
    "summary": "Issue Intent Context",
    "description": "Issue an immutable task-scoped Intent Authorization Context.\nOnly authorized principals (ADMIN or APPROVER) can issue intent authorizations.",
    "tag": "Intent Authorization",
    "auth": "Approver or Admin",
    "requiredRole": "ADMIN, APPROVER",
    "headers": [
      {
        "name": "Authorization",
        "type": "string",
        "required": true,
        "description": "Bearer JWT session token obtained via /api/v1/auth/login",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 201,
        "description": "Successful Response",
        "schema": "IntentContextResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"org_id\": \"sample_id_99\",\n  \"user_id\": \"sample_id_99\",\n  \"agent_id\": \"sample_id_99\",\n  \"authorized_objective\": \"sample_string\",\n  \"allowed_actions\": [\n    \"sample_string\"\n  ],\n  \"denied_actions\": [\n    \"sample_string\"\n  ],\n  \"allowed_permissions\": [\n    \"sample_string\"\n  ],\n  \"allowed_resources\": [\n    \"sample_string\"\n  ],\n  \"allowed_recipients\": [\n    \"sample_string\"\n  ],\n  \"sensitivity_ceiling\": 1,\n  \"execution_scope\": \"sample_string\",\n  \"expiration_timestamp\": \"2026-11-16T12:00:00Z\",\n  \"context_status\": \"sample_string\",\n  \"authorization_version\": 1,\n  \"revoked_at\": {},\n  \"revoked_reason\": {},\n  \"created_at\": \"2026-11-16T12:00:00Z\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "issue_intent_context_api_v1_intents_post",
    "requestBody": {
      "contentType": "application/json",
      "schema": "IntentContextCreate",
      "example": "{\n  \"agent_id\": \"sample_id_99\",\n  \"authorized_objective\": \"sample_string\",\n  \"allowed_actions\": [\n    \"sample_string\"\n  ],\n  \"denied_actions\": [\n    \"sample_string\"\n  ],\n  \"allowed_permissions\": [\n    \"sample_string\"\n  ],\n  \"allowed_resources\": [\n    \"sample_string\"\n  ],\n  \"allowed_recipients\": [\n    \"sample_string\"\n  ],\n  \"sensitivity_ceiling\": 1,\n  \"execution_scope\": \"sample_string\",\n  \"ttl_seconds\": 1\n}"
    }
  },
  {
    "path": "/api/v1/intents/{intent_id}",
    "method": "GET",
    "summary": "Get Intent Context",
    "description": "Retrieve full details of an authorized intent context.",
    "tag": "Intent Authorization",
    "auth": "Bearer Token",
    "requiredRole": "ADMIN, APPROVER, VIEWER",
    "headers": [
      {
        "name": "Authorization",
        "type": "string",
        "required": true,
        "description": "Bearer JWT session token obtained via /api/v1/auth/login",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "intent_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "IntentContextResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"org_id\": \"sample_id_99\",\n  \"user_id\": \"sample_id_99\",\n  \"agent_id\": \"sample_id_99\",\n  \"authorized_objective\": \"sample_string\",\n  \"allowed_actions\": [\n    \"sample_string\"\n  ],\n  \"denied_actions\": [\n    \"sample_string\"\n  ],\n  \"allowed_permissions\": [\n    \"sample_string\"\n  ],\n  \"allowed_resources\": [\n    \"sample_string\"\n  ],\n  \"allowed_recipients\": [\n    \"sample_string\"\n  ],\n  \"sensitivity_ceiling\": 1,\n  \"execution_scope\": \"sample_string\",\n  \"expiration_timestamp\": \"2026-11-16T12:00:00Z\",\n  \"context_status\": \"sample_string\",\n  \"authorization_version\": 1,\n  \"revoked_at\": {},\n  \"revoked_reason\": {},\n  \"created_at\": \"2026-11-16T12:00:00Z\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "get_intent_context_api_v1_intents__intent_id__get"
  },
  {
    "path": "/api/v1/intents/{intent_id}/revoke",
    "method": "POST",
    "summary": "Revoke Intent Context",
    "description": "Explicitly revoke an active intent authorization context.\nCauses any subsequent tool calls under this intent to immediately fail closed.",
    "tag": "Intent Authorization",
    "auth": "Approver or Admin",
    "requiredRole": "ADMIN, APPROVER",
    "headers": [
      {
        "name": "Authorization",
        "type": "string",
        "required": true,
        "description": "Bearer JWT session token obtained via /api/v1/auth/login",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "intent_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "IntentContextResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"org_id\": \"sample_id_99\",\n  \"user_id\": \"sample_id_99\",\n  \"agent_id\": \"sample_id_99\",\n  \"authorized_objective\": \"sample_string\",\n  \"allowed_actions\": [\n    \"sample_string\"\n  ],\n  \"denied_actions\": [\n    \"sample_string\"\n  ],\n  \"allowed_permissions\": [\n    \"sample_string\"\n  ],\n  \"allowed_resources\": [\n    \"sample_string\"\n  ],\n  \"allowed_recipients\": [\n    \"sample_string\"\n  ],\n  \"sensitivity_ceiling\": 1,\n  \"execution_scope\": \"sample_string\",\n  \"expiration_timestamp\": \"2026-11-16T12:00:00Z\",\n  \"context_status\": \"sample_string\",\n  \"authorization_version\": 1,\n  \"revoked_at\": {},\n  \"revoked_reason\": {},\n  \"created_at\": \"2026-11-16T12:00:00Z\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "revoke_intent_context_api_v1_intents__intent_id__revoke_post",
    "requestBody": {
      "contentType": "application/json",
      "schema": "IntentContextRevoke",
      "example": "{\n  \"reason\": \"sample_string\"\n}"
    }
  },
  {
    "path": "/api/v1/agents/messages",
    "method": "POST",
    "summary": "Send Agent Message",
    "description": "Dispatch an authenticated inter-agent message with replay defense and signature validation.",
    "tag": "Inter-Agent Messaging",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 201,
        "description": "Successful Response",
        "schema": "AgentMessageResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"org_id\": \"sample_id_99\",\n  \"sender_id\": \"sample_id_99\",\n  \"recipient_id\": \"sample_id_99\",\n  \"message_type\": \"sample_string\",\n  \"payload_json\": {},\n  \"signature\": \"sample_string\",\n  \"nonce\": \"sample_string\",\n  \"status\": \"sample_string\",\n  \"expires_at\": \"2026-11-16T12:00:00Z\",\n  \"created_at\": \"2026-11-16T12:00:00Z\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "send_agent_message_api_v1_agents_messages_post",
    "requestBody": {
      "contentType": "application/json",
      "schema": "AgentMessageSendRequest",
      "example": "{\n  \"sender_id\": \"sample_id_99\",\n  \"recipient_id\": \"sample_id_99\",\n  \"message_type\": \"sample_string\",\n  \"payload\": {},\n  \"signature\": \"sample_string\",\n  \"nonce\": {},\n  \"ttl_seconds\": 1\n}"
    }
  },
  {
    "path": "/api/v1/agents/{agent_id}/messages",
    "method": "GET",
    "summary": "Get Agent Messages",
    "description": "Retrieve unexpired messages directed to a specific agent.",
    "tag": "Inter-Agent Messaging",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "agent_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "status",
        "type": "string",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "Response Get Agent Messages Api V1 Agents  Agent Id  Messages Get",
        "example": "[\n  {\n    \"id\": \"sample_id_99\",\n    \"org_id\": \"sample_id_99\",\n    \"sender_id\": \"sample_id_99\",\n    \"recipient_id\": \"sample_id_99\",\n    \"message_type\": \"sample_string\",\n    \"payload_json\": {},\n    \"signature\": \"sample_string\",\n    \"nonce\": \"sample_string\",\n    \"status\": \"sample_string\",\n    \"expires_at\": \"2026-11-16T12:00:00Z\",\n    \"created_at\": \"2026-11-16T12:00:00Z\"\n  }\n]"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "get_agent_messages_api_v1_agents__agent_id__messages_get"
  },
  {
    "path": "/api/v1/agents/{agent_id}/messages/{message_id}/ack",
    "method": "POST",
    "summary": "Acknowledge Message",
    "description": "Acknowledge receipt and delivery of a message.",
    "tag": "Inter-Agent Messaging",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "agent_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "message_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "AgentMessageResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"org_id\": \"sample_id_99\",\n  \"sender_id\": \"sample_id_99\",\n  \"recipient_id\": \"sample_id_99\",\n  \"message_type\": \"sample_string\",\n  \"payload_json\": {},\n  \"signature\": \"sample_string\",\n  \"nonce\": \"sample_string\",\n  \"status\": \"sample_string\",\n  \"expires_at\": \"2026-11-16T12:00:00Z\",\n  \"created_at\": \"2026-11-16T12:00:00Z\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "acknowledge_message_api_v1_agents__agent_id__messages__message_id__ack_post"
  },
  {
    "path": "/api/v1/policies",
    "method": "GET",
    "summary": "List Policies",
    "description": "List all configured security policies for the caller's tenant.",
    "tag": "Policies",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "skip",
        "type": "integer",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "limit",
        "type": "integer",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "Response List Policies Api V1 Policies Get",
        "example": "[\n  {\n    \"name\": \"sample_string\",\n    \"description\": \"sample_string\",\n    \"allowed_permissions\": [\n      \"sample_string\"\n    ],\n    \"denied_permissions\": [\n      \"sample_string\"\n    ],\n    \"require_approval_permissions\": [\n      \"sample_string\"\n    ],\n    \"allowed_resources\": [\n      \"sample_string\"\n    ],\n    \"allowed_recipients\": [\n      \"sample_string\"\n    ],\n    \"max_risk_level\": \"LOW\",\n    \"max_sensitivity\": 1,\n    \"version\": 1,\n    \"parameter_constraints\": {},\n    \"id\": \"sample_id_99\",\n    \"created_at\": \"2026-11-16T12:00:00Z\",\n    \"updated_at\": \"2026-11-16T12:00:00Z\"\n  }\n]"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "list_policies_api_v1_policies_get"
  },
  {
    "path": "/api/v1/policies",
    "method": "POST",
    "summary": "Create Policy",
    "description": "Create a new security policy and record initial version snapshot.",
    "tag": "Policies",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 201,
        "description": "Successful Response",
        "schema": "PolicyResponse",
        "example": "{\n  \"name\": \"sample_string\",\n  \"description\": \"sample_string\",\n  \"allowed_permissions\": [\n    \"sample_string\"\n  ],\n  \"denied_permissions\": [\n    \"sample_string\"\n  ],\n  \"require_approval_permissions\": [\n    \"sample_string\"\n  ],\n  \"allowed_resources\": [\n    \"sample_string\"\n  ],\n  \"allowed_recipients\": [\n    \"sample_string\"\n  ],\n  \"max_risk_level\": \"LOW\",\n  \"max_sensitivity\": 1,\n  \"version\": 1,\n  \"parameter_constraints\": {},\n  \"id\": \"sample_id_99\",\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"updated_at\": \"2026-11-16T12:00:00Z\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "create_policy_api_v1_policies_post",
    "requestBody": {
      "contentType": "application/json",
      "schema": "PolicyCreate",
      "example": "{\n  \"name\": \"sample_string\",\n  \"description\": \"sample_string\",\n  \"allowed_permissions\": [\n    \"sample_string\"\n  ],\n  \"denied_permissions\": [\n    \"sample_string\"\n  ],\n  \"require_approval_permissions\": [\n    \"sample_string\"\n  ],\n  \"allowed_resources\": [\n    \"sample_string\"\n  ],\n  \"allowed_recipients\": [\n    \"sample_string\"\n  ],\n  \"max_risk_level\": \"LOW\",\n  \"max_sensitivity\": 1,\n  \"version\": 1,\n  \"parameter_constraints\": {}\n}"
    }
  },
  {
    "path": "/api/v1/policies/from-template/{template_key}",
    "method": "POST",
    "summary": "Create From Template",
    "description": "Instantiate a new security policy directly from a certified enterprise template.",
    "tag": "Policies",
    "auth": "Admin Only",
    "requiredRole": "ADMIN",
    "headers": [
      {
        "name": "Authorization",
        "type": "string",
        "required": true,
        "description": "Bearer JWT session token obtained via /api/v1/auth/login",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "template_key",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 201,
        "description": "Successful Response",
        "schema": "PolicyResponse",
        "example": "{\n  \"name\": \"sample_string\",\n  \"description\": \"sample_string\",\n  \"allowed_permissions\": [\n    \"sample_string\"\n  ],\n  \"denied_permissions\": [\n    \"sample_string\"\n  ],\n  \"require_approval_permissions\": [\n    \"sample_string\"\n  ],\n  \"allowed_resources\": [\n    \"sample_string\"\n  ],\n  \"allowed_recipients\": [\n    \"sample_string\"\n  ],\n  \"max_risk_level\": \"LOW\",\n  \"max_sensitivity\": 1,\n  \"version\": 1,\n  \"parameter_constraints\": {},\n  \"id\": \"sample_id_99\",\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"updated_at\": \"2026-11-16T12:00:00Z\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "create_from_template_api_v1_policies_from_template__template_key__post"
  },
  {
    "path": "/api/v1/policies/simulate",
    "method": "POST",
    "summary": "Simulate Policy",
    "description": "Dry-run simulation mode.\nTests a hypothetical tool execution against a policy or policy draft without executing the real tool.\nPublic callers may simulate drafts. Simulating against saved policies requires tenant authentication.",
    "tag": "Policies",
    "auth": "Public",
    "requiredRole": "None",
    "headers": [],
    "parameters": [
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "SimulationResponse",
        "example": "{\n  \"verdict\": \"ALLOW\",\n  \"would_allow\": true,\n  \"reason\": \"sample_string\",\n  \"risk_score\": 0.95,\n  \"risk_level\": \"LOW\",\n  \"matched_rule\": \"sample_string\",\n  \"requires_approval\": true,\n  \"evaluation_stages\": [\n    {}\n  ]\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "simulate_policy_api_v1_policies_simulate_post",
    "requestBody": {
      "contentType": "application/json",
      "schema": "SimulationRequest",
      "example": "{\n  \"policy_id\": {},\n  \"policy_draft\": {},\n  \"tool_name\": \"sample_string\",\n  \"arguments\": {},\n  \"resource_id\": \"sample_id_99\",\n  \"recipient\": \"sample_string\",\n  \"sensitivity\": 1,\n  \"intent_context_id\": {}\n}"
    }
  },
  {
    "path": "/api/v1/policies/templates",
    "method": "GET",
    "summary": "List Policy Templates",
    "description": "List pre-configured production policy templates for rapid deployment.",
    "tag": "Policies",
    "auth": "Public",
    "requiredRole": "None",
    "headers": [],
    "parameters": [],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "Response List Policy Templates Api V1 Policies Templates Get",
        "example": "[\n  {}\n]"
      }
    ],
    "operationId": "list_policy_templates_api_v1_policies_templates_get"
  },
  {
    "path": "/api/v1/policies/{policy_id}",
    "method": "DELETE",
    "summary": "Delete Policy",
    "description": "Delete a policy by ID.",
    "tag": "Policies",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "policy_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 204,
        "description": "Successful Response",
        "schema": "object"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "delete_policy_api_v1_policies__policy_id__delete"
  },
  {
    "path": "/api/v1/policies/{policy_id}",
    "method": "GET",
    "summary": "Get Policy",
    "description": "Retrieve a specific policy by ID.",
    "tag": "Policies",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "policy_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "PolicyResponse",
        "example": "{\n  \"name\": \"sample_string\",\n  \"description\": \"sample_string\",\n  \"allowed_permissions\": [\n    \"sample_string\"\n  ],\n  \"denied_permissions\": [\n    \"sample_string\"\n  ],\n  \"require_approval_permissions\": [\n    \"sample_string\"\n  ],\n  \"allowed_resources\": [\n    \"sample_string\"\n  ],\n  \"allowed_recipients\": [\n    \"sample_string\"\n  ],\n  \"max_risk_level\": \"LOW\",\n  \"max_sensitivity\": 1,\n  \"version\": 1,\n  \"parameter_constraints\": {},\n  \"id\": \"sample_id_99\",\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"updated_at\": \"2026-11-16T12:00:00Z\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "get_policy_api_v1_policies__policy_id__get"
  },
  {
    "path": "/api/v1/policies/{policy_id}",
    "method": "PUT",
    "summary": "Update Policy",
    "description": "Update an existing security policy and record a new version snapshot.",
    "tag": "Policies",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "policy_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "PolicyResponse",
        "example": "{\n  \"name\": \"sample_string\",\n  \"description\": \"sample_string\",\n  \"allowed_permissions\": [\n    \"sample_string\"\n  ],\n  \"denied_permissions\": [\n    \"sample_string\"\n  ],\n  \"require_approval_permissions\": [\n    \"sample_string\"\n  ],\n  \"allowed_resources\": [\n    \"sample_string\"\n  ],\n  \"allowed_recipients\": [\n    \"sample_string\"\n  ],\n  \"max_risk_level\": \"LOW\",\n  \"max_sensitivity\": 1,\n  \"version\": 1,\n  \"parameter_constraints\": {},\n  \"id\": \"sample_id_99\",\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"updated_at\": \"2026-11-16T12:00:00Z\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "update_policy_api_v1_policies__policy_id__put",
    "requestBody": {
      "contentType": "application/json",
      "schema": "PolicyUpdate",
      "example": "{\n  \"name\": {},\n  \"description\": {},\n  \"allowed_permissions\": {},\n  \"denied_permissions\": {},\n  \"require_approval_permissions\": {},\n  \"allowed_resources\": {},\n  \"allowed_recipients\": {},\n  \"max_risk_level\": {},\n  \"max_sensitivity\": {},\n  \"version\": {},\n  \"parameter_constraints\": {}\n}"
    }
  },
  {
    "path": "/api/v1/policies/{policy_id}/conflicts",
    "method": "GET",
    "summary": "Detect Policy Conflicts",
    "description": "Detect conflicting policy rules:\n- Same permission in allowed and denied lists\n- Same permission in require_approval and denied lists\n- Zero permissions allowed (unusable dead policy)\n- Sensitivity ceiling set to 0 while requesting sensitive permissions",
    "tag": "Policies",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "policy_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "ConflictReport",
        "example": "{\n  \"policy_id\": \"sample_id_99\",\n  \"has_conflicts\": true,\n  \"conflicts\": [\n    {}\n  ],\n  \"recommendations\": [\n    \"sample_string\"\n  ]\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "detect_policy_conflicts_api_v1_policies__policy_id__conflicts_get"
  },
  {
    "path": "/api/v1/policies/{policy_id}/rollback/{version_number}",
    "method": "POST",
    "summary": "Rollback Policy Version",
    "description": "Roll back an active policy to an earlier version snapshot.",
    "tag": "Policies",
    "auth": "Admin Only",
    "requiredRole": "ADMIN",
    "headers": [
      {
        "name": "Authorization",
        "type": "string",
        "required": true,
        "description": "Bearer JWT session token obtained via /api/v1/auth/login",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "policy_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "version_number",
        "type": "integer",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "PolicyResponse",
        "example": "{\n  \"name\": \"sample_string\",\n  \"description\": \"sample_string\",\n  \"allowed_permissions\": [\n    \"sample_string\"\n  ],\n  \"denied_permissions\": [\n    \"sample_string\"\n  ],\n  \"require_approval_permissions\": [\n    \"sample_string\"\n  ],\n  \"allowed_resources\": [\n    \"sample_string\"\n  ],\n  \"allowed_recipients\": [\n    \"sample_string\"\n  ],\n  \"max_risk_level\": \"LOW\",\n  \"max_sensitivity\": 1,\n  \"version\": 1,\n  \"parameter_constraints\": {},\n  \"id\": \"sample_id_99\",\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"updated_at\": \"2026-11-16T12:00:00Z\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "rollback_policy_version_api_v1_policies__policy_id__rollback__version_number__post"
  },
  {
    "path": "/api/v1/policies/{policy_id}/versions",
    "method": "GET",
    "summary": "List Policy Versions",
    "description": "List historical audit snapshots of a policy.",
    "tag": "Policies",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "policy_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "Response List Policy Versions Api V1 Policies  Policy Id  Versions Get",
        "example": "[\n  {\n    \"id\": \"sample_id_99\",\n    \"policy_id\": \"sample_id_99\",\n    \"version\": 1,\n    \"name\": \"sample_string\",\n    \"description\": \"sample_string\",\n    \"allowed_permissions\": [\n      \"sample_string\"\n    ],\n    \"denied_permissions\": [\n      \"sample_string\"\n    ],\n    \"require_approval_permissions\": [\n      \"sample_string\"\n    ],\n    \"allowed_resources\": [\n      \"sample_string\"\n    ],\n    \"allowed_recipients\": [\n      \"sample_string\"\n    ],\n    \"max_risk_level\": \"sample_string\",\n    \"max_sensitivity\": 1,\n    \"modified_by\": \"sample_string\",\n    \"change_reason\": \"sample_string\",\n    \"created_at\": \"2026-11-16T12:00:00Z\"\n  }\n]"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "list_policy_versions_api_v1_policies__policy_id__versions_get"
  },
  {
    "path": "/api/v1/sentinel/sessions",
    "method": "GET",
    "summary": "List Sessions",
    "description": "Lists task sessions strictly confined to the caller's tenant org_id.",
    "tag": "SENTINEL Behavioral Security",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "agent_id",
        "type": "string",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "session_state",
        "type": "string",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "skip",
        "type": "integer",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "limit",
        "type": "integer",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "Response List Sessions Api V1 Sentinel Sessions Get",
        "example": "[\n  {\n    \"id\": \"sample_id_99\",\n    \"org_id\": \"sample_id_99\",\n    \"agent_id\": \"sample_id_99\",\n    \"task_objective\": \"sample_string\",\n    \"authorized_scope\": {},\n    \"session_state\": \"sample_string\",\n    \"total_executions\": 1,\n    \"blocked_executions\": 1,\n    \"scope_violations\": 1,\n    \"suspension_reason\": {},\n    \"suspended_at\": {},\n    \"created_at\": \"2026-11-16T12:00:00Z\",\n    \"updated_at\": \"2026-11-16T12:00:00Z\"\n  }\n]"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "list_sessions_api_v1_sentinel_sessions_get"
  },
  {
    "path": "/api/v1/sentinel/sessions",
    "method": "POST",
    "summary": "Create Session",
    "description": "Creates a new tenant-isolated autonomous task session.",
    "tag": "SENTINEL Behavioral Security",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 201,
        "description": "Successful Response",
        "schema": "SentinelSessionResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"org_id\": \"sample_id_99\",\n  \"agent_id\": \"sample_id_99\",\n  \"task_objective\": \"sample_string\",\n  \"authorized_scope\": {},\n  \"session_state\": \"sample_string\",\n  \"total_executions\": 1,\n  \"blocked_executions\": 1,\n  \"scope_violations\": 1,\n  \"suspension_reason\": {},\n  \"suspended_at\": {},\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"updated_at\": \"2026-11-16T12:00:00Z\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "create_session_api_v1_sentinel_sessions_post",
    "requestBody": {
      "contentType": "application/json",
      "schema": "SentinelSessionCreateRequest",
      "example": "{\n  \"agent_id\": \"sample_id_99\",\n  \"task_objective\": \"sample_string\",\n  \"authorized_scope\": {},\n  \"auto_activate\": true\n}"
    }
  },
  {
    "path": "/api/v1/sentinel/sessions/{session_id}",
    "method": "GET",
    "summary": "Get Session",
    "description": "Retrieves task session metadata with cross-tenant isolation enforcement.",
    "tag": "SENTINEL Behavioral Security",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "session_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "SentinelSessionResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"org_id\": \"sample_id_99\",\n  \"agent_id\": \"sample_id_99\",\n  \"task_objective\": \"sample_string\",\n  \"authorized_scope\": {},\n  \"session_state\": \"sample_string\",\n  \"total_executions\": 1,\n  \"blocked_executions\": 1,\n  \"scope_violations\": 1,\n  \"suspension_reason\": {},\n  \"suspended_at\": {},\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"updated_at\": \"2026-11-16T12:00:00Z\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "get_session_api_v1_sentinel_sessions__session_id__get"
  },
  {
    "path": "/api/v1/sentinel/sessions/{session_id}/assess-objective",
    "method": "POST",
    "summary": "Assess Session Objective",
    "description": "Evaluates whether a proposed agent tool invocation aligns with the declared task objective.\nStrictly advisory: cannot independently grant permissions or override CORE denials.",
    "tag": "SENTINEL Behavioral Security",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "session_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "SentinelObjectiveAssessmentResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"session_id\": \"sample_id_99\",\n  \"org_id\": \"sample_id_99\",\n  \"tool_name\": \"sample_string\",\n  \"alignment_status\": \"sample_string\",\n  \"alignment_score\": 0.95,\n  \"severity\": \"sample_string\",\n  \"reason_codes_json\": [\n    \"sample_string\"\n  ],\n  \"evidence_json\": {},\n  \"limitations\": \"sample_string\",\n  \"created_at\": \"2026-11-16T12:00:00Z\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "assess_session_objective_api_v1_sentinel_sessions__session_id__assess_objective_post",
    "requestBody": {
      "contentType": "application/json",
      "schema": "SentinelObjectiveAssessRequest",
      "example": "{\n  \"tool_name\": \"sample_string\",\n  \"arguments\": {},\n  \"user_request\": {}\n}"
    }
  },
  {
    "path": "/api/v1/sentinel/sessions/{session_id}/contain",
    "method": "POST",
    "summary": "Enforce Containment",
    "description": "Enforces a containment measure (STEP_UP, RATE_THROTTLE, REQUIRE_APPROVAL, QUARANTINE_SUSPEND, TERMINATE).",
    "tag": "SENTINEL Behavioral Security",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "session_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "SentinelContainmentActionResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"session_id\": \"sample_id_99\",\n  \"org_id\": \"sample_id_99\",\n  \"action_type\": \"sample_string\",\n  \"trigger_reason\": \"sample_string\",\n  \"status\": \"sample_string\",\n  \"action_payload\": {},\n  \"enforced_at\": \"2026-11-16T12:00:00Z\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "enforce_containment_api_v1_sentinel_sessions__session_id__contain_post",
    "requestBody": {
      "contentType": "application/json",
      "schema": "SentinelContainmentEnforceRequest",
      "example": "{\n  \"action_type\": \"sample_string\",\n  \"trigger_reason\": \"sample_string\",\n  \"action_payload\": {}\n}"
    }
  },
  {
    "path": "/api/v1/sentinel/sessions/{session_id}/containment-history",
    "method": "GET",
    "summary": "Get Containment History",
    "description": "Returns ordered audit history of all containment actions for a task session.",
    "tag": "SENTINEL Behavioral Security",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "session_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "Response Get Containment History Api V1 Sentinel Sessions  Session Id  Containment History Get",
        "example": "[\n  {\n    \"id\": \"sample_id_99\",\n    \"session_id\": \"sample_id_99\",\n    \"org_id\": \"sample_id_99\",\n    \"action_type\": \"sample_string\",\n    \"trigger_reason\": \"sample_string\",\n    \"status\": \"sample_string\",\n    \"action_payload\": {},\n    \"enforced_at\": \"2026-11-16T12:00:00Z\"\n  }\n]"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "get_containment_history_api_v1_sentinel_sessions__session_id__containment_history_get"
  },
  {
    "path": "/api/v1/sentinel/sessions/{session_id}/events",
    "method": "GET",
    "summary": "Get Session Events",
    "description": "Lists the ordered behavioral event timeline for a session.",
    "tag": "SENTINEL Behavioral Security",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "session_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "Response Get Session Events Api V1 Sentinel Sessions  Session Id  Events Get",
        "example": "[\n  {\n    \"id\": \"sample_id_99\",\n    \"org_id\": \"sample_id_99\",\n    \"session_id\": \"sample_id_99\",\n    \"correlation_id\": \"sample_id_99\",\n    \"event_type\": \"sample_string\",\n    \"tool_name\": {},\n    \"resource_id\": {},\n    \"verdict\": {},\n    \"execution_success\": {},\n    \"execution_error\": {},\n    \"step_index\": 1,\n    \"event_payload\": {},\n    \"timestamp\": \"2026-11-16T12:00:00Z\"\n  }\n]"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "get_session_events_api_v1_sentinel_sessions__session_id__events_get"
  },
  {
    "path": "/api/v1/sentinel/sessions/{session_id}/events",
    "method": "POST",
    "summary": "Record Event",
    "description": "Ingests and redacts a behavioral telemetry event associated with a session.",
    "tag": "SENTINEL Behavioral Security",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "session_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 201,
        "description": "Successful Response",
        "schema": "SentinelEventResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"org_id\": \"sample_id_99\",\n  \"session_id\": \"sample_id_99\",\n  \"correlation_id\": \"sample_id_99\",\n  \"event_type\": \"sample_string\",\n  \"tool_name\": {},\n  \"resource_id\": {},\n  \"verdict\": {},\n  \"execution_success\": {},\n  \"execution_error\": {},\n  \"step_index\": 1,\n  \"event_payload\": {},\n  \"timestamp\": \"2026-11-16T12:00:00Z\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "record_event_api_v1_sentinel_sessions__session_id__events_post",
    "requestBody": {
      "contentType": "application/json",
      "schema": "SentinelEventCreateRequest",
      "example": "{\n  \"correlation_id\": {},\n  \"event_type\": \"sample_string\",\n  \"tool_name\": {},\n  \"resource_id\": {},\n  \"verdict\": {},\n  \"execution_success\": {},\n  \"execution_error\": {},\n  \"step_index\": 1,\n  \"event_payload\": {}\n}"
    }
  },
  {
    "path": "/api/v1/sentinel/sessions/{session_id}/objective-assessments",
    "method": "GET",
    "summary": "Get Objective Assessments",
    "description": "Returns ordered list of semantic objective alignment assessments for a task session.",
    "tag": "SENTINEL Behavioral Security",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "session_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "Response Get Objective Assessments Api V1 Sentinel Sessions  Session Id  Objective Assessments Get",
        "example": "[\n  {\n    \"id\": \"sample_id_99\",\n    \"session_id\": \"sample_id_99\",\n    \"org_id\": \"sample_id_99\",\n    \"tool_name\": \"sample_string\",\n    \"alignment_status\": \"sample_string\",\n    \"alignment_score\": 0.95,\n    \"severity\": \"sample_string\",\n    \"reason_codes_json\": [\n      \"sample_string\"\n    ],\n    \"evidence_json\": {},\n    \"limitations\": \"sample_string\",\n    \"created_at\": \"2026-11-16T12:00:00Z\"\n  }\n]"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "get_objective_assessments_api_v1_sentinel_sessions__session_id__objective_assessments_get"
  },
  {
    "path": "/api/v1/sentinel/sessions/{session_id}/resume",
    "method": "POST",
    "summary": "Resume Session",
    "description": "Resumes a suspended session back to ACTIVE.",
    "tag": "SENTINEL Behavioral Security",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "session_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "SentinelSessionResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"org_id\": \"sample_id_99\",\n  \"agent_id\": \"sample_id_99\",\n  \"task_objective\": \"sample_string\",\n  \"authorized_scope\": {},\n  \"session_state\": \"sample_string\",\n  \"total_executions\": 1,\n  \"blocked_executions\": 1,\n  \"scope_violations\": 1,\n  \"suspension_reason\": {},\n  \"suspended_at\": {},\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"updated_at\": \"2026-11-16T12:00:00Z\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "resume_session_api_v1_sentinel_sessions__session_id__resume_post"
  },
  {
    "path": "/api/v1/sentinel/sessions/{session_id}/risk",
    "method": "GET",
    "summary": "Get Session Risk",
    "description": "Computes and returns the point-in-time explainable risk assessment for a session.",
    "tag": "SENTINEL Behavioral Security",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "session_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "SentinelRiskAssessmentResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"session_id\": \"sample_id_99\",\n  \"org_id\": \"sample_id_99\",\n  \"risk_score\": 0.95,\n  \"risk_tier\": \"sample_string\",\n  \"factors_json\": [\n    {}\n  ],\n  \"created_at\": \"2026-11-16T12:00:00Z\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "get_session_risk_api_v1_sentinel_sessions__session_id__risk_get"
  },
  {
    "path": "/api/v1/sentinel/sessions/{session_id}/suspend",
    "method": "POST",
    "summary": "Suspend Session",
    "description": "Suspends an active session, blocking subsequent tool executions at the boundary.",
    "tag": "SENTINEL Behavioral Security",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "session_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "SentinelSessionResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"org_id\": \"sample_id_99\",\n  \"agent_id\": \"sample_id_99\",\n  \"task_objective\": \"sample_string\",\n  \"authorized_scope\": {},\n  \"session_state\": \"sample_string\",\n  \"total_executions\": 1,\n  \"blocked_executions\": 1,\n  \"scope_violations\": 1,\n  \"suspension_reason\": {},\n  \"suspended_at\": {},\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"updated_at\": \"2026-11-16T12:00:00Z\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "suspend_session_api_v1_sentinel_sessions__session_id__suspend_post",
    "requestBody": {
      "contentType": "application/json",
      "schema": "SentinelSessionSuspendRequest",
      "example": "{\n  \"reason\": \"sample_string\"\n}"
    }
  },
  {
    "path": "/api/v1/sentinel/sessions/{session_id}/terminate",
    "method": "POST",
    "summary": "Terminate Session",
    "description": "Permanently terminates a task session.",
    "tag": "SENTINEL Behavioral Security",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "session_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "reason",
        "type": "string",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "SentinelSessionResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"org_id\": \"sample_id_99\",\n  \"agent_id\": \"sample_id_99\",\n  \"task_objective\": \"sample_string\",\n  \"authorized_scope\": {},\n  \"session_state\": \"sample_string\",\n  \"total_executions\": 1,\n  \"blocked_executions\": 1,\n  \"scope_violations\": 1,\n  \"suspension_reason\": {},\n  \"suspended_at\": {},\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"updated_at\": \"2026-11-16T12:00:00Z\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "terminate_session_api_v1_sentinel_sessions__session_id__terminate_post"
  },
  {
    "path": "/api/v1/benchmarks",
    "method": "GET",
    "summary": "List Benchmark Runs",
    "description": "List historical benchmark runs for the authenticated organization.",
    "tag": "Security Benchmarks",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "limit",
        "type": "integer",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "offset",
        "type": "integer",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "Response List Benchmark Runs Api V1 Benchmarks Get",
        "example": "[\n  {\n    \"id\": \"sample_id_99\",\n    \"benchmark_name\": \"sample_string\",\n    \"total_attacks\": 1,\n    \"attacks_blocked\": 1,\n    \"detection_rate\": 0.95,\n    \"avg_latency_ms\": 0.95,\n    \"passed\": true,\n    \"created_at\": \"2026-11-16T12:00:00Z\",\n    \"report_metadata\": {}\n  }\n]"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "list_benchmark_runs_api_v1_benchmarks_get"
  },
  {
    "path": "/api/v1/benchmarks/latest",
    "method": "GET",
    "summary": "Get Latest Benchmark Run",
    "description": "Returns the latest benchmark run for the organization, or executes one on demand.",
    "tag": "Security Benchmarks",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "BenchmarkRunResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"benchmark_name\": \"sample_string\",\n  \"total_attacks\": 1,\n  \"attacks_blocked\": 1,\n  \"detection_rate\": 0.95,\n  \"avg_latency_ms\": 0.95,\n  \"passed\": true,\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"report_metadata\": {}\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "get_latest_benchmark_run_api_v1_benchmarks_latest_get"
  },
  {
    "path": "/api/v1/benchmarks/run",
    "method": "POST",
    "summary": "Execute Benchmark Suite",
    "description": "Executes the full 25-vector adversarial penetration and intent evasion test suite.\nRecords execution report, latency telemetry, and block rates.",
    "tag": "Security Benchmarks",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "BenchmarkRunResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"benchmark_name\": \"sample_string\",\n  \"total_attacks\": 1,\n  \"attacks_blocked\": 1,\n  \"detection_rate\": 0.95,\n  \"avg_latency_ms\": 0.95,\n  \"passed\": true,\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"report_metadata\": {}\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "execute_benchmark_suite_api_v1_benchmarks_run_post"
  },
  {
    "path": "/api/v1/benchmarks/{run_id}",
    "method": "GET",
    "summary": "Get Benchmark Run",
    "description": "Retrieve full breakdown and scenario details of a specific benchmark run.",
    "tag": "Security Benchmarks",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "run_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "BenchmarkRunResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"benchmark_name\": \"sample_string\",\n  \"total_attacks\": 1,\n  \"attacks_blocked\": 1,\n  \"detection_rate\": 0.95,\n  \"avg_latency_ms\": 0.95,\n  \"passed\": true,\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"report_metadata\": {}\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "get_benchmark_run_api_v1_benchmarks__run_id__get"
  },
  {
    "path": "/api/v1/intercept",
    "method": "POST",
    "summary": "Intercept Tool Call",
    "description": "Authoritative enforcement endpoint implementing SICTACK CORE 8-stage pipeline:\n1. Tenant & Agent Identity Verification\n2. Intent Context Resolution & Immutability Verification\n3. Permission Allow / Deny Lists\n4. Sensitivity Ceiling Enforcement\n5. Recipient / Exfiltration Boundaries\n6. Resource Scope Glob Confinement\n7. Atomic Human Approval Nonce Verification\n8. Tamper-Evident Audit Recording",
    "tag": "Security Gateway",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "InterceptResponse",
        "example": "{\n  \"verdict\": \"ALLOW\",\n  \"allowed\": true,\n  \"reason\": \"sample_string\",\n  \"decision_id\": \"sample_id_99\",\n  \"action_hash\": \"sample_string\",\n  \"risk_score\": 0.95,\n  \"risk_level\": \"LOW\",\n  \"policy_id\": {},\n  \"policy_version\": {},\n  \"approval_id\": {},\n  \"requires_approval\": true,\n  \"intent_id\": {},\n  \"session_id\": {},\n  \"trace_id\": {},\n  \"session_state\": {},\n  \"risk_tier\": {},\n  \"containment_action\": {},\n  \"execution_result\": {},\n  \"timestamp\": \"2026-11-16T12:00:00Z\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "intercept_tool_call_api_v1_intercept_post",
    "requestBody": {
      "contentType": "application/json",
      "schema": "InterceptRequest",
      "example": "{\n  \"tool_name\": \"sample_string\",\n  \"arguments\": {},\n  \"agent_id\": \"sample_id_99\",\n  \"user_request\": {},\n  \"sensitivity\": 1,\n  \"resource_id\": {},\n  \"recipient\": {},\n  \"intent_id\": {},\n  \"session_id\": {},\n  \"approval_token\": {},\n  \"approval_id\": {},\n  \"trace_id\": {},\n  \"nonce\": {}\n}"
    }
  },
  {
    "path": "/api/v1/incidents",
    "method": "GET",
    "summary": "List Incidents",
    "description": "List security incidents for the caller's tenant with optional filters.",
    "tag": "Security Incidents & Fleet Risk",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "status",
        "type": "string",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "severity",
        "type": "string",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "agent_id",
        "type": "string",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "skip",
        "type": "integer",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "limit",
        "type": "integer",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "Response List Incidents Api V1 Incidents Get",
        "example": "[\n  {\n    \"id\": \"sample_id_99\",\n    \"org_id\": \"sample_id_99\",\n    \"title\": \"sample_string\",\n    \"severity\": \"sample_string\",\n    \"status\": \"sample_string\",\n    \"trigger_rule_id\": \"sample_id_99\",\n    \"affected_agent_ids_json\": [\n      \"sample_string\"\n    ],\n    \"session_ids_json\": [\n      \"sample_string\"\n    ],\n    \"summary\": \"sample_string\",\n    \"evidence_trail_json\": [\n      {}\n    ],\n    \"containment_action_taken\": {},\n    \"created_at\": \"2026-11-16T12:00:00Z\",\n    \"updated_at\": \"2026-11-16T12:00:00Z\",\n    \"resolved_at\": {},\n    \"resolved_by\": {},\n    \"resolution_notes\": {}\n  }\n]"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "list_incidents_api_v1_incidents_get"
  },
  {
    "path": "/api/v1/incidents",
    "method": "POST",
    "summary": "Create Incident",
    "description": "Create a new managed security incident.",
    "tag": "Security Incidents & Fleet Risk",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 201,
        "description": "Successful Response",
        "schema": "SecurityIncidentResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"org_id\": \"sample_id_99\",\n  \"title\": \"sample_string\",\n  \"severity\": \"sample_string\",\n  \"status\": \"sample_string\",\n  \"trigger_rule_id\": \"sample_id_99\",\n  \"affected_agent_ids_json\": [\n    \"sample_string\"\n  ],\n  \"session_ids_json\": [\n    \"sample_string\"\n  ],\n  \"summary\": \"sample_string\",\n  \"evidence_trail_json\": [\n    {}\n  ],\n  \"containment_action_taken\": {},\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"updated_at\": \"2026-11-16T12:00:00Z\",\n  \"resolved_at\": {},\n  \"resolved_by\": {},\n  \"resolution_notes\": {}\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "create_incident_api_v1_incidents_post",
    "requestBody": {
      "contentType": "application/json",
      "schema": "SecurityIncidentCreate",
      "example": "{\n  \"title\": \"sample_string\",\n  \"trigger_rule_id\": \"sample_id_99\",\n  \"severity\": \"sample_string\",\n  \"affected_agent_ids\": [\n    \"sample_string\"\n  ],\n  \"session_ids\": [\n    \"sample_string\"\n  ],\n  \"summary\": \"sample_string\",\n  \"evidence_trail\": [\n    {}\n  ]\n}"
    }
  },
  {
    "path": "/api/v1/incidents/fleet-risk",
    "method": "GET",
    "summary": "Get Fleet Risk",
    "description": "Aggregate fleet-wide multi-agent risk and active incident intelligence.",
    "tag": "Security Incidents & Fleet Risk",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "FleetRiskResponse",
        "example": "{\n  \"org_id\": \"sample_id_99\",\n  \"fleet_risk_score\": 0.95,\n  \"monitored_agents_count\": 1,\n  \"agent_risk_scores\": {},\n  \"recent_detections_count\": 1,\n  \"timestamp\": \"sample_string\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "get_fleet_risk_api_v1_incidents_fleet_risk_get"
  },
  {
    "path": "/api/v1/incidents/{incident_id}",
    "method": "GET",
    "summary": "Get Incident",
    "description": "Retrieve details and evidence trail for a specific security incident.",
    "tag": "Security Incidents & Fleet Risk",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "incident_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "SecurityIncidentResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"org_id\": \"sample_id_99\",\n  \"title\": \"sample_string\",\n  \"severity\": \"sample_string\",\n  \"status\": \"sample_string\",\n  \"trigger_rule_id\": \"sample_id_99\",\n  \"affected_agent_ids_json\": [\n    \"sample_string\"\n  ],\n  \"session_ids_json\": [\n    \"sample_string\"\n  ],\n  \"summary\": \"sample_string\",\n  \"evidence_trail_json\": [\n    {}\n  ],\n  \"containment_action_taken\": {},\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"updated_at\": \"2026-11-16T12:00:00Z\",\n  \"resolved_at\": {},\n  \"resolved_by\": {},\n  \"resolution_notes\": {}\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "get_incident_api_v1_incidents__incident_id__get"
  },
  {
    "path": "/api/v1/incidents/{incident_id}/contain",
    "method": "POST",
    "summary": "Contain Incident",
    "description": "Enforce containment action against an active incident.",
    "tag": "Security Incidents & Fleet Risk",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "incident_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "SecurityIncidentResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"org_id\": \"sample_id_99\",\n  \"title\": \"sample_string\",\n  \"severity\": \"sample_string\",\n  \"status\": \"sample_string\",\n  \"trigger_rule_id\": \"sample_id_99\",\n  \"affected_agent_ids_json\": [\n    \"sample_string\"\n  ],\n  \"session_ids_json\": [\n    \"sample_string\"\n  ],\n  \"summary\": \"sample_string\",\n  \"evidence_trail_json\": [\n    {}\n  ],\n  \"containment_action_taken\": {},\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"updated_at\": \"2026-11-16T12:00:00Z\",\n  \"resolved_at\": {},\n  \"resolved_by\": {},\n  \"resolution_notes\": {}\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "contain_incident_api_v1_incidents__incident_id__contain_post",
    "requestBody": {
      "contentType": "application/json",
      "schema": "SecurityIncidentContainRequest",
      "example": "{\n  \"action\": \"sample_string\",\n  \"reason\": {}\n}"
    }
  },
  {
    "path": "/api/v1/incidents/{incident_id}/resolve",
    "method": "POST",
    "summary": "Resolve Incident",
    "description": "Formally resolve a security incident with operator closure notes.",
    "tag": "Security Incidents & Fleet Risk",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "incident_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "SecurityIncidentResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"org_id\": \"sample_id_99\",\n  \"title\": \"sample_string\",\n  \"severity\": \"sample_string\",\n  \"status\": \"sample_string\",\n  \"trigger_rule_id\": \"sample_id_99\",\n  \"affected_agent_ids_json\": [\n    \"sample_string\"\n  ],\n  \"session_ids_json\": [\n    \"sample_string\"\n  ],\n  \"summary\": \"sample_string\",\n  \"evidence_trail_json\": [\n    {}\n  ],\n  \"containment_action_taken\": {},\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"updated_at\": \"2026-11-16T12:00:00Z\",\n  \"resolved_at\": {},\n  \"resolved_by\": {},\n  \"resolution_notes\": {}\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "resolve_incident_api_v1_incidents__incident_id__resolve_post",
    "requestBody": {
      "contentType": "application/json",
      "schema": "SecurityIncidentResolveRequest",
      "example": "{\n  \"resolved_by\": \"sample_string\",\n  \"notes\": \"sample_string\"\n}"
    }
  },
  {
    "path": "/",
    "method": "GET",
    "summary": "Root",
    "description": "Root info endpoint redirecting users to interactive Swagger documentation.",
    "tag": "System & Health",
    "auth": "Public",
    "requiredRole": "None",
    "headers": [],
    "parameters": [],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "object"
      }
    ],
    "operationId": "root__get"
  },
  {
    "path": "/health",
    "method": "GET",
    "summary": "Health Check",
    "description": "Health check endpoint for container orchestrators and monitoring.",
    "tag": "System & Health",
    "auth": "Public",
    "requiredRole": "None",
    "headers": [],
    "parameters": [],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "object"
      }
    ],
    "operationId": "health_check_health_get"
  },
  {
    "path": "/api/v1/threats",
    "method": "GET",
    "summary": "List Threats",
    "description": "List detected security threat events within the tenant's organization.",
    "tag": "Threat Intelligence",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "status",
        "type": "string",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "severity",
        "type": "string",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "agent_id",
        "type": "string",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "limit",
        "type": "integer",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "offset",
        "type": "integer",
        "required": false,
        "description": "",
        "location": "query"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "Response List Threats Api V1 Threats Get",
        "example": "[\n  {\n    \"id\": \"sample_id_99\",\n    \"org_id\": \"sample_id_99\",\n    \"agent_id\": \"sample_id_99\",\n    \"threat_category\": \"sample_string\",\n    \"severity\": \"sample_string\",\n    \"description\": \"sample_string\",\n    \"detection_rule\": \"sample_string\",\n    \"related_trace_id\": {},\n    \"recommended_response\": \"sample_string\",\n    \"mitigation_status\": \"sample_string\",\n    \"created_at\": \"2026-11-16T12:00:00Z\"\n  }\n]"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "list_threats_api_v1_threats_get"
  },
  {
    "path": "/api/v1/threats/stats",
    "method": "GET",
    "summary": "Get Threat Stats",
    "description": "Aggregates threat statistics across the organization for SecOps visibility.",
    "tag": "Threat Intelligence",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "ThreatStatsResponse",
        "example": "{\n  \"total_threats\": 1,\n  \"active_threats\": 1,\n  \"critical_threats\": 1,\n  \"high_threats\": 1,\n  \"categories\": {}\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "get_threat_stats_api_v1_threats_stats_get"
  },
  {
    "path": "/api/v1/threats/{threat_id}/mitigate",
    "method": "POST",
    "summary": "Mitigate Threat",
    "description": "Updates mitigation status for a detected threat (e.g. MITIGATED or DISMISSED).",
    "tag": "Threat Intelligence",
    "auth": "API Key",
    "requiredRole": "Machine (API Key) or User (ADMIN, APPROVER, VIEWER)",
    "headers": [
      {
        "name": "X-API-Key",
        "type": "string",
        "required": true,
        "description": "Secret API key (ilk_live_...) for machine authentication",
        "location": "header"
      }
    ],
    "parameters": [
      {
        "name": "threat_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      },
      {
        "name": "authorization",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      },
      {
        "name": "X-API-Key",
        "type": "string",
        "required": false,
        "description": "",
        "location": "header"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "SecurityThreatResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"org_id\": \"sample_id_99\",\n  \"agent_id\": \"sample_id_99\",\n  \"threat_category\": \"sample_string\",\n  \"severity\": \"sample_string\",\n  \"description\": \"sample_string\",\n  \"detection_rule\": \"sample_string\",\n  \"related_trace_id\": {},\n  \"recommended_response\": \"sample_string\",\n  \"mitigation_status\": \"sample_string\",\n  \"created_at\": \"2026-11-16T12:00:00Z\"\n}"
      },
      {
        "status": 422,
        "description": "Validation Error",
        "schema": "HTTPValidationError",
        "example": "{\n  \"detail\": [\n    {\n      \"loc\": {},\n      \"msg\": {},\n      \"type\": {},\n      \"input\": {},\n      \"ctx\": {}\n    }\n  ]\n}"
      }
    ],
    "operationId": "mitigate_threat_api_v1_threats__threat_id__mitigate_post",
    "requestBody": {
      "contentType": "application/json",
      "schema": "ThreatMitigateRequest",
      "example": "{\n  \"status\": \"sample_string\",\n  \"note\": {}\n}"
    }
  }
];

export const API_TAG_GROUPS: string[] = Array.from(
  new Set(API_ENDPOINTS.map((ep) => ep.tag))
);
