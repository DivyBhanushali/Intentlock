// INTENTLOCK 2.0 – Auto-Generated OpenAPI Endpoint Reference Catalog
// Generated deterministically from FastAPI application and OpenAPI 3.1.0 specification.
// Total Operations: 48

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
    "description": "List all registered AI agents.",
    "tag": "Agents",
    "auth": "Public",
    "requiredRole": "None",
    "headers": [],
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
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "Response List Agents Api V1 Agents Get",
        "example": "[\n  {\n    \"id\": \"sample_id_99\",\n    \"name\": \"sample_string\",\n    \"description\": \"sample_string\",\n    \"policy_id\": {},\n    \"created_at\": \"2026-11-16T12:00:00Z\",\n    \"last_active_at\": \"2026-11-16T12:00:00Z\"\n  }\n]"
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
    "auth": "Public",
    "requiredRole": "None",
    "headers": [],
    "parameters": [],
    "responses": [
      {
        "status": 201,
        "description": "Successful Response",
        "schema": "AgentResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"name\": \"sample_string\",\n  \"description\": \"sample_string\",\n  \"policy_id\": {},\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"last_active_at\": \"2026-11-16T12:00:00Z\"\n}"
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
    "path": "/api/v1/agents/{agent_id}",
    "method": "GET",
    "summary": "Get Agent",
    "description": "Retrieve details for a specific registered agent.",
    "tag": "Agents",
    "auth": "Public",
    "requiredRole": "None",
    "headers": [],
    "parameters": [
      {
        "name": "agent_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "AgentResponse",
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"name\": \"sample_string\",\n  \"description\": \"sample_string\",\n  \"policy_id\": {},\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"last_active_at\": \"2026-11-16T12:00:00Z\"\n}"
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
    "path": "/api/v1/approvals",
    "method": "GET",
    "summary": "List Approvals",
    "description": "List approval requests with optional status filtering.",
    "tag": "Approvals",
    "auth": "Public",
    "requiredRole": "None",
    "headers": [],
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
    "auth": "Public",
    "requiredRole": "None",
    "headers": [],
    "parameters": [
      {
        "name": "approval_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
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
    "auth": "Public",
    "requiredRole": "None",
    "headers": [],
    "parameters": [
      {
        "name": "approval_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
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
    "auth": "Public",
    "requiredRole": "None",
    "headers": [],
    "parameters": [
      {
        "name": "approval_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
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
    "path": "/api/v1/audit/events",
    "method": "GET",
    "summary": "List Audit Events",
    "description": "Query the security audit trail with multi-field filtering.",
    "tag": "Audit",
    "auth": "Public",
    "requiredRole": "None",
    "headers": [],
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
    "auth": "Public",
    "requiredRole": "None",
    "headers": [],
    "parameters": [
      {
        "name": "event_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
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
    "auth": "Public",
    "requiredRole": "None",
    "headers": [],
    "parameters": [],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "AuditStatsResponse",
        "example": "{\n  \"total_events\": 1,\n  \"allowed_count\": 1,\n  \"denied_count\": 1,\n  \"require_approval_count\": 1,\n  \"active_agents_count\": 1\n}"
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
        "example": "[\n  {\n    \"name\": \"sample_string\",\n    \"description\": \"sample_string\",\n    \"allowed_permissions\": [\n      \"sample_string\"\n    ],\n    \"denied_permissions\": [\n      \"sample_string\"\n    ],\n    \"require_approval_permissions\": [\n      \"sample_string\"\n    ],\n    \"allowed_resources\": [\n      \"sample_string\"\n    ],\n    \"allowed_recipients\": [\n      \"sample_string\"\n    ],\n    \"max_risk_level\": \"LOW\",\n    \"max_sensitivity\": 1,\n    \"id\": \"sample_id_99\",\n    \"created_at\": \"2026-11-16T12:00:00Z\",\n    \"updated_at\": \"2026-11-16T12:00:00Z\"\n  }\n]"
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
        "example": "{\n  \"name\": \"sample_string\",\n  \"description\": \"sample_string\",\n  \"allowed_permissions\": [\n    \"sample_string\"\n  ],\n  \"denied_permissions\": [\n    \"sample_string\"\n  ],\n  \"require_approval_permissions\": [\n    \"sample_string\"\n  ],\n  \"allowed_resources\": [\n    \"sample_string\"\n  ],\n  \"allowed_recipients\": [\n    \"sample_string\"\n  ],\n  \"max_risk_level\": \"LOW\",\n  \"max_sensitivity\": 1,\n  \"id\": \"sample_id_99\",\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"updated_at\": \"2026-11-16T12:00:00Z\"\n}"
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
      "example": "{\n  \"name\": \"sample_string\",\n  \"description\": \"sample_string\",\n  \"allowed_permissions\": [\n    \"sample_string\"\n  ],\n  \"denied_permissions\": [\n    \"sample_string\"\n  ],\n  \"require_approval_permissions\": [\n    \"sample_string\"\n  ],\n  \"allowed_resources\": [\n    \"sample_string\"\n  ],\n  \"allowed_recipients\": [\n    \"sample_string\"\n  ],\n  \"max_risk_level\": \"LOW\",\n  \"max_sensitivity\": 1\n}"
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
        "example": "{\n  \"name\": \"sample_string\",\n  \"description\": \"sample_string\",\n  \"allowed_permissions\": [\n    \"sample_string\"\n  ],\n  \"denied_permissions\": [\n    \"sample_string\"\n  ],\n  \"require_approval_permissions\": [\n    \"sample_string\"\n  ],\n  \"allowed_resources\": [\n    \"sample_string\"\n  ],\n  \"allowed_recipients\": [\n    \"sample_string\"\n  ],\n  \"max_risk_level\": \"LOW\",\n  \"max_sensitivity\": 1,\n  \"id\": \"sample_id_99\",\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"updated_at\": \"2026-11-16T12:00:00Z\"\n}"
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
    "description": "Dry-run simulation mode.\nTests a hypothetical tool execution against a policy or policy draft without executing the real tool.",
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
    "auth": "Public",
    "requiredRole": "None",
    "headers": [],
    "parameters": [
      {
        "name": "policy_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
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
    "auth": "Public",
    "requiredRole": "None",
    "headers": [],
    "parameters": [
      {
        "name": "policy_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
      }
    ],
    "responses": [
      {
        "status": 200,
        "description": "Successful Response",
        "schema": "PolicyResponse",
        "example": "{\n  \"name\": \"sample_string\",\n  \"description\": \"sample_string\",\n  \"allowed_permissions\": [\n    \"sample_string\"\n  ],\n  \"denied_permissions\": [\n    \"sample_string\"\n  ],\n  \"require_approval_permissions\": [\n    \"sample_string\"\n  ],\n  \"allowed_resources\": [\n    \"sample_string\"\n  ],\n  \"allowed_recipients\": [\n    \"sample_string\"\n  ],\n  \"max_risk_level\": \"LOW\",\n  \"max_sensitivity\": 1,\n  \"id\": \"sample_id_99\",\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"updated_at\": \"2026-11-16T12:00:00Z\"\n}"
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
        "example": "{\n  \"name\": \"sample_string\",\n  \"description\": \"sample_string\",\n  \"allowed_permissions\": [\n    \"sample_string\"\n  ],\n  \"denied_permissions\": [\n    \"sample_string\"\n  ],\n  \"require_approval_permissions\": [\n    \"sample_string\"\n  ],\n  \"allowed_resources\": [\n    \"sample_string\"\n  ],\n  \"allowed_recipients\": [\n    \"sample_string\"\n  ],\n  \"max_risk_level\": \"LOW\",\n  \"max_sensitivity\": 1,\n  \"id\": \"sample_id_99\",\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"updated_at\": \"2026-11-16T12:00:00Z\"\n}"
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
      "example": "{\n  \"name\": {},\n  \"description\": {},\n  \"allowed_permissions\": {},\n  \"denied_permissions\": {},\n  \"require_approval_permissions\": {},\n  \"allowed_resources\": {},\n  \"allowed_recipients\": {},\n  \"max_risk_level\": {},\n  \"max_sensitivity\": {}\n}"
    }
  },
  {
    "path": "/api/v1/policies/{policy_id}/conflicts",
    "method": "GET",
    "summary": "Detect Policy Conflicts",
    "description": "Detect conflicting policy rules:\n- Same permission in allowed and denied lists\n- Same permission in require_approval and denied lists\n- Zero permissions allowed (unusable dead policy)\n- Sensitivity ceiling set to 0 while requesting sensitive permissions",
    "tag": "Policies",
    "auth": "Public",
    "requiredRole": "None",
    "headers": [],
    "parameters": [
      {
        "name": "policy_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
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
        "example": "{\n  \"name\": \"sample_string\",\n  \"description\": \"sample_string\",\n  \"allowed_permissions\": [\n    \"sample_string\"\n  ],\n  \"denied_permissions\": [\n    \"sample_string\"\n  ],\n  \"require_approval_permissions\": [\n    \"sample_string\"\n  ],\n  \"allowed_resources\": [\n    \"sample_string\"\n  ],\n  \"allowed_recipients\": [\n    \"sample_string\"\n  ],\n  \"max_risk_level\": \"LOW\",\n  \"max_sensitivity\": 1,\n  \"id\": \"sample_id_99\",\n  \"created_at\": \"2026-11-16T12:00:00Z\",\n  \"updated_at\": \"2026-11-16T12:00:00Z\"\n}"
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
    "auth": "Public",
    "requiredRole": "None",
    "headers": [],
    "parameters": [
      {
        "name": "policy_id",
        "type": "string",
        "required": true,
        "description": "",
        "location": "path"
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
        "example": "[\n  {\n    \"id\": \"sample_id_99\",\n    \"org_id\": \"sample_id_99\",\n    \"total_scenarios\": 1,\n    \"passed_scenarios\": 1,\n    \"failed_scenarios\": 1,\n    \"block_rate\": 0.95,\n    \"average_latency_ms\": 0.95,\n    \"report_json\": {},\n    \"created_at\": \"2026-11-16T12:00:00Z\"\n  }\n]"
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
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"org_id\": \"sample_id_99\",\n  \"total_scenarios\": 1,\n  \"passed_scenarios\": 1,\n  \"failed_scenarios\": 1,\n  \"block_rate\": 0.95,\n  \"average_latency_ms\": 0.95,\n  \"report_json\": {},\n  \"created_at\": \"2026-11-16T12:00:00Z\"\n}"
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
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"org_id\": \"sample_id_99\",\n  \"total_scenarios\": 1,\n  \"passed_scenarios\": 1,\n  \"failed_scenarios\": 1,\n  \"block_rate\": 0.95,\n  \"average_latency_ms\": 0.95,\n  \"report_json\": {},\n  \"created_at\": \"2026-11-16T12:00:00Z\"\n}"
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
        "example": "{\n  \"id\": \"sample_id_99\",\n  \"org_id\": \"sample_id_99\",\n  \"total_scenarios\": 1,\n  \"passed_scenarios\": 1,\n  \"failed_scenarios\": 1,\n  \"block_rate\": 0.95,\n  \"average_latency_ms\": 0.95,\n  \"report_json\": {},\n  \"created_at\": \"2026-11-16T12:00:00Z\"\n}"
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
    "description": "Authoritative enforcement endpoint implementing INTENTLOCK 2.0 8-stage pipeline:\n1. Tenant & Agent Identity Verification\n2. Intent Context Resolution & Immutability Verification\n3. Permission Allow / Deny Lists\n4. Sensitivity Ceiling Enforcement\n5. Recipient / Exfiltration Boundaries\n6. Resource Scope Glob Confinement\n7. Atomic Human Approval Nonce Verification\n8. Tamper-Evident Audit Recording",
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
        "example": "{\n  \"verdict\": \"ALLOW\",\n  \"allowed\": true,\n  \"reason\": \"sample_string\",\n  \"decision_id\": \"sample_id_99\",\n  \"action_hash\": \"sample_string\",\n  \"risk_score\": 0.95,\n  \"risk_level\": \"LOW\",\n  \"approval_id\": {},\n  \"intent_id\": {},\n  \"trace_id\": {},\n  \"policy_version\": 1,\n  \"execution_result\": {}\n}"
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
      "example": "{\n  \"agent_id\": \"sample_id_99\",\n  \"tool_name\": \"sample_string\",\n  \"arguments\": {},\n  \"user_request\": \"sample_string\",\n  \"sensitivity\": 1,\n  \"resource_id\": \"sample_id_99\",\n  \"recipient\": \"sample_string\",\n  \"approval_id\": {},\n  \"intent_id\": {},\n  \"trace_id\": {}\n}"
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
