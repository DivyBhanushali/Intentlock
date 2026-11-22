// SICTACK – Team Members, RBAC & Agent API Keys Management (Warm Editorial Software)

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  teamApi,
  type TeamMember,
  type ApiKeyItem,
  type UserRole,
} from "@/lib/api";
import { formatDate, timeAgo } from "@/lib/utils";
import {
  UsersIcon,
  KeyIcon,
  ShieldIcon,
  RefreshIcon,
  LockIcon,
  CheckCircleIcon,
  InfoIcon,
} from "@/components/icons";

export default function TeamPage() {
  const { user, isAuthenticated } = useAuth();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & form state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("APPROVER");
  const [inviting, setInviting] = useState(false);

  // New API key modal
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyName, setKeyName] = useState("Production Bot Key");
  const [creatingKey, setCreatingKey] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const isAdmin = user?.role === "ADMIN";

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const [membersData, keysData] = await Promise.all([
        teamApi.listMembers().catch(() => []),
        teamApi.listApiKeys().catch(() => []),
      ]);
      setMembers(membersData);
      setApiKeys(keysData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load team data");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!isAuthenticated) {
        if (active) setLoading(false);
        return;
      }
      try {
        const [membersData, keysData] = await Promise.all([
          teamApi.listMembers().catch(() => []),
          teamApi.listApiKeys().catch(() => []),
        ]);
        if (active) {
          setMembers(membersData);
          setApiKeys(keysData);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load team data");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail || !invitePassword) return;
    setInviting(true);
    try {
      await teamApi.inviteMember({
        email: inviteEmail.trim(),
        full_name: inviteName.trim() || "Team Member",
        password: invitePassword,
        role: inviteRole,
      });
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteName("");
      setInvitePassword("");
      setInviteRole("APPROVER");
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to invite member");
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(memberId: string, newRole: UserRole) {
    try {
      await teamApi.updateMember(memberId, { role: newRole });
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update role");
    }
  }

  async function handleRemoveMember(memberId: string, memberEmail: string) {
    if (!confirm(`Are you sure you want to remove ${memberEmail} from the organization?`)) {
      return;
    }
    try {
      await teamApi.removeMember(memberId);
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove member");
    }
  }

  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault();
    if (!keyName) return;
    setCreatingKey(true);
    try {
      const res = await teamApi.createApiKey({ name: keyName.trim() });
      if (res.raw_key) {
        setNewlyCreatedKey(res.raw_key);
      }
      setKeyName("Production Bot Key");
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create API key");
    } finally {
      setCreatingKey(false);
    }
  }

  async function handleRevokeKey(keyId: string, keyName: string) {
    if (!confirm(`Revoke API key "${keyName}"? Any AI agent using this key will immediately be blocked.`)) {
      return;
    }
    try {
      await teamApi.revokeApiKey(keyId);
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to revoke API key");
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="border-b border-[#E2E0D8] pb-5">
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-[#18191B]">
            Team & Access Control
          </h1>
          <p className="mt-1 text-xs text-[#56585D]">
            Multi-user enterprise workspace, role-based access control (RBAC), and agent API keys.
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E0D8] bg-white p-8 text-center max-w-lg mx-auto shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#EDF5F0] border border-[#234E39]/20 text-[#234E39] mb-4">
            <LockIcon size={24} />
          </div>
          <h2 className="text-lg font-semibold text-[#18191B]">Organization Login Required</h2>
          <p className="mt-2 text-xs text-[#56585D] leading-relaxed">
            Sign in to your enterprise workspace to invite employees, manage roles (Admin, Approver, Viewer), and generate cryptographic API keys for your AI bots.
          </p>
          <div className="mt-6">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1D3557] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#152741] transition-all shadow-xs"
            >
              Sign In or Register Workspace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#E2E0D8] pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-[#18191B]">
              Team & Machine Access Control
            </h1>
            <span className="rounded-full bg-[#EDF5F0] px-2.5 py-0.5 text-[10px] font-semibold text-[#234E39] border border-[#234E39]/20">
              {user?.org_name}
            </span>
            <span className="rounded-full bg-[#EEF4F8] px-2 py-0.5 text-[10px] font-mono text-[#1D3557] border border-[#1D3557]/20">
              {user?.plan}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#56585D]">
            Manage your organization&apos;s human operators, assign RBAC permissions, and issue API keys for your AI agents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setLoading(true);
              fetchData();
            }}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E0D8] bg-white px-3 py-1.5 text-xs text-[#56585D] hover:border-[#18191B]/30 hover:text-[#18191B] transition-all shadow-xs"
          >
            <RefreshIcon size={12} className={loading ? "animate-spin" : ""} />
            Sync
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => {
                  setNewlyCreatedKey(null);
                  setShowKeyModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#1D3557]/30 bg-[#EEF4F8] px-3 py-1.5 text-xs font-semibold text-[#1D3557] hover:bg-[#1D3557]/10 transition-all shadow-xs"
              >
                <KeyIcon size={12} />
                Generate Key
              </button>

              <button
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D3557] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#152741] transition-all shadow-xs"
              >
                <UsersIcon size={12} />
                Invite Member
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-[#943425]/20 bg-[#FDF1EF] p-3 text-xs text-[#943425]">
          {error}
        </div>
      )}

      {/* RBAC Role Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#E2E0D8] bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-[#EDF5F0] text-[#234E39]">
              <ShieldIcon size={12} />
            </span>
            <span className="text-xs font-bold text-[#18191B]">ADMIN</span>
            <span className="ml-auto text-[10px] text-[#787A80]">Tier 1</span>
          </div>
          <p className="text-[11px] text-[#56585D] leading-relaxed">
            Full workspace authority. Can manage security policies, invite/delete team members, issue &amp; revoke agent API keys, and resolve human-in-the-loop approvals.
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E0D8] bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-[#EEF4F8] text-[#1D3557]">
              <ShieldIcon size={12} />
            </span>
            <span className="text-xs font-bold text-[#18191B]">APPROVER</span>
            <span className="ml-auto text-[10px] text-[#787A80]">Tier 2</span>
          </div>
          <p className="text-[11px] text-[#56585D] leading-relaxed">
            Security operations role. Can view policies and audit telemetry, and review/grant/reject pending high-risk tool execution approvals.
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E0D8] bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-[#F4F3EE] text-[#787A80]">
              <InfoIcon size={12} />
            </span>
            <span className="text-xs font-bold text-[#18191B]">VIEWER</span>
            <span className="ml-auto text-[10px] text-[#787A80]">Tier 3</span>
          </div>
          <p className="text-[11px] text-[#56585D] leading-relaxed">
            Auditor &amp; observer role. Read-only access to audit logs, active agent list, and telemetry dashboards. Cannot alter policies or resolve approvals.
          </p>
        </div>
      </div>

      {/* ─── Section 1: Team Members Table ─── */}
      <div className="rounded-xl border border-[#E2E0D8] bg-white overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-[#E2E0D8] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UsersIcon size={16} className="text-[#1D3557]" />
            <h2 className="text-sm font-semibold text-[#18191B]">
              Organization Members
            </h2>
            <span className="ml-2 rounded-full bg-[#F4F3EE] border border-[#E2E0D8] px-2 py-0.5 text-[10px] font-mono text-[#56585D]">
              {members.length} {members.length === 1 ? "user" : "users"}
            </span>
          </div>
          <span className="text-[11px] text-[#56585D]">
            Signed in as: <strong className="text-[#1D3557]">{user?.email}</strong> ({user?.role})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E2E0D8] bg-[#F4F3EE] text-[#56585D] uppercase tracking-wider text-[10px]">
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Role &amp; Permissions</th>
                <th className="px-5 py-3 font-semibold">Joined Date</th>
                <th className="px-5 py-3 font-semibold">Last Active</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E0D8]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#787A80]">
                    <RefreshIcon size={18} className="animate-spin inline-block mr-2" />
                    Loading team members...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#787A80]">
                    No team members found.
                  </td>
                </tr>
              ) : (
                members.map((m) => {
                  const isSelf = m.id === user?.id;
                  return (
                    <tr key={m.id} className="hover:bg-[#FBFBF9] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF4F8] border border-[#1D3557]/20 text-[#1D3557] font-bold text-xs uppercase">
                            {m.full_name ? m.full_name.charAt(0) : m.email.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-[#18191B] flex items-center gap-2">
                              {m.full_name || "Team Member"}
                              {isSelf && (
                                <span className="rounded bg-[#EEF4F8] text-[#1D3557] border border-[#1D3557]/20 px-1.5 py-0.2 text-[9px] font-mono font-semibold">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#56585D] font-mono">
                              {m.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        {isAdmin && !isSelf ? (
                          <select
                            value={m.role}
                            onChange={(e) => handleRoleChange(m.id, e.target.value as UserRole)}
                            aria-label={`Change role for ${m.email}`}
                            className="rounded border border-[#E2E0D8] bg-white px-2 py-1 text-[11px] font-semibold text-[#18191B] focus:border-[#1D3557] focus:outline-hidden"
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="APPROVER">APPROVER</option>
                            <option value="VIEWER">VIEWER</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                              m.role === "ADMIN"
                                ? "bg-[#EDF5F0] text-[#234E39] border-[#234E39]/20"
                                : m.role === "APPROVER"
                                ? "bg-[#EEF4F8] text-[#1D3557] border-[#1D3557]/20"
                                : "bg-[#F4F3EE] text-[#787A80] border-[#E2E0D8]"
                            }`}
                          >
                            <ShieldIcon size={10} />
                            {m.role}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-[#56585D] font-mono text-[11px]">
                        {formatDate(m.created_at)}
                      </td>

                      <td className="px-5 py-3.5 text-[#56585D] text-[11px]">
                        {m.last_login_at ? timeAgo(m.last_login_at) : "Never"}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        {isAdmin && !isSelf ? (
                          <button
                            onClick={() => handleRemoveMember(m.id, m.email)}
                            className="rounded px-2.5 py-1 text-[11px] text-[#943425] hover:bg-[#FDF1EF] hover:border-[#943425]/30 border border-transparent transition-all"
                          >
                            Remove
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#787A80]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Section 2: Agent API Keys (M2M) ─── */}
      <div className="rounded-xl border border-[#E2E0D8] bg-white overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-[#E2E0D8] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyIcon size={16} className="text-[#1D3557]" />
            <div>
              <h2 className="text-sm font-semibold text-[#18191B]">
                Agent Machine API Keys
              </h2>
              <p className="text-[10px] text-[#56585D]">
                Machine-to-machine tokens used by Python/TypeScript SDKs to intercept agent tools.
              </p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => {
                setNewlyCreatedKey(null);
                setShowKeyModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#1D3557]/30 bg-[#EEF4F8] px-2.5 py-1 text-xs font-semibold text-[#1D3557] hover:bg-[#1D3557]/10 transition-all shadow-xs"
            >
              <KeyIcon size={12} />
              + Create Key
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E2E0D8] bg-[#F4F3EE] text-[#56585D] uppercase tracking-wider text-[10px]">
                <th className="px-5 py-3 font-semibold">Key Name</th>
                <th className="px-5 py-3 font-semibold">Key Token Prefix</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Created</th>
                <th className="px-5 py-3 font-semibold">Last Used</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E0D8]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#787A80]">
                    <RefreshIcon size={18} className="animate-spin inline-block mr-2" />
                    Loading API keys...
                  </td>
                </tr>
              ) : apiKeys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#787A80]">
                    No active API keys found. Generate one to connect your AI agents.
                  </td>
                </tr>
              ) : (
                apiKeys.map((k) => (
                  <tr key={k.id} className="hover:bg-[#FBFBF9] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-[#18191B]">{k.name}</div>
                      <div className="text-[10px] text-[#787A80] font-mono">{k.id}</div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[#1D3557] bg-[#EEF4F8] border border-[#1D3557]/20 px-2 py-0.5 rounded text-[11px]">
                        {k.key_prefix}••••••••••••••••
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#EDF5F0] px-2 py-0.5 text-[10px] font-semibold text-[#234E39] border border-[#234E39]/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#234E39]" />
                        ACTIVE
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-[#56585D] font-mono text-[11px]">
                      {formatDate(k.created_at)}
                    </td>

                    <td className="px-5 py-3.5 text-[#56585D] text-[11px]">
                      {k.last_used_at ? timeAgo(k.last_used_at) : "Never"}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      {isAdmin ? (
                        <button
                          onClick={() => handleRevokeKey(k.id, k.name)}
                          className="rounded px-2.5 py-1 text-[11px] text-[#943425] hover:bg-[#FDF1EF] hover:border-[#943425]/30 border border-transparent transition-all"
                        >
                          Revoke
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#787A80]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modal: Invite Member ─── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-[#E2E0D8] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E2E0D8] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <UsersIcon size={16} className="text-[#1D3557]" />
                <h3 className="font-semibold text-[#18191B] text-sm">
                  Add Team Member
                </h3>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-[#787A80] hover:text-[#18191B] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#18191B] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full rounded-lg border border-[#E2E0D8] bg-white px-3 py-2 text-xs text-[#18191B] placeholder-[#787A80] focus:border-[#1D3557] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#18191B] mb-1">
                  Company Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="e.g. john@company.com"
                  className="w-full rounded-lg border border-[#E2E0D8] bg-white px-3 py-2 text-xs text-[#18191B] placeholder-[#787A80] focus:border-[#1D3557] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#18191B] mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-lg border border-[#E2E0D8] bg-white px-3 py-2 text-xs text-[#18191B] placeholder-[#787A80] focus:border-[#1D3557] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#18191B] mb-1">
                  Assigned RBAC Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full rounded-lg border border-[#E2E0D8] bg-white px-3 py-2 text-xs text-[#18191B] focus:border-[#1D3557] focus:outline-hidden"
                >
                  <option value="APPROVER">APPROVER — Can review &amp; grant tool execution approvals</option>
                  <option value="VIEWER">VIEWER — Read-only access to audit logs and policies</option>
                  <option value="ADMIN">ADMIN — Full organization control &amp; team management</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E0D8]">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="rounded-lg border border-[#E2E0D8] bg-transparent px-3 py-1.5 text-xs text-[#56585D] hover:text-[#18191B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="rounded-lg bg-[#1D3557] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#152741] disabled:opacity-50 transition-all shadow-xs"
                >
                  {inviting ? "Creating..." : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal: Create API Key ─── */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-[#E2E0D8] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E2E0D8] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <KeyIcon size={16} className="text-[#1D3557]" />
                <h3 className="font-semibold text-[#18191B] text-sm">
                  {newlyCreatedKey ? "API Key Generated" : "Generate Agent API Key"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowKeyModal(false);
                  setNewlyCreatedKey(null);
                }}
                className="text-[#787A80] hover:text-[#18191B] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {newlyCreatedKey ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-[#8D5B18]/30 bg-[#FEF6EC] p-3 text-xs text-[#8D5B18]">
                  ⚠️ <strong>Save this secret key now.</strong> You won&apos;t be able to see it again!
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#18191B] mb-1">
                    Secret API Key
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={newlyCreatedKey}
                      className="w-full font-mono text-xs rounded-lg border border-[#1D3557]/40 bg-[#EEF4F8] px-3 py-2 text-[#1D3557] select-all font-semibold"
                    />
                    <button
                      onClick={() => copyToClipboard(newlyCreatedKey)}
                      className="shrink-0 rounded-lg bg-[#1D3557] px-3 py-2 text-xs font-semibold text-white hover:bg-[#152741] transition-all flex items-center gap-1 shadow-xs"
                    >
                      {copiedKey ? (
                        <>
                          <CheckCircleIcon size={14} />
                          Copied
                        </>
                      ) : (
                        "Copy"
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-[#56585D] leading-relaxed">
                  Provide this key to your AI agent via environment variable:
                  <pre className="mt-1 p-2.5 rounded bg-[#141518] border border-[#26282D] font-mono text-[10px] text-[#EDF5F0] overflow-x-auto">
                    SICTACK_API_KEY={newlyCreatedKey}
                  </pre>
                </div>

                <div className="pt-2 text-right">
                  <button
                    onClick={() => {
                      setShowKeyModal(false);
                      setNewlyCreatedKey(null);
                    }}
                    className="rounded-lg bg-[#234E39] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#1b3d2c] shadow-xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#18191B] mb-1">
                    Key Purpose / Agent Name
                  </label>
                  <input
                    type="text"
                    required
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="e.g. LangChain Customer Support Agent"
                    className="w-full rounded-lg border border-[#E2E0D8] bg-white px-3 py-2 text-xs text-[#18191B] placeholder-[#787A80] focus:border-[#1D3557] focus:outline-hidden"
                  />
                </div>

                <p className="text-[11px] text-[#56585D]">
                  This key will have fail-closed security enforcement scoped strictly to <strong>{user?.org_name}</strong> policies.
                </p>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E0D8]">
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(false)}
                    className="rounded-lg border border-[#E2E0D8] bg-transparent px-3 py-1.5 text-xs text-[#56585D] hover:text-[#18191B]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingKey}
                    className="rounded-lg bg-[#1D3557] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#152741] disabled:opacity-50 transition-all shadow-xs"
                  >
                    {creatingKey ? "Generating..." : "Generate Key"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
