// INTENTLOCK – Enterprise Login & Tenant Onboarding

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { LockIcon, ShieldIcon, CheckCircleIcon, KeyIcon } from "@/components/icons";

export default function LoginPage() {
  const router = useRouter();
  const { login, register, isAuthenticated, user, logout } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);

  if (isAuthenticated && user && !newApiKey) {
    return (
      <div className="max-w-md mx-auto mt-16 rounded-xl border border-[#1a2233] bg-[#0d111a] p-6 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
          <CheckCircleIcon size={24} />
        </div>
        <h2 className="text-lg font-bold text-slate-100">Authenticated Active Session</h2>
        <p className="mt-1 text-xs text-slate-400">
          Logged in as <strong className="text-emerald-400">{user.email}</strong>
        </p>
        <div className="mt-4 rounded-lg bg-[#0a0e17] border border-[#161f30] p-3 text-left text-xs font-mono">
          <div className="text-slate-400">Workspace: <span className="text-slate-200">{user.org_name}</span></div>
          <div className="text-slate-400 mt-1">Tenant ID: <span className="text-slate-400">{user.org_id}</span></div>
          <div className="text-slate-400 mt-1">Role: <span className="text-emerald-400 font-semibold">{user.role}</span></div>
        </div>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
          >
            Go to Security Operations Center
          </button>
          <button
            onClick={logout}
            className="rounded-lg border border-[#1a2233] bg-[#121824] px-4 py-2 text-xs font-medium text-slate-300 hover:text-rose-400 transition-colors"
          >
            Sign Out
          </button>
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
        const apiKey = await register(email, password, fullName || "Admin User", companyName || "My AI Company");
        if (apiKey) {
          setNewApiKey(apiKey);
        } else {
          router.push("/");
        }
      } else {
        await login(email, password);
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
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 mb-3 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
          <LockIcon size={24} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-100">
          {isRegister ? "Create Enterprise Workspace" : "Sign In to IntentLock"}
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Zero-Trust Security Gateway for Enterprise AI Agents
        </p>
      </div>

      {/* Success Modal when New API Key generated on Registration */}
      {newApiKey ? (
        <div className="rounded-xl border border-emerald-500/30 bg-[#0d111a] p-6 text-center">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mb-3">
            <KeyIcon size={20} />
          </div>
          <h2 className="text-base font-bold text-slate-100">Workspace Created Successfully!</h2>
          <p className="mt-1 text-xs text-slate-400">
            Here is your live Agent API Key. Use this key to authenticate your Python SDK tool calls:
          </p>
          <div className="mt-3 p-3 rounded-lg bg-[#07090e] border border-emerald-500/30 font-mono text-xs text-emerald-400 break-all select-all">
            {newApiKey}
          </div>
          <p className="mt-2 text-[10px] text-amber-400">
            ⚠️ Please copy this key now. It will not be shown in full again for security reasons.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-5 w-full rounded-lg bg-emerald-600 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
          >
            Enter Security Operations Center
          </button>
        </div>
      ) : (
        /* Form Card */
        <div className="rounded-xl border border-[#1a2233] bg-[#0d111a] p-6 shadow-xl">
          {error && (
            <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Company / Organization</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Robotics or FinTech Corp"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Administrator Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Divy Bhanushali"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Work Email Address</label>
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-600 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-lg disabled:opacity-50"
            >
              {loading ? "Authenticating..." : isRegister ? "Create Organization & Generate API Key" : "Sign In to Workspace"}
            </button>
          </form>

          {/* Switch Mode / Demo Fill */}
          <div className="mt-5 pt-4 border-t border-[#1a2233] flex flex-col gap-2.5 text-center text-xs">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-slate-400 hover:text-emerald-400 transition-colors"
            >
              {isRegister ? "Already have an account? Sign in" : "Need an organization account? Register workspace"}
            </button>

            {!isRegister && (
              <button
                type="button"
                onClick={handleQuickDemoFill}
                className="text-[11px] font-mono text-slate-500 hover:text-slate-300 transition-colors"
              >
                [Auto-Fill Demo Admin Credentials]
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
