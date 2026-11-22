// SICTACK — Centralized Safe Redirect Validation Utility
// Fail-Closed Open Redirect Defense with Strict Route Allowlisting

/**
 * Default safe fallback destination when redirect parameter is missing, invalid, or malicious.
 */
export const DEFAULT_SAFE_FALLBACK = "/soc";

/**
 * Strict allowlist of approved internal application routes.
 * Routes like /login are explicitly excluded to prevent redirect loops.
 */
export const ALLOWED_REDIRECT_ROUTES: ReadonlySet<string> = new Set([
  // Core Protected Security Operations Consoles
  "/soc",
  "/agents",
  "/policies",
  "/approvals",
  "/audit",
  "/threats",
  "/intents",
  "/provenance",
  "/benchmark",
  "/test",
  "/team",

  // Public Root & Preview
  "/",
  "/design-preview",

  // Developer Documentation Portal
  "/developers",
  "/developers/api",
  "/developers/api/authentication",
  "/developers/api/reference",
  "/developers/architecture",
  "/developers/changelog",
  "/developers/concepts",
  "/developers/deployment",
  "/developers/examples",
  "/developers/installation",
  "/developers/integrations",
  "/developers/integrations/langchain",
  "/developers/integrations/langgraph",
  "/developers/integrations/mcp",
  "/developers/playground",
  "/developers/quickstart",
  "/developers/sdk",
  "/developers/sdk/decisions",
  "/developers/sdk/errors",
  "/developers/sdk/initialization",
  "/developers/sdk/tool-protection",
  "/developers/security",
  "/developers/troubleshooting",
]);

/**
 * Query parameter keys that are safe to preserve on internal redirects.
 * Sensitive keys (token, secret, apiKey, redirect, etc.) are strictly stripped.
 */
const SAFE_QUERY_PARAMS: ReadonlySet<string> = new Set([
  "status",
  "filter",
  "severity",
  "category",
  "tab",
  "q",
  "search",
  "page",
  "limit",
  "session_expired",
  "agent_id",
]);

/**
 * Multi-layer decode to catch double- or triple-encoded attack vectors.
 */
function recursivelyDecode(str: string, maxDepth: number = 3): string {
  let current = str;
  for (let i = 0; i < maxDepth; i++) {
    try {
      const decoded = decodeURIComponent(current);
      if (decoded === current) break;
      current = decoded;
    } catch {
      // Malformed URI encoding detected
      return "";
    }
  }
  return current;
}

/**
 * Validates and sanitizes a requested redirect destination against strict security invariants:
 * 1. Must be a non-empty string.
 * 2. Must not contain control characters, raw backslashes, or whitespace.
 * 3. Must not be protocol-relative (//) or external scheme (https:, http:, javascript:, data:).
 * 4. Must not contain directory traversal attempts (..).
 * 5. Must match an explicitly allowlisted internal application route.
 * 6. Must not target /login (redirect loop prevention).
 * 7. Query parameters (if present) are strictly filtered to safe keys only.
 *
 * @param destination - Untrusted candidate destination URL from query string or header.
 * @param fallback - Safe internal route if validation fails (defaults to /soc).
 * @returns An authorized, safe relative path.
 */
export function getSafeRedirect(
  destination: string | null | undefined,
  fallback: string = DEFAULT_SAFE_FALLBACK
): string {
  const safeFallback = ALLOWED_REDIRECT_ROUTES.has(fallback) ? fallback : DEFAULT_SAFE_FALLBACK;

  if (!destination || typeof destination !== "string") {
    return safeFallback;
  }

  const trimmed = destination.trim();
  if (!trimmed) {
    return safeFallback;
  }

  // Reject control characters (0x00 - 0x1F, 0x7F) and any whitespace within the string
  if (/[\x00-\x1F\x7F\s]/.test(trimmed)) {
    return safeFallback;
  }

  // Reject any backslashes (raw or encoded) to neutralize Windows / browser normalization bypasses
  if (trimmed.includes("\\")) {
    return safeFallback;
  }

  // Inspect recursive decoded content for hidden backslashes, control characters, or bypass attempts
  const decoded = recursivelyDecode(trimmed);
  if (!decoded || /[\x00-\x1F\x7F\s\\]/.test(decoded)) {
    return safeFallback;
  }

  // Must begin with a single slash and must NOT begin with protocol-relative "//" or "/\"
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return safeFallback;
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.startsWith("/\\")) {
    return safeFallback;
  }

  // Disallow any scheme indicators before query/fragment (e.g. javascript:, data:, https:)
  const beforeQuery = trimmed.split(/[?#]/)[0];
  const decodedBeforeQuery = decoded.split(/[?#]/)[0];
  if (beforeQuery.includes(":") || decodedBeforeQuery.includes(":")) {
    return safeFallback;
  }

  // Disallow path traversal sequences (".." or "/./")
  const pathSegments = decodedBeforeQuery.split("/");
  for (const segment of pathSegments) {
    if (segment === ".." || segment === ".") {
      return safeFallback;
    }
  }

  // Normalize path portion (strip any trailing slash for non-root paths)
  let normalizedPath = beforeQuery;
  if (normalizedPath.length > 1 && normalizedPath.endsWith("/")) {
    normalizedPath = normalizedPath.slice(0, -1);
  }

  // Explicit loop prevention: /login is strictly forbidden as a post-login destination
  if (normalizedPath === "/login" || normalizedPath.startsWith("/login/")) {
    return safeFallback;
  }

  // Enforce strict allowlist matching
  if (!ALLOWED_REDIRECT_ROUTES.has(normalizedPath)) {
    return safeFallback;
  }

  // Handle query parameters safely if present
  const questionMarkIndex = trimmed.indexOf("?");
  if (questionMarkIndex !== -1) {
    const rawQueryString = trimmed.slice(questionMarkIndex + 1).split("#")[0];
    if (rawQueryString) {
      try {
        const searchParams = new URLSearchParams(rawQueryString);
        const safeParams = new URLSearchParams();

        for (const [key, value] of searchParams.entries()) {
          const lowerKey = key.toLowerCase();
          // Filter to allowed query keys and sanitize value against scheme injection
          if (
            SAFE_QUERY_PARAMS.has(lowerKey) &&
            value.length <= 100 &&
            !value.includes(":") &&
            !value.includes("//") &&
            !value.includes("\\") &&
            !/[\x00-\x1F\x7F]/.test(value)
          ) {
            safeParams.set(key, value);
          }
        }

        const safeQuery = safeParams.toString();
        if (safeQuery) {
          return `${normalizedPath}?${safeQuery}`;
        }
      } catch {
        // Query parsing failure: discard query and return safe normalized path
        return normalizedPath;
      }
    }
  }

  return normalizedPath;
}
