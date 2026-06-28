---
name: peppy-customization-audit
description: "Use when auditing or improving Copilot customizations in this repo (.github agents, instructions, skills, frontmatter validity, applyTo scope, and overlap/conflict checks). Not for runtime product bugs unrelated to customization files."
argument-hint: "Audit customization quality and consistency"
---
# Peppy Customization Audit

## Trigger Phrases
- audit .github customizations
- fix applyTo scope issues
- debug why custom agent is not invoked
- check overlap between agents and skills
- validate frontmatter and descriptions

## When to Use
- Before merging changes to `.github/agents/`, `.github/instructions/`, `.github/skills/`, or `.github/copilot-instructions.md`.
- When custom agents are not being discovered or are being invoked for the wrong tasks.
- When instructions seem to conflict or overload context.

## Boundaries
- Do not use this for website feature implementation, UI fixes, or product test failures.
- Escalate to domain agents once customization-level issues are resolved.

## Inputs
- The changed customization files and intended behavior.
- Nearby project conventions that those customizations should enforce.

## Procedure
1. Validate frontmatter quality: YAML structure, stable `name`, and clear `description` discovery language.
2. Check scope quality: `applyTo` patterns are specific, match real paths, and avoid accidental global loading.
3. Check responsibility boundaries: each agent/skill/instruction has a distinct purpose with minimal overlap.
4. Check behavior quality: constraints, approach steps, and output formats are practical and testable.
5. Check cross-file consistency: no contradictory guidance across instructions, agents, and workspace rules.

## Audit Checklist
- Discovery integrity: description phrases are specific enough to trigger correct loading.
- Scope integrity: patterns are precise and mapped to real project structure.
- Workflow integrity: output expectations include explicit fallback states (for example, "No findings").
- Conflict integrity: no two files prescribe incompatible actions for the same scenario.
- Maintenance integrity: review checklist and core instructions still reflect current customization architecture.

## Output
- A concise summary of the highest-impact issues found.
- A prioritized set of file-level updates.
- Residual risks and suggested follow-up checks.
