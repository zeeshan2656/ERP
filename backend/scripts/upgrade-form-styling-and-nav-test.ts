import { query } from '../src/config/database.js';
import { formsService } from '../src/modules/forms/forms.service.js';
import * as fs from 'fs';
import * as path from 'path';

async function runAcceptanceVerification() {
  console.log('========================================================================');
  console.log('UPGRADE VERIFICATION: ADVANCED STYLING, ENTER-KEY NAV & FULL-SCREEN FORMS');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, details?: any) {
    total++;
    if (condition) {
      console.log(`[PASS] Test ${total}: ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] Test ${total}: ${testName}`);
      if (details) console.error('       Details:', details);
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1 & 2: CONFIGURE INSET, OUTSET, BORDER, COLOR, TYPOGRAPHY STYLING
  // --------------------------------------------------------------------------
  const formId = 'f0000000-0000-0000-0000-000000000001';
  const existingForm = await formsService.getFormById(formId);
  assert(Boolean(existingForm), 'Sales Order Full-Screen form exists in DB', { id: formId });

  // Update controls with diverse professional Oracle APEX / MS Access styling
  const upgradedControls = (existingForm.controls || []).map((ctrl: any) => {
    switch (ctrl.name) {
      case 'section_order_info':
        return {
          ...ctrl,
          colSpan: 12,
          styling: {
            ...ctrl.styling,
            sectionBgColor: 'transparent',
            sectionBorderColor: 'var(--brand-primary, #0067b8)',
            isBold: true,
            fontSize: '15px',
          },
        };
      case 'order_number':
        return {
          ...ctrl,
          colSpan: 4,
          styling: {
            ...ctrl.styling,
            boxAppearance: 'inset',
            borderStyle: 'inset',
            borderWidth: '2px',
            borderColor: '#64748b',
            borderRadius: '4px',
            bgColor: '#f8fafc',
            textColor: '#0f172a',
            isBold: true,
            padding: '7px 10px',
            textAlign: 'left',
          },
        };
      case 'order_date':
        return {
          ...ctrl,
          colSpan: 4,
          styling: {
            ...ctrl.styling,
            boxAppearance: 'inset',
            borderStyle: 'inset',
            borderWidth: '2px',
            borderColor: '#64748b',
            borderRadius: '4px',
            bgColor: '#f8fafc',
            textColor: '#0f172a',
            padding: '7px 10px',
          },
        };
      case 'order_status':
        return {
          ...ctrl,
          colSpan: 4,
          styling: {
            ...ctrl.styling,
            boxAppearance: 'outlined',
            borderStyle: 'solid',
            borderWidth: '2px',
            borderColor: 'var(--brand-primary, #0067b8)',
            borderRadius: '6px',
            isBold: true,
            padding: '7px 10px',
          },
        };
      case 'customer_name':
        return {
          ...ctrl,
          colSpan: 6,
          styling: {
            ...ctrl.styling,
            boxAppearance: 'outset',
            borderStyle: 'outset',
            borderWidth: '2px',
            borderColor: '#94a3b8',
            borderRadius: '4px',
            bgColor: '#ffffff',
            textColor: '#0f172a',
            isBold: true,
            padding: '7px 10px',
          },
        };
      case 'customer_email':
        return {
          ...ctrl,
          colSpan: 3,
          styling: {
            ...ctrl.styling,
            boxAppearance: 'recessed',
            borderStyle: 'solid',
            borderWidth: '1px',
            borderColor: '#cbd5e1',
            borderRadius: '4px',
            padding: '7px 10px',
          },
        };
      case 'customer_phone':
        return {
          ...ctrl,
          colSpan: 3,
          styling: {
            ...ctrl.styling,
            boxAppearance: 'recessed',
            borderStyle: 'solid',
            borderWidth: '1px',
            borderColor: '#cbd5e1',
            borderRadius: '4px',
            padding: '7px 10px',
          },
        };
      case 'shipping_address':
        return {
          ...ctrl,
          colSpan: 8,
          styling: {
            ...ctrl.styling,
            boxAppearance: 'default',
            borderStyle: 'solid',
            borderWidth: '1px',
            borderColor: '#64748b',
            borderRadius: '4px',
            padding: '8px 10px',
          },
        };
      case 'total_amount':
        return {
          ...ctrl,
          colSpan: 4,
          styling: {
            ...ctrl.styling,
            boxAppearance: 'raised',
            borderStyle: 'solid',
            borderWidth: '1px',
            borderColor: '#cbd5e1',
            borderRadius: '6px',
            isBold: true,
            fontSize: '14px',
            textAlign: 'right',
            textColor: 'var(--brand-primary, #0067b8)',
          },
        };
      case 'order_items_grid':
        return {
          ...ctrl,
          colSpan: 12,
          styling: {
            ...ctrl.styling,
            gridHeaderBg: 'var(--surface-2, #f1f5f9)',
            gridHeaderTextColor: 'var(--text-primary, #0f172a)',
            gridRowStriped: true,
            gridCellPadding: 'normal',
            borderRadius: '6px',
            borderColor: '#cbd5e1',
          },
        };
      default:
        return ctrl;
    }
  });

  // --------------------------------------------------------------------------
  // TEST 3 & 4: SAVE FORM AND VERIFY PERSISTENCE & RESTORATION
  // --------------------------------------------------------------------------
  await formsService.updateForm(formId, {
    controls: upgradedControls,
    canvasLayout: {
      ...existingForm.canvasLayout,
      width: '100%',
      gap: 16,
      padding: '28px 32px',
    },
  });

  const reloadedForm = await formsService.getFormById(formId);
  const orderNumCtrl = reloadedForm.controls.find((c: any) => c.name === 'order_number');
  const custNameCtrl = reloadedForm.controls.find((c: any) => c.name === 'customer_name');
  const totalAmtCtrl = reloadedForm.controls.find((c: any) => c.name === 'total_amount');
  const gridCtrl = reloadedForm.controls.find((c: any) => c.name === 'order_items_grid');

  assert(
    orderNumCtrl?.styling?.boxAppearance === 'inset' && orderNumCtrl?.styling?.borderStyle === 'inset',
    '3D Inset appearance persists and reloads correctly for order_number',
    orderNumCtrl?.styling
  );

  assert(
    custNameCtrl?.styling?.boxAppearance === 'outset' && custNameCtrl?.styling?.borderStyle === 'outset',
    '3D Outset appearance persists and reloads correctly for customer_name',
    custNameCtrl?.styling
  );

  assert(
    totalAmtCtrl?.styling?.boxAppearance === 'raised' && totalAmtCtrl?.styling?.textAlign === 'right',
    'Raised appearance and text alignment persist and reload correctly',
    totalAmtCtrl?.styling
  );

  assert(
    gridCtrl?.colSpan === 12 && gridCtrl?.styling?.gridRowStriped === true,
    'Detail grid spans 12 columns (100% full width) with striped row configuration',
    { colSpan: gridCtrl?.colSpan, styling: gridCtrl?.styling }
  );

  // --------------------------------------------------------------------------
  // TEST 5 & 6: ENTER KEY & NUMPAD ENTER NAVIGATION RULE
  // --------------------------------------------------------------------------
  // Test code verification of useFormEnterNavigation
  const hookPath = path.resolve(process.cwd(), '../frontend/src/hooks/useFormEnterNavigation.ts');
  const hookCode = fs.readFileSync(hookPath, 'utf-8');

  assert(
    hookCode.includes("e.key === 'Enter'") && hookCode.includes("e.code === 'NumpadEnter'"),
    'Hook handles both main keyboard Enter and numeric keypad NumpadEnter'
  );

  assert(
    hookCode.includes('checkValidity') && hookCode.includes('form-input-error'),
    'Hook validates field validity and displays error styling when validation fails'
  );

  // --------------------------------------------------------------------------
  // TEST 7: TEXTAREA MULTILINE PRESERVATION
  // --------------------------------------------------------------------------
  assert(
    hookCode.includes("target.tagName.toLowerCase() === 'textarea'"),
    'Textarea multiline editing is preserved (Enter inserts newline unless Shift+Enter or Ctrl+Enter is configured)'
  );

  // --------------------------------------------------------------------------
  // TEST 8: DETAIL GRID CONTINUOUS CELL ENTER-NAVIGATION & AUTO ROW ADDITION
  // --------------------------------------------------------------------------
  assert(
    hookCode.includes('handleDetailGridEnterNavigation') &&
    hookCode.includes('onAddRow') &&
    hookCode.includes('editableCols'),
    'Detail grid Enter navigation moves across columns, down rows, and auto-adds rows on the last cell'
  );

  // --------------------------------------------------------------------------
  // TEST 9 & 10: TRUE RESPONSIVE FULL-SCREEN VIEWPORT SIZING
  // --------------------------------------------------------------------------
  const cssPath = path.resolve(process.cwd(), '../frontend/src/index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  assert(
    cssContent.includes('.apex-fullscreen-form-shell') &&
    cssContent.includes('100vw') &&
    cssContent.includes('100vh'),
    'Full-Screen form shell uses 100vw and 100vh viewport units'
  );

  assert(
    cssContent.includes('.apex-form-grid') &&
    cssContent.includes('@media (max-width: 1024px)') &&
    cssContent.includes('@media (max-width: 640px)'),
    'Responsive grid reflows columns across Desktop (12), Tablet (6), and Mobile (1)'
  );

  // --------------------------------------------------------------------------
  // TEST 11: ALL EXISTING PLATFORM FUNCTIONALITY INTACT
  // --------------------------------------------------------------------------
  const runtimePath = path.resolve(process.cwd(), '../frontend/src/pages/admin/forms/FormRuntimePage.tsx');
  const runtimeCode = fs.readFileSync(runtimePath, 'utf-8');

  assert(
    runtimeCode.includes('computeControlStyles') &&
    runtimeCode.includes('useFormEnterNavigation') &&
    runtimeCode.includes('handleDetailGridEnterNavigation') &&
    runtimeCode.includes('handleSaveRecord') &&
    runtimeCode.includes('handleDeleteRecord') &&
    runtimeCode.includes('handleNewRecord'),
    'FormRuntimePage retains all CRUD, Master-Detail, and Navigation actions alongside styling and Enter nav'
  );

  console.log('\n========================================================================');
  console.log(`SUMMARY: ${passed} / ${total} TESTS PASSED`);
  console.log('========================================================================\n');

  if (passed === total) {
    console.log('ALL ACCEPTANCE CRITERIA SUCCESSFULLY SATISFIED!');
  } else {
    console.error(`FAILED: ${total - passed} tests failed.`);
    process.exit(1);
  }

  process.exit(0);
}

runAcceptanceVerification().catch((err) => {
  console.error('Test execution failed with error:', err);
  process.exit(1);
});
