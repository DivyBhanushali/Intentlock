// SICTACK – Enterprise Authentication & Tenant Onboarding Console

"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  AlertTriangleIcon,
} from "@/components/icons";
import { getSafeRedirect } from "@/lib/safe-redirect";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const sessionExpired = searchParams.get("session_expired") === "true";
  const redirectPath = getSafeRedirect(redirectParam);

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
      <div className="max-w-xl mx-auto mt-16 px-4 font-sans text-[#18191B]">
        <div className="rounded-2xl border border-[#E2E0D8] bg-[#FFFFFF] p-8 shadow-[0_4px_16px_rgba(24,25,27,0.06)] relative overflow-hidden">
          <div className="text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EDF5F0] border border-[#D4E8DC] text-[#234E39] mb-4 shadow-xs">
              <CheckCircleIcon size={28} />
            </div>
            <h2 className="text-xl font-bold text-[#18191B]">Authenticated Enterprise Session</h2>
            <p className="mt-1 text-xs text-[#56585D]">
              You are currently signed in with active organization credentials.
            </p>
          </div>

          <div className="mt-6 rounded-xl bg-[#F4F3EE] border border-[#E2E0D8] p-4 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between border-b border-[#E2E0D8] pb-2">
              <span className="text-[#56585D]">Active User:</span>
              <span className="text-[#18191B] font-semibold">{user.email}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#E2E0D8] pb-2">
              <span className="text-[#56585D]">Organization:</span>
              <span className="text-[#234E39] font-semibold">{user.org_name}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#E2E0D8] pb-2">
              <span className="text-[#56585D]">Tenant ID:</span>
              <span className="text-[#787A80]">{user.org_id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#56585D]">Assigned Role:</span>
              <span className="rounded bg-[#EDF5F0] border border-[#D4E8DC] text-[#234E39] px-2 py-0.5 font-bold text-[10px]">
                {user.role}
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => router.push(redirectPath)}
              className="rounded-xl bg-[#1D3557] py-2.5 px-4 text-xs font-semibold text-white hover:bg-[#152740] transition-all shadow-xs text-center cursor-pointer"
            >
              {redirectPath !== "/soc" ? "Continue to Destination" : "Open Security Operations"}
            </button>
            <Link
              href="/team"
              className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] py-2.5 px-4 text-xs font-medium text-[#56585D] hover:text-[#18191B] hover:border-[#CECBC0] transition-all text-center"
            >
              Manage Team &amp; Keys
            </Link>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={logout}
              className="text-xs text-[#787A80] hover:text-[#943425] transition-colors cursor-pointer"
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
          router.push(redirectPath);
        }
      } else {
        await login(email.trim(), password);
        router.push(redirectPath);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  function handleQuickDemoFill() {
    setIsRegister(false);
    setEmail("admin@sictack.io");
    setPassword("DemoAdmin123!");
    setError(null);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 font-sans text-[#18191B]">
      {/* ─── Top Brand Header ─── */}
      <div className="flex items-center justify-between border-b border-[#E2E0D8] pb-5 mb-8">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#EEF4F8] border border-[#CFDEEB] flex items-center justify-center text-[#1D3557] shadow-xs">
            <LockIcon size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-wider text-[#18191B]">SICTACK</span>
              <span className="rounded bg-[#F4F3EE] border border-[#E2E0D8] px-1.5 py-0.2 text-[9px] font-mono text-[#56585D]">
                GATEWAY v1.0
              </span>
            </div>
            <p className="text-[11px] text-[#56585D]">Secure the action. Protect the intention.</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-[#234E39]">
          <span className="h-2 w-2 rounded-full bg-[#234E39] animate-pulse" />
          <span className="font-semibold">INDUSTRIAL SECURITY ACTIVE</span>
        </div>
      </div>

      {/* ─── Success View: Cryptographic Agent API Key Reveal ─── */}
      {newApiKey ? (
        <div className="max-w-xl mx-auto rounded-2xl border border-[#D4E8DC] bg-[#FFFFFF] p-8 shadow-[0_4px_16px_rgba(24,25,27,0.06)] relative overflow-hidden">
          <div className="text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EDF5F0] border border-[#D4E8DC] text-[#234E39] mb-4 shadow-xs">
              <KeyIcon size={26} />
            </div>
            <h2 className="text-xl font-bold text-[#18191B]">Enterprise Workspace Created!</h2>
            <p className="mt-1 text-xs text-[#56585D]">
              Your organization tenant has been provisioned with fail-closed security.
            </p>
          </div>

          <div className="mt-6 rounded-xl border border-[#FBE3C6] bg-[#FEF6EC] p-3.5 text-xs text-[#8D5B18] flex items-start gap-2.5">
            <ShieldIcon size={16} className="text-[#8D5B18] shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Save your secret Agent API key now.</strong>
              <div className="text-[11px] text-[#8D5B18]/90 mt-0.5">
                For security reasons, this raw machine credential is encrypted in our vault and cannot be recovered in full again.
              </div>
            </div>
          </div>

          <div className="mt-5">
            <label className="block text-[11px] font-semibold text-[#56585D] mb-1.5">
              Production Machine-to-Machine API Key
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={newApiKey}
                className="w-full font-mono text-xs rounded-xl border border-[#E2E0D8] bg-[#F4F3EE] px-3.5 py-2.5 text-[#18191B] select-all focus:outline-none"
              />
              <button
                onClick={() => copyToClipboard(newApiKey)}
                className="shrink-0 rounded-xl bg-[#1D3557] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#152740] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
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
            <span className="text-[11px] font-semibold text-[#56585D]">Quick Python SDK Integration:</span>
            <pre className="mt-1.5 p-3 rounded-xl bg-[#141518] border border-[#282A30] font-mono text-[10px] text-[#EDEDEB] leading-relaxed overflow-x-auto">
{`from sictack import SictackClient

client = SictackClient(
    api_key="${newApiKey}",
    base_url="https://sictack-backend.onrender.com"
)`}
            </pre>
          </div>

          <button
            onClick={() => router.push("/soc")}
            className="mt-6 w-full rounded-xl bg-[#1D3557] py-3 text-xs font-bold text-white hover:bg-[#152740] transition-all shadow-xs cursor-pointer"
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
              <div className="inline-flex items-center gap-2 rounded-full bg-[#EDF5F0] border border-[#D4E8DC] px-3 py-1 text-[11px] font-semibold text-[#234E39] mb-3">
                <ShieldIcon size={12} />
                <span>Zero-Trust Enterprise AI Security</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#18191B] sm:text-4xl leading-tight">
                Secure every autonomous action your AI bot takes.
              </h1>
              <p className="mt-3 text-sm text-[#56585D] leading-relaxed">
                SICTACK acts as a cryptographic, fail-closed firewall sitting directly between LLM reasoning and real-world tools. Prevent prompt injection, data exfiltration, database drops, and unauthorized actions before execution occurs.
              </p>
            </div>

            {/* Feature Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-3.5 shadow-[0_1px_3px_rgba(24,25,27,0.04)]">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-[#EDF5F0] text-[#234E39]">
                    <ShieldIcon size={12} />
                  </div>
                  <h3 className="text-xs font-bold text-[#18191B]">Deterministic Enforcement</h3>
                </div>
                <p className="text-[11px] text-[#56585D] leading-relaxed">
                  No probabilistic LLM fuzzing. Policies are evaluated with strict mathematical determinism.
                </p>
              </div>

              <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-3.5 shadow-[0_1px_3px_rgba(24,25,27,0.04)]">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-[#EEF4F8] text-[#1D3557]">
                    <KeyIcon size={12} />
                  </div>
                  <h3 className="text-xs font-bold text-[#18191B]">M2M Scoped Credentials</h3>
                </div>
                <p className="text-[11px] text-[#56585D] leading-relaxed">
                  Stripe-style API keys (<code className="text-[#1D3557] font-mono">ilk_live_...</code>) for LangChain, AutoGen, and CrewAI bots.
                </p>
              </div>

              <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-3.5 shadow-[0_1px_3px_rgba(24,25,27,0.04)]">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-[#F3EFF8] text-[#4A3B69]">
                    <UsersIcon size={12} />
                  </div>
                  <h3 className="text-xs font-bold text-[#18191B]">Multi-User RBAC</h3>
                </div>
                <p className="text-[11px] text-[#56585D] leading-relaxed">
                  Give employees granular roles: Admin (manage), Approver (HITL review), Viewer (read-only).
                </p>
              </div>

              <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-3.5 shadow-[0_1px_3px_rgba(24,25,27,0.04)]">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-[#EDF5F0] text-[#234E39]">
                    <TerminalIcon size={12} />
                  </div>
                  <h3 className="text-xs font-bold text-[#18191B]">SHA-256 Action Ledger</h3>
                </div>
                <p className="text-[11px] text-[#56585D] leading-relaxed">
                  Every tool call canonicalized and hashed to ensure complete tamper-evident audit trails.
                </p>
              </div>
            </div>

            {/* Live Security Metrics Banner */}
            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs shadow-[0_1px_3px_rgba(24,25,27,0.04)]">
              <div>
                <div className="text-[10px] text-[#787A80] uppercase tracking-wider">Pentest Protection</div>
                <div className="text-sm font-bold text-[#234E39] mt-0.5">15/15 Vectors Blocked</div>
              </div>
              <div className="border-l border-[#E2E0D8] pl-4">
                <div className="text-[10px] text-[#787A80] uppercase tracking-wider">Interception Latency</div>
                <div className="text-sm font-bold text-[#1D3557] mt-0.5">&lt; 0.8 ms Overhead</div>
              </div>
              <div className="border-l border-[#E2E0D8] pl-4">
                <div className="text-[10px] text-[#787A80] uppercase tracking-wider">Fail-Closed Invariant</div>
                <div className="text-sm font-bold text-[#18191B] mt-0.5">100% Guaranteed</div>
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Console Card (5 cols) */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-[#E2E0D8] bg-[#FFFFFF] p-6 shadow-[0_4px_16px_rgba(24,25,27,0.06)] relative">
              {/* Segmented Tab Switcher */}
              <div className="flex rounded-xl bg-[#F4F3EE] p-1 border border-[#E2E0D8] mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setError(null);
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    !isRegister
                      ? "bg-[#FFFFFF] text-[#18191B] shadow-xs"
                      : "text-[#56585D] hover:text-[#18191B]"
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
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    isRegister
                      ? "bg-[#FFFFFF] text-[#18191B] shadow-xs"
                      : "text-[#56585D] hover:text-[#18191B]"
                  }`}
                >
                  Register Workspace
                </button>
              </div>

              {sessionExpired && !error && (
                <div className="mb-4 rounded-xl border border-[#FBE3C6] bg-[#FEF6EC] p-3 text-xs text-[#8D5B18] flex items-start gap-2">
                  <AlertTriangleIcon size={14} className="shrink-0 mt-0.5 text-[#8D5B18]" />
                  <span>Your session has expired or is invalid. Please sign in to resume.</span>
                </div>
              )}

              {error && (
                <div className="mb-4 rounded-xl border border-[#F8D5D0] bg-[#FDF1EF] p-3 text-xs text-[#943425] flex items-start gap-2">
                  <ShieldIcon size={14} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {isRegister && (
                  <>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#56585D] mb-1">
                        Company / Organization
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#787A80]">
                          <BuildingIcon size={14} />
                        </div>
                        <input
                          type="text"
                          required
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="e.g. Acme Robotics or FinTech Corp"
                          className="w-full rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] pl-9 pr-3 py-2 text-xs text-[#18191B] placeholder-[#787A80] focus:border-[#1D3557] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#56585D] mb-1">
                        Administrator Full Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#787A80]">
                          <UsersIcon size={14} />
                        </div>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Divy Bhanushali"
                          className="w-full rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] pl-9 pr-3 py-2 text-xs text-[#18191B] placeholder-[#787A80] focus:border-[#1D3557] focus:outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-[#56585D] mb-1">
                    Corporate Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] px-3.5 py-2 text-xs text-[#18191B] placeholder-[#787A80] focus:border-[#1D3557] focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-[#56585D]">
                      Password
                    </label>
                    {isRegister && (
                      <span className="text-[10px] text-[#787A80] font-mono">Min 6 chars</span>
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
                      className="w-full rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] px-3.5 py-2 pr-10 text-xs text-[#18191B] placeholder-[#787A80] focus:border-[#1D3557] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#787A80] hover:text-[#18191B] transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                    </button>
                  </div>
                </div>

                {isRegister && (
                  <div className="rounded-lg bg-[#EDF5F0] border border-[#D4E8DC] p-2.5 text-[11px] text-[#234E39] leading-tight">
                    ✨ Automatically provisions your organization workspace, creates the primary <strong>Admin</strong> account, and generates your first live agent API key.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#1D3557] py-2.5 text-xs font-bold text-white hover:bg-[#152740] transition-all shadow-xs disabled:opacity-50 mt-2 cursor-pointer"
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
                <div className="mt-5 pt-4 border-t border-[#E2E0D8]">
                  <button
                    type="button"
                    onClick={handleQuickDemoFill}
                    className="w-full rounded-xl border border-dashed border-[#E2E0D8] bg-[#F4F3EE] py-2 text-[11px] font-mono text-[#56585D] hover:text-[#18191B] hover:border-[#CECBC0] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>⚡ Fill Demo Admin Credentials</span>
                  </button>
                </div>
              )}

              {/* Footer Trust Note */}
              <div className="mt-5 text-center text-[10px] text-[#787A80] flex items-center justify-center gap-1.5">
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FBFBF9] flex items-center justify-center text-xs font-mono text-[#56585D]">
          Loading security gateway...
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
