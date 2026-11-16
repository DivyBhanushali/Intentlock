// INTENTLOCK 2.0 – Production Deployment Guide
"use client";

import { DeveloperLayout } from "@/components/developers/DeveloperLayout";
import { CodeBlock } from "@/components/developers/CodeBlock";
import { Callout } from "@/components/developers/Callout";
import { PreviousNextNavigation } from "@/components/developers/PreviousNextNavigation";
import { TocItem } from "@/components/developers/types";

export default function ProductionDeploymentPage() {
  const breadcrumbs = [
    { label: "Developers", href: "/developers" },
    { label: "Security & Operations", href: "/developers/deployment" },
    { label: "Production Deployment", href: "/developers/deployment" },
  ];

  const toc: TocItem[] = [
    { id: "topology", title: "Architecture & Cloud Topology", level: 2 },
    { id: "sdk-installation", title: "Python SDK in Production", level: 2 },
    { id: "environment-vars", title: "Environment Variables Reference", level: 2 },
    { id: "database-migrations", title: "PostgreSQL & Migration Workflow", level: 2 },
    { id: "health-probes", title: "Health Checks & Monitoring", level: 2 },
    { id: "network-security", title: "HTTPS, CORS & Security Headers", level: 2 },
    { id: "key-management", title: "API Key Management", level: 2 },
    { id: "backup-recovery", title: "Backup, Rollback & Disaster Recovery", level: 2 },
    { id: "practices-vs-recommendations", title: "Current Practices vs Recommendations", level: 2 },
  ];

  const backendEnvExample = `# Backend Environment Configuration (.env)
# Application Settings
APP_NAME=INTENTLOCK Enterprise
APP_VERSION=2.0.0
DEBUG=false
ENVIRONMENT=production

# Database (Supabase PostgreSQL Connection Pooler)
# Port 5432: Session Pooler (recommended for migrations/DDL)
# Port 6543: Transaction Pooler (recommended for high-throughput API workers)
DATABASE_URL=postgresql://aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require

# Authentication & Cryptography
# Generate a cryptographically secure 256-bit random key via: openssl rand -hex 32
SECRET_KEY=replace_with_64_char_hex_secret_generated_via_openssl
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Human-in-the-Loop Approval Policy
DEFAULT_APPROVAL_TIMEOUT_SECONDS=300
FAIL_CLOSED_ON_INTERNAL_ERROR=true

# Cross-Origin Resource Sharing (JSON array format)
CORS_ORIGINS=["https://intentlock-wheat.vercel.app"]`;

  const frontendEnvExample = `# Frontend Environment Configuration (.env.local)
NEXT_PUBLIC_API_URL=https://intentlock-backend-ze2i.onrender.com/api/v1
NEXT_PUBLIC_APP_ENV=production`;

  const dockerfileExample = `# Production Backend Dockerfile (backend/Dockerfile)
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for PostgreSQL libpq
RUN apt-get update && apt-get install -y --no-install-recommends \\
    build-essential \\
    libpq-dev \\
    curl \\
    && rm -rf /var/lib/apt/lists/*

# Install INTENTLOCK Python SDK
COPY sdk/python /sdk/python
RUN pip install --no-cache-dir /sdk/python

# Install backend dependencies
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend /app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]`;

  const healthCheckResponse = `{
  "status": "healthy",
  "service": "INTENTLOCK API",
  "version": "2.0.0",
  "database": "postgresql"
}`;

  return (
    <DeveloperLayout breadcrumbs={breadcrumbs} toc={toc}>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-mono font-medium text-emerald-400">
              Operations &amp; Infrastructure
            </span>
            <span className="text-xs text-slate-500">Production Specification</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Production Deployment Guide
          </h1>
          <p className="mt-3 text-base text-slate-400 leading-relaxed">
            INTENTLOCK is built for resilient enterprise operations across decoupled cloud environments. This guide documents the verified cloud topology, database pooling, configuration variables, migration workflow, and monitoring practices.
          </p>
        </div>

        {/* Section: Topology */}
        <section id="topology" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Architecture &amp; Cloud Topology
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            The INTENTLOCK platform runs across three dedicated cloud infrastructure components:
          </p>

          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0a0e17] border-b border-slate-800 text-slate-400 font-mono">
                <tr>
                  <th className="p-3">Component</th>
                  <th className="p-3">Platform</th>
                  <th className="p-3">Production URL / Role</th>
                  <th className="p-3">Runtime Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-[#080c14] text-slate-300">
                <tr>
                  <td className="p-3 font-semibold text-white">Frontend Dashboard &amp; Docs</td>
                  <td className="p-3 font-mono text-cyan-400">Vercel</td>
                  <td className="p-3 font-mono text-slate-300">https://intentlock-wheat.vercel.app</td>
                  <td className="p-3 text-slate-400">Next.js 16 with Edge Network CDN, Server-Side Rendering, and Client-Side SOC consoles.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-white">Security Gateway API</td>
                  <td className="p-3 font-mono text-emerald-400">Render</td>
                  <td className="p-3 font-mono text-slate-300">https://intentlock-backend-ze2i.onrender.com</td>
                  <td className="p-3 text-slate-400">Python 3.11 / FastAPI with Uvicorn multi-worker server behind managed HTTPS load balancers.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-white">Relational Database &amp; RLS</td>
                  <td className="p-3 font-mono text-emerald-300">Supabase</td>
                  <td className="p-3 font-mono text-slate-300">Managed PostgreSQL 15</td>
                  <td className="p-3 text-slate-400">Row Level Security (RLS) enabled on 12 core tables, Supavisor connection pooling, and SSL required.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section: SDK Installation */}
        <section id="sdk-installation" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Python SDK in Production
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            In agent production environments (e.g., containerized worker tasks, background queue consumers, or microservices), install the SDK using standard package tooling:
          </p>

          <CodeBlock
            code={`# Option A: Install from repository checkout (recommended for locked mono-repos)
pip install /path/to/INTENTLOCK_SDK/sdk/python

# Option B: Install pre-built wheel
pip install intentlock_sdk-0.1.0-py3-none-any.whl

# Verify installation in your Python environment
python -c "import intentlock; print(intentlock.__version__)"
# Output: 0.1.0`}
            language="bash"
            filename="Terminal"
          />

          <Callout type="info" title="Python Version Requirement">
            <p className="text-xs leading-relaxed">
              The INTENTLOCK Python SDK specifies <code className="font-mono text-emerald-300">requires-python = &quot;&gt;=3.12&quot;</code> in <code className="font-mono text-emerald-300">pyproject.toml</code>. Ensure your runtime environment uses <strong>Python &ge; 3.12</strong>.
            </p>
          </Callout>
        </section>

        {/* Section: Environment Variables */}
        <section id="environment-vars" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Environment Variables Reference
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Configure the backend service with environment variables passed via your cloud orchestrator (Render dashboard, Docker secrets, or Kubernetes ConfigMaps).
          </p>

          <Callout type="warning" title="Security Reminder: Placeholder Values Only">
            <p className="text-xs leading-relaxed">
              The configurations below contain <strong>safe illustrative placeholders</strong>. Never commit real passwords, database credentials, production API keys, or JWT secrets to source control.
            </p>
          </Callout>

          <CodeBlock code={backendEnvExample} language="ini" filename="backend/.env (Reference)" />
          <CodeBlock code={frontendEnvExample} language="ini" filename="frontend/.env.local (Reference)" />
        </section>

        {/* Section: Database Migrations */}
        <section id="database-migrations" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            PostgreSQL &amp; Migration Workflow
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            INTENTLOCK uses a deterministic, versioned, idempotent migration engine (<code className="font-mono text-emerald-300">backend/app/db/migrations.py</code>). Migrations are tracked in the <code className="font-mono text-emerald-300">schema_migrations</code> table:
          </p>

          <div className="space-y-3 text-xs">
            <div className="rounded-xl border border-slate-800 bg-[#0a0e17] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-emerald-400">Migration 1: 001_v2_enterprise_multitenancy_schema</span>
                <span className="text-[10px] font-mono text-slate-500">Version 1</span>
              </div>
              <p className="text-slate-300">
                Adds <code className="font-mono text-emerald-300">org_id</code> multi-tenancy columns, indexes, intent governance columns to <code className="font-mono text-slate-300">approvals</code>, and SHA-256 sequential hash chain columns (<code className="font-mono text-slate-300">sequence_number</code>, <code className="font-mono text-slate-300">previous_hash</code>, <code className="font-mono text-slate-300">entry_hash</code>) to <code className="font-mono text-slate-300">audit_events</code>.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0a0e17] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-emerald-400">Migration 2: 002_enable_supabase_rls_and_revoke_public_api_grants</span>
                <span className="text-[10px] font-mono text-slate-500">Version 2</span>
              </div>
              <p className="text-slate-300">
                Enables PostgreSQL Row Level Security (RLS) across all 12 application tables. Revokes public PostgREST grants from <code className="font-mono text-slate-400">anon</code>, <code className="font-mono text-slate-400">authenticated</code>, and <code className="font-mono text-slate-400">PUBLIC</code>. Revokes privileges strictly from sequences owned by INTENTLOCK tables via <code className="font-mono text-emerald-300">pg_depend</code> catalog matching, preserving <code className="font-mono text-emerald-300">service_role</code> access.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0a0e17] p-4 text-xs space-y-2">
            <span className="font-semibold text-white">Migration Execution Dynamics</span>
            <p className="text-slate-400 leading-relaxed">
              During application startup, the FastAPI lifespan hook (<code className="font-mono text-emerald-300">backend/app/main.py</code>) executes <code className="font-mono text-emerald-300">apply_migrations(engine)</code> to apply unapplied migrations idempotently. For enterprise multi-worker or zero-downtime deployments using Supabase pooling, connect via the <strong>Session Pooler (port 5432)</strong> as a dedicated pre-deploy release job prior to scaling API worker containers on the Transaction Pooler (port 6543).
            </p>
          </div>
        </section>

        {/* Section: Docker Containerization */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Docker Containerization
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            The FastAPI backend is packaged using a multi-layer slim Debian container image:
          </p>
          <CodeBlock code={dockerfileExample} language="dockerfile" filename="backend/Dockerfile" />
        </section>

        {/* Section: Health Probes */}
        <section id="health-probes" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Health Checks &amp; Monitoring
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Configure container orchestrators and uptime monitoring tools to probe the following endpoints:
          </p>

          <div className="space-y-3">
            <div className="rounded-xl border border-slate-800 bg-[#0a0e17] p-4 text-xs space-y-2">
              <div className="flex items-center justify-between font-mono">
                <span className="font-bold text-emerald-400">GET /health</span>
                <span className="text-slate-500">Liveness / Readiness Probe (Public)</span>
              </div>
              <p className="text-slate-400">Returns service status, current version, and database dialect without requiring authentication.</p>
              <CodeBlock code={healthCheckResponse} language="json" filename="Response Payload" />
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0a0e17] p-4 text-xs space-y-2">
              <div className="flex items-center justify-between font-mono">
                <span className="font-bold text-cyan-400">GET /api/v1/audit/verify</span>
                <span className="text-slate-500">Integrity Probe (Requires JWT/API Key)</span>
              </div>
              <p className="text-slate-400">Recalculates sequential SHA-256 hashes across all audit records for the tenant to confirm zero database tampering.</p>
            </div>
          </div>
        </section>

        {/* Section: Network Security */}
        <section id="network-security" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            HTTPS, CORS &amp; Security Headers
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            All production HTTP responses include defensive headers enforced via FastAPI middleware (<code className="font-mono text-emerald-300">backend/app/main.py</code>):
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl border border-slate-800 bg-[#0a0e17] p-3.5 space-y-1">
              <span className="font-mono font-bold text-emerald-400">X-Content-Type-Options</span>
              <p className="text-slate-400"><code className="font-mono text-emerald-300">nosniff</code>: Prevents MIME-type sniffing by browsers.</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#0a0e17] p-3.5 space-y-1">
              <span className="font-mono font-bold text-emerald-400">X-Frame-Options</span>
              <p className="text-slate-400"><code className="font-mono text-emerald-300">DENY</code>: Blocks clickjacking by preventing iframe embedding.</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#0a0e17] p-3.5 space-y-1">
              <span className="font-mono font-bold text-emerald-400">Referrer-Policy</span>
              <p className="text-slate-400"><code className="font-mono text-emerald-300">strict-origin-when-cross-origin</code>: Protects sensitive paths in referrers.</p>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            <strong>CORS Policy:</strong> Configured via <code className="font-mono text-emerald-300">CORS_ORIGINS</code>. In production, only the trusted Vercel frontend origin (<code className="font-mono text-slate-300">https://intentlock-wheat.vercel.app</code>) is permitted for cross-origin browser requests with credentials.
          </p>
        </section>

        {/* Section: Key Management */}
        <section id="key-management" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            API Key Management
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            INTENTLOCK generates prefixed machine-to-machine API keys:
          </p>
          <ul className="text-xs text-slate-300 list-disc list-inside space-y-1.5">
            <li><strong>Live Keys:</strong> Prefix <code className="font-mono text-emerald-400">ilk_live_...</code>. Generated for production agent interception.</li>
            <li><strong>Test Keys:</strong> Prefix <code className="font-mono text-amber-400">ilk_test_...</code>. Generated for staging and sandbox environments.</li>
            <li><strong>Storage Security:</strong> Raw keys are shown to operators <em>exactly once</em> at creation time. The backend hashes keys with salt before storage in PostgreSQL (<code className="font-mono text-emerald-300">api_keys</code> table).</li>
            <li><strong>Revocation:</strong> Admins can revoke keys instantly via <code className="font-mono text-emerald-300">DELETE /api/v1/api-keys/{'{key_id}'}</code> or through the dashboard.</li>
          </ul>
        </section>

        {/* Section: Backup & Recovery */}
        <section id="backup-recovery" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Backup, Rollback &amp; Disaster Recovery
          </h2>
          <div className="space-y-3 text-xs text-slate-300">
            <div className="rounded-xl border border-slate-800 bg-[#0a0e17] p-4 space-y-2">
              <h3 className="font-semibold text-white">Database Backup &amp; PITR</h3>
              <p className="text-slate-400">
                Supabase provides automated daily backups and Point-In-Time Recovery (PITR) for PostgreSQL. Write-Ahead Logs (WAL) are archived continuously. In the event of catastrophic data corruption, the database can be restored to any second within the retention window.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0a0e17] p-4 space-y-2">
              <h3 className="font-semibold text-white">Rollback Strategy</h3>
              <p className="text-slate-400">
                Because INTENTLOCK schema migrations are additive (adding columns, indexes, and RLS rules), previous backend container versions remain compatible with newer database states. If a deployment must be rolled back, revert the Render deployment to the previous image tag without requiring an immediate database downgrade.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Practices vs Recommendations */}
        <section id="practices-vs-recommendations" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Current Practices vs Enterprise Recommendations
          </h2>
          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0a0e17] border-b border-slate-800 text-slate-400 font-mono">
                <tr>
                  <th className="p-3">Operational Area</th>
                  <th className="p-3">Current Verified Implementation</th>
                  <th className="p-3">Recommended Enterprise Enhancement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-[#080c14] text-slate-300">
                <tr>
                  <td className="p-3 font-semibold text-white">Database Connection Pooling</td>
                  <td className="p-3 text-slate-400">Supabase Supavisor pooler (port 6543 / 5432).</td>
                  <td className="p-3 text-slate-400">Deploy PgBouncer as a dedicated sidecar or internal cluster proxy.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-white">Secrets Management</td>
                  <td className="p-3 text-slate-400">Environment variables loaded into Render and Vercel.</td>
                  <td className="p-3 text-slate-400">Integrate HashiCorp Vault or AWS Secrets Manager with dynamic rotation.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-white">Audit Log Archiving</td>
                  <td className="p-3 text-slate-400">PostgreSQL table with SHA-256 hash chaining.</td>
                  <td className="p-3 text-slate-400">Automated daily streaming of verified hash-chain snapshots to immutable AWS S3 Glacier Object Lock.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Navigation */}
        <PreviousNextNavigation
          prev={{ title: "Security Architecture", href: "/developers/security" }}
          next={{ title: "Troubleshooting & FAQs", href: "/developers/troubleshooting" }}
        />
      </div>
    </DeveloperLayout>
  );
}
