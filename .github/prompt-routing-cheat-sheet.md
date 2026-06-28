# Prompt Routing Cheat Sheet

Date: 2026-06-01
Scope: Peppy Tools Copilot agents, instructions, and skills
Goal: Help users phrase requests so the intended route is selected on first try.

## Quick Rule
- Start with the action verb that matches intent.
- Include one concrete scope token (for example: PR, sw.js, README.md, .github/agents).
- If the task has two intents, split into two requests.

## Route Selection by Intent

### 1) Implementation Route
Primary: Peppy Static Site Implementer
Use verbs: implement, fix, patch, add, update behavior, wire
Add scope tokens: HTML, CSS, JS, sw.js, manifest.json, portal card, route, PWA

Good examples:
- "Fix portal card link mismatch in peppy-tools/index.html and patch related route logic."
- "Implement sw.js precache update for the new tool route."
- "Add a new tool card and wire the route end to end."

Avoid:
- "Audit this" (too broad)
- "Review and implement everything" (two intents)

### 2) Read-Only Review Route
Primary: Peppy Code Reviewer
Use verbs: review, audit PR, assess, check regressions, find gaps
Add scope tokens: PR, changed files, security, unsafe DOM, test gaps, regressions

Good examples:
- "Review this PR for security regressions and test gaps."
- "Check changed files for unsafe DOM updates and route regressions."
- "Review sw.js diff for cache/versioning risk."

Avoid:
- "Fix issues you find" in the same request (split into follow-up implementation request)

### 3) Documentation Sync Route
Primary: Peppy Docs Maintainer
Use verbs: sync docs, update docs, correct counts, refresh URLs
Add scope tokens: README.md, prompts/, references/, release notes, route strings

Good examples:
- "Sync README.md and references with current tool routes."
- "Correct stale tool counts across prompts/ and references/."
- "Refresh release notes and product URLs in docs only."

Avoid:
- "Also change app behavior" in the same request (split request)

### 4) Static Integrity Audit Route
Primary: peppy-static-audit skill
Use verbs: verify integrity, audit drift, validate metadata, check consistency
Add scope tokens: sitemap.xml, robots.txt, canonical, JSON-LD, cache drift, portal links

Good examples:
- "Audit sitemap.xml, canonical tags, and robots.txt for route drift."
- "Validate portal links and sitemap consistency across current tools."
- "Inspect service-worker cache drift and offline shell integrity."

Avoid:
- "Implement fixes now" unless you want an implementation pass in a second request

### 5) Customization Governance Route
Primary: peppy-customization-audit skill
Use verbs: audit customizations, debug discovery, validate frontmatter, fix applyTo
Add scope tokens: .github/agents, .github/instructions, .github/skills, copilot-instructions

Good examples:
- "Audit .github customizations for overlap and applyTo scope mistakes."
- "Debug why Peppy agents are not being discovered in chat."
- "Validate frontmatter and trigger descriptions across .github/agents."

Avoid:
- Product runtime bug requests (not customization scope)

## Two-Stage Pattern (Best Practice)
Use this when you want review plus changes:
1. "Review changed files for regressions and security risks." (Reviewer)
2. "Implement fixes for findings 1 and 2 only." (Implementer)
3. "Sync README and references for any route changes." (Docs Maintainer)

## Disambiguation Tokens
When prompts are short, add one of these tokens:
- Review token: PR, regressions, test gaps, findings only
- Implement token: fix, patch, update behavior, modify code
- Docs token: README.md, prompts/, references/, docs only
- Static audit token: sitemap.xml, canonical, robots.txt, cache drift
- Customization token: .github/agents, applyTo, frontmatter, discovery

## High-Signal Prompt Starters
- "Review only: ..."
- "Implement only: ..."
- "Docs only: ..."
- "Audit integrity only: ..."
- "Audit customizations only: ..."

## Maintenance Note
When agent descriptions or skill boundaries change, update this cheat sheet and the discovery matrix together.
