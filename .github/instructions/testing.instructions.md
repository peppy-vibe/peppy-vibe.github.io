---
description: "Use when editing or adding Vitest tests for the Peppy Tools workspace. Covers deterministic tests for plain-JS utilities and browser-safe stubs."
applyTo:
  - "tests/**/*.js"
---
# Testing Guidelines

- Keep tests deterministic and fast. Avoid network access and avoid depending on a real browser unless the task specifically requires it.
- Continue using the current plain-JS loading pattern for source files when that is enough to exercise the code.
- Prefer testing pure helpers and extracted functions. Use lightweight DOM stubs only when necessary.
- Add regression coverage for bug fixes that affect shared utilities, parsing, safe HTML handling, or storage behavior.
- Keep assertions focused on behavior, not implementation details.
- For static-site behavior changes, favor tests around shared utilities in `peppy-tools/lib/` where deterministic unit coverage is possible.
- If a requested change is not practical to unit test, state why and list the manual verification performed.
