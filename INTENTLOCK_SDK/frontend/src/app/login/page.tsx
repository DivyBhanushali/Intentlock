// INTENTLOCK – Enterprise Authentication & Tenant Onboarding Console

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  LockIcon,
  ShieldIcon,
  CheckCircleIcon,
  KeyIcon,
  EyeIcon,
  EyeOffIcon,
  BuildingIcon,
  UsersIcon,
  TerminalIcon,
  InfoIcon,
} from "@/components/icons";

export default function LoginPage() {
  const router = useRouter();
  const { login, register, isAuthenticated, user, logout } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // If already authenticated and not viewing the generated key
  if (isAuthenticated && user && !newApiKey) {
    return (
      <div className="max-w-xl mx-auto mt-16 px-4">
        <div className="rounded-2xl border border-[#1a2233] bg-[#0d111a] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 mb-4 shadow-[0_0_24px_rgba(16,185,129,0.2)]">
              <CheckCircleIcon size={28} />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Authenticated Enterprise Session</h2>
            <p className="mt-1 text-xs text-slate-400">
              You are currently signed in with active organization credentials.
            </p>
          </div>

          <div className="mt-6 rounded-xl bg-[#07090e] border border-[#1a2233] p-4 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between border-b border-[#141b2b] pb-2">
              <span className="text-slate-500">Active User:</span>
              <span className="text-slate-200 font-semibold">{user.email}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#141b2b] pb-2">
              <span className="text-slate-500">Organization:</span>
              <span className="text-emerald-400 font-semibold">{user.org_name}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#141b2b] pb-2">
              <span className="text-slate-500">Tenant ID:</span>
              <span className="text-slate-400">{user.org_id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Assigned Role:</span>
              <span className="rounded bg-emerald-500/20 text-emerald-400 px-2 py-0.5 font-bold text-[10px]">
                {user.role}
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => router.push("/")}
              className="rounded-xl bg-emerald-500 py-2.5 px-4 text-xs font-semibold text-black hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 text-center"
            >
              Open Security Operations
            </button>
            <Link
              href="/team"
              className="rounded-xl border border-[#1a2233] bg-[#121824] py-2.5 px-4 text-xs font-medium text-slate-200 hover:border-slate-700 transition-all text-center"
            >
              Manage Team &amp; Keys
            </Link>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={logout}
              className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
            >
              Sign Out from this Workspace
            </button>
          </div>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        const apiKey = await register(
          email.trim(),
          password,
          fullName.trim() || "Admin User",
          companyName.trim() || "My AI Company"
        );
        if (apiKey) {
          setNewApiKey(apiKey);
        } else {
          router.push("/");
        }
      } else {
        await login(email.trim(), password);
        router.push("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  function handleQuickDemoFill() {
    setIsRegister(false);
    setEmail("admin@intentlock.io");
    setPassword("DemoAdmin123!");
    setError(null);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* ─── Top Brand Header ─── */}
      <div className="flex items-center justify-between border-b border-[#1a2233] pb-5 mb-8">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <LockIcon size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-wider text-slate-100">INTENTLOCK</span>
              <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-mono text-emerald-400">
                GATEWAY v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Deterministic Zero-Trust Security for Autonomous AI Fleets</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>INDUSTRIAL SECURITY ACTIVE</span>
        </div>
      </div>

      {/* ─── Success View: Cryptographic Agent API Key Reveal ─── */}
      {newApiKey ? (
        <div className="max-w-xl mx-auto rounded-2xl border border-emerald-500/30 bg-[#0d111a] p-8 shadow-2xl relative overflow-hidden">
          <div className="text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-4 shadow-[0_0_24px_rgba(16,185,129,0.25)]">
              <KeyIcon size={26} />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Enterprise Workspace Created!</h2>
            <p className="mt-1 text-xs text-slate-400">
              Your organization tenant has been provisioned with fail-closed security.
            </p>
          </div>

          <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300 flex items-start gap-2.5">
            <ShieldIcon size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Save your secret Agent API key now.</strong>
              <div className="text-[11px] text-amber-300/80 mt-0.5">
                For security reasons, this raw machine credential is encrypted in our vault and cannot be recovered in full again.
              </div>
            </div>
          </div>

          <div className="mt-5">
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
              Production Machine-to-Machine API Key
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={newApiKey}
                className="w-full font-mono text-xs rounded-xl border border-emerald-500/40 bg-[#07090e] px-3.5 py-2.5 text-emerald-300 select-all focus:outline-none"
              />
              <button
                onClick={() => copyToClipboard(newApiKey)}
                className="shrink-0 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-black hover:bg-emerald-400 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                {copiedKey ? (
                  <>
                    <CheckCircleIcon size={14} />
                    Copied
                  </>
                ) : (
                  "Copy Key"
                )}
              </button>
            </div>
          </div>

          {/* Code snippet preview */}
          <div className="mt-5">
            <span className="text-[11px] font-semibold text-slate-300">Quick Python SDK Integration:</span>
            <pre className="mt-1.5 p-3 rounded-xl bg-[#07090e] border border-[#1a2233] font-mono text-[10px] text-emerald-400/90 leading-relaxed overflow-x-auto">
{`from intentlock import IntentLockClient

client = IntentLockClient(
    api_key="${newApiKey}",
    base_url="https://intentlock-backend-ze2i.onrender.com"
)`}
            </pre>
          </div>

          <button
            onClick={() => router.push("/")}
            className="mt-6 w-full rounded-xl bg-emerald-500 py-3 text-xs font-bold text-black hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
          >
            Launch Security Operations Center →
          </button>
        </div>
      ) : (
        /* ─── Main 2-Column Split: Enterprise Showcase + Auth Console ─── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Industrial Capability Showcase (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-400 mb-3">
                <ShieldIcon size={12} />
                <span>Zero-Trust Enterprise AI Security</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 sm:text-4xl leading-tight">
                Secure every autonomous action your AI bot takes.
              </h1>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                INTENTLOCK acts as a cryptographic, fail-closed firewall sitting directly between LLM reasoning and real-world tools. Prevent prompt injection, data exfiltration, database drops, and unauthorized actions before execution occurs.
              </p>
            </div>

            {/* Feature Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="rounded-xl border border-[#1a2233] bg-[#0d111a]/80 p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500/20 text-emerald-400">
                    <ShieldIcon size={12} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-200">Deterministic Enforcement</h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  No probabilistic LLM fuzzing. Policies are evaluated with strict mathematical determinism.
                </p>
              </div>

              <div className="rounded-xl border border-[#1a2233] bg-[#0d111a]/80 p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-cyan-500/20 text-cyan-400">
                    <KeyIcon size={12} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-200">M2M Scoped Credentials</h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Stripe-style API keys (<code className="text-cyan-400 font-mono">ilk_live_...</code>) for LangChain, AutoGen, and CrewAI bots.
                </p>
              </div>

              <div className="rounded-xl border border-[#1a2233] bg-[#0d111a]/80 p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-violet-500/20 text-violet-400">
                    <UsersIcon size={12} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-200">Multi-User RBAC</h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Give employees granular roles: Admin (manage), Approver (HITL review), Viewer (read-only).
                </p>
              </div>

              <div className="rounded-xl border border-[#1a2233] bg-[#0d111a]/80 p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500/20 text-emerald-400">
                    <TerminalIcon size={12} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-200">SHA-256 Action Ledger</h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Every tool call canonicalized and hashed to ensure complete tamper-evident audit trails.
                </p>
              </div>
            </div>

            {/* Live Security Metrics Banner */}
            <div className="rounded-xl border border-[#1a2233] bg-[#07090e] p-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Pentest Protection</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">15/15 Vectors Blocked</div>
              </div>
              <div className="border-l border-[#1a2233] pl-4">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Interception Latency</div>
                <div className="text-sm font-bold text-cyan-400 mt-0.5">&lt; 0.8 ms Overhead</div>
              </div>
              <div className="border-l border-[#1a2233] pl-4">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Fail-Closed Invariant</div>
                <div className="text-sm font-bold text-slate-200 mt-0.5">100% Guaranteed</div>
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Console Card (5 cols) */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-[#1a2233] bg-[#0d111a] p-6 shadow-2xl relative">
              {/* Segmented Tab Switcher */}
              <div className="flex rounded-xl bg-[#07090e] p-1 border border-[#1a2233] mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setError(null);
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    !isRegister
                      ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true);
                    setError(null);
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    isRegister
                      ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Register Workspace
                </button>
              </div>

              {error && (
                <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 flex items-start gap-2">
                  <ShieldIcon size={14} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {isRegister && (
                  <>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Company / Organization
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                          <BuildingIcon size={14} />
                        </div>
                        <input
                          type="text"
                          required
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="e.g. Acme Robotics or FinTech Corp"
                          className="w-full rounded-xl border border-[#1a2233] bg-[#07090e] pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Administrator Full Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                          <UsersIcon size={14} />
                        </div>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Divy Bhanushali"
                          className="w-full rounded-xl border border-[#1a2233] bg-[#07090e] pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Corporate Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full rounded-xl border border-[#1a2233] bg-[#07090e] px-3.5 py-2 text-xs text-slate-200 placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-300">
                      Password
                    </label>
                    {isRegister && (
                      <span className="text-[10px] text-slate-500 font-mono">Min 6 chars</span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-xl border border-[#1a2233] bg-[#07090e] px-3.5 py-2 pr-10 text-xs text-slate-200 placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                    </button>
                  </div>
                </div>

                {isRegister && (
                  <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-2.5 text-[11px] text-emerald-400/90 leading-tight">
                    ✨ Automatically provisions your organization workspace, creates the primary <strong>Admin</strong> account, and generates your first live agent API key.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-black hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 mt-2"
                >
                  {loading
                    ? isRegister
                      ? "Provisioning Organization..."
                      : "Authenticating..."
                    : isRegister
                    ? "Create Organization & Generate API Key"
                    : "Sign In to Workspace"}
                </button>
              </form>

              {/* Demo Fill Option */}
              {!isRegister && (
                <div className="mt-5 pt-4 border-t border-[#1a2233]">
                  <button
                    type="button"
                    onClick={handleQuickDemoFill}
                    className="w-full rounded-xl border border-dashed border-[#1a2233] bg-[#07090e] py-2 text-[11px] font-mono text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>⚡ Fill Demo Admin Credentials</span>
                  </button>
                </div>
              )}

              {/* Footer Trust Note */}
              <div className="mt-5 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
                <LockIcon size={10} />
                <span>Protected by PBKDF2-HMAC-SHA256 &amp; JWT 256-bit encryption</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
