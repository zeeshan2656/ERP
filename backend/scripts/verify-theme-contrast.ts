/**
 * Automated Verification Script: Universal Theme Contrast & WCAG 2.2 AA Audit
 * Audits every theme style and mode against WCAG 2.2 AA (>= 4.5:1 normal, >= 3.0:1 large/components)
 */

interface ColorPair {
  element: string;
  fg: string;
  bg: string;
  isLarge?: boolean;
}

interface ThemeSpec {
  name: string;
  style: string;
  mode: 'light' | 'dark';
  pairs: ColorPair[];
}

function parseHex(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

function getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const [rs, gs, bs] = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = parseHex(color1);
  const rgb2 = parseHex(color2);
  const lum1 = getRelativeLuminance(rgb1);
  const lum2 = getRelativeLuminance(rgb2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return parseFloat(((brightest + 0.05) / (darkest + 0.05)).toFixed(2));
}

const themesToTest: ThemeSpec[] = [
  {
    name: 'General (Standard) - Light Mode',
    style: 'general',
    mode: 'light',
    pairs: [
      { element: 'Primary Text on Surface-1', fg: '#0f172a', bg: '#ffffff' },
      { element: 'Primary Text on Canvas Surface-0', fg: '#0f172a', bg: '#f8fafc' },
      { element: 'Secondary Text on Surface-1', fg: '#334155', bg: '#ffffff' },
      { element: 'Muted Text on Surface-1', fg: '#64748b', bg: '#ffffff' },
      { element: 'Brand Primary Text on Primary Button', fg: '#ffffff', bg: '#0067b8' },
      { element: 'JOIN Badge Label on Canvas Card', fg: '#005a9e', bg: '#ffffff' },
      { element: 'Save Action Button', fg: '#ffffff', bg: '#047857' },
      { element: 'Update Action Button', fg: '#ffffff', bg: '#1d4ed8' },
      { element: 'Delete Action Button', fg: '#ffffff', bg: '#dc2626' },
      { element: 'Warning Button Text', fg: '#0f172a', bg: '#f59e0b' },
      { element: 'Status Success Badge Text', fg: '#15803d', bg: '#ffffff' },
      { element: 'Status Warning Badge Text', fg: '#b45309', bg: '#ffffff' },
      { element: 'Status Danger Badge Text', fg: '#b91c1c', bg: '#ffffff' },
      { element: 'Status Info Badge Text', fg: '#0369a1', bg: '#ffffff' },
    ],
  },
  {
    name: 'General (Standard) - Dark Mode',
    style: 'general',
    mode: 'dark',
    pairs: [
      { element: 'Primary Text on Slate Surface-1', fg: '#f8fafc', bg: '#1e293b' },
      { element: 'Primary Text on Canvas Surface-0', fg: '#f8fafc', bg: '#0b1120' },
      { element: 'Secondary Text on Surface-1', fg: '#cbd5e1', bg: '#1e293b' },
      { element: 'Muted Text on Surface-1', fg: '#94a3b8', bg: '#1e293b' },
      { element: 'Brand Primary Text on Primary Button', fg: '#0f172a', bg: '#38bdf8' },
      { element: 'INNER/LEFT/RIGHT JOIN Badge Label on Canvas', fg: '#38bdf8', bg: '#1e293b' },
      { element: 'Save Action Button', fg: '#ffffff', bg: '#047857' },
      { element: 'Update Action Button', fg: '#ffffff', bg: '#2563eb' },
      { element: 'Delete Action Button', fg: '#ffffff', bg: '#dc2626' },
      { element: 'Warning Button Text', fg: '#0f172a', bg: '#fbbf24' },
      { element: 'Status Success Badge Text', fg: '#4ade80', bg: '#1e293b' },
      { element: 'Status Warning Badge Text', fg: '#fbbf24', bg: '#1e293b' },
      { element: 'Status Danger Badge Text', fg: '#f87171', bg: '#1e293b' },
      { element: 'Status Info Badge Text', fg: '#38bdf8', bg: '#1e293b' },
    ],
  },
  {
    name: 'Enterprise UI - Light Mode',
    style: 'enterprise',
    mode: 'light',
    pairs: [
      { element: 'Primary Text on Surface-1', fg: '#111827', bg: '#ffffff' },
      { element: 'Secondary Text on Surface-1', fg: '#374151', bg: '#ffffff' },
      { element: 'Muted Text on Surface-1', fg: '#4b5563', bg: '#ffffff' },
      { element: 'Brand Primary Text on Primary Button', fg: '#ffffff', bg: '#0050aa' },
      { element: 'JOIN Badge Label on Canvas', fg: '#0050aa', bg: '#ffffff' },
      { element: 'Status Success Badge Text', fg: '#166534', bg: '#ffffff' },
      { element: 'Status Warning Badge Text', fg: '#92400e', bg: '#ffffff' },
      { element: 'Status Danger Badge Text', fg: '#b91c1c', bg: '#ffffff' },
    ],
  },
  {
    name: 'Enterprise UI - Dark Mode',
    style: 'enterprise',
    mode: 'dark',
    pairs: [
      { element: 'Primary Text on Deep Navy Surface-1', fg: '#f8fafc', bg: '#162032' },
      { element: 'Secondary Text on Surface-1', fg: '#cbd5e1', bg: '#162032' },
      { element: 'Muted Text on Surface-1', fg: '#94a3b8', bg: '#162032' },
      { element: 'Brand Primary Text on Primary Button', fg: '#0a0f1d', bg: '#60a5fa' },
      { element: 'INNER/LEFT/RIGHT JOIN Badge Label on Canvas', fg: '#60a5fa', bg: '#162032' },
      { element: 'Status Success Badge Text', fg: '#4ade80', bg: '#162032' },
      { element: 'Status Warning Badge Text', fg: '#fbbf24', bg: '#162032' },
      { element: 'Status Danger Badge Text', fg: '#f87171', bg: '#162032' },
    ],
  },
  {
    name: 'Soft UI (Neumorphic) - Light Mode',
    style: 'soft-ui',
    mode: 'light',
    pairs: [
      { element: 'Primary Text on Neumorphic Soft BG', fg: '#1A202C', bg: '#ECF0F3' },
      { element: 'Secondary Text on Soft BG', fg: '#4A5568', bg: '#ECF0F3' },
      { element: 'Muted Text on Soft BG', fg: '#546274', bg: '#ECF0F3' },
      { element: 'Brand Primary Text on Primary Button', fg: '#FFFFFF', bg: '#2B6CB0' },
      { element: 'JOIN Badge Label on Canvas', fg: '#2B6CB0', bg: '#ECF0F3' },
      { element: 'Status Success Badge Text', fg: '#166534', bg: '#ECF0F3' },
      { element: 'Status Warning Badge Text', fg: '#92400e', bg: '#ECF0F3' },
    ],
  },
  {
    name: 'Soft UI (Neumorphic) - Dark Mode',
    style: 'soft-ui',
    mode: 'dark',
    pairs: [
      { element: 'Primary Text on Dark Neumorphic Soft BG', fg: '#F7FAFC', bg: '#2F3338' },
      { element: 'Secondary Text on Soft BG', fg: '#CBD5E0', bg: '#2F3338' },
      { element: 'Muted Text on Soft BG', fg: '#A0AEC0', bg: '#2F3338' },
      { element: 'Brand Primary Text on Primary Button', fg: '#0F172A', bg: '#00E5FF' },
      { element: 'INNER/LEFT/RIGHT JOIN Badge Label on Canvas', fg: '#00E5FF', bg: '#2F3338' },
      { element: 'Status Success Badge Text', fg: '#4ade80', bg: '#2F3338' },
      { element: 'Status Warning Badge Text', fg: '#fbbf24', bg: '#2F3338' },
    ],
  },
  {
    name: 'Glassmorphism - Light Mode',
    style: 'glassmorphism',
    mode: 'light',
    pairs: [
      { element: 'Primary Text on Frosted White Glass Surface', fg: '#0f172a', bg: '#f4f7fb' },
      { element: 'Secondary Text on Glass Surface', fg: '#334155', bg: '#f4f7fb' },
      { element: 'Muted Text on Glass Surface', fg: '#475569', bg: '#f4f7fb' },
      { element: 'Brand Primary Text on Primary Button', fg: '#ffffff', bg: '#4f46e5' },
      { element: 'JOIN Badge Label on Canvas', fg: '#4f46e5', bg: '#f4f7fb' },
      { element: 'Status Success Badge Text', fg: '#166534', bg: '#f4f7fb' },
    ],
  },
  {
    name: 'Glassmorphism - Dark Mode',
    style: 'glassmorphism',
    mode: 'dark',
    pairs: [
      { element: 'Primary Text on Obsidian Glass Surface', fg: '#f8fafc', bg: '#151d2f' },
      { element: 'Secondary Text on Glass Surface', fg: '#cbd5e1', bg: '#151d2f' },
      { element: 'Muted Text on Glass Surface', fg: '#94a3b8', bg: '#151d2f' },
      { element: 'Brand Primary Text on Primary Button', fg: '#0f172a', bg: '#818cf8' },
      { element: 'INNER/LEFT/RIGHT JOIN Badge Label on Canvas', fg: '#818cf8', bg: '#151d2f' },
      { element: 'Status Success Badge Text', fg: '#4ade80', bg: '#151d2f' },
    ],
  },
];

console.log('======================================================================');
console.log('   APEX FLOW UNIVERSAL TEXT CONTRAST & WCAG 2.2 AA AUDIT');
console.log('======================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

for (const theme of themesToTest) {
  console.log(`\n--- Theme: ${theme.name} ---`);
  for (const pair of theme.pairs) {
    totalTests++;
    const ratio = getContrastRatio(pair.fg, pair.bg);
    const required = pair.isLarge ? 3.0 : 4.5;
    const passes = ratio >= required;

    if (passes) {
      passedTests++;
      const level = ratio >= 7.0 ? 'AAA' : 'AA';
      console.log(`  [PASS ${level}] ${pair.element}: ${ratio}:1 (>= ${required}:1) | FG: ${pair.fg} on BG: ${pair.bg}`);
    } else {
      failedTests++;
      console.error(`  [FAIL] ${pair.element}: ${ratio}:1 (< ${required}:1) | FG: ${pair.fg} on BG: ${pair.bg}`);
    }
  }
}

console.log('\n======================================================================');
console.log(`AUDIT SUMMARY: ${passedTests} / ${totalTests} passed (${failedTests} failed)`);
console.log('======================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('ALL COLOR COMBINATIONS MEET OR EXCEED WCAG 2.2 AA REQUIREMENTS!');
}
