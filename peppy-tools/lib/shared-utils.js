/* ═══════════════════════════════════════════
   Shared Utility Functions
   Used by multiple tool pages.
═══════════════════════════════════════════ */
'use strict';

/**
 * Escape user-supplied text for safe insertion into innerHTML templates.
 * Covers &, <, >, ", and ' to prevent both element and attribute XSS.
 */
function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/** Alias for modules that use the longer name */
const escapeHtml = escHtml;
