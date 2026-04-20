import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

/*
 * Load plain-JS source files by evaluating them in a controlled scope.
 * This avoids needing to convert the codebase to ES modules.
 */

function loadFunctions(relativePath, fnNames) {
  const code = readFileSync(join(__dirname, '..', relativePath), 'utf8');
  const exports = {};
  // Build a wrapper that captures the named functions
  const wrapper = `${code}\nreturn { ${fnNames.join(', ')} };`;
  const fn = new Function('document', 'window', 'navigator', wrapper);
  return fn({}, {}, {});
}

/* ───── pdf-utils.js ───── */
const pdfUtils = loadFunctions('lib/pdf-utils.js', [
  'fmtBytes', 'parsePageRanges', 'hexToRgb', 'stemName',
]);

describe('fmtBytes', () => {
  it('formats bytes', () => {
    expect(pdfUtils.fmtBytes(500)).toBe('500 B');
  });
  it('formats kilobytes', () => {
    expect(pdfUtils.fmtBytes(2048)).toBe('2.0 KB');
  });
  it('formats megabytes', () => {
    expect(pdfUtils.fmtBytes(5242880)).toBe('5.00 MB');
  });
});

describe('parsePageRanges', () => {
  it('parses single pages', () => {
    expect(pdfUtils.parsePageRanges('1, 3, 5', 10)).toEqual([0, 2, 4]);
  });
  it('parses ranges', () => {
    expect(pdfUtils.parsePageRanges('2-4', 10)).toEqual([1, 2, 3]);
  });
  it('clamps to total', () => {
    expect(pdfUtils.parsePageRanges('1-100', 3)).toEqual([0, 1, 2]);
  });
  it('returns null on bad input', () => {
    expect(pdfUtils.parsePageRanges('abc', 10)).toBeNull();
  });
  it('handles reversed ranges', () => {
    expect(pdfUtils.parsePageRanges('5-3', 10)).toEqual([2, 3, 4]);
  });
});

describe('hexToRgb', () => {
  it('converts black', () => {
    expect(pdfUtils.hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
  });
  it('converts white', () => {
    expect(pdfUtils.hexToRgb('#ffffff')).toEqual({ r: 1, g: 1, b: 1 });
  });
  it('converts a color', () => {
    const { r, g, b } = pdfUtils.hexToRgb('#ff8040');
    expect(r).toBeCloseTo(1);
    expect(g).toBeCloseTo(0.502, 2);
    expect(b).toBeCloseTo(0.251, 2);
  });
});

describe('stemName', () => {
  it('strips .pdf extension', () => {
    expect(pdfUtils.stemName('report.pdf')).toBe('report');
  });
  it('strips .PDF extension (case-insensitive)', () => {
    expect(pdfUtils.stemName('Report.PDF')).toBe('Report');
  });
  it('leaves non-pdf names alone', () => {
    expect(pdfUtils.stemName('image.png')).toBe('image.png');
  });
});
