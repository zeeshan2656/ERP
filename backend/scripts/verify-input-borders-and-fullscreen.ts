/**
 * Automated Verification Script: Input Borders Contrast & Fullscreen Form Display Modes
 *
 * Verifies:
 * 1. WCAG 2.2 AA non-text contrast ratio (>= 3.0:1) for input borders across all themes (Light & Dark)
 * 2. Form Builder display_mode persistence (embedded, dialog, fullscreen) via backend API & DB
 * 3. Form export / import preserves display_mode
 */

import { getDbPool } from '../src/config/database.js';
import { formsService } from '../src/modules/forms/forms.service.js';

// Contrast calculation utilities
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

let passed = 0;
let failed = 0;

function assertTest(desc: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ✓ [PASS] ${desc}`);
    passed++;
  } else {
    console.error(`  ✗ [FAIL] ${desc} ${detail ? `(${detail})` : ''}`);
    failed++;
  }
}

async function runVerification() {
  console.log('============================================================');
  console.log('   APEX FLOW: INPUT BORDERS & DISPLAY MODES AUDIT SUITE');
  console.log('============================================================\n');

  // ========================================================
  // Test Group 1: Input Border Contrast Across All Themes
  // Non-text contrast requirement (WCAG 2.2 AA SC 1.4.11) is >= 3.0:1
  // ========================================================
  console.log('--- Test Group 1: Input Border Contrast (WCAG 2.2 AA SC 1.4.11 >= 3.0:1) ---');

  const themeBorderCases = [
    {
      theme: 'General Standard (Light)',
      border: '#64748b',
      background: '#ffffff',
      canvas: '#f8fafc',
    },
    {
      theme: 'General Standard (Dark)',
      border: '#64748b',
      background: '#1e293b',
      canvas: '#0f172a',
    },
    {
      theme: 'Enterprise Clean (Light)',
      border: '#64748b',
      background: '#ffffff',
      canvas: '#f8fafc',
    },
    {
      theme: 'Enterprise Clean (Dark)',
      border: '#64748b',
      background: '#0f172a',
      canvas: '#020617',
    },
    {
      theme: 'Soft UI Neumorphism (Light)',
      border: '#718096',
      background: '#ECF0F3',
      canvas: '#E2E8F0',
    },
    {
      theme: 'Soft UI Neumorphism (Dark)',
      border: '#64748b',
      background: '#242830',
      canvas: '#1a1d24',
    },
    {
      theme: 'Glassmorphism (Light)',
      border: '#64748b',
      background: '#ffffff',
      canvas: '#f0f4f8',
    },
    {
      theme: 'Glassmorphism (Dark)',
      border: '#64748b',
      background: '#0f172a',
      canvas: '#0a0f1d',
    },
  ];

  for (const item of themeBorderCases) {
    const ratioBg = getContrastRatio(item.border, item.background);
    const ratioCanvas = getContrastRatio(item.border, item.canvas);

    assertTest(
      `${item.theme}: border ${item.border} against surface ${item.background} ratio = ${ratioBg}:1`,
      ratioBg >= 3.0,
      `Expected >= 3.0:1, got ${ratioBg}:1`
    );

    assertTest(
      `${item.theme}: border ${item.border} against canvas ${item.canvas} ratio = ${ratioCanvas}:1`,
      ratioCanvas >= 3.0,
      `Expected >= 3.0:1, got ${ratioCanvas}:1`
    );
  }

  // ========================================================
  // Test Group 2: Form Builder Display Modes Persistence
  // ========================================================
  console.log('\n--- Test Group 2: Display Mode Persistence (DB & API) ---');

  let testFormId: string | null = null;

  try {
    // 2.1 Create Form with display_mode = 'fullscreen'
    const createdForm = await formsService.createForm(
      {
        name: '__Audit_Fullscreen_Form__',
        form_type: 'single',
        display_mode: 'fullscreen',
        source_type: 'table',
        source_name: 'sales_orders',
        canvas_layout: {
          gridSnap: true,
          gridSize: 8,
          maxWidth: 1200,
          displayMode: 'fullscreen',
          sections: [
            { id: 's1', name: 'Header', title: 'Order Details', height: 180, isCollapsible: false, isCollapsed: false },
          ],
        },
        controls: [
          {
            id: 'c1',
            type: 'text',
            sectionId: 's1',
            x: 20,
            y: 30,
            width: 240,
            height: 38,
            label: 'Order Number',
            binding: { field: 'order_number' },
          },
        ],
      }
    );

    testFormId = createdForm.id;
    assertTest('Form created with display_mode = "fullscreen"', createdForm.display_mode === 'fullscreen', `Got: ${createdForm.display_mode}`);

    // 2.2 Verify retrieve via getFormById
    const fetched = await formsService.getFormById(testFormId);
    assertTest('getFormById returns correct display_mode = "fullscreen"', fetched.display_mode === 'fullscreen', `Got: ${fetched.display_mode}`);

    // 2.3 Verify in listForms
    const allFormsRes = await formsService.listForms({ limit: 100 });
    const foundInList = allFormsRes.forms.find((f) => f.id === testFormId);
    assertTest('listForms includes display_mode = "fullscreen"', foundInList?.display_mode === 'fullscreen', `Got: ${foundInList?.display_mode}`);

    // 2.4 Update to display_mode = 'dialog'
    const updatedDialog = await formsService.updateForm(
      testFormId,
      {
        display_mode: 'dialog',
      }
    );
    assertTest('updateForm updates display_mode to "dialog"', updatedDialog.display_mode === 'dialog', `Got: ${updatedDialog.display_mode}`);

    const fetchedDialog = await formsService.getFormById(testFormId);
    assertTest('getFormById reflects updated display_mode = "dialog"', fetchedDialog.display_mode === 'dialog', `Got: ${fetchedDialog.display_mode}`);

    // 2.5 Update to display_mode = 'embedded'
    const updatedEmbedded = await formsService.updateForm(
      testFormId,
      {
        display_mode: 'embedded',
      }
    );
    assertTest('updateForm updates display_mode to "embedded"', updatedEmbedded.display_mode === 'embedded', `Got: ${updatedEmbedded.display_mode}`);

    // 2.6 Export and Import
    const exportResult = await formsService.exportForm(testFormId);
    assertTest('Exported definition contains display_mode = "embedded"', exportResult.form.display_mode === 'embedded', `Got: ${exportResult.form?.display_mode}`);

    // Import definition
    exportResult.form.name = '__Audit_Imported_Form__';
    exportResult.form.slug = 'audit-imported-form';
    exportResult.form.display_mode = 'fullscreen';
    const importedForm = await formsService.importForm(exportResult);
    assertTest('Imported form inherits display_mode = "fullscreen"', importedForm.display_mode === 'fullscreen', `Got: ${importedForm.display_mode}`);

    // Clean up imported form
    await formsService.deleteForm(importedForm.id);
    assertTest('Successfully cleaned up imported test form', true);

    // Clean up created form
    await formsService.deleteForm(testFormId);
    testFormId = null;
    assertTest('Successfully cleaned up primary test form', true);
  } catch (err: any) {
    console.error('Test execution error:', err);
    assertTest('Test execution completed without unhandled exceptions', false, err.message);
  } finally {
    if (testFormId) {
      try {
        await formsService.deleteForm(testFormId);
      } catch {}
    }
  }

  // ========================================================
  // Summary
  // ========================================================
  console.log('\n============================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('============================================================\n');

  await getDbPool().end();

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runVerification();
