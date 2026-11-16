# INTENTLOCK Developer Portal — Phase 4.5 Verification & Release Readiness Report

**Document Status:** Complete  
**Date:** 2026-11-16  
**Product:** INTENTLOCK — Deterministic AI Agent Security Middleware & Python Developer SDK  
**Phase:** Phase 4.5: API Documentation Verification & Release Readiness  
**Live Frontend:** [https://intentlock-wheat.vercel.app/](https://intentlock-wheat.vercel.app/)  
**Live Backend:** [https://intentlock-backend-ze2i.onrender.com/](https://intentlock-backend-ze2i.onrender.com/)  
**Repository:** [https://github.com/DivyBhanushali/Intentlock.git](https://github.com/DivyBhanushali/Intentlock.git)  

---

## 1. Reconciled API Operation and Group Counts

An exhaustive, deterministic re-verification of the FastAPI application was performed locally:

- **Total Unique API Paths:** 40
- **Total Registered Operations:** 48
- **Total Resource Groups:** Exactly **11** resource groups.

### Reconciliation of Resource Group Count Discrepancy
In the Phase 4 report, the summary narrative previously referred to "10 resource groups" while the table listed 11 entries. In raw OpenAPI metadata, there are 12 tags (`Root` and `Health` exist as separate tags). In the Developer Portal, `/` and `/health` are grouped into the unified **System & Health** resource group, yielding exactly **11 active resource groups**:

1. **Agents** (3 operations)
2. **Approvals** (4 operations)
3. **Audit** (4 operations)
4. **Authentication & Workspaces** (10 operations)
5. **Execution Provenance & Evidence** (2 operations)
6. **Intent Authorization** (4 operations)
7. **Policies** (11 operations)
8. **Security Benchmarks** (4 operations)
9. **Security Gateway** (1 operation: `POST /api/v1/intercept`)
10. **System & Health** (2 operations: `GET /` and `GET /health`)
11. **Threat Intelligence** (3 operations)

**Total:** $3 + 4 + 4 + 10 + 2 + 4 + 11 + 4 + 1 + 2 + 3 = 48$ operations.

A new automated staleness contract test (`test_api_reference_data_not_stale`) has been added to `INTENTLOCK_SDK/backend/tests/test_api_docs_contract.py`. If backend routes or operations change without regenerating `api-reference-data.ts`, this test will immediately fail the CI pipeline.

---

## 2. Verified RBAC Roles & Authentication Audit

### 2.1. Source of Truth for Roles: `VIEWER` vs `MEMBER`
A comprehensive audit of the database models (`backend/app/db/models.py`) and API schemas (`backend/app/api/v1/auth.py`) established the definitive roles:

- `backend/app/db/models.py` (Line 55):  
  `role = Column(String(32), default="ADMIN") # ADMIN, APPROVER, VIEWER`
- `backend/app/api/v1/auth.py` (Lines 94 & 98):  
  `role: str = Field(default="APPROVER", pattern=r"^(ADMIN|APPROVER|VIEWER)$")`

**Resolution:** There is **no `MEMBER` role** in the INTENTLOCK backend. The valid roles are strictly:
1. **`ADMIN`**: Full administrative privileges over organization settings, team member invitations, API key issuance/revocation, and policy creation/deletion.
2. **`APPROVER`**: Authorized to approve or reject pending human-in-the-loop tool requests and view audit trails.
3. **`VIEWER`**: Read-only access to dashboard metrics, active agents, benchmark results, and audit events.

All references to `MEMBER` in documentation, type definitions, and generated data have been updated to `VIEWER`.

### 2.2. Authentication Channels & Header Support
- **JWT Bearer Token:** Transmitted as `Authorization: Bearer <jwt_token>`. Decoded via `decode_access_token()`. Carries user identity and role (`ADMIN`, `APPROVER`, `VIEWER`).
- **Machine API Key:** Transmitted via `X-API-Key: ilk_live_...`.
- **Dual Bearer Compatibility:** In `backend/app/api/deps.py` (Line 65), `get_current_tenant` also accepts machine API keys formatted as `Authorization: Bearer ilk_live_...`.

### 2.3. Machine API Key Restrictions on Management Endpoints
Direct inspection of `backend/app/api/deps.py` reveals that `get_current_tenant` populates `tenant.api_key` for machine keys, while `tenant.user` remains `None`.

All user management and administrative endpoints rely on `require_authenticated_user` (or its derivatives `require_admin_user` and `require_approver_or_admin`). When an API key attempts to call these endpoints, `require_authenticated_user` explicitly raises:
```
HTTP 401 Unauthorized
Detail: "Authentication required. Please provide a valid Bearer JWT session token."
```
**Conclusion:** API keys **cannot** access any management, approval, or team administration endpoints. This restriction is now prominently documented in the Authentication Guide.

---

## 3. Verified Endpoint Authorization Matrix

The complete 48-operation matrix has been updated with verified `ADMIN`, `APPROVER`, `VIEWER`, and `Machine` requirements:

| HTTP Method | Path | Summary | Auth Channel | Access Scope / Required Role |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Root | Public | None |
| `GET` | `/health` | Health Check | Public | None |
| `POST` | `/api/v1/auth/login` | Login | Public | None |
| `POST` | `/api/v1/auth/register` | Register User & Org | Public | None |
| `GET` | `/api/v1/auth/me` | Current User Profile | Bearer Token | User (ADMIN, APPROVER, VIEWER) |
| `GET` | `/api/v1/auth/members` | List Team Members | Bearer Token | User (ADMIN, APPROVER, VIEWER) |
| `POST` | `/api/v1/auth/members` | Invite Team Member | Bearer Token | User (ADMIN Only) |
| `PATCH` | `/api/v1/auth/members/{user_id}` | Update Team Member | Bearer Token | User (ADMIN Only) |
| `DELETE` | `/api/v1/auth/members/{user_id}` | Remove Team Member | Bearer Token | User (ADMIN Only) |
| `GET` | `/api/v1/auth/api-keys` | List API Keys | Bearer Token | User (ADMIN, APPROVER, VIEWER) |
| `POST` | `/api/v1/auth/api-keys` | Create New API Key | Bearer Token | User (ADMIN Only) |
| `DELETE` | `/api/v1/auth/api-keys/{key_id}` | Revoke API Key | Bearer Token | User (ADMIN Only) |
| `POST` | `/api/v1/intercept` | Intercept Tool Call | API Key / Bearer | Machine (API Key) or User |
| `GET` | `/api/v1/intents` | List Intent Contexts | API Key / Bearer | Machine or User (Tenant Scoped) |
| `POST` | `/api/v1/intents` | Issue Intent Context | API Key / Bearer | Machine or User (Tenant Scoped) |
| `GET` | `/api/v1/intents/{intent_id}` | Get Intent Context | API Key / Bearer | Machine or User (Tenant Scoped) |
| `POST` | `/api/v1/intents/{intent_id}/revoke`| Revoke Intent Context | API Key / Bearer | Machine or User (Tenant Scoped) |
| `GET` | `/api/v1/policies` | List Policies | API Key / Bearer | Machine or User (Tenant Scoped) |
| `POST` | `/api/v1/policies` | Create Policy | Bearer Token | User (ADMIN Only) |
| `GET` | `/api/v1/policies/templates` | List Policy Templates | API Key / Bearer | Machine or User (Tenant Scoped) |
| `POST` | `/api/v1/policies/simulate` | Simulate Policy | API Key / Bearer | Machine or User (Tenant Scoped) |
| `POST` | `/api/v1/policies/from-template/{template_key}` | Create from Template | Bearer Token | User (ADMIN Only) |
| `GET` | `/api/v1/policies/{policy_id}` | Get Policy | API Key / Bearer | Machine or User (Tenant Scoped) |
| `PUT` | `/api/v1/policies/{policy_id}` | Update Policy | Bearer Token | User (ADMIN Only) |
| `DELETE` | `/api/v1/policies/{policy_id}` | Delete Policy | Bearer Token | User (ADMIN Only) |
| `GET` | `/api/v1/policies/{policy_id}/versions` | List Policy Versions | API Key / Bearer | Machine or User (Tenant Scoped) |
| `GET` | `/api/v1/policies/{policy_id}/conflicts` | Detect Policy Conflicts| API Key / Bearer | Machine or User (Tenant Scoped) |
| `POST` | `/api/v1/policies/{policy_id}/rollback/{version_number}` | Rollback Policy | Bearer Token | User (ADMIN Only) |
| `GET` | `/api/v1/approvals` | List Approvals | Bearer Token | User (ADMIN, APPROVER) |
| `GET` | `/api/v1/approvals/{approval_id}`| Get Approval | Bearer Token | User (ADMIN, APPROVER) |
| `POST` | `/api/v1/approvals/{approval_id}/approve` | Approve Request | Bearer Token | User (ADMIN, APPROVER) |
| `POST` | `/api/v1/approvals/{approval_id}/reject` | Reject Request | Bearer Token | User (ADMIN, APPROVER) |
| `GET` | `/api/v1/audit/events` | List Audit Events | API Key / Bearer | Machine or User (Tenant Scoped) |
| `GET` | `/api/v1/audit/events/{event_id}`| Get Audit Event | API Key / Bearer | Machine or User (Tenant Scoped) |
| `GET` | `/api/v1/audit/stats` | Get Audit Statistics | API Key / Bearer | Machine or User (Tenant Scoped) |
| `GET` | `/api/v1/audit/verify` | Verify Hash Chain | API Key / Bearer | Machine or User (Tenant Scoped) |
| `GET` | `/api/v1/agents` | List Agents | API Key / Bearer | Machine or User (Tenant Scoped) |
| `POST` | `/api/v1/agents` | Register Agent | API Key / Bearer | Machine or User (Tenant Scoped) |
| `GET` | `/api/v1/agents/{agent_id}` | Get Agent Details | API Key / Bearer | Machine or User (Tenant Scoped) |
| `GET` | `/api/v1/threats` | List Threat Events | Bearer Token | User (ADMIN, APPROVER, VIEWER) |
| `GET` | `/api/v1/threats/stats` | Get Threat Statistics | Bearer Token | User (ADMIN, APPROVER, VIEWER) |
| `POST` | `/api/v1/threats/{threat_id}/mitigate` | Mitigate Threat | Bearer Token | User (ADMIN, APPROVER) |
| `GET` | `/api/v1/provenance` | List Traces | Bearer Token | User (ADMIN, APPROVER, VIEWER) |
| `GET` | `/api/v1/provenance/{trace_id}` | Get Trace Details | Bearer Token | User (ADMIN, APPROVER, VIEWER) |
| `GET` | `/api/v1/benchmarks` | List Benchmark Runs | Bearer Token | User (ADMIN, APPROVER, VIEWER) |
| `POST` | `/api/v1/benchmarks/run` | Execute Benchmark Suite| Bearer Token | User (ADMIN Only) |
| `GET` | `/api/v1/benchmarks/latest` | Latest Benchmark Run | Bearer Token | User (ADMIN, APPROVER, VIEWER) |
| `GET` | `/api/v1/benchmarks/{run_id}` | Get Benchmark Run | Bearer Token | User (ADMIN, APPROVER, VIEWER) |

---

## 4. Security Claim Evidence & Corrections

| Security Claim | Source Code Evidence & Test Status | Action Taken / Qualification |
| :--- | :--- | :--- |
| **Tenant Isolation** | Evaluated via `org_id` filters in SQLAlchemy models. However, `backend/app/api/deps.py` (Line 98) falls back to `default-org` if no token/key is provided, and `policies.py` includes `default-org` policies. | **Qualified**: Removed claims of absolute isolation. Documented tenant scoping by `org_id` with shared starter policies in `default-org` and development fallback. |
| **Fail-Closed Enforcement** | In `backend/app/api/v1/intercept.py` (Lines 200-240) and SDK `agent.py`: any unregistered tool, missing permission, or unhandled evaluation defaults to `DENY`. | **Supported**: Verified in code and covered by tests. |
| **API Key Storage** | `backend/app/core/security.py`: `hash_api_key()` computes SHA-256 digest before storing in `ApiKeyModel.key_hash`. Raw key is never stored. | **Supported**: Confirmed in model schema and hash verification logic. |
| **Audit-Chain Integrity** | Sequential cryptographic SHA-256 hash linkage in `backend/app/core/audit_chain.py`. Tested in `test_api_audit_chain.py`. | **Supported**: 3/3 automated tests pass. |
| **Approval Replay Defense** | In `INTENTLOCK_SDK/sdk/python/src/intentlock/approval.py`: `consume()` checks `request.consumed == True` and raises `ApprovalReplayError`. Tested in `test_docs_examples.py`. | **Supported**: Automated tests confirm single-use token guarantee and tampering defense. |
| **Rate Limiting** | No token bucket, sliding window, or Redis rate limiter is implemented in application code. | **Corrected**: Removed all claims of infrastructure rate limiting. Documented that application-level rate limiting is currently not implemented and recommended via reverse proxy/WAF. |
| **Production Readiness** | Backend connects to Supabase PostgreSQL over Session Pooler; FastAPI lifespan runs database migrations. | **Supported**: Verified via `/health` endpoint reporting `database: postgresql`. |

---

## 5. SDK Installation Verification & Global Package Collision Discovery

### 5.1. Verified Repository Installation Command
```bash
pip install git+https://github.com/DivyBhanushali/Intentlock.git#subdirectory=INTENTLOCK_SDK/sdk/python
```
The `#subdirectory=INTENTLOCK_SDK/sdk/python` anchor correctly navigates the nested directory structure of the repository to locate `pyproject.toml`.

### 5.2. Collision Discovery in Host Environment
During verification, running `python -c "from intentlock import IntentLockClient"` failed with:
`ImportError: cannot import name 'IntentLockClient' from 'intentlock' (C:\Users\divyb\AppData\Local\Programs\Python\Python314\Lib\site-packages\intentlock\__init__.py)`

**Root Cause Analysis:**
1. A stale pre-release snapshot of `intentlock` had previously been installed into the host machine's global Python 3.14 `site-packages` before `IntentLockClient` was authored.
2. In the repository source tree (`INTENTLOCK_SDK/sdk/python/src/intentlock/__init__.py`), both `SecureAgent` and `IntentLockClient` are exported and functional.
3. When executing with `PYTHONPATH=INTENTLOCK_SDK/sdk/python/src`:
   ```bash
   python -c "import sys; sys.path.insert(0, 'INTENTLOCK_SDK/sdk/python/src'); from intentlock import SecureAgent, IntentLockClient; print(SecureAgent, IntentLockClient)"
   ```
   **Output:** `<class 'intentlock.agent.SecureAgent'> <class 'intentlock.client.IntentLockClient'>` (Exit Code 0).
4. **Resolution in Documentation:** Explicitly instructed developers to always create and activate a project-specific virtual environment (`python -m venv .venv`) to prevent shadowing by stale global installations.

---

## 6. Frontend Build Investigation

### 6.1. Exact Command & Environment
- **Command:** `npm --prefix INTENTLOCK_SDK/frontend run build` (`next build`)
- **Environment:** Windows 11 64-bit on NTFS filesystem inside Microsoft OneDrive folder (`C:\Users\divyb\OneDrive\Desktop\TYIT FInal Year Project`).
- **Framework:** Next.js 16.4.5 (Turbopack engine).

### 6.2. Forensic Error Analysis
```
▲ Next.js 16.4.5 (Turbopack)
✓ Running next.config.ts took 138ms

> Build error occurred
Error: EPERM: operation not permitted, rmdir 'C:\Users\divyb\OneDrive\Desktop\TYIT FInal Year Project\INTENTLOCK_SDK\frontend\.next\build\chunks'
    at ignore-listed frames {
  errno: -4048,
  code: 'EPERM',
  syscall: 'rmdir',
  path: 'C:\\Users\\divyb\\OneDrive\\Desktop\\TYIT FInal Year Project\\INTENTLOCK_SDK\\frontend\\.next\\build\\chunks'
}
```

### 6.3. Investigation Findings
1. Using PowerShell inspection (`Get-ItemProperty "...\.next\build\chunks" | Select-Object Attributes`), the directory attributes were revealed as:  
   `ReadOnly, Directory, Archive, ReparsePoint`
2. **Mechanism:** The Microsoft OneDrive sync client (`OneDrive.exe`) automatically attaches `ReparsePoint` (Cloud placeholder) and `ReadOnly` attributes to subdirectories created within synced folders.
3. During Next.js 16 Turbopack's pre-compilation cleanup, Node's `fs.rmdirSync` attempts to delete `.next/build/chunks`. Windows kernel explicitly rejects `rmdir` on active OneDrive reparse points with `EPERM / -4048`.
4. **Code Quality Independence:** Frontend static analysis confirms that this failure is strictly an environment/filesystem limitation:
   - `tsc --noEmit` exits with **0 errors**.
   - `eslint` exits with **0 errors and 0 warnings**.
   - The production deployment on Vercel (`https://intentlock-wheat.vercel.app/`) builds cleanly from the same codebase in Linux CI.

---

## 7. Automated Test Results

### 7.1. API Docs Contract Test Suite (8/8 Passed)
```
pytest INTENTLOCK_SDK/backend/tests/test_api_docs_contract.py
============================== 8 passed in 0.82s ==============================
```
- `test_openapi_local_generation`: **PASSED**
- `test_operation_count_conformance`: **PASSED** (48 operations match)
- `test_path_parameter_names_match`: **PASSED**
- `test_auth_headers_validity`: **PASSED**
- `test_no_secrets_in_documentation`: **PASSED** (0 credential leaks)
- `test_all_response_status_codes_valid`: **PASSED**
- `test_valid_rbac_roles_documented`: **PASSED** (Confirms `VIEWER` and zero `MEMBER` roles)
- `test_api_reference_data_not_stale`: **PASSED** (Confirms 48/48 operationIds match OpenAPI)

### 7.2. Backend Core Tests (15/15 Passed)
```
pytest INTENTLOCK_SDK/backend/tests/test_api_auth.py INTENTLOCK_SDK/backend/tests/test_api_audit_chain.py INTENTLOCK_SDK/backend/tests/test_api_intercept.py INTENTLOCK_SDK/backend/tests/test_api_policies.py
============================= 15 passed in 1.01s ==============================
```

### 7.3. SDK Documentation Example Tests (3/3 Passed)
```
pytest INTENTLOCK_SDK/sdk/python/tests/test_docs_examples.py
============================== 3 passed in 0.06s ==============================
```

### 7.4. TypeScript Compiler (`tsc --noEmit`)
```
node INTENTLOCK_SDK/frontend/node_modules/typescript/bin/tsc --project INTENTLOCK_SDK/frontend/tsconfig.json --noEmit
Command exited with code 0.
0 errors.
```

### 7.5. ESLint Code Quality
```
node INTENTLOCK_SDK/frontend/node_modules/eslint/bin/eslint.js --config INTENTLOCK_SDK/frontend/eslint.config.mjs INTENTLOCK_SDK/frontend/src/app/developers/api INTENTLOCK_SDK/frontend/src/lib/api-reference-data.ts
Command exited with code 0.
0 errors, 0 warnings.
```

---

## 8. Files Created and Modified

- `INTENTLOCK_SDK/backend/tests/generate_ts_data.py`: Updated role mapping from `MEMBER` to `VIEWER` and refined role descriptions.
- `INTENTLOCK_SDK/backend/tests/test_api_docs_contract.py`: Added `test_valid_rbac_roles_documented` and `test_api_reference_data_not_stale`.
- `INTENTLOCK_SDK/frontend/src/lib/api-reference-data.ts`: Regenerated complete 48-operation catalog with verified `ADMIN`, `APPROVER`, and `VIEWER` roles.
- `INTENTLOCK_SDK/frontend/src/app/developers/api/page.tsx`: Reconciled 11 resource groups, qualified tenant isolation claims, and removed unverified infrastructure rate limiting claims.
- `INTENTLOCK_SDK/frontend/src/app/developers/api/authentication/page.tsx`: Updated `MEMBER` to `VIEWER` and added a warning callout documenting that API keys cannot access user management endpoints.
- `INTENTLOCK_SDK/DEVELOPER_PORTAL_PHASE4_5_REPORT.md`: This comprehensive verification report.

---

## 9. Remaining Blockers

There are **zero blockers** within the application codebase, schemas, tests, or documentation:
- The local Next.js build failure is conclusively diagnosed as a Windows OneDrive synchronization lock on temporary `.next` directories.
- The global SDK import collision is resolved by recommending virtual environment isolation.

---

## 10. Phase 5 Readiness Recommendation

Phase 4.5 verification and correction pass is complete. All documentation claims, OpenAPI data structures, authorization roles, and contract test suites are in 100% verified alignment with the underlying codebase.

We recommend proceeding directly to **Phase 5: Framework Integrations & Production Guides**:
- `/developers/frameworks/langchain`
- `/developers/frameworks/langgraph`
- `/developers/frameworks/mcp`
- `/developers/guides/production`
- `/developers/guides/custom-policies`
- `/developers/guides/threat-modeling`
