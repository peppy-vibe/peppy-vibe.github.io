# Customization Discovery Matrix

Date: 2026-06-01
Scope: .github agents, instructions, and skills for Peppy Tools
Purpose: Simulate realistic user prompts and map expected routing after hardening.

## Routing Rules Used
- Prefer the most specific customization matching user intent.
- Treat "implement/fix/build" as implementation intent.
- Treat "review/audit PR/find bugs" as read-only review intent.
- Treat "update docs/sync README/counts/URLs" as docs-maintenance intent.
- Treat requests mentioning `.github` customization files as customization-audit intent.

## Prompt Matrix (20 Dry-Run Samples)

| # | Example Prompt | Expected Primary Route | Secondary Route (if needed) | Ambiguity Risk | Confidence | Notes |
|---|---|---|---|---|---|---|
| 1 | "implement dark mode bug fix in random-tools" | Peppy Static Site Implementer | static-site.instructions.md | Low | High | Clear code implementation intent. |
| 2 | "review this PR for regressions and security" | Peppy Code Reviewer | peppy-static-audit | Low | High | PR + security terms strongly map to reviewer. |
| 3 | "sync README with actual tool routes" | Peppy Docs Maintainer | peppy-static-audit | Low | High | Docs-first with route verification. |
| 4 | "audit sitemap, canonical tags, and robots" | peppy-static-audit | Peppy Docs Maintainer | Medium | Medium | SEO nouns disambiguate static audit. |
| 5 | "fix service worker cache misses" | Peppy Static Site Implementer | peppy-static-audit | Low | High | Fix wording is explicit. |
| 6 | "find stale docs and wrong tool counts" | Peppy Docs Maintainer | peppy-static-audit | Low | High | Documentation drift language is explicit. |
| 7 | "review sw.js changes and test gaps" | Peppy Code Reviewer | peppy-static-audit | Medium | Medium | Could route to static audit without review cues. |
| 8 | "update agent descriptions so slash discovery works" | peppy-customization-audit | customization.instructions.md | Low | High | .github customization scope is explicit. |
| 9 | "why are my custom agents not invoked" | peppy-customization-audit | customization.instructions.md | Low | High | Discovery/debugging customization issue. |
| 10 | "implement fixes from your audit" | Peppy Static Site Implementer | Peppy Docs Maintainer | Medium | Medium | Requires sequential handoff. |
| 11 | "audit .github instructions for applyTo mistakes" | peppy-customization-audit | customization.instructions.md | Low | High | Explicit customization governance ask. |
| 12 | "clean up release notes and references docs" | Peppy Docs Maintainer | documentation.instructions.md | Low | High | Docs maintenance only. |
| 13 | "run a code quality audit across changed files" | Peppy Code Reviewer | peppy-static-audit | Medium | Medium | Generic audit wording. |
| 14 | "verify portal links and sitemap consistency" | peppy-static-audit | Peppy Docs Maintainer | Low | High | Static integrity check. |
| 15 | "add a new QR tool card and update route docs" | Peppy Static Site Implementer | Peppy Docs Maintainer | Low | High | Implementation plus docs sync. |
| 16 | "check for unsafe innerHTML usage in modified files" | Peppy Code Reviewer | peppy-static-audit | Low | High | Security-style read-only request. |
| 17 | "audit precache list and cache version bump in sw.js" | peppy-static-audit | Peppy Code Reviewer | Low | High | Static/offline integrity phrasing is direct. |
| 18 | "sync prompts and references with new product URLs" | Peppy Docs Maintainer | documentation.instructions.md | Low | High | Docs-only update. |
| 19 | "fix portal card link mismatch and broken route" | Peppy Static Site Implementer | peppy-static-audit | Low | High | Implementation wording + route bug. |
| 20 | "audit overlap between agents and skills in .github" | peppy-customization-audit | customization.instructions.md | Low | High | Customization-specific governance ask. |

## Ambiguity Hotspots
- The keyword "audit" is broad and may map to either code review or static integrity checks.
- Hybrid requests ("implement fixes from audit") require explicit sequential routing.
- Service-worker requests can be either read-only review or implementation depending on verbs.

## Hardening Actions Applied
- Added explicit non-goals/boundaries in all three Peppy agents.
- Added boundary sections to both Peppy audit skills.
- Added checklist requirement for explicit boundaries/non-goals.
- Refined descriptions to emphasize implementation vs review vs docs vs customization governance.

## Residual Risks
- Extremely short prompts (for example, "audit this") remain ambiguous without context.
- Multi-intent prompts may still require a brief clarification step when both edit and review are requested simultaneously.

## Recommendation
- Keep the matrix updated whenever agent descriptions or skill boundaries change.
- Add 5-10 real historical prompts from your team over time to continuously calibrate routing.
- Revisit any rows with `Medium` ambiguity after observing real prompt traffic.
- Use `.github/prompt-routing-cheat-sheet.md` as the first-stop prompt style guide for team members.
