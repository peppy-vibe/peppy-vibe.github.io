# Changes Implemented

This document summarizes all roadmap items from notes/tech_review.md that were implemented in this pass.

## P0 Implemented
1. Disabled MD5 in Dev Tools hash flow and set SHA-256 as default.
- Updated UI options in dev-tools/index.html.
- Blocked MD5 execution path with explicit user-facing message in dev-tools/app.js.

2. Added safe storage wrappers and migrated high-risk call sites.
- Added safeStorageGet, safeStorageSet, safeStorageRemove in lib/shared-utils.js.
- Migrated theme persistence in lib/shared-ui.js.
- Migrated saved-list operations in people-tools/app.js with fallback alerts.
- Updated notepad draft read/write paths in advanced-notepad/app.js.

3. Hardened notepad preview sink.
- Added sanitizeRenderedHtml() in advanced-notepad/app.js.
- Applied sanitization immediately before preview-pane innerHTML assignment.

## P1 Implemented
1. Added page-range parser guardrails.
- Extended parsePageRanges in lib/pdf-utils.js with max token/span limits.
- Kept backward compatibility for existing call sites.

2. Improved service worker observability and failure handling.
- Added warning/error logging for CDN warmup failures and install failures.
- Added logging on runtime fetch/cache write failures in sw.js.

3. Added tests for new reliability/security guardrails.
- Extended tests/utils.test.js for:
  - safe storage helper success/failure behavior
  - parsePageRanges complexity limits
  - shared shuffle helper sanity

## P2 Implemented
1. Persisted stopwatch and countdown timer state across refresh.
- Added sessionStorage-backed state persistence and restoration in clock-tools/app.js.
- Restores running/paused states and UI controls on reload.

2. Started utility de-duplication using shared helpers.
- Added cryptoRandomFloat and shuffleArray to lib/shared-utils.js.
- Updated people-tools/app.js to consume shared random/shuffle helpers.

## Validation
- Ran unit tests: 31/31 passing (vitest).
- Ran editor diagnostics on all changed files: no reported errors.

## Human Review Required Before Merge
1. Product/security policy decision on SHA-1 visibility.
- SHA-1 remains selectable for compatibility workflows.
- If policy requires stronger defaults only, remove SHA-1 from UI as follow-up.

2. Service worker CDN list alignment.
- sw.js pre-cache list currently includes pdf-lib@1.17.1 while pdf-tools/index.html loads @cantoo/pdf-lib@2.6.2.
- Consider aligning to one source/version for predictable offline behavior.
