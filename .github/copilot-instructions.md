# Peppy Tools Workspace Guidelines

## Pinned Quick Prompts
- Review only: Review this PR for regressions, security risks, and test gaps.
- Implement only: Fix the portal card route bug in peppy-tools and patch related JS.
- Docs only: Sync README.md, prompts, and references with current tool routes.
- Static audit only: Audit sitemap.xml, canonical metadata, robots.txt, and cache drift.
- Customization audit only: Audit .github agents, instructions, and skills for overlap and applyTo issues.
- Two-stage flow: Start with review findings, then run a separate implementation request.
- Use one scope token per prompt, for example PR, sw.js, README.md, or .github/agents.
- Avoid mixed intent prompts like review and implement everything in one message.
- For service worker work, say review sw.js diff for read-only checks or fix sw.js cache issue for code changes.
- Keep prompts explicit about intent so the correct agent or skill is selected on first pass.

## Code Style
- Keep changes small, local, and easy to review. Do not reformat unrelated files.
- Prefer plain HTML, CSS, and vanilla JavaScript. Do not introduce a framework or build step unless the task explicitly requires it.
- Preserve existing naming, script order, and event patterns unless you are deliberately refactoring that slice of the app.
- Use ASCII by default. Only introduce non-ASCII when the existing file already uses it or there is a clear user-facing need.
- Use `apply_patch` for manual edits.

## Architecture
- This workspace contains static sites and tools under `peppy-tools/`, plus sibling product sites such as `peppy-form-extractor/` and `peppy-spreadsheetql/`.
- Keep portal cards, tool folders, sitemap entries, and README feature lists aligned. If a tool is added, renamed, or removed, update the related portal metadata and docs together.
- Keep user data client-side. Do not add server-backed flows or external runtime dependencies unless the task explicitly asks for them.
- Preserve the current theme system (`stp-theme` and `data-theme`) and the existing service-worker cache-busting approach.
- Prefer shared helpers in `peppy-tools/lib/` over duplicated logic in individual tools.

## Build and Test
- Use `npm test` for the Vitest suite.
- For browser-facing changes, verify the touched HTML and JavaScript in a browser and check for console errors.
- If a change affects docs or release notes, update the root README and the relevant reference files together.

## Conventions
- Use `textContent`, DOM APIs, or `escHtml()` for user-controlled content.
- Keep relative paths correct for GitHub Pages, including nested tool directories.
- Use the existing CDN/SRI pattern and the local vendored Bootstrap assets already in the repo.
- Treat `README.md`, `prompts/`, and `references/` as source-of-truth docs. Keep counts, URLs, and feature lists accurate.

## Copilot Customization Hygiene
- Keep `.github/agents/`, `.github/instructions/`, and `.github/skills/` scopes precise and non-overlapping.
- Prefer explicit `Use when...` descriptions with search-friendly trigger words.
- When you change customization behavior, re-read related customization files for conflicts before finishing.
