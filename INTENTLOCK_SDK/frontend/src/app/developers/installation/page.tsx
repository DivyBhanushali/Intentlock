// SICTACK 1.0 – Installation Documentation Page
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
    { id: "install-pypi", title: "Install from PyPI", level: 2 },
    { id: "install-source", title: "Source Installation (Contributors)", level: 2 },
    { id: "verification", title: "Verifying Installation", level: 2 },
    { id: "optional-deps", title: "Optional Integrations", level: 2 },
    { id: "troubleshooting", title: "Troubleshooting", level: 2 },
  ];

  const localWheelInstallCode = `# 1. Install pre-built local wheel distribution (current development milestone)
pip install dist/sictack-1.0.0-py3-none-any.whl

# Backward compatibility layer included (supports both 'import sictack' and 'import intentlock')`;

  const pypiInstallCode = `# Future public release from PyPI (upon commercial publication)
pip install sictack`;

  const poetryInstallCode = `# Add to pyproject.toml via poetry (local wheel or path dependency)
poetry add ./dist/sictack-1.0.0-py3-none-any.whl`;

  const localInstallCode = `# 1. Clone the repository for local editable development
git clone https://github.com/sictack/sictack.git
cd sictack/INTENTLOCK_SDK/sdk/python

# 2. Create and activate a clean virtual environment (Python 3.12+)
python -m venv .venv
# Linux / macOS:
source .venv/bin/activate
# Windows PowerShell:
.\\.venv\\Scripts\\Activate.ps1

# 3. Install in editable development mode
pip install -e .`;

  const verifySnippet = `python -c "import sictack; print('SICTACK SDK Version:', sictack.__version__)"`;

  const verifyExpectedOutput = `SICTACK SDK Version: 1.0.0`;

  return (
    <DeveloperLayout breadcrumbs={breadcrumbs} toc={toc}>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-md bg-[#EDF5F0] border border-[#234E39]/20 px-2 py-0.5 text-xs font-mono font-medium text-[#234E39]">
              Getting Started
            </span>
            <span className="text-xs text-[#787A80]">v1.0.0</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#18191B] sm:text-4xl">
            Installation &amp; Setup
          </h1>
          <p className="mt-3 text-base text-[#56585D] leading-relaxed">
            Install the official SICTACK Python SDK (<code className="text-[#234E39] font-mono text-sm">sictack</code>) into your local or cloud environment. Learn prerequisites, package distribution, and verification steps.
          </p>
        </div>

        {/* Distribution Notice */}
        <Callout type="info" title="Package Distribution & Installation Notice">
          <p className="text-sm leading-relaxed">
            The canonical package identity is <code className="font-mono font-medium text-[#18191B]">sictack (v1.0.0)</code>. Prior to commercial PyPI publication (see blocker <code className="text-[#943425] font-mono">BLK-004</code>), install the SDK using the verified pre-built wheel distribution (<code className="font-mono text-[#234E39]">pip install dist/sictack-1.0.0-py3-none-any.whl</code>) or editable source repository mode (<code className="font-mono text-[#234E39]">pip install -e ./sdk/python</code>). Both <code className="font-mono text-[#18191B]">import sictack</code> and legacy <code className="font-mono text-[#18191B]">import intentlock</code> forwarders are supported.
          </p>
        </Callout>

        {/* Prerequisites */}
        <section id="prerequisites" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Prerequisites
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            Before installing the SDK, verify that your development environment satisfies the runtime requirements:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#18191B]">
                <svg className="h-4 w-4 text-[#234E39]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Python 3.12 or Higher</span>
              </div>
              <p className="mt-2 text-xs text-[#56585D] leading-relaxed">
                SICTACK leverages modern Python type hinting, modern generic syntax, and structured concurrency features supported in Python 3.12+.
              </p>
            </div>

            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#18191B]">
                <svg className="h-4 w-4 text-[#234E39]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Pydantic &ge; 2.0</span>
              </div>
              <p className="mt-2 text-xs text-[#56585D] leading-relaxed">
                All SDK models (<code className="text-[#234E39] font-mono">ToolCall</code>, <code className="text-[#234E39] font-mono">Decision</code>, <code className="text-[#234E39] font-mono">Policy</code>) use Pydantic V2 for deterministic JSON serialization and validation.
              </p>
            </div>
          </div>
        </section>

        {/* Install from PyPI */}
        <section id="install-pypi" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Install from PyPI (Recommended)
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            The recommended method to install <code className="font-mono text-[#234E39]">sictack</code> into an existing project or CI pipeline is directly from PyPI:
          </p>

          <CodeTabs
            tabs={[
              { id: "pip", label: "pip", code: pypiInstallCode, language: "bash" },
              { id: "wheel", label: "local wheel", code: localWheelInstallCode, language: "bash" },
              { id: "poetry", label: "poetry", code: poetryInstallCode, language: "bash" },
            ]}
          />
        </section>

        {/* Source Installation (Contributors) */}
        <section id="install-source" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Source Installation (Contributors)
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            If you are contributing to the SDK or want to step through SDK source code locally, clone the repository and install in editable mode:
          </p>

          <CodeBlock code={localInstallCode} language="bash" filename="Terminal" />
        </section>

        {/* Verification */}
        <section id="verification" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Verifying Installation
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            Verify that the package is correctly installed and accessible by printing its version string:
          </p>

          <CodeBlock code={verifySnippet} language="bash" filename="Terminal" />

          <p className="text-xs text-[#56585D]">Expected terminal output:</p>
          <CodeBlock code={verifyExpectedOutput} language="text" filename="Output" />
        </section>

        {/* Optional Integrations */}
        <section id="optional-deps" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Optional Framework Integrations
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            SICTACK provides native adapters for popular agentic frameworks. Install these optional dependencies in your application as needed:
          </p>

          <div className="overflow-x-auto rounded-xl border border-[#E2E0D8]">
            <table className="w-full text-left text-xs text-[#56585D]">
              <thead className="bg-[#FFFFFF] text-[#18191B] border-b border-[#E2E0D8]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Framework</th>
                  <th className="py-2.5 px-4 font-semibold">Adapter Class</th>
                  <th className="py-2.5 px-4 font-semibold">Install Command</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E0D8] font-mono">
                <tr>
                  <td className="py-2.5 px-4 text-[#18191B] font-sans font-medium">LangChain</td>
                  <td className="py-2.5 px-4 text-[#234E39]">SecureTool, secure_langchain_tool</td>
                  <td className="py-2.5 px-4 text-[#56585D]">pip install langchain-core</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#18191B] font-sans font-medium">LangGraph</td>
                  <td className="py-2.5 px-4 text-[#234E39]">SecureGraphNode</td>
                  <td className="py-2.5 px-4 text-[#56585D]">pip install langgraph</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#18191B] font-sans font-medium">Model Context Protocol</td>
                  <td className="py-2.5 px-4 text-[#234E39]">MCPSecurityProxy</td>
                  <td className="py-2.5 px-4 text-[#56585D]">Built-in (Zero extra dependencies)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Troubleshooting */}
        <section id="troubleshooting" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Troubleshooting Common Issues
          </h2>

          <div className="space-y-3">
            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4">
              <h3 className="text-sm font-semibold text-[#943425]">
                Error: ModuleNotFoundError: No module named &apos;intentlock&apos;
              </h3>
              <p className="mt-1 text-xs text-[#56585D] leading-relaxed">
                Ensure that your active shell is using the virtual environment where SICTACK was installed. Run <code className="text-[#18191B]">which python</code> (Linux/macOS) or <code className="text-[#18191B]">Get-Command python</code> (Windows) to verify the interpreter path.
              </p>
            </div>

            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4">
              <h3 className="text-sm font-semibold text-[#943425]">
                Error: Package requires Python &gt;= 3.12
              </h3>
              <p className="mt-1 text-xs text-[#56585D] leading-relaxed">
                SICTACK specifies <code className="text-[#18191B]">requires-python = &quot;&gt;=3.12&quot;</code> in <code className="text-[#18191B]">pyproject.toml</code>. If you are using Python 3.10 or 3.11, upgrade your Python installation or use <code className="text-[#18191B]">pyenv</code> to select Python 3.12+.
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
