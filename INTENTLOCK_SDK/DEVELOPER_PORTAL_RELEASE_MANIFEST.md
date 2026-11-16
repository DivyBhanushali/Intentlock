# INTENTLOCK — Developer Portal Release Manifest

**Release Version:** 1.0.0  
**Associated Commit Target:** Feature Release (Phases 0–8 Sign-off)  
**Creation Date:** November 16, 2026  

---

## 1. Release Manifest Overview

This manifest defines the explicit, audited boundaries of the INTENTLOCK Developer Portal release. It segregates all newly created documentation pages, reusable UI components, navigation registries, and automated test contracts from pre-existing uncommitted modifications that belong to independent development streams.

---

## 2. Files Authorized for Staging and Release (INCLUSION SCOPE)

### 2.1 Next.js Developer Portal Routes (`src/app/developers/`)
| Path | Route | Purpose |
| :--- | :--- | :--- |
| `INTENTLOCK_SDK/frontend/src/app/developers/layout.tsx` | Layout | Dedicated developer sidebar and topbar layout wrapper |
| `INTENTLOCK_SDK/frontend/src/app/developers/page.tsx` | `/developers` | Developer Portal landing page |
| `INTENTLOCK_SDK/frontend/src/app/developers/quickstart/page.tsx` | `/developers/quickstart` | 5-Minute Quickstart guide |
| `INTENTLOCK_SDK/frontend/src/app/developers/installation/page.tsx`| `/developers/installation`| Python 3.12+ installation and packaging guide |
| `INTENTLOCK_SDK/frontend/src/app/developers/concepts/page.tsx` | `/developers/concepts` | Core zero-trust gateway architecture and concepts |
| `INTENTLOCK_SDK/frontend/src/app/developers/architecture/page.tsx`| `/developers/architecture`| System architecture, in-process vs remote execution |
| `INTENTLOCK_SDK/frontend/src/app/developers/security/page.tsx` | `/developers/security` | Threat model, prompt injection, and hardening guide |
| `INTENTLOCK_SDK/frontend/src/app/developers/sdk/page.tsx` | `/developers/sdk` | Python SDK architecture and overview |
| `INTENTLOCK_SDK/frontend/src/app/developers/sdk/initialization/page.tsx` | `/developers/sdk/initialization` | Client & Agent initialization documentation |
| `INTENTLOCK_SDK/frontend/src/app/developers/sdk/tool-protection/page.tsx`| `/developers/sdk/tool-protection` | Tool protection and interception policies |
| `INTENTLOCK_SDK/frontend/src/app/developers/sdk/decisions/page.tsx` | `/developers/sdk/decisions` | Decision model and human-in-the-loop approvals |
| `INTENTLOCK_SDK/frontend/src/app/developers/sdk/errors/page.tsx` | `/developers/sdk/errors` | SDK exception hierarchy and error handling |
| `INTENTLOCK_SDK/frontend/src/app/developers/api/page.tsx` | `/developers/api` | REST API overview and conventions |
| `INTENTLOCK_SDK/frontend/src/app/developers/api/authentication/page.tsx` | `/developers/api/authentication` | API keys, Bearer JWT, and RBAC matrix |
| `INTENTLOCK_SDK/frontend/src/app/developers/api/reference/page.tsx` | `/developers/api/reference` | OpenAPI catalog (11 groups, 48 operations) |
| `INTENTLOCK_SDK/frontend/src/app/developers/integrations/page.tsx` | `/developers/integrations` | Framework integrations hub |
| `INTENTLOCK_SDK/frontend/src/app/developers/integrations/langchain/page.tsx`| `/developers/integrations/langchain`| LangChain SecureTool integration guide |
| `INTENTLOCK_SDK/frontend/src/app/developers/integrations/langgraph/page.tsx`| `/developers/integrations/langgraph`| LangGraph SecureGraphNode integration guide |
| `INTENTLOCK_SDK/frontend/src/app/developers/integrations/mcp/page.tsx` | `/developers/integrations/mcp` | MCP Security Proxy integration guide |
| `INTENTLOCK_SDK/frontend/src/app/developers/examples/page.tsx` | `/developers/examples` | Practical agent examples and use cases |
| `INTENTLOCK_SDK/frontend/src/app/developers/playground/page.tsx` | `/developers/playground` | Developer Playground documentation & simulation guide |
| `INTENTLOCK_SDK/frontend/src/app/developers/deployment/page.tsx` | `/developers/deployment` | Production deployment guide (Render, Vercel) |
| `INTENTLOCK_SDK/frontend/src/app/developers/troubleshooting/page.tsx` | `/developers/troubleshooting`| Diagnostics, error codes, and troubleshooting |
| `INTENTLOCK_SDK/frontend/src/app/developers/changelog/page.tsx` | `/developers/changelog` | Version 0.1.0 release notes and history |

### 2.2 Reusable Developer Portal UI Components (`src/components/developers/`)
| Path | Purpose |
| :--- | :--- |
| `INTENTLOCK_SDK/frontend/src/components/developers/code-block.tsx` | Syntax-highlighted code block with one-click copy and ARIA labels |
| `INTENTLOCK_SDK/frontend/src/components/developers/code-tabs.tsx` | Multi-language code tab switcher with keyboard navigation (`tablist`) |
| `INTENTLOCK_SDK/frontend/src/components/developers/callout.tsx` | Alert callouts (info, warning, caution, success, security) |
| `INTENTLOCK_SDK/frontend/src/components/developers/endpoint-badge.tsx` | HTTP method badge (GET, POST, PUT, DELETE) with status indicators |
| `INTENTLOCK_SDK/frontend/src/components/developers/search.tsx` | Accessible modal search dialog with focus trap and `Ctrl+K` shortcut |
| `INTENTLOCK_SDK/frontend/src/components/developers/sidebar.tsx` | Collapsible, searchable developer sidebar with active route tracking |

### 2.3 Navigation, Configuration & Generated API Data
| Path | Purpose |
| :--- | :--- |
| `INTENTLOCK_SDK/frontend/src/lib/docs-config.ts` | Centralized documentation hierarchy and full search index (24 routes) |
| `INTENTLOCK_SDK/frontend/src/lib/api-reference-data.ts` | Type-safe OpenAPI reference matrix generated deterministically from FastAPI |
| `INTENTLOCK_SDK/frontend/src/components/navbar.tsx` | Navigation bar integration adding the "Docs" navigation link |

### 2.4 Automated Test Suites & Documentation Contracts
| Path | Purpose |
| :--- | :--- |
| `INTENTLOCK_SDK/backend/tests/test_api_docs_contract.py` | Automated contract test verifying OpenAPI sync and anti-secret hygiene |
| `INTENTLOCK_SDK/backend/tests/test_phase6_docs_contract.py` | Automated contract test verifying architecture and RBAC claims |
| `INTENTLOCK_SDK/backend/tests/test_phase7_qa_contract.py` | Automated contract test verifying search index and WCAG accessibility |
| `INTENTLOCK_SDK/sdk/python/tests/test_docs_examples.py` | Automated tests executing code examples from SDK documentation |
| `INTENTLOCK_SDK/sdk/python/tests/test_phase5_examples.py` | Automated tests executing LangChain, LangGraph, and MCP examples |

### 2.5 Documentation Audit Reports
| Path | Purpose |
| :--- | :--- |
| `INTENTLOCK_SDK/DEVELOPER_PORTAL_AUDIT.md` | Phase 0 Discovery & Technical Audit Blueprint |
| `INTENTLOCK_SDK/DEVELOPER_PORTAL_PHASE1_REPORT.md` | Phase 1 Foundation & Reusable Components Report |
| `INTENTLOCK_SDK/DEVELOPER_PORTAL_PHASE2_REPORT.md` | Phase 2 Landing Page & Navigation Report |
| `INTENTLOCK_SDK/DEVELOPER_PORTAL_PHASE3_REPORT.md` | Phase 3 Getting Started & SDK Documentation Report |
| `INTENTLOCK_SDK/DEVELOPER_PORTAL_PHASE4_REPORT.md` | Phase 4 REST API Reference & Auth Report |
| `INTENTLOCK_SDK/DEVELOPER_PORTAL_PHASE4_5_REPORT.md` | Phase 4.5 OpenAPI & RBAC Verification Report |
| `INTENTLOCK_SDK/DEVELOPER_PORTAL_PHASE5_REPORT.md` | Phase 5 Framework Integrations & Playground Report |
| `INTENTLOCK_SDK/DEVELOPER_PORTAL_PHASE6_REPORT.md` | Phase 6 Security Architecture & Deployment Report |
| `INTENTLOCK_SDK/DEVELOPER_PORTAL_PHASE7_REPORT.md` | Phase 7 UX, Search, Accessibility & QA Report |
| `INTENTLOCK_SDK/DEVELOPER_PORTAL_PHASE8_REPORT.md` | Phase 8 Final Production Validation & Release Sign-Off Report |
| `INTENTLOCK_SDK/DEVELOPER_PORTAL_RELEASE_CHECKLIST.md`| Actionable Production Release Sign-Off Checklist |
| `INTENTLOCK_SDK/DEVELOPER_PORTAL_RELEASE_MANIFEST.md` | This File-by-File Inclusion & Exclusion Manifest |

---

## 3. Files Excluded from Release (EXCLUSION SCOPE / DO NOT STAGE)

The following files represent pre-existing work or unrelated development experiments and **must remain unstaged and uncommitted**:

| Path | Reason for Exclusion |
| :--- | :--- |
| `INTENTLOCK_SDK/backend/app/api/deps.py` | Pre-existing uncommitted authentication refactoring from prior session |
| `INTENTLOCK_SDK/frontend/next.config.ts` | Pre-existing uncommitted CSP security header configuration |
| `intentlock.db` | Local SQLite runtime database file containing local session data |
| `intentlock.db.bak` | Local SQLite database backup |
| `SECURITY_HEADERS_AUDIT.md` | Unrelated independent security audit report |
| `SECURITY_REMEDIATION_REPORT.md` | Unrelated independent remediation report |
| `INTENTLOCK_SDK/backend/tests/analyze_routes.py` | Temporary Phase 4 route analysis helper script |
| `INTENTLOCK_SDK/backend/tests/extract_matrix.py` | Temporary Phase 4 matrix helper script |
| `INTENTLOCK_SDK/backend/tests/generate_api_docs_data.py` | Generation script (catalog already committed in `api-reference-data.ts`) |
| `INTENTLOCK_SDK/backend/tests/generate_ts_data.py` | Generation script |
| `INTENTLOCK_SDK/backend/tests/inspect_deps.py` | Temporary dependency inspection script |
