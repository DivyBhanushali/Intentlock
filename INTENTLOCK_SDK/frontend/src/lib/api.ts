// INTENTLOCK – API client for communicating with the FastAPI backend.

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://intentlock-backend-ze2i.onrender.com/api/v1";

// ─── Types ───

export type RiskLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type DecisionVerdict = "ALLOW" | "DENY" | "REQUIRE_APPROVAL";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";

export interface Policy {
  id: string;
  name: string;
  description: string;
  allowed_permissions: string[];
  denied_permissions: string[];
  require_approval_permissions: string[];
  allowed_resources: string[];
  allowed_recipients: string[];
  max_risk_level: RiskLevel;
  max_sensitivity: number;
  created_at: string;
  updated_at: string;
}

export interface PolicyCreate {
  name: string;
  description?: string;
  allowed_permissions?: string[];
  denied_permissions?: string[];
  require_approval_permissions?: string[];
  allowed_resources?: string[];
  allowed_recipients?: string[];
  max_risk_level?: RiskLevel;
  max_sensitivity?: number;
}

export interface Approval {
  id: string;
  action_hash: string;
  tool_name: string;
  agent_id: string;
  status: ApprovalStatus;
  created_at: string;
  expires_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  consumed: boolean;
  arguments_json: Record<string, unknown>;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  agent_id: string | null;
  tool_name: string | null;
  verdict: DecisionVerdict;
  reason: string;
  policy_id: string | null;
  action_hash: string | null;
  approval_id: string | null;
  risk_score: number;
  execution_success: boolean | null;
  execution_error: string | null;
  metadata_json: Record<string, unknown>;
}

export interface AuditStats {
  total_events: number;
  allowed_count: number;
  denied_count: number;
  require_approval_count: number;
  active_agents_count: number;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  policy_id: string | null;
  created_at: string;
  last_active_at: string;
}

export interface AgentCreate {
  id: string;
  name: string;
  description?: string;
  policy_id?: string;
}

export interface InterceptRequest {
  agent_id?: string;
  tool_name: string;
  arguments?: Record<string, unknown>;
  user_request?: string;
  sensitivity?: number;
  resource_id?: string;
  recipient?: string;
  approval_id?: string;
}

export interface InterceptResponse {
  verdict: DecisionVerdict;
  allowed: boolean;
  reason: string;
  decision_id: string;
  action_hash: string;
  risk_score: number;
  risk_level: RiskLevel;
  approval_id: string | null;
  execution_result: unknown;
}

// ─── Fetch helper ───

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const token = typeof window !== "undefined" ? localStorage.getItem("intentlock_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string>),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

// ─── Policies ───

export const policiesApi = {
  list: () => apiFetch<Policy[]>("/policies"),
  get: (id: string) => apiFetch<Policy>(`/policies/${id}`),
  create: (data: PolicyCreate) =>
    apiFetch<Policy>("/policies", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<PolicyCreate>) =>
    apiFetch<Policy>(`/policies/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    apiFetch<void>(`/policies/${id}`, { method: "DELETE" }),
};

// ─── Approvals ───

export const approvalsApi = {
  list: () => apiFetch<Approval[]>("/approvals"),
  approve: (id: string, approver_id = "admin@company.com", notes?: string) =>
    apiFetch<Approval>(`/approvals/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ approver_id, notes }),
    }),
  reject: (id: string, approver_id = "admin@company.com", notes?: string) =>
    apiFetch<Approval>(`/approvals/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ approver_id, notes }),
    }),
};

// ─── Audit ───

export const auditApi = {
  list: (params?: { agent_id?: string; tool_name?: string; verdict?: string; limit?: number }) => {
    const sp = new URLSearchParams();
    if (params?.agent_id) sp.set("agent_id", params.agent_id);
    if (params?.tool_name) sp.set("tool_name", params.tool_name);
    if (params?.verdict) sp.set("verdict", params.verdict);
    if (params?.limit) sp.set("limit", String(params.limit));
    const qs = sp.toString();
    return apiFetch<AuditEvent[]>(`/audit/events${qs ? `?${qs}` : ""}`);
  },
  get: (id: string) => apiFetch<AuditEvent>(`/audit/events/${id}`),
  stats: () => apiFetch<AuditStats>("/audit/stats"),
};

// ─── Agents ───

export const agentsApi = {
  list: () => apiFetch<Agent[]>("/agents"),
  get: (id: string) => apiFetch<Agent>(`/agents/${id}`),
  create: (data: AgentCreate) =>
    apiFetch<Agent>("/agents", { method: "POST", body: JSON.stringify(data) }),
};

// ─── Intercept ───

export const interceptApi = {
  evaluate: (data: InterceptRequest) =>
    apiFetch<InterceptResponse>("/intercept", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ─── Team & API Keys Management ───

export type UserRole = "ADMIN" | "APPROVER" | "VIEWER";

export interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  org_id: string;
  created_at: string;
  last_login_at: string | null;
}

export interface MemberInvite {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
}

export interface MemberUpdate {
  role?: UserRole;
  full_name?: string;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  raw_key?: string;
}

export interface ApiKeyCreate {
  name: string;
}

export const teamApi = {
  listMembers: () => apiFetch<TeamMember[]>("/auth/members"),
  inviteMember: (data: MemberInvite) =>
    apiFetch<TeamMember>("/auth/members", { method: "POST", body: JSON.stringify(data) }),
  updateMember: (id: string, data: MemberUpdate) =>
    apiFetch<TeamMember>(`/auth/members/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  removeMember: (id: string) =>
    apiFetch<void>(`/auth/members/${id}`, { method: "DELETE" }),
  listApiKeys: () => apiFetch<ApiKeyItem[]>("/auth/api-keys"),
  createApiKey: (data: ApiKeyCreate) =>
    apiFetch<ApiKeyItem>("/auth/api-keys", { method: "POST", body: JSON.stringify(data) }),
  revokeApiKey: (id: string) =>
    apiFetch<void>(`/auth/api-keys/${id}`, { method: "DELETE" }),
};

// ─── Intent Authorization Context ───

export interface IntentContext {
  id: string;
  org_id: string;
  agent_id: string;
  user_id: string;
  authorized_objective: string;
  allowed_actions: string[];
  denied_actions: string[];
  allowed_permissions: string[];
  allowed_resources: string[];
  allowed_recipients: string[];
  sensitivity_ceiling: number;
  execution_scope: string;
  expiration_timestamp: string;
  context_status: "ACTIVE" | "REVOKED" | "EXPIRED" | "CONSUMED";
  authorization_version: number;
  created_at: string;
  revocation_reason?: string;
}

export interface IntentCreate {
  agent_id: string;
  authorized_objective: string;
  allowed_actions?: string[];
  denied_actions?: string[];
  allowed_permissions?: string[];
  allowed_resources?: string[];
  allowed_recipients?: string[];
  sensitivity_ceiling?: number;
  execution_scope?: string;
  duration_seconds?: number;
}

export const intentsApi = {
  list: (status?: string) =>
    apiFetch<IntentContext[]>(`/intents${status ? `?status=${status}` : ""}`),
  get: (id: string) => apiFetch<IntentContext>(`/intents/${id}`),
  create: (data: IntentCreate) =>
    apiFetch<IntentContext>("/intents", { method: "POST", body: JSON.stringify(data) }),
  revoke: (id: string, reason: string) =>
    apiFetch<IntentContext>(`/intents/${id}/revoke`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
};

// ─── Provenance & Evidence Graph ───

export interface TraceSummary {
  trace_id: string;
  agent_id: string;
  event_count: number;
  start_time: string;
  last_time: string;
  tools_called: string[];
  verdicts: string[];
  intent_id?: string;
}

export interface ProvenanceNode {
  type: string;
  id: string;
  label: string;
  details: Record<string, unknown>;
  timestamp?: string;
}

export interface ProvenanceEdge {
  from_id: string;
  to_id: string;
  relationship: string;
}

export interface ProvenanceDetail {
  trace_id: string;
  org_id: string;
  agent_id: string;
  intent_context: IntentContext | null;
  causal_explanation: string;
  nodes: ProvenanceNode[];
  edges: ProvenanceEdge[];
  raw_events: AuditEvent[];
}

export const provenanceApi = {
  listTraces: (limit = 50) =>
    apiFetch<TraceSummary[]>(`/provenance?limit=${limit}`),
  getDetail: (traceId: string) =>
    apiFetch<ProvenanceDetail>(`/provenance/${traceId}`),
};

// ─── Threat Intelligence & Mitigation ───

export interface SecurityThreat {
  id: string;
  org_id: string;
  agent_id: string;
  threat_category: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  detection_rule: string;
  related_trace_id?: string;
  recommended_response: string;
  mitigation_status: "ACTIVE" | "MITIGATED" | "DISMISSED";
  created_at: string;
}

export interface ThreatStats {
  total_threats: number;
  active_threats: number;
  critical_threats: number;
  high_threats: number;
  categories: Record<string, number>;
}

export const threatsApi = {
  list: (status?: string, severity?: string) => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (severity) params.append("severity", severity);
    const qs = params.toString();
    return apiFetch<SecurityThreat[]>(`/threats${qs ? `?${qs}` : ""}`);
  },
  stats: () => apiFetch<ThreatStats>("/threats/stats"),
  mitigate: (threatId: string, status: "MITIGATED" | "DISMISSED", note?: string) =>
    apiFetch<SecurityThreat>(`/threats/${threatId}/mitigate`, {
      method: "POST",
      body: JSON.stringify({ status, note }),
    }),
};

// ─── Adversarial Benchmark ───

export interface BenchmarkScenario {
  vector_id: string;
  name: string;
  category: string;
  attack_payload: string;
  expected_verdict: string;
  actual_verdict: string;
  status: "PASSED" | "FAILED";
  latency_ms: number;
  mitigation_layer: string;
}

export interface BenchmarkRun {
  id: string;
  org_id: string;
  total_scenarios: number;
  passed_scenarios: number;
  failed_scenarios: number;
  block_rate: number;
  average_latency_ms: number;
  report_json: {
    total_scenarios: number;
    passed_scenarios: number;
    failed_scenarios: number;
    block_rate: number;
    average_latency_ms: number;
    scenarios: BenchmarkScenario[];
    duration_ms: number;
    timestamp: string;
  };
  created_at: string;
}

export const benchmarksApi = {
  run: () => apiFetch<BenchmarkRun>("/benchmarks/run", { method: "POST" }),
  getLatest: () => apiFetch<BenchmarkRun>("/benchmarks/latest"),
  list: () => apiFetch<BenchmarkRun[]>("/benchmarks"),
  get: (id: string) => apiFetch<BenchmarkRun>(`/benchmarks/${id}`),
};

// ─── Cryptographic Audit Verification ───

export interface AuditVerifyReport {
  verified: boolean;
  total_records: number;
  valid_records: number;
  corrupted_records: number;
  first_corrupted_id: string | null;
  details: string;
}

export const auditVerifyApi = {
  verify: () => apiFetch<AuditVerifyReport>("/audit/verify"),
};



