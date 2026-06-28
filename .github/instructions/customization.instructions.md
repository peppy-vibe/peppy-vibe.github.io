---
description: "Use when editing Copilot customization files in .github (agents, instructions, skills, and copilot-instructions) to keep frontmatter valid, scopes precise, and guidance non-conflicting."
applyTo:
  - ".github/copilot-instructions.md"
  - ".github/customization-review-checklist.md"
  - ".github/agents/**/*.agent.md"
  - ".github/instructions/**/*.instructions.md"
  - ".github/skills/**/SKILL.md"
---
# Customization Guidelines

- Keep frontmatter minimal, valid YAML, and stable over time (`name`, `description`, and `argument-hint` where needed).
- Start descriptions with clear "Use when..." language and include realistic trigger words users type in chat.
- Keep instruction `applyTo` globs specific. Avoid broad patterns unless the rule truly applies across the workspace.
- Avoid duplicate responsibility across agents, instructions, and skills. If overlap is required, state the boundary explicitly.
- Prefer concrete operational guidance over abstract style statements.
- For review-oriented customizations, require severity ordering and explicit "No findings" behavior.
- For implementer-oriented customizations, require validation reporting (`npm test` and/or manual checks) plus residual risk.
- Re-read related customization files after edits to ensure guidance does not conflict.
