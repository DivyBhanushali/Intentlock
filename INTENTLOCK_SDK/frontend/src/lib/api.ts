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

