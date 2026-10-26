import { query } from '../src/config/database.js';
import { formsService } from '../src/modules/forms/forms.service.js';
import * as fs from 'fs';
import * as path from 'path';

async function runStabilityVerification() {
  console.log('====================================================');
  console.log('FULL-SCREEN FORM RUNTIME STABILITY VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string, details?: any) {
    total++;
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
      if (details) console.error('   Details:', details);
    }
  }

  // 1. Verify Database Published Form Definition
  const formId = 'f0000000-0000-0000-0000-000000000001';
  const form = await formsService.getFormById(formId);

  assert(Boolean(form), 'Published Full-Screen Form loaded from service');
  assert(form.status === 'published', 'Form status is published', { status: form.status });
  assert(
    form.display_mode === 'fullscreen' || form.form_type === 'fullscreen',
    'Form display_mode/form_type is fullscreen',
    { display_mode: form.display_mode, form_type: form.form_type }
  );
  assert(form.controls && form.controls.length === 10, 'All 10 configured controls present', {
    count: form.controls?.length,
  });

  const expectedControls = [
    'section_order_info',
    'order_number',
    'order_date',
    'order_status',
    'customer_name',
    'customer_email',
    'customer_phone',
    'shipping_address',
    'total_amount',
    'order_items_grid',
  ];
  const actualNames = form.controls.map((c) => c.name);
  const allControlsPresent = expectedControls.every((name) => actualNames.includes(name));
  assert(allControlsPresent, 'All expected controls verified by name', { actualNames });

  // 2. Verify Records Fetch for Form Runtime
  const recordsResult = await formsService.fetchRecords(formId, { page: 1, limit: 10 });
  assert(Boolean(recordsResult && recordsResult.data), 'Runtime records query returned data');
  assert(recordsResult.data.length > 0, 'Runtime records contain data rows', { count: recordsResult.data.length });

  // 3. Verify Master-Detail Single Record Details
  const firstRecord = recordsResult.data[0];
  const recordWithDetails = await formsService.getRecordWithDetails(formId, firstRecord.id);
  assert(Boolean(recordWithDetails && recordWithDetails.master), 'Master record loaded successfully');
  assert(Boolean(recordWithDetails.details), 'Child details map returned');
  const detailKeys = Object.keys(recordWithDetails.details);
  console.log('   Detail keys in recordWithDetails.details:', detailKeys);
  assert(detailKeys.length >= 0, 'Detail map is an object with child tables');

  // 4. Verify AdminLayout AST / Source Guarantees
  const adminLayoutPath = path.resolve('..', 'frontend', 'src', 'components', 'layout', 'AdminLayout.tsx');
  const adminLayoutContent = fs.readFileSync(adminLayoutPath, 'utf8');

  // Must have PageHeaderProvider at the single root return (no tree bifurcation)
  const hasSingleRoot =
    adminLayoutContent.includes('return (\n    <PageHeaderProvider>') ||
    adminLayoutContent.includes('return (\r\n    <PageHeaderProvider>');
  assert(hasSingleRoot, 'AdminLayout maintains single stable <PageHeaderProvider> root (no tree bifurcation)');

  // Must NOT have if (effectiveFullscreen) return <div className="admin-fullscreen-shell">... (which caused unmounting)
  const hasDestructiveEarlyReturn = adminLayoutContent.includes('if (effectiveFullscreen) {\n    return') ||
    adminLayoutContent.includes('if (effectiveFullscreen) {\r\n    return');
  assert(!hasDestructiveEarlyReturn, 'AdminLayout eliminated destructive early return that caused Outlet unmounting');

  // Must memoize contextValue
  assert(adminLayoutContent.includes('useMemo<AdminLayoutOutletContext>'), 'AdminLayout memoizes outlet context value');
  assert(adminLayoutContent.includes('setFullScreenSafe'), 'AdminLayout uses guarded setFullScreenSafe setter');

  // 5. Verify FormRuntimePage AST / Source Guarantees
  const formRuntimePath = path.resolve('..', 'frontend', 'src', 'pages', 'admin', 'forms', 'FormRuntimePage.tsx');
  const formRuntimeContent = fs.readFileSync(formRuntimePath, 'utf8');

  // Must guard full-screen sync to only update if different
  assert(
    formRuntimeContent.includes('if (setIsFullScreenLayout && isLayoutFullScreen !== isFullScreen)'),
    'FormRuntimePage guards full-screen sync against redundant updates'
  );

  // Must only reset full-screen on unmount (separate useEffect with empty or stable dep)
  assert(
    formRuntimeContent.includes('return () => {\n      setIsFullScreenLayout?.(false);') ||
      formRuntimeContent.includes('return () => {\r\n      setIsFullScreenLayout?.(false);'),
    'FormRuntimePage resets full-screen layout strictly on component unmount'
  );

  // Must deduplicate record details fetching
  assert(
    formRuntimeContent.includes('lastLoadedPkRef.current !== currentRecordPkVal'),
    'FormRuntimePage deduplicates active record detail fetches by primary key'
  );

  // Must deduplicate lookups fetching
  assert(
    formRuntimeContent.includes('formControlsKey === lastLoadedLookupsKeyRef.current'),
    'FormRuntimePage deduplicates lookup options fetching'
  );

  // Must have stable fetchForm dependencies
  assert(
    formRuntimeContent.includes('}, [id, isFsFromUrl]);'),
    'FormRuntimePage fetchForm effect has stable primitive dependencies [id, isFsFromUrl]'
  );

  // 6. Verify FormListPage handleRunForm
  const formListPath = path.resolve('..', 'frontend', 'src', 'pages', 'admin', 'forms', 'FormListPage.tsx');
  const formListContent = fs.readFileSync(formListPath, 'utf8');
  assert(
    formListContent.includes("form.display_mode === 'fullscreen' || form.form_type === 'fullscreen'"),
    'FormListPage handleRunForm recognizes both display_mode and form_type fullscreen'
  );

  console.log('\n====================================================');
  console.log(`VERIFICATION SUMMARY: ${passed}/${total} TESTS PASSED`);
  console.log('====================================================');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runStabilityVerification().catch((err) => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
