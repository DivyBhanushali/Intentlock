// INTENTLOCK 2.0 – Installation Documentation Page
import { DeveloperLayout } from "@/components/developers/DeveloperLayout";
import { CodeBlock } from "@/components/developers/CodeBlock";
import { CodeTabs } from "@/components/developers/CodeTabs";
import { Callout } from "@/components/developers/Callout";
import { PreviousNextNavigation } from "@/components/developers/PreviousNextNavigation";
import { TocItem } from "@/components/developers/types";

export default function InstallationPage() {
  const breadcrumbs = [
    { label: "Developers", href: "/developers" },
    { label: "Getting Started", href: "/developers/installation" },
    { label: "Installation", href: "/developers/installation" },
  ];

  const toc: TocItem[] = [
    { id: "prerequisites", title: "Prerequisites", level: 2 },
    { id: "install-git", title: "Install from GitHub", level: 2 },
    { id: "install-editable", title: "Editable Local Development", level: 2 },
    { id: "verification", title: "Verifying Installation", level: 2 },
    { id: "optional-deps", title: "Optional Integrations", level: 2 },
    { id: "troubleshooting", title: "Troubleshooting", level: 2 },
  ];

  const gitInstallCode = `# Install directly from the GitHub repository into your active virtualenv
pip install "git+https://github.com/DivyBhanushali/Intentlock.git#subdirectory=INTENTLOCK_SDK/sdk/python"`;

  const poetryInstallCode = `# Add to pyproject.toml via poetry
poetry add "git+https://github.com/DivyBhanushali/Intentlock.git#subdirectory=INTENTLOCK_SDK/sdk/python"`;

  const localInstallCode = `# 1. Clone the repository
git clone https://github.com/DivyBhanushali/Intentlock.git
cd Intentlock/INTENTLOCK_SDK/sdk/python

# 2. Create and activate a clean virtual environment (Python 3.12+)
python -m venv .venv
# Linux / macOS:
source .venv/bin/activate
# Windows PowerShell:
.venv\\Scripts\\Activate.ps1

# 3. Install in editable (-e) development mode
pip install -e .`;

  const verifySnippet = `python -c "import intentlock; print('INTENTLOCK SDK Version:', intentlock.__version__)"`;

  const verifyExpectedOutput = `INTENTLOCK SDK Version: 0.1.0`;

  return (
    <DeveloperLayout breadcrumbs={breadcrumbs} toc={toc}>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-mono font-medium text-emerald-400">
              Getting Started
            </span>
            <span className="text-xs text-slate-500">v0.1.0</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Installation &amp; Setup
          </h1>
          <p className="mt-3 text-base text-slate-400 leading-relaxed">
            Install the INTENTLOCK Python SDK (<code className="text-emerald-300 font-mono text-sm">intentlock-sdk</code>) into your local or cloud environment. Learn the prerequisites, installation options, and verification steps.
          </p>
        </div>

        {/* Distribution Notice */}
        <Callout type="info" title="Package Distribution Notice">
          <p className="text-sm leading-relaxed">
            The INTENTLOCK SDK is currently distributed directly from the GitHub repository. It is not published under the public PyPI index. Ensure your build environment has git installed and access to GitHub.
          </p>
        </Callout>

        {/* Prerequisites */}
        <section id="prerequisites" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Prerequisites
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Before installing the SDK, verify that your development environment satisfies the runtime requirements:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-800/80 bg-[#0a0e17] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Python 3.12 or Higher</span>
              </div>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                INTENTLOCK leverages modern Python type hinting, modern generic syntax, and structured concurrency features supported in Python 3.12+.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-[#0a0e17] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Pydantic &ge; 2.0</span>
              </div>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                All SDK models (<code className="text-emerald-300 font-mono">ToolCall</code>, <code className="text-emerald-300 font-mono">Decision</code>, <code className="text-emerald-300 font-mono">Policy</code>) use Pydantic V2 for deterministic JSON serialization and validation.
              </p>
            </div>
          </div>
        </section>

        {/* Install from GitHub */}
        <section id="install-git" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Install from GitHub
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            The recommended method to install <code className="font-mono text-emerald-300">intentlock-sdk</code> into an existing project or CI pipeline is directly from the source repository:
          </p>

          <CodeTabs
            tabs={[
              { id: "pip", label: "pip", code: gitInstallCode, language: "bash" },
              { id: "poetry", label: "poetry", code: poetryInstallCode, language: "bash" },
            ]}
          />
        </section>

        {/* Editable Local Development */}
        <section id="install-editable" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Editable Local Development
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            If you are contributing to the SDK or want to step through SDK source code locally, clone the repository and install in editable mode:
          </p>

          <CodeBlock code={localInstallCode} language="bash" filename="Terminal" />
        </section>

        {/* Verification */}
        <section id="verification" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Verifying Installation
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Verify that the package is correctly installed and accessible by printing its version string:
          </p>

          <CodeBlock code={verifySnippet} language="bash" filename="Terminal" />

          <p className="text-xs text-slate-400">Expected terminal output:</p>
          <CodeBlock code={verifyExpectedOutput} language="text" filename="Output" />
        </section>

        {/* Optional Integrations */}
        <section id="optional-deps" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Optional Framework Integrations
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            INTENTLOCK provides native adapters for popular agentic frameworks. Install these optional dependencies in your application as needed:
          </p>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0e1420] text-slate-200 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Framework</th>
                  <th className="py-2.5 px-4 font-semibold">Adapter Class</th>
                  <th className="py-2.5 px-4 font-semibold">Install Command</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                <tr>
                  <td className="py-2.5 px-4 text-white font-sans font-medium">LangChain</td>
                  <td className="py-2.5 px-4 text-emerald-400">SecureTool, secure_langchain_tool</td>
                  <td className="py-2.5 px-4 text-slate-400">pip install langchain-core</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-white font-sans font-medium">LangGraph</td>
                  <td className="py-2.5 px-4 text-emerald-400">SecureGraphNode</td>
                  <td className="py-2.5 px-4 text-slate-400">pip install langgraph</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-white font-sans font-medium">Model Context Protocol</td>
                  <td className="py-2.5 px-4 text-emerald-400">MCPSecurityProxy</td>
                  <td className="py-2.5 px-4 text-slate-400">Built-in (Zero extra dependencies)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Troubleshooting */}
        <section id="troubleshooting" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Troubleshooting Common Issues
          </h2>

          <div className="space-y-3">
            <div className="rounded-xl border border-slate-800 bg-[#0a0e17] p-4">
              <h3 className="text-sm font-semibold text-rose-300">
                Error: ModuleNotFoundError: No module named &apos;intentlock&apos;
              </h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Ensure that your active shell is using the virtual environment where INTENTLOCK was installed. Run <code className="text-slate-200">which python</code> (Linux/macOS) or <code className="text-slate-200">Get-Command python</code> (Windows) to verify the interpreter path.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0a0e17] p-4">
              <h3 className="text-sm font-semibold text-rose-300">
                Error: Package requires Python &gt;= 3.12
              </h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                INTENTLOCK specifies <code className="text-slate-200">requires-python = &quot;&gt;=3.12&quot;</code> in <code className="text-slate-200">pyproject.toml</code>. If you are using Python 3.10 or 3.11, upgrade your Python installation or use <code className="text-slate-200">pyenv</code> to select Python 3.12+.
              </p>
            </div>
          </div>
        </section>

        {/* Previous / Next Navigation */}
        <PreviousNextNavigation
          prev={{ title: "Overview", href: "/developers" }}
          next={{ title: "Quickstart", href: "/developers/quickstart" }}
        />
      </div>
    </DeveloperLayout>
  );
}
