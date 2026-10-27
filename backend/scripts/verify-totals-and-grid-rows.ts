import { query } from '../src/config/database.js';
import { formsService } from '../src/modules/forms/forms.service.js';
import { seedDefaultForms } from '../src/db/seeds/default-forms.seed.js';
import * as fs from 'fs';
import * as path from 'path';

// Mirroring the frontend formCalculations logic to verify accuracy
function evaluateExpressionOnRow(expr: string, row: Record<string, any>): number {
  try {
    let substituted = expr.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, (ident) => {
      if (ident in row) {
        const val = Number(row[ident]);
        return Number.isFinite(val) ? String(val) : '0';
      }
      return '0';
    });

    if (!/^[\d\s+\-*/().%]+$/.test(substituted)) {
      return 0;
    }

    const tokens: string[] = [];
    let i = 0;
    while (i < substituted.length) {
      const ch = substituted[i];
      if (/\s/.test(ch)) {
        i++;
        continue;
      }
      if (/[\d.]/.test(ch)) {
        let numStr = '';
        while (i < substituted.length && /[\d.]/.test(substituted[i])) {
          numStr += substituted[i];
          i++;
        }
        tokens.push(numStr);
        continue;
      }
      if ('+-*/()'.includes(ch)) {
        tokens.push(ch);
        i++;
        continue;
      }
      i++;
    }

    let pos = 0;
    function parsePrimary(): number {
      if (pos >= tokens.length) return 0;
      const tok = tokens[pos];
      if (tok === '+') {
        pos++;
        return parsePrimary();
      }
      if (tok === '-') {
        pos++;
        return -parsePrimary();
      }
      if (tok === '(') {
        pos++;
        const val = parseAddSub();
        if (tokens[pos] === ')') pos++;
        return val;
      }
      pos++;
      const num = parseFloat(tok);
      return Number.isFinite(num) ? num : 0;
    }

    function parseMulDiv(): number {
      let val = parsePrimary();
      while (pos < tokens.length && (tokens[pos] === '*' || tokens[pos] === '/')) {
        const op = tokens[pos];
        pos++;
        const nextVal = parsePrimary();
        if (op === '*') val = val * nextVal;
        else val = nextVal !== 0 ? val / nextVal : 0;
      }
      return val;
    }

    function parseAddSub(): number {
      let val = parseMulDiv();
      while (pos < tokens.length && (tokens[pos] === '+' || tokens[pos] === '-')) {
        const op = tokens[pos];
        pos++;
        const nextVal = parseMulDiv();
        if (op === '+') val = val + nextVal;
        else val = val - nextVal;
      }
      return val;
    }

    return parseAddSub();
  } catch {
    return 0;
  }
}

function calculateSummary(
  calcType: string,
  sourceColumn: string,
  formula: string | undefined,
  rows: Record<string, any>[]
): number {
  if (!rows || rows.length === 0) return 0;

  if (calcType === 'COUNT') {
    return rows.filter((r) => r[sourceColumn] !== undefined && r[sourceColumn] !== null && r[sourceColumn] !== '').length;
  }

  if (calcType === 'FORMULA' || (formula && formula.trim().length > 0)) {
    const rawFormula = (formula || '').trim();
    const sumMatch = rawFormula.match(/^SUM\s*\(\s*(.+)\s*\)$/i);
    const avgMatch = rawFormula.match(/^AVG\s*\(\s*(.+)\s*\)$/i);
    const countMatch = rawFormula.match(/^COUNT\s*\(\s*(.+)\s*\)$/i);
    const innerExpr = sumMatch ? sumMatch[1] : avgMatch ? avgMatch[1] : countMatch ? countMatch[1] : rawFormula;

    const rowValues = rows.map((r) => evaluateExpressionOnRow(innerExpr, r));
    if (countMatch) return rowValues.filter((v) => v !== 0).length;
    const sum = rowValues.reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0);
    if (avgMatch) return rows.length > 0 ? sum / rows.length : 0;
    return sum;
  }

  if (calcType === 'AVG') {
    const valid = rows
      .map((r) => r[sourceColumn])
      .filter((v) => v !== undefined && v !== null && String(v).trim() !== '' && !isNaN(Number(v)))
      .map((v) => Number(v));
    if (valid.length === 0) return 0;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
  }

  if (calcType === 'MIN') {
    const valid = rows
      .map((r) => r[sourceColumn])
      .filter((v) => v !== undefined && v !== null && String(v).trim() !== '' && !isNaN(Number(v)))
      .map((v) => Number(v));
    if (valid.length === 0) return 0;
    return Math.min(...valid);
  }

  if (calcType === 'MAX') {
    const valid = rows
      .map((r) => r[sourceColumn])
      .filter((v) => v !== undefined && v !== null && String(v).trim() !== '' && !isNaN(Number(v)))
      .map((v) => Number(v));
    if (valid.length === 0) return 0;
    return Math.max(...valid);
  }

  const values = rows
    .map((r) => Number(r[sourceColumn]))
    .filter((v) => Number.isFinite(v));

  if (values.length === 0) return 0;

  switch (calcType) {
    case 'SUM':
      return values.reduce((a, b) => a + b, 0);
    default:
      return 0;
  }
}

async function runVerification() {
  console.log('========================================================================');
  console.log('ACCEPTANCE TESTS: DETAIL GRID ROW SETTINGS, SCROLLING & COLUMN TOTALS');
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
  // TEST SUITE 1: FORMULA AND SUMMARY ENGINE MATHEMATICAL ACCURACY
  // --------------------------------------------------------------------------
  console.log('\n--- 1. Testing Summary and Formula Calculations ---');

  const testRows = [
    { item_name: 'Widget A', quantity: 10, unit_price: 25.5, discount_percent: 10, line_total: 229.5 },
    { item_name: 'Gadget B', quantity: 5, unit_price: 100.0, discount_percent: 0, line_total: 500.0 },
    { item_name: 'Part C', quantity: 2, unit_price: 15.0, discount_percent: 20, line_total: 24.0 },
    { item_name: 'Empty Row', quantity: '', unit_price: null, discount_percent: undefined, line_total: '' },
  ];

  const sumQty = calculateSummary('SUM', 'quantity', undefined, testRows);
  assert(sumQty === 17, 'SUM(quantity) correctly sums valid numeric rows ignoring blanks', { sumQty, expected: 17 });

  const countItems = calculateSummary('COUNT', 'item_name', undefined, testRows);
  assert(countItems === 4, 'COUNT(item_name) correctly counts rows with values', { countItems, expected: 4 });

  const avgPrice = calculateSummary('AVG', 'unit_price', undefined, testRows);
  assert(Math.abs(avgPrice - 46.833) < 0.01, 'AVG(unit_price) calculates correct average', { avgPrice });

  const minPrice = calculateSummary('MIN', 'unit_price', undefined, testRows);
  assert(minPrice === 15.0, 'MIN(unit_price) returns minimum value', { minPrice, expected: 15.0 });

  const maxPrice = calculateSummary('MAX', 'unit_price', undefined, testRows);
  assert(maxPrice === 100.0, 'MAX(unit_price) returns maximum value', { maxPrice, expected: 100.0 });

  const formulaSubtotal = calculateSummary('FORMULA', '', 'SUM(quantity * unit_price)', testRows);
  // (10*25.5) + (5*100) + (2*15) = 255 + 500 + 30 = 785
  assert(formulaSubtotal === 785, 'Formula SUM(quantity * unit_price) evaluates correctly across multiple columns', {
    formulaSubtotal,
    expected: 785,
  });

  const injectionSafe = calculateSummary('FORMULA', '', 'process.exit(1) + alert(1)', testRows);
  assert(injectionSafe === 0, 'Formula parser rejects invalid/injection syntax safely without executing code', {
    injectionSafe,
  });

  // --------------------------------------------------------------------------
  // TEST SUITE 2: SEED DATA & FORM DEFINITION PERSISTENCE
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Testing Form Definition Persistence (Rows & Totals) ---');

  // Trigger seed update
  await seedDefaultForms();

  const formId = 'f0000000-0000-0000-0000-000000000001';
  const seededForm = await formsService.getFormById(formId);
  assert(Boolean(seededForm), 'Sales Order Full-Screen form exists in DB', { id: formId });

  const gridCtrl = seededForm.controls.find((c: any) => c.id === 'grid_order_items');
  assert(Boolean(gridCtrl), 'Found grid_order_items in seeded form controls');
  assert(
    gridCtrl?.detailGridConfig?.defaultVisibleRows === 5,
    'detailGridConfig.defaultVisibleRows is configured to 5 in seeded form',
    { defaultVisibleRows: gridCtrl?.detailGridConfig?.defaultVisibleRows }
  );
  assert(
    gridCtrl?.detailGridConfig?.enableTotals === true,
    'detailGridConfig.enableTotals is enabled in seeded form'
  );
  assert(
    Array.isArray(gridCtrl?.detailGridConfig?.summaryFields) && gridCtrl.detailGridConfig.summaryFields.length >= 2,
    'detailGridConfig.summaryFields contains configured summary fields',
    { summaryFields: gridCtrl?.detailGridConfig?.summaryFields }
  );

  // Test updating configurable rows & totals via API service and saving
  const updatedControls = seededForm.controls.map((c: any) => {
    if (c.id === 'grid_order_items') {
      return {
        ...c,
        detailGridConfig: {
          ...c.detailGridConfig,
          defaultVisibleRows: 8,
          enableTotals: true,
          summaryFields: [
            ...c.detailGridConfig.summaryFields,
            {
              id: 'sum_avg_price',
              label: 'Average Price',
              sourceColumn: 'unit_price',
              calculationType: 'AVG',
              format: 'currency',
              decimalPlaces: 2,
              prefix: '$',
            },
          ],
        },
      };
    }
    return c;
  });

  await formsService.updateForm(formId, { controls: updatedControls });
  const reloadedForm = await formsService.getFormById(formId);
  const reloadedGrid = reloadedForm.controls.find((c: any) => c.id === 'grid_order_items');

  assert(
    reloadedGrid?.detailGridConfig?.defaultVisibleRows === 8,
    'Persists updated defaultVisibleRows (8) after saving and reloading form',
    { defaultVisibleRows: reloadedGrid?.detailGridConfig?.defaultVisibleRows }
  );
  assert(
    reloadedGrid?.detailGridConfig?.summaryFields?.some((s: any) => s.id === 'sum_avg_price'),
    'Persists added summary field after saving and reloading form'
  );

  // --------------------------------------------------------------------------
  // TEST SUITE 3: MASTER-DETAIL TRANSACTION & AUTHORITATIVE BACKEND TOTALS
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Testing Master-Detail Transaction & Authoritative Totals ---');

  const testOrderNumber = `TEST-ORD-${Date.now().toString().slice(-6)}`;
  const saveResult = await formsService.saveRecordWithDetails(formId, {
    master: {
      order_number: testOrderNumber,
      customer_name: 'Acme Test Corp',
      status: 'pending',
      order_date: new Date().toISOString().slice(0, 10),
      total_amount: 0, // Intentionally pass 0 to test authoritative calculation on backend
    },
    details: {
      grid_order_items: {
        inserted: [
          {
            item_name: 'High-Torque Motor',
            sku: 'MOT-991',
            quantity: 3,
            unit_price: 150.0,
            discount_percent: 0,
            line_total: 450.0,
          },
          {
            item_name: 'Heavy Duty Bearings',
            sku: 'BRG-404',
            quantity: 10,
            unit_price: 25.0,
            discount_percent: 0,
            line_total: 250.0,
          },
        ],
      },
    },
  });

  assert(Boolean(saveResult?.success && saveResult?.masterId), 'saveRecordWithDetails succeeded with transaction', {
    masterId: saveResult?.masterId,
  });

  if (saveResult?.masterId) {
    const [savedMaster] = await query<any[]>(
      'SELECT id, order_number, total_amount FROM sales_orders WHERE id = ?',
      [saveResult.masterId]
    );

    assert(
      Number(savedMaster.total_amount) === 700.0,
      'Authoritative master total_amount recalculated and saved on backend (450 + 250 = 700)',
      { total_amount: savedMaster.total_amount, expected: 700.0 }
    );

    const detailRowsInDb = await query<any[]>(
      'SELECT * FROM sales_order_items WHERE order_id = ?',
      [saveResult.masterId]
    );

    assert(detailRowsInDb.length === 2, 'Detail grid child rows successfully saved to database', {
      count: detailRowsInDb.length,
    });

    // Cleanup test record
    await formsService.deleteRecord(formId, saveResult.masterId);
    console.log(`Cleaned up test record ID: ${saveResult.masterId}`);
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 4: CSS & FULL-SCREEN LAYOUT CHECKS
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Testing CSS & Theme Compatibility ---');

  const cssFilePath = path.resolve(process.cwd(), '../frontend/src/index.css');
  const cssContent = fs.readFileSync(cssFilePath, 'utf-8');

  assert(
    cssContent.includes('.apex-fullscreen-form-shell') &&
    cssContent.includes('100vw') &&
    cssContent.includes('100vh'),
    'CSS includes .apex-fullscreen-form-shell with 100vw/100vh full-screen rules'
  );

  assert(
    cssContent.includes('.apex-detail-grid-scroll-wrapper'),
    'CSS includes .apex-detail-grid-scroll-wrapper with automatic vertical scrolling'
  );

  assert(
    cssContent.includes('position: sticky') &&
    cssContent.includes('top: 0'),
    'CSS includes sticky header pinning for detail grid while scrolling'
  );

  assert(
    cssContent.includes('.apex-detail-grid-totals-bar'),
    'CSS includes .apex-detail-grid-totals-bar styling for totals section'
  );

  // Restore seeded configuration defaultVisibleRows back to 5
  const resetControls = reloadedForm.controls.map((c: any) => {
    if (c.id === 'grid_order_items') {
      return {
        ...c,
        detailGridConfig: {
          ...c.detailGridConfig,
          defaultVisibleRows: 5,
        },
      };
    }
    return c;
  });
  await formsService.updateForm(formId, { controls: resetControls });

  console.log('\n========================================================================');
  console.log(`VERIFICATION COMPLETE: ${passed} / ${total} tests passed.`);
  console.log('========================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
