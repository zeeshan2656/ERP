import { getContrastRatio, checkWcagCompliance } from '../utils/contrast.ts';

// Test matrix across 3 styles x 2 modes (light, dark) = 6 primary visual environments
const testEnvironments = [
  // General (Standard SaaS) - Light
  {
    name: 'General / Standard (Light)',
    textColor: '#0f172a',
    canvasBg: '#f8fafc',
    surfaceBg: '#ffffff',
    primaryBtnBg: '#0067b8',
    primaryBtnText: '#ffffff',
    saveBtnBg: '#047857',
    saveBtnText: '#ffffff',
    updateBtnBg: '#1d4ed8',
    updateBtnText: '#ffffff',
    deleteBtnBg: '#dc2626',
    deleteBtnText: '#ffffff',
  },
  // General (Standard SaaS) - Dark
  {
    name: 'General / Standard (Dark)',
    textColor: '#f8fafc',
    canvasBg: '#0b1120',
    surfaceBg: '#151e2e',
    primaryBtnBg: '#38bdf8',
    primaryBtnText: '#0b1120',
    saveBtnBg: '#047857',
    saveBtnText: '#ffffff',
    updateBtnBg: '#1d4ed8',
    updateBtnText: '#ffffff',
    deleteBtnBg: '#dc2626',
    deleteBtnText: '#ffffff',
  },
  // Soft UI (Neumorphism) - Light
  {
    name: 'Soft UI (Light)',
    textColor: '#1a202c',
    canvasBg: '#ECF0F3',
    surfaceBg: '#ECF0F3',
    primaryBtnBg: '#2B6CB0',
    primaryBtnText: '#ffffff',
    saveBtnBg: '#047857',
    saveBtnText: '#ffffff',
    updateBtnBg: '#1d4ed8',
    updateBtnText: '#ffffff',
    deleteBtnBg: '#dc2626',
    deleteBtnText: '#ffffff',
  },
  // Soft UI (Neumorphism) - Dark
  {
    name: 'Soft UI (Dark)',
    textColor: '#F7FAFC',
    canvasBg: '#24272c',
    surfaceBg: '#2F3338',
    primaryBtnBg: '#00E5FF',
    primaryBtnText: '#0f172a',
    saveBtnBg: '#047857',
    saveBtnText: '#ffffff',
    updateBtnBg: '#1d4ed8',
    updateBtnText: '#ffffff',
    deleteBtnBg: '#dc2626',
    deleteBtnText: '#ffffff',
  },
  // Enterprise B2B - Light
  {
    name: 'Enterprise (Light)',
    textColor: '#111827',
    canvasBg: '#f1f5f9',
    surfaceBg: '#ffffff',
    primaryBtnBg: '#0050aa',
    primaryBtnText: '#ffffff',
    saveBtnBg: '#047857',
    saveBtnText: '#ffffff',
    updateBtnBg: '#1d4ed8',
    updateBtnText: '#ffffff',
    deleteBtnBg: '#dc2626',
    deleteBtnText: '#ffffff',
  },
  // Enterprise B2B - Dark
  {
    name: 'Enterprise (Dark)',
    textColor: '#f9fafb',
    canvasBg: '#0a0f1d',
    surfaceBg: '#162032',
    primaryBtnBg: '#2563eb',
    primaryBtnText: '#ffffff',
    saveBtnBg: '#047857',
    saveBtnText: '#ffffff',
    updateBtnBg: '#1d4ed8',
    updateBtnText: '#ffffff',
    deleteBtnBg: '#dc2626',
    deleteBtnText: '#ffffff',
  },
  // Glassmorphism UI - Light
  {
    name: 'Glassmorphism UI (Light)',
    textColor: '#0f172a',
    canvasBg: '#eef2f7',
    surfaceBg: '#ffffff',
    primaryBtnBg: '#4f46e5',
    primaryBtnText: '#ffffff',
    saveBtnBg: '#047857',
    saveBtnText: '#ffffff',
    updateBtnBg: '#1d4ed8',
    updateBtnText: '#ffffff',
    deleteBtnBg: '#dc2626',
    deleteBtnText: '#ffffff',
  },
  // Glassmorphism UI - Dark
  {
    name: 'Glassmorphism UI (Dark)',
    textColor: '#f8fafc',
    canvasBg: '#070a12',
    surfaceBg: '#131b2c',
    primaryBtnBg: '#818cf8',
    primaryBtnText: '#0f172a',
    saveBtnBg: '#047857',
    saveBtnText: '#ffffff',
    updateBtnBg: '#1d4ed8',
    updateBtnText: '#ffffff',
    deleteBtnBg: '#dc2626',
    deleteBtnText: '#ffffff',
  },
];

console.log('====================================================');
console.log('ANTIGRAVITY THEME ARCHITECTURE: CONTRAST AUDIT (WCAG AA)');
console.log('====================================================');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

for (const env of testEnvironments) {
  console.log(`\nTesting environment: [${env.name}]`);

  // Check 1: Body text on surface
  const surfaceCheck = checkWcagCompliance(env.textColor, env.surfaceBg, false);
  totalTests++;
  if (surfaceCheck.passed) {
    passedTests++;
    console.log(`  ✓ Surface Text: ${surfaceCheck.ratio}:1 (>= 4.5:1 required)`);
  } else {
    failedTests++;
    console.error(`  ✗ Surface Text: ${surfaceCheck.ratio}:1 (< 4.5:1)`);
  }

  // Check 2: Body text on canvas
  const canvasCheck = checkWcagCompliance(env.textColor, env.canvasBg, false);
  totalTests++;
  if (canvasCheck.passed) {
    passedTests++;
    console.log(`  ✓ Canvas Text: ${canvasCheck.ratio}:1 (>= 4.5:1 required)`);
  } else {
    failedTests++;
    console.error(`  ✗ Canvas Text: ${canvasCheck.ratio}:1 (< 4.5:1)`);
  }

  // Check 3: Primary Button text on Primary Button bg
  const btnCheck = checkWcagCompliance(env.primaryBtnText, env.primaryBtnBg, false);
  totalTests++;
  if (btnCheck.passed) {
    passedTests++;
    console.log(`  ✓ Primary Button: ${btnCheck.ratio}:1 (>= 4.5:1 required)`);
  } else {
    failedTests++;
    console.error(`  ✗ Primary Button: ${btnCheck.ratio}:1 (< 4.5:1)`);
  }

  // Check 4: Save Button
  const saveCheck = checkWcagCompliance(env.saveBtnText, env.saveBtnBg, false);
  totalTests++;
  if (saveCheck.passed) {
    passedTests++;
    console.log(`  ✓ Save Button: ${saveCheck.ratio}:1 (>= 4.5:1 required)`);
  } else {
    failedTests++;
    console.error(`  ✗ Save Button: ${saveCheck.ratio}:1 (< 4.5:1)`);
  }

  // Check 5: Update Button
  const updateCheck = checkWcagCompliance(env.updateBtnText, env.updateBtnBg, false);
  totalTests++;
  if (updateCheck.passed) {
    passedTests++;
    console.log(`  ✓ Update Button: ${updateCheck.ratio}:1 (>= 4.5:1 required)`);
  } else {
    failedTests++;
    console.error(`  ✗ Update Button: ${updateCheck.ratio}:1 (< 4.5:1)`);
  }

  // Check 6: Delete Button
  const deleteCheck = checkWcagCompliance(env.deleteBtnText, env.deleteBtnBg, false);
  totalTests++;
  if (deleteCheck.passed) {
    passedTests++;
    console.log(`  ✓ Delete Button: ${deleteCheck.ratio}:1 (>= 4.5:1 required)`);
  } else {
    failedTests++;
    console.error(`  ✗ Delete Button: ${deleteCheck.ratio}:1 (< 4.5:1)`);
  }
}

console.log('\n----------------------------------------------------');
console.log(`Summary: ${passedTests}/${totalTests} tests passed (${failedTests} failures).`);
if (failedTests === 0) {
  console.log('ALL 12 COMBINATIONS ACHIEVE 100% WCAG AA COMPLIANCE!');
} else {
  throw new Error(`Contrast audit failed with ${failedTests} failures.`);
}
