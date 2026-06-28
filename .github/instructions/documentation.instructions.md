---
description: "Use when editing README.md, prompts/, references/, or other project documentation. Keeps project facts, counts, URLs, and feature lists aligned with the codebase."
applyTo:
  - "README.md"
  - "prompts/**/*.md"
  - "prompts/**/*.txt"
  - "references/**/*.md"
  - "references/**/*.txt"
---
# Documentation Guidelines

- Verify facts against the current codebase before changing prose. Do not rely on stale counts or memory.
- Update related documents together when a route, feature count, folder structure, or brand string changes.
- Prefer rewriting stale sections over layering contradictory notes.
- Keep changelog or review notes explicit about whether they are current guidance or archived snapshots.
- Keep docs concise and scannable. Prefer concrete facts, current routes, and verified counts over marketing language.
- Use real paths and current filenames when referencing files or folders.
- When stating tool counts or route lists, verify against the filesystem and current portal/sitemap entries in the same pass.
- If docs mention SEO or PWA behavior, cross-check against `sitemap.xml`, `robots.txt`, `peppy-tools/manifest.json`, and `peppy-tools/sw.js` before closing edits.
- Include unresolved mismatches explicitly instead of silently leaving stale statements.
