---
name: peppy-static-audit
description: "Use when auditing static-site integrity in Peppy Tools (tool counts, routes, SEO metadata, README facts, sitemap entries, and service-worker cache drift). Primarily read-first; implement changes only when explicitly requested."
argument-hint: "Audit the current site facts and documentation"
---
# Peppy Static Audit

## Trigger Phrases
- audit portal and sitemap drift
- verify canonical and robots metadata
- check tool count consistency
- inspect service worker cache drift
- validate route integrity across docs

## When to Use
- After adding, renaming, or removing a tool or route.
- After changing the portal, sitemap, README, or service worker.
- When you need to verify that docs and metadata still match the current codebase.

## Boundaries
- Use `Peppy Code Reviewer` for focused bug/security PR reviews.
- Use `Peppy Docs Maintainer` for docs-only rewrite/sync requests.
- Use `Peppy Static Site Implementer` when the user explicitly asks to implement fixes.

## Inputs
- A focused scope (tool name, folder, or route family) when possible.
- The source-of-truth files for that scope (portal page, tool folder, sitemap, README, service worker).

## Procedure
1. Read the portal, affected tool pages, and the current shared helpers.
2. Compare tool counts, route lists, canonical URLs, titles, and structured data against the docs.
3. Check README.md, prompts/, and references/ for stale numbers, names, or URLs.
4. Verify the service worker cache list and version if assets or routes changed.
5. Run the smallest available validation step for the touched slice (`npm test` when utility logic changed, otherwise focused manual verification).

## Audit Checklist
- Route integrity: portal cards and links match existing folders and index files.
- Search/SEO integrity: sitemap URLs, canonical tags, and social metadata point to live routes.
- Documentation integrity: README/prompts/references counts and names match current tools.
- Offline integrity: service worker pre-cache list covers required shell assets and uses an updated cache version when needed.
- Drift integrity: no duplicate or conflicting naming across docs and UI labels.

## Output
- A short summary of the mismatches found.
- A prioritized list of files that need updates.
- The validation performed (or why validation was not run).
- If no mismatches are found, explicitly state "No static drift found" and include residual risk.
