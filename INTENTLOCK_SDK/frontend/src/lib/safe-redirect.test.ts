// SICTACK — Automated Security Test Suite for Safe Redirect Validation
// Covers OWASP Open Redirect, Protocol-Relative, URI Scheme, and Normalization vectors

import assert from "node:assert/strict";
import { getSafeRedirect, DEFAULT_SAFE_FALLBACK } from "./safe-redirect.ts";

function runTests() {
  console.log("================================================================================");
  console.log("   SICTACK SAFE REDIRECT SECURITY TEST SUITE (STAGE 3C.2)                      ");
  console.log("================================================================================");

  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => void) {
    total++;
    try {
      fn();
      passed++;
      console.log(`  [PASS] ${name}`);
    } catch (err) {
      console.error(`  [FAIL] ${name}:`, err);
    }
  }

  // --- Suite 1: Valid Approved Destinations ---
  console.log("\n--- Suite 1: Valid Allowlisted Destinations ---");
  const validRoutes = [
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
    "/",
    "/developers",
    "/developers/quickstart",
    "/developers/sdk/decisions",
  ];

  for (const route of validRoutes) {
    test(`Allows valid destination: ${route}`, () => {
      assert.equal(getSafeRedirect(route), route);
    });
  }

  // --- Suite 2: External URLs & Protocol-Relative URLs ---
  console.log("\n--- Suite 2: External & Protocol-Relative URLs ---");
  const externalVectors = [
    "https://malicious.example",
    "http://malicious.example",
    "//malicious.example",
    "///malicious.example",
    "////malicious.example",
    "//malicious.example/soc",
    "http://127.0.0.1:8000/evil",
    "https://intentlock.attacker.com",
    "ftp://malicious.example",
  ];

  for (const vector of externalVectors) {
    test(`Rejects external vector: ${vector}`, () => {
      assert.equal(getSafeRedirect(vector), DEFAULT_SAFE_FALLBACK);
    });
  }

  // --- Suite 3: URI Schemes & Injection ---
  console.log("\n--- Suite 3: URI Scheme & Script Injection ---");
  const schemeVectors = [
    "javascript:alert(1)",
    "javascript:void(0)",
    "data:text/html,test",
    "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "blob:https://malicious.example",
    "/javascript:alert(1)",
  ];

  for (const vector of schemeVectors) {
    test(`Rejects URI scheme vector: ${vector}`, () => {
      assert.equal(getSafeRedirect(vector), DEFAULT_SAFE_FALLBACK);
    });
  }

  // --- Suite 4: Backslash Normalization & Windows Path Separators ---
  console.log("\n--- Suite 4: Backslash Normalization Attacks ---");
  const backslashVectors = [
    "/\\malicious.example",
    "\\malicious.example",
    "\\\\malicious.example",
    "/\\/malicious.example",
    "/soc\\evil",
    "/intents\\..\\evil",
  ];

  for (const vector of backslashVectors) {
    test(`Rejects backslash vector: ${vector}`, () => {
      assert.equal(getSafeRedirect(vector), DEFAULT_SAFE_FALLBACK);
    });
  }

  // --- Suite 5: URL Encoding & Double-Encoding Bypasses ---
  console.log("\n--- Suite 5: URL Encoding & Double-Encoding Vectors ---");
  const encodingVectors = [
    "%2F%2Fmalicious.example",
    "%252F%252Fmalicious.example",
    "/%2Fmalicious.example",
    "/%5Cmalicious.example",
    "%2F%5Cmalicious.example",
    "%252F%255Cmalicious.example",
    "/%2e%2e/etc/passwd",
    "/%00/evil",
    "/soc%0d%0aSet-Cookie:evil=1",
    "/soc%00",
  ];

  for (const vector of encodingVectors) {
    test(`Rejects encoded attack vector: ${vector}`, () => {
      assert.equal(getSafeRedirect(vector), DEFAULT_SAFE_FALLBACK);
    });
  }

  // --- Suite 6: Whitespace & Control Characters ---
  console.log("\n--- Suite 6: Whitespace & Control Characters ---");
  test("Trims and allows clean whitespace around valid destination", () => {
    assert.equal(getSafeRedirect("  /intents  "), "/intents");
  });

  test("Rejects internal whitespace in path", () => {
    assert.equal(getSafeRedirect("/in tents"), DEFAULT_SAFE_FALLBACK);
  });

  test("Rejects tab characters inside path", () => {
    assert.equal(getSafeRedirect("/soc\tevil"), DEFAULT_SAFE_FALLBACK);
  });

  test("Rejects newline characters inside path", () => {
    assert.equal(getSafeRedirect("/soc\nevil"), DEFAULT_SAFE_FALLBACK);
  });

  // --- Suite 7: Path Traversal & Normalization ---
  console.log("\n--- Suite 7: Path Traversal Vectors ---");
  const traversalVectors = [
    "/soc/../../malicious",
    "/agents/../policies/evil",
    "../soc",
    "/../soc",
    "/soc/.",
    "/./soc",
  ];

  for (const vector of traversalVectors) {
    test(`Rejects traversal vector: ${vector}`, () => {
      assert.equal(getSafeRedirect(vector), DEFAULT_SAFE_FALLBACK);
    });
  }

  // --- Suite 8: Null, Empty, and Unknown Routes ---
  console.log("\n--- Suite 8: Null, Empty, Unknown Routes & Loop Prevention ---");
  test("Rejects null destination", () => {
    assert.equal(getSafeRedirect(null), DEFAULT_SAFE_FALLBACK);
  });

  test("Rejects undefined destination", () => {
    assert.equal(getSafeRedirect(undefined), DEFAULT_SAFE_FALLBACK);
  });

  test("Rejects empty string", () => {
    assert.equal(getSafeRedirect(""), DEFAULT_SAFE_FALLBACK);
  });

  test("Rejects whitespace-only string", () => {
    assert.equal(getSafeRedirect("   "), DEFAULT_SAFE_FALLBACK);
  });

  test("Rejects unapproved internal route", () => {
    assert.equal(getSafeRedirect("/nonexistent-page"), DEFAULT_SAFE_FALLBACK);
  });

  test("Rejects /login to prevent redirect loops", () => {
    assert.equal(getSafeRedirect("/login"), DEFAULT_SAFE_FALLBACK);
  });

  test("Rejects /login with nested redirects", () => {
    assert.equal(getSafeRedirect("/login?redirect=/intents"), DEFAULT_SAFE_FALLBACK);
  });

  // --- Suite 9: Query String Sanitization ---
  console.log("\n--- Suite 9: Query String Sanitization ---");
  test("Preserves safe query parameter on allowlisted route", () => {
    assert.equal(getSafeRedirect("/intents?status=ACTIVE"), "/intents?status=ACTIVE");
  });

  test("Preserves multiple safe query parameters", () => {
    assert.equal(
      getSafeRedirect("/threats?filter=ACTIVE&severity=CRITICAL"),
      "/threats?filter=ACTIVE&severity=CRITICAL"
    );
  });

  test("Strips unsafe nested redirect parameter in query string", () => {
    assert.equal(getSafeRedirect("/intents?redirect=//evil.com"), "/intents");
  });

  test("Strips credential-like keys from query string", () => {
    assert.equal(getSafeRedirect("/soc?token=secret123&filter=all"), "/soc?filter=all");
  });

  test("Strips scheme characters from query parameter values", () => {
    assert.equal(getSafeRedirect("/intents?status=javascript:alert(1)"), "/intents");
  });

  console.log("\n================================================================================");
  console.log(`   TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
  console.log("================================================================================");

  if (passed !== total) {
    throw new Error(`Security test suite failed: ${total - passed} failures`);
  }
}

runTests();
