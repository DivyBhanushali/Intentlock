// SICTACK – API client for communicating with the FastAPI backend.

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
  intent_id?: string | null;
  trace_id?: string | null;
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
  parent_agent_id?: string | null;
  role?: string;
  max_delegation_depth?: number;
  created_at: string;
  last_active_at: string;
}

export interface DelegationCreateRequest {
  child_agent_id: string;
  allowed_capabilities: string[];
  allocated_budget?: number;
  ttl_seconds?: number;
}

export interface DelegationRevokeRequest {
  revocation_reason?: string;
}

export interface DelegationResponse {
  delegation_id: string;
  parent_agent_id: string;
  child_agent_id: string;
  allowed_capabilities: string[];
  allocated_budget: number;
  consumed_budget: number;
  depth: number;
  is_revoked: boolean;
  expires_at: string | null;
  created_at: string;
  signature: string;
}

export interface AgentHierarchyNode {
  agent_id: string;
  name: string;
  role: string;
  parent_agent_id: string | null;
  max_delegation_depth: number;
  children: AgentHierarchyNode[];
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
  const token = typeof window !== "undefined"
    ? (localStorage.getItem("sictack_token") || localStorage.getItem("intentlock_token"))
    : null;
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
    if (res.status === 401 && typeof window !== "undefined") {
      // Clear invalid or expired session credentials to prevent zombie loops
      localStorage.removeItem("sictack_token");
      localStorage.removeItem("sictack_user");
      localStorage.removeItem("intentlock_token");
      localStorage.removeItem("intentlock_user");

      // Notify auth context to update React state across components and tabs
      window.dispatchEvent(new Event("sictack:auth-expired"));
      window.dispatchEvent(new Event("intentlock:auth-expired"));
    }
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
  onboard: (req: { agent_id: string; name: string; description?: string; template_key?: string; policy_id?: string; environment?: string; tools?: string[] }) =>
    apiFetch<{ agent: Agent; policy: Policy; api_key?: string }>("/agents/onboard", { method: "POST", body: JSON.stringify(req) }),
  getDiagnostics: (agentId: string) =>
    apiFetch<AgentDiagnostics>(`/agents/${agentId}/diagnostics`),
  createDelegation: (agentId: string, data: DelegationCreateRequest) =>
    apiFetch<DelegationResponse>(`/agents/${agentId}/delegations`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  listDelegations: (agentId: string) =>
    apiFetch<DelegationResponse[]>(`/agents/${agentId}/delegations`),
  revokeDelegation: (delegationId: string, reason?: string) =>
    apiFetch<DelegationResponse>(`/agents/delegations/${delegationId}/revoke`, {
      method: "POST",
      body: JSON.stringify({ revocation_reason: reason || "Admin revocation via API" }),
    }),
  getHierarchy: (agentId: string) =>
    apiFetch<AgentHierarchyNode>(`/agents/${agentId}/hierarchy`),
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

// ─── Enterprise Administration & Entitlements (Phase 5A) ───

export interface EnterpriseOverview {
  organization: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    status: string;
    created_at: string;
  };
  entitlements: {
    plan: string;
    max_agents: number;
    active_agents: number;
    max_monthly_actions: number;
    consumed_monthly_actions: number;
    utilization_pct: number;
    rate_limit_per_minute: number;
    within_limits: boolean;
  };
  security_posture: {
    active_keys_count: number;
    active_incidents_count: number;
    total_members: number;
  };
}

export interface KeyRotationResponse {
  message: string;
  old_key_id: string;
  old_key_expires_at: string;
  new_key_id: string;
  new_key_prefix: string;
  new_secret_key: string;
  name: string;
}

export const enterpriseApi = {
  getOverview: () => apiFetch<EnterpriseOverview>("/enterprise/overview"),
  getOrganization: () => apiFetch<Record<string, unknown>>("/enterprise/organization"),
  updateOrganization: (data: Record<string, unknown>) =>
    apiFetch<Record<string, unknown>>("/enterprise/organization", { method: "PATCH", body: JSON.stringify(data) }),
  rotateApiKey: (keyId: string, gracePeriodHours: number = 24) =>
    apiFetch<KeyRotationResponse>("/enterprise/keys/rotate", {
      method: "POST",
      body: JSON.stringify({ key_id: keyId, grace_period_hours: gracePeriodHours }),
    }),
  getEntitlements: () => apiFetch<Record<string, unknown>>("/enterprise/entitlements"),
  assignAgentOwnership: (agentId: string, data: { owner_user_id?: string; policy_id?: string; status?: string }) =>
    apiFetch<Record<string, unknown>>(`/enterprise/agents/${agentId}/ownership`, { method: "POST", body: JSON.stringify(data) }),
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
  listRecords: (params?: { agent_id?: string; session_id?: string; trust_level?: string; limit?: number }) => {
    const p = new URLSearchParams();
    if (params?.agent_id) p.set("agent_id", params.agent_id);
    if (params?.session_id) p.set("session_id", params.session_id);
    if (params?.trust_level) p.set("trust_level", params.trust_level);
    if (params?.limit) p.set("limit", String(params.limit));
    const qs = p.toString();
    return apiFetch<DataProvenanceItem[]>(`/provenance/records${qs ? `?${qs}` : ""}`);
  },
  getRecord: (id: string) =>
    apiFetch<DataProvenanceItem>(`/provenance/records/${id}`),
  getLineage: (id: string, maxDepth: number = 15) =>
    apiFetch<ProvenanceLineageNodeItem>(`/provenance/records/${id}/lineage?max_depth=${maxDepth}`),
  verifyTrust: (req: { claimed_trust_level: string; parent_provenance_ids: string[]; is_authoritative_component?: boolean }) =>
    apiFetch<TrustVerificationResult>("/provenance/verify-trust", {
      method: "POST",
      body: JSON.stringify(req),
    }),
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

// ─── SENTINEL Behavioral Intelligence & Containment ───

export interface SentinelSession {
  id: string;
  org_id: string;
  agent_id: string;
  task_objective: string;
  authorized_scope: {
    allowed_tools?: string[];
    allowed_resources?: string[];
    max_steps?: number;
    max_execution_time_seconds?: number;
  };
  session_state: "ACTIVE" | "SUSPENDED" | "COMPLETED" | "QUARANTINED" | "TERMINATED";
  parent_session_id?: string | null;
  delegation_id?: string | null;
  total_executions: number;
  blocked_executions: number;
  scope_violations: number;
  suspension_reason: string | null;
  suspended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RiskFactor {
  rule_id: string;
  factor_name: string;
  weight: number;
  raw_score: number;
  description: string;
}

export interface SentinelRiskAssessment {
  id: string;
  session_id: string;
  org_id: string;
  risk_score: number;
  risk_tier: "TIER_0" | "TIER_1" | "TIER_2" | "TIER_3";
  factors_json: {
    factors?: RiskFactor[];
    summary?: string;
  };
  created_at: string;
}

export interface SentinelContainmentAction {
  id: string;
  session_id: string;
  org_id: string;
  action_type: "STEP_UP_MONITORING" | "RATE_THROTTLE" | "REQUIRE_APPROVAL" | "QUARANTINE_SUSPEND" | "TERMINATE";
  trigger_reason: string;
  status: "ENFORCED" | "PENDING" | "FAILED";
  action_payload: Record<string, unknown>;
  enforced_at: string;
}

export const sentinelApi = {
  listSessions: (status?: string) => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    const qs = params.toString();
    return apiFetch<SentinelSession[]>(`/sentinel/sessions${qs ? `?${qs}` : ""}`);
  },
  getSession: (sessionId: string) =>
    apiFetch<SentinelSession>(`/sentinel/sessions/${sessionId}`),
  getRisk: (sessionId: string) =>
    apiFetch<SentinelRiskAssessment>(`/sentinel/sessions/${sessionId}/risk`),
  enforceContainment: (
    sessionId: string,
    req: { action_type: string; trigger_reason: string; action_payload?: Record<string, unknown> }
  ) =>
    apiFetch<SentinelContainmentAction>(`/sentinel/sessions/${sessionId}/contain`, {
      method: "POST",
      body: JSON.stringify(req),
    }),
  getContainmentHistory: (sessionId: string) =>
    apiFetch<SentinelContainmentAction[]>(`/sentinel/sessions/${sessionId}/containment-history`),
  getObjectiveAssessments: (sessionId: string) =>
    apiFetch<SentinelObjectiveAssessment[]>(`/sentinel/sessions/${sessionId}/objective-assessments`),
  assessObjective: (
    sessionId: string,
    req: { tool_name: string; arguments?: Record<string, unknown>; user_request?: string }
  ) =>
    apiFetch<SentinelObjectiveAssessment>(`/sentinel/sessions/${sessionId}/assess-objective`, {
      method: "POST",
      body: JSON.stringify(req),
    }),
};

export interface SentinelObjectiveAssessment {
  id: string;
  session_id: string;
  org_id: string;
  tool_name: string;
  alignment_status: string;
  alignment_score: number;
  severity: string;
  reason_codes_json: string[];
  evidence_json: Record<string, unknown>;
  limitations: string;
  created_at: string;
}

export interface AgentDiagnostics {
  agent_id: string;
  org_id: string;
  status: string;
  policy_id?: string | null;
  policy_name?: string | null;
  policy_version?: number | null;
  total_interceptions: number;
  blocked_interceptions: number;
  active_sessions_count: number;
  recent_threat_count: number;
  last_active_at?: string | null;
}

// ─── Phase 4C: Security Incidents & Fleet Risk ───

export interface SecurityIncident {
  id: string;
  org_id: string;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "DETECTED" | "INVESTIGATING" | "CONTAINED" | "RESOLVED";
  trigger_rule_id: string;
  affected_agent_ids_json: string[];
  session_ids_json: string[];
  summary: string;
  containment_action_taken?: string | null;
  evidence_trail_json: Array<Record<string, unknown>>;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  resolved_by?: string | null;
  resolution_notes?: string | null;
}

export interface FleetRiskPosture {
  org_id: string;
  fleet_risk_score: number;
  monitored_agents_count: number;
  agent_risk_scores: Record<string, { name?: string; risk_score?: number; direct_risk?: number; propagated_risk?: number; effective_risk?: number }>;
  recent_detections_count: number;
  timestamp: string;
}

export const incidentsApi = {
  list: (params?: { status?: string; severity?: string; agent_id?: string }) => {
    const p = new URLSearchParams();
    if (params?.status) p.set("status", params.status);
    if (params?.severity) p.set("severity", params.severity);
    if (params?.agent_id) p.set("agent_id", params.agent_id);
    const qs = p.toString();
    return apiFetch<SecurityIncident[]>(`/incidents${qs ? `?${qs}` : ""}`);
  },
  get: (incidentId: string) =>
    apiFetch<SecurityIncident>(`/incidents/${incidentId}`),
  create: (req: {
    title: string;
    severity: string;
    trigger_rule_id: string;
    affected_agent_ids?: string[];
    session_ids?: string[];
    summary?: string;
  }) =>
    apiFetch<SecurityIncident>("/incidents", {
      method: "POST",
      body: JSON.stringify(req),
    }),
  contain: (incidentId: string, req: { action: string; reason?: string }) =>
    apiFetch<SecurityIncident>(`/incidents/${incidentId}/contain`, {
      method: "POST",
      body: JSON.stringify(req),
    }),
  resolve: (incidentId: string, req: { notes: string; resolved_by?: string }) =>
    apiFetch<SecurityIncident>(`/incidents/${incidentId}/resolve`, {
      method: "POST",
      body: JSON.stringify(req),
    }),
  getFleetRisk: () =>
    apiFetch<FleetRiskPosture>("/incidents/fleet-risk"),
};

// ─── Data Provenance & Execution Integrity (Phase 4D) ───

export interface DataProvenanceItem {
  id: string;
  org_id: string;
  session_id: string;
  agent_id: string;
  source_type: string;
  source_identifier: string;
  input_hash: string;
  output_hash: string;
  data_classification: string;
  trust_level: string;
  parent_provenance_ids_json: string[];
  transformation_type?: string | null;
  decision_id?: string | null;
  incident_id?: string | null;
  signature: string;
  created_at: string;
}

export interface ProvenanceLineageNodeItem {
  record_id: string;
  source_type: string;
  source_identifier: string;
  trust_level: string;
  data_classification: string;
  input_hash: string;
  output_hash: string;
  transformation_type?: string | null;
  created_at: string;
  parent_nodes: ProvenanceLineageNodeItem[];
}

export interface TrustVerificationResult {
  is_valid: boolean;
  effective_trust_level: string;
  reason: string;
}

export interface ExecutionIntegrityItem {
  id: string;
  org_id: string;
  agent_id: string;
  session_id: string;
  tool_name: string;
  request_digest: string;
  policy_version: number;
  status: string;
  rejection_reason?: string | null;
  nonce: string;
  created_at: string;
}

export const integrityApi = {
  validate: (req: {
    agent_id: string;
    tool_name: string;
    arguments: Record<string, unknown>;
    nonce: string;
    approved_digest?: string;
    policy_version?: number;
    session_id?: string;
  }) =>
    apiFetch<ExecutionIntegrityItem>("/integrity/validate", {
      method: "POST",
      body: JSON.stringify(req),
    }),
  listRecords: (params?: { agent_id?: string; tool_name?: string; status?: string; limit?: number }) => {
    const p = new URLSearchParams();
    if (params?.agent_id) p.set("agent_id", params.agent_id);
    if (params?.tool_name) p.set("tool_name", params.tool_name);
    if (params?.status) p.set("status", params.status);
    if (params?.limit) p.set("limit", String(params.limit));
    const qs = p.toString();
    return apiFetch<ExecutionIntegrityItem[]>(`/integrity/records${qs ? `?${qs}` : ""}`);
  },
};







