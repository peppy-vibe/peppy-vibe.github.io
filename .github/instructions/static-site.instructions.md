---
description: "Use when editing portal pages, sub-app HTML/CSS/JS, the service worker, the manifest, robots.txt, or sitemap.xml. Covers static-site layout, theme, SEO, and DOM safety."
applyTo:
  - "index.html"
  - "contact.html"
  - "peppy-tools/**/*.html"
  - "peppy-tools/**/*.css"
  - "peppy-tools/**/*.js"
  - "peppy-form-extractor/**/*.html"
  - "peppy-form-extractor/**/*.css"
  - "peppy-form-extractor/**/*.js"
  - "peppy-spreadsheetql/**/*.html"
  - "peppy-spreadsheetql/**/*.css"
  - "peppy-spreadsheetql/**/*.js"
  - "robots.txt"
  - "sitemap.xml"
  - "peppy-tools/manifest.json"
  - "peppy-tools/sw.js"
---
# Static Site Guidelines

- Keep the site static and offline-friendly. Do not introduce a build step, server dependency, or client-side framework.
- Preserve the existing theme contract: `stp-theme` in `localStorage`, `data-theme` on `<html>`, and early theme initialization before first paint.
- Use safe DOM updates for any user-controlled string. Prefer `textContent`, DOM node creation, or `escHtml()` rather than raw `innerHTML`.
- Keep script execution predictable: preserve existing script ordering and use deferred loading patterns already used by the project.
- Keep paths relative and GitHub Pages friendly, especially for nested tool folders and shared assets.
- When you add, rename, or remove a tool, update the portal card list, sitemap, and README in the same change.
- Keep SEO metadata, canonical URLs, JSON-LD, and social meta tags aligned with the actual deployed routes.
- If you change a shared asset list or service-worker pre-cache list, review the cache version and offline behavior in the same slice.
- When a route or card changes, verify portal links, sitemap entries, and README route mentions before closing the task.
- Prefer shared utilities in `peppy-tools/lib/` over duplicated browser helpers.
- Preserve accessibility basics on touched pages (title/heading consistency, form labels, button names, and color contrast parity with existing theme tokens).
