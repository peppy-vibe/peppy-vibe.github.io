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
const pdfUtils = loadFunctions('peppy-tools/lib/pdf-utils.js', [
  'fmtBytes', 'parsePageRanges', 'hexToRgb', 'stemName', 'PAGE_SIZES',
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

/* ───── PAGE_SIZES (now in pdf-utils.js) ───── */
describe('PAGE_SIZES', () => {
  it('contains standard sizes', () => {
    expect(pdfUtils.PAGE_SIZES).toBeDefined();
    expect(pdfUtils.PAGE_SIZES.A4).toBeDefined();
    expect(pdfUtils.PAGE_SIZES.Letter).toBeDefined();
    expect(pdfUtils.PAGE_SIZES.Legal).toBeDefined();
    expect(pdfUtils.PAGE_SIZES.A3).toBeDefined();
    expect(pdfUtils.PAGE_SIZES.A5).toBeDefined();
  });
  it('A4 dimensions are correct', () => {
    const [w, h] = pdfUtils.PAGE_SIZES.A4;
    expect(w).toBeCloseTo(595.28, 1);
    expect(h).toBeCloseTo(841.89, 1);
  });
  it('each size is [width, height] with width < height (portrait)', () => {
    for (const [name, [w, h]] of Object.entries(pdfUtils.PAGE_SIZES)) {
      expect(w).toBeLessThan(h);
    }
  });
});

/* ───── shared-utils.js ───── */
const sharedUtils = loadFunctions('peppy-tools/lib/shared-utils.js', ['escHtml', 'escapeHtml']);

describe('escHtml', () => {
  it('escapes ampersands', () => {
    expect(sharedUtils.escHtml('a & b')).toBe('a &amp; b');
  });
  it('escapes angle brackets', () => {
    expect(sharedUtils.escHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
  it('escapes double quotes', () => {
    expect(sharedUtils.escHtml('a "b" c')).toBe('a &quot;b&quot; c');
  });
  it('escapes single quotes (attribute context)', () => {
    expect(sharedUtils.escHtml("it's")).toBe('it&#x27;s');
  });
  it('handles all dangerous chars together', () => {
    expect(sharedUtils.escHtml('<img src="x" onerror=\'alert(1)\'>&')).toBe(
      '&lt;img src=&quot;x&quot; onerror=&#x27;alert(1)&#x27;&gt;&amp;'
    );
  });
  it('returns empty string for empty input', () => {
    expect(sharedUtils.escHtml('')).toBe('');
  });
  it('coerces non-string input to string', () => {
    expect(sharedUtils.escHtml(42)).toBe('42');
    expect(sharedUtils.escHtml(null)).toBe('null');
  });
});

describe('escapeHtml alias', () => {
  it('is the same function as escHtml', () => {
    expect(sharedUtils.escapeHtml).toBe(sharedUtils.escHtml);
  });
});

/* ───── shared-ui.js ───── */
const sharedUI = loadFunctions('peppy-tools/lib/shared-ui.js', [
  'toggleFullscreen', 'updateThemeBtn', 'toggleTheme', 'initTheme',
  'toggleMobileMenu', 'closeMobileMenu',
]);

describe('shared-ui exports', () => {
  it('exports all expected functions', () => {
    expect(typeof sharedUI.toggleFullscreen).toBe('function');
    expect(typeof sharedUI.updateThemeBtn).toBe('function');
    expect(typeof sharedUI.toggleTheme).toBe('function');
    expect(typeof sharedUI.initTheme).toBe('function');
    expect(typeof sharedUI.toggleMobileMenu).toBe('function');
    expect(typeof sharedUI.closeMobileMenu).toBe('function');
  });
});
