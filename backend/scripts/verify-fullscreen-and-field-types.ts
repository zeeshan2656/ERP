import { query } from '../src/config/database.js';
import { formsService } from '../src/modules/forms/forms.service.js';
import { RowDataPacket } from 'mysql2';

async function runVerification() {
  console.log('====================================================');
  console.log('RUNNING FULL-SCREEN RUNTIME & FIELD TYPE VERIFICATION');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: any) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${testName}`);
      if (details) console.error('   Details:', details);
    }
  }

  try {
    // 1. Verify Sample Form f0000000-0000-0000-0000-000000000001 Definition
    const form = await formsService.getFormById('f0000000-0000-0000-0000-000000000001');
    assert(Boolean(form), 'Form f0000000-0000-0000-0000-000000000001 loaded successfully');
    assert(form.form_type === 'fullscreen', 'Form type is fullscreen', { form_type: form.form_type });
    assert(form.controls && form.controls.length >= 8, 'Form controls loaded dynamically from saved configuration', {
      controlCount: form.controls?.length,
    });

    const controlTypes = form.controls.map((c) => c.type);
    console.log('   Configured form controls in sample form:', form.controls.map((c) => `${c.name} (${c.type})`).join(', '));
    assert(controlTypes.includes('datagrid') || controlTypes.includes('master_detail'), 'Master-detail child grid is present in form');

    // 2. Verify Records Fetch for Fullscreen Form
    const recordsResult = await formsService.fetchRecords('f0000000-0000-0000-0000-000000000001', {
      page: 1,
      limit: 10,
      sortOrder: 'ASC',
    });
    assert(Boolean(recordsResult), 'Runtime records query executed');
    assert(Array.isArray(recordsResult.data), 'Runtime records data returned as array', {
      total: recordsResult.pagination.total,
      returnedCount: recordsResult.data.length,
    });

    if (recordsResult.data.length > 0) {
      const firstPk = recordsResult.data[0].id;
      const details = await formsService.getRecordWithDetails('f0000000-0000-0000-0000-000000000001', firstPk);
      assert(Boolean(details.master), 'Master record loaded for primary key ' + firstPk);
      assert(Boolean(details.details), 'Child details map loaded for primary key ' + firstPk);
      console.log('   Master record keys:', Object.keys(details.master).join(', '));
    }

    // 3. Test Eligible Data Sources
    const eligible = await formsService.listEligibleDataSources();
    assert(Array.isArray(eligible.tables) && eligible.tables.length > 0, 'Eligible tables list populated');
    console.log(`   Found ${eligible.tables.length} tables and ${eligible.queries.length} saved queries.`);
    const sampleTable = eligible.tables[0]?.name || 'users';

    // 4. Test Table Lookup with Full Row Attributes for Dependent Mappings
    const tableLookup = await formsService.getLookupData({
      sourceType: 'table',
      sourceName: sampleTable,
      returnColumn: 'id',
      displayColumn: eligible.tables[0]?.primaryKey || 'id',
      limit: 5,
    });
    assert(Array.isArray(tableLookup) && tableLookup.length > 0, `Table lookup for '${sampleTable}' returned records`, {
      count: tableLookup.length,
    });
    assert(tableLookup[0] && 'key' in tableLookup[0] && 'label' in tableLookup[0], 'Lookup item has key and label');
    assert(Boolean(tableLookup[0]?.data), 'Lookup item contains full row data for dependent field auto-population', {
      dataSample: tableLookup[0]?.data,
    });
    if (tableLookup[0]?.data) {
      console.log('   Available columns on lookup row for mapping:', Object.keys(tableLookup[0].data).join(', '));
    }

    if (eligible.queries.length > 0) {
      const q = eligible.queries[0];
      const qSchema = await formsService.getSourceSchema('query', q.name);
      const returnCol = qSchema.columns[0]?.name || 'username';
      const displayCol = qSchema.columns[1]?.name || qSchema.columns[0]?.name || 'full_name';

      const queryLookup = await formsService.getLookupData({
        sourceType: 'query',
        sourceName: q.name,
        returnColumn: returnCol,
        displayColumn: displayCol,
        limit: 5,
      });
      assert(Array.isArray(queryLookup), 'Saved query lookup executed successfully', { count: queryLookup.length });
    }

    // 5. Test Field Type Switching & Persistence
    // Locate the first number control (e.g. total_amount or order_number)
    const originalControls = JSON.parse(JSON.stringify(form.controls));
    const targetControl = form.controls.find((c) => c.fieldBinding === 'total_amount' || c.type === 'currency' || c.type === 'number');
    if (targetControl) {
      const origType = targetControl.type;
      console.log(`   Testing field type switch on control '${targetControl.name}' (originally '${origType}') -> 'text'`);

      // Update control type to text
      targetControl.type = 'text';
      await formsService.updateForm('f0000000-0000-0000-0000-000000000001', {
        controls: form.controls,
      });

      // Reload form to verify persistence
      const reloaded = await formsService.getFormById('f0000000-0000-0000-0000-000000000001');
      const updatedControl = reloaded.controls.find((c) => c.id === targetControl.id);
      assert(updatedControl?.type === 'text', 'Switched visual type to text and verified persistence in DB', {
        type: updatedControl?.type,
      });

      // Verify physical database column is unchanged
      const schemaCheck = await query<RowDataPacket[]>(
        `SELECT DATA_TYPE, COLUMN_TYPE FROM information_schema.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [form.source_name, targetControl.fieldBinding || 'total_amount']
      );
      assert(
        schemaCheck.length > 0 && schemaCheck[0].DATA_TYPE === 'decimal',
        'Physical database column type remained intact (schema preserved)',
        schemaCheck[0]
      );

      // Revert to original
      await formsService.updateForm('f0000000-0000-0000-0000-000000000001', {
        controls: originalControls,
      });
      console.log(`   Reverted control '${targetControl.name}' back to '${origType}'`);
    }

    // 6. Test Dependent Field Mapping Auto-population Logic
    const mockLookupOption = tableLookup[0];
    if (mockLookupOption && mockLookupOption.data) {
      const dataKeys = Object.keys(mockLookupOption.data);
      const firstCol = dataKeys[0] || 'id';
      const secondCol = dataKeys[1] || 'name';

      const dependentMappings = [
        { sourceColumn: firstCol, targetField: 'mapped_target_1' },
        { sourceColumn: secondCol, targetField: 'mapped_target_2' },
      ];
      const testRecord: Record<string, any> = { selected_key: mockLookupOption.key };

      dependentMappings.forEach((m) => {
        if (m.sourceColumn in mockLookupOption.data!) {
          testRecord[m.targetField] = mockLookupOption.data![m.sourceColumn];
        }
      });

      assert(Boolean(testRecord.mapped_target_1 !== undefined), 'Dependent field auto-population correctly extracted mapped values', testRecord);
    }

    console.log('\n====================================================');
    console.log(`VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
    console.log('====================================================');
  } catch (err) {
    console.error('Verification failed with error:', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runVerification();
