/* ═══════════════════════════════════════════
   Shared PDF utility functions
   Used by pdf-tools and pdf-editor
═══════════════════════════════════════════ */
'use strict';

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload  = () => resolve(fr.result);
    fr.onerror = () => reject(new Error('Failed to read file'));
    fr.readAsArrayBuffer(file);
  });
}

function downloadBytes(bytes, filename) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 2000);
}

/** Strip .pdf extension from a filename string */
function stemName(name) {
  return name.replace(/\.pdf$/i, '');
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b };
}

/**
 * Parse a page-range string like "1, 3-5, 8" into a sorted array of
 * 0-based indices, clamped to [0, total).
 */
function parsePageRanges(str, total) {
  const indices = new Set();
  const parts = str.split(',').map(s => s.trim()).filter(Boolean);
  for (const part of parts) {
    if (part.includes('-')) {
      const [a, b] = part.split('-').map(s => parseInt(s.trim(), 10));
      if (isNaN(a) || isNaN(b)) return null;
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) {
        if (i >= 1 && i <= total) indices.add(i - 1);
      }
    } else {
      const n = parseInt(part, 10);
      if (isNaN(n)) return null;
      if (n >= 1 && n <= total) indices.add(n - 1);
    }
  }
  return [...indices].sort((a, b) => a - b);
}

function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1048576).toFixed(2) + ' MB';
}

/** Standard page dimensions in PDF points (1pt = 1/72 inch) */
const PAGE_SIZES = {
  A4:     [595.28, 841.89],
  Letter: [612, 792],
  Legal:  [612, 1008],
  A3:     [841.89, 1190.55],
  A5:     [419.53, 595.28],
};
