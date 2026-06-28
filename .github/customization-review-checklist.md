# Copilot Customization Review Checklist

Use this checklist when reviewing changes to agent, instruction, and skill files in .github.

## Frontmatter Validity
- [ ] YAML frontmatter is present and closes with matching --- markers.
- [ ] name values are stable and match the expected agent or skill identity.
- [ ] description uses clear trigger words users are likely to type.
- [ ] argument-hint is short and action-oriented when present.
- [ ] Description starts with explicit "Use when..." language for discovery quality.

## Scope and Loading
- [ ] applyTo patterns are specific, not global by default.
- [ ] applyTo covers real project paths (for example peppy-tools/sw.js and peppy-tools/manifest.json).
- [ ] Instructions do not unintentionally load for unrelated files.
- [ ] New skills and agents do not duplicate an existing customization without a clear distinction.

## Behavior Quality
- [ ] Constraints are explicit about scope, safety, and non-goals.
- [ ] Approach steps are sequential and practical.
- [ ] Output format defines what to report when there are no findings or no edits.
- [ ] Severity language is consistent for review-oriented agents.

## Consistency Across Customizations
- [ ] Terms are consistent across agents, instructions, and skills (tool names, route wording, docs names).
- [ ] Guidance does not conflict across files.
- [ ] Discoverability phrases in descriptions align with common requests (review, audit, implement, sync docs).
- [ ] Each agent and skill has explicit boundaries/non-goals to minimize ambiguous routing.

## Verification Before Merge
- [ ] Read all changed customization files end-to-end for wording conflicts.
- [ ] Confirm any referenced paths, routes, and counts against current code.
- [ ] Capture residual risks or known gaps in the PR summary.
- [ ] If behavior guidance changed, verify agent instructions and file instructions still agree.
