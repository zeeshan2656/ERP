import mysql from 'mysql2/promise';
import { formsService } from '../src/modules/forms/forms.service.js';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details?: any) {
  if (condition) {
    results.push({ name, passed: true, details });
    console.log(`  ✓ [PASS] ${name}`);
  } else {
    results.push({ name, passed: false, details });
    console.error(`  ✗ [FAIL] ${name}`, details);
  }
}

async function runTestSuite() {
  console.log('\n============================================================');
  console.log('   APEX FLOW: FORM BUILDER AUTOMATED VERIFICATION SUITE');
  console.log('============================================================\n');

  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'erp_platform_db',
  });

  try {
    // -------------------------------------------------------------
    // Test 1: Module Registry & Permissions
    // -------------------------------------------------------------
    console.log('--- Test Group 1: Module Registry & Permissions ---');
    const [modRows]: [any[], any] = await conn.query('SELECT * FROM module_registry WHERE module_key = "form_builder"');
    assert(modRows.length === 1, 'Form Builder registered in module_registry', { module: modRows[0] });
    assert(modRows[0]?.route_path === '/admin/forms', 'Form Builder route is /admin/forms');
    assert(modRows[0]?.icon_name === 'LayoutTemplate', 'Form Builder icon is LayoutTemplate');

    const [permRows]: [any[], any] = await conn.query(`
      SELECT rp.*, r.slug as role_slug
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      WHERE rp.module_key = 'form_builder'
    `);
    const adminPerm = permRows.find((p: any) => p.role_slug === 'admin');
    const managerPerm = permRows.find((p: any) => p.role_slug === 'manager');
    assert(Boolean(adminPerm && adminPerm.can_view && adminPerm.can_add && adminPerm.can_edit && adminPerm.can_delete), 'Admin has full permissions for Form Builder');
    assert(Boolean(managerPerm && managerPerm.can_view && managerPerm.can_add && managerPerm.can_edit && !managerPerm.can_delete), 'Manager has view/add/edit without delete for Form Builder');

    // -------------------------------------------------------------
    // Test 2: Master-Detail Sample Tables
    // -------------------------------------------------------------
    console.log('\n--- Test Group 2: Master-Detail Database Tables & Foreign Keys ---');
    const [soRows]: [any[], any] = await conn.query('SELECT count(*) as count FROM sales_orders');
    const [soiRows]: [any[], any] = await conn.query('SELECT count(*) as count FROM sales_order_items');
    assert(soRows[0]?.count >= 4, 'sales_orders table has seeded records', { count: soRows[0]?.count });
    assert(soiRows[0]?.count >= 7, 'sales_order_items table has seeded child items', { count: soiRows[0]?.count });

    const [fkRows]: [any[], any] = await conn.query(`
      SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = 'erp_platform_db' AND TABLE_NAME = 'sales_order_items'
        AND REFERENCED_TABLE_NAME = 'sales_orders'
    `);
    assert(fkRows.length > 0, 'Foreign key relationship exists from sales_order_items to sales_orders', fkRows[0]);

    // -------------------------------------------------------------
    // Test 3: Form Service: Sources & Schema Discovery
    // -------------------------------------------------------------
    console.log('\n--- Test Group 3: Data Sources & Schema Discovery ---');
    const sources = await formsService.listEligibleDataSources();
    assert(sources.tables.length > 0, 'Lists eligible database tables', { count: sources.tables.length });
    const hasSalesOrders = sources.tables.some((t) => t.name === 'sales_orders');
    assert(hasSalesOrders, 'sales_orders included in eligible tables');

    const schema = await formsService.getSourceSchema('table', 'sales_orders');
    assert(schema.columns.length >= 10, 'Discovers schema columns for sales_orders', { columnCount: schema.columns.length });
    assert(schema.primaryKey === 'id', 'Identifies sales_orders primary key as id');
    assert(schema.inboundRelations.some((r) => r.childTable === 'sales_order_items'), 'Discovers inbound detail relation to sales_order_items');

    // -------------------------------------------------------------
    // Test 4: Form Lifecycle & Persistence (Blank Canvas Creation)
    // -------------------------------------------------------------
    console.log('\n--- Test Group 4: Form Designer Lifecycle & Blank Canvas ---');
    const newForm = await formsService.createForm({
      name: 'Test Automated Orders Form',
      description: 'Created by automated verification test',
      category: 'Sales',
      form_type: 'single',
      status: 'draft',
      source_type: 'table',
      source_name: 'sales_orders',
      canvas_layout: { width: '100%', padding: '24px', columns: 12, gap: 16, snapToGrid: true, gridSize: 8, showGridLines: true, zoomLevel: 1.0 },
      controls: [], // Completely blank canvas!
      master_detail_config: {
        masterTable: 'sales_orders',
        masterPrimaryKey: 'id',
        details: [
          {
            id: 'det_test_items',
            gridControlId: 'grid_items',
            detailTable: 'sales_order_items',
            foreignKeyColumn: 'order_id',
            masterKeyColumn: 'id',
            relationshipType: 'one_to_many',
            cascadeDelete: true,
            columns: [],
          },
        ],
      },
    });

    assert(Boolean(newForm.id), 'Successfully created new form with blank canvas', { id: newForm.id, name: newForm.name });
    assert(newForm.controls.length === 0, 'New form canvas is genuinely empty');
    assert(newForm.status === 'draft', 'New form starts in draft status');

    // Add controls to the form
    const updatedForm = await formsService.updateForm(newForm.id, {
      controls: [
        {
          id: 'fld_ord_num',
          type: 'text',
          name: 'order_number',
          label: 'Order Number',
          fieldBinding: 'order_number',
          col: 1,
          row: 1,
          colSpan: 6,
          validation: { required: true },
        },
        {
          id: 'grid_items',
          type: 'datagrid',
          name: 'items_grid',
          label: 'Line Items Grid',
          col: 1,
          row: 2,
          colSpan: 12,
          detailGridConfig: {
            detailTable: 'sales_order_items',
            foreignKeyColumn: 'order_id',
            masterKeyColumn: 'id',
            columns: [
              { field: 'item_name', label: 'Item Name', width: '200px', editable: true, required: true },
              { field: 'quantity', label: 'Qty', width: '80px', editable: true, required: true, type: 'number' },
              { field: 'unit_price', label: 'Unit Price', width: '100px', editable: true, required: true, type: 'currency' },
              { field: 'line_total', label: 'Total', width: '100px', editable: false, type: 'currency' },
            ],
            allowAdd: true,
            allowEdit: true,
            allowDelete: true,
            defaultPageSize: 10,
            cascadeDelete: true,
          },
        },
      ],
    });

    assert(updatedForm.controls.length === 2, 'Updated form controls saved successfully', { count: updatedForm.controls.length });
    assert(updatedForm.version === 2, 'Version incremented to 2');

    // Publish form
    const published = await formsService.publishForm(newForm.id);
    assert(published.status === 'published', 'Form successfully published');

    // Duplicate form
    const duplicated = await formsService.duplicateForm(newForm.id, 'Test Automated Orders Form (Clone)');
    assert(duplicated.name === 'Test Automated Orders Form (Clone)', 'Form successfully duplicated');
    assert(duplicated.status === 'draft', 'Duplicated form clone starts as draft');
    assert(duplicated.controls.length === 2, 'Duplicated form inherits all controls');

    // Export & Import
    const exported = await formsService.exportForm(newForm.id);
    assert(exported.apexFlowExport === 'FormDefinition', 'Export format is valid');
    const imported = await formsService.importForm(exported);
    assert(imported.name === newForm.name, 'Form successfully imported from definition');

    // Clean up clones
    await formsService.deleteForm(duplicated.id);
    await formsService.deleteForm(imported.id);

    // -------------------------------------------------------------
    // Test 5: Real Runtime CRUD & Master-Detail Transaction Engine
    // -------------------------------------------------------------
    console.log('\n--- Test Group 5: Real Runtime CRUD & Master-Detail Transaction Engine ---');
    // Fetch records
    const fetchRes = await formsService.fetchRecords(newForm.id, { page: 1, limit: 10 });
    assert(fetchRes.data.length >= 4, 'Runtime SELECT fetched real database records', { total: fetchRes.pagination.total });

    // Insert new master record with child detail rows in single transaction
    const testOrderNumber = `TEST-${Date.now()}`;
    const createResult = await formsService.saveRecordWithDetails(newForm.id, {
      master: {
        order_number: testOrderNumber,
        customer_name: 'Antigravity Test Customer',
        order_date: '2026-03-01',
        order_status: 'pending',
        payment_status: 'unpaid',
        total_amount: 1500.00,
        shipping_address: '100 Antigravity Way, Suite 1',
      },
      details: {
        grid_items: {
          inserted: [
            {
              item_name: 'Test Heavy Duty Component A',
              sku: 'TEST-SKU-001',
              quantity: 2,
              unit_price: 500.00,
              line_total: 1000.00,
            },
            {
              item_name: 'Test Sensor Module B',
              sku: 'TEST-SKU-002',
              quantity: 1,
              unit_price: 500.00,
              line_total: 500.00,
            },
          ],
        },
      },
    });

    assert(createResult.success, 'Transaction-safe master + detail insertion succeeded', createResult);
    const createdMasterId = createResult.masterId;
    assert(Boolean(createdMasterId), 'Generated master ID received');

    // Retrieve single record with populated master-detail child rows
    const recordWithDetails = await formsService.getRecordWithDetails(newForm.id, createdMasterId);
    assert(recordWithDetails.master.order_number === testOrderNumber, 'Loaded master record matches inserted order_number');
    const childRows = recordWithDetails.details['grid_items'] || [];
    assert(childRows.length === 2, 'Loaded 2 child items automatically bound by order_id foreign key', { childCount: childRows.length });
    assert(childRows[0].order_id === createdMasterId, 'Child foreign key correctly assigned to master primary key');

    // Update master record AND synchronize detail rows (insert new item, update existing item, delete item) in a transaction
    const itemToUpdate = childRows[0];
    const itemToDelete = childRows[1];

    const updateResult = await formsService.saveRecordWithDetails(
      newForm.id,
      {
        master: {
          order_number: testOrderNumber,
          customer_name: 'Antigravity Test Customer Updated',
          order_status: 'processing',
          total_amount: 2200.00,
        },
        details: {
          grid_items: {
            updated: [
              {
                id: itemToUpdate.id,
                quantity: 3,
                unit_price: 500.00,
                line_total: 1500.00,
              },
            ],
            deleted: [itemToDelete.id],
            inserted: [
              {
                item_name: 'Test Additional Spare Part C',
                sku: 'TEST-SKU-003',
                quantity: 1,
                unit_price: 700.00,
                line_total: 700.00,
              },
            ],
          },
        },
      },
      createdMasterId
    );

    assert(updateResult.success, 'Transactional master update and child sync (update, delete, insert) succeeded');

    // Verify synchronized details
    const reloaded = await formsService.getRecordWithDetails(newForm.id, createdMasterId);
    assert(reloaded.master.customer_name === 'Antigravity Test Customer Updated', 'Master customer_name updated');
    const updatedChildRows = reloaded.details['grid_items'] || [];
    assert(updatedChildRows.length === 2, 'Detail grid now has 2 child rows (1 updated, 1 inserted, 1 deleted)');
    const updatedChild = updatedChildRows.find((r) => r.id === itemToUpdate.id);
    assert(updatedChild && updatedChild.quantity === 3, 'Existing child item updated quantity to 3');
    const deletedChild = updatedChildRows.find((r) => r.id === itemToDelete.id);
    assert(!deletedChild, 'Removed child item was deleted from database');

    // Delete record with cascade safety
    const deleteResult = await formsService.deleteRecord(newForm.id, createdMasterId);
    assert(deleteResult.success, 'Record deleted successfully with foreign key cleanup');

    // Verify deletion in database
    const [checkDeletedMaster]: [any[], any] = await conn.query('SELECT count(*) as count FROM sales_orders WHERE id = ?', [createdMasterId]);
    assert(checkDeletedMaster[0].count === 0, 'Master record removed from database');
    const [checkDeletedChildren]: [any[], any] = await conn.query('SELECT count(*) as count FROM sales_order_items WHERE order_id = ?', [createdMasterId]);
    assert(checkDeletedChildren[0].count === 0, 'Associated child items cleanly removed');

    // Clean up test form
    await formsService.deleteForm(newForm.id);

    // -------------------------------------------------------------
    // Test 6: Lookup LOV Data Provider
    // -------------------------------------------------------------
    console.log('\n--- Test Group 6: Lookup LOV Data Provider ---');
    const lookupData = await formsService.getLookupData({
      sourceType: 'table',
      sourceName: 'roles',
      returnColumn: 'id',
      displayColumn: 'name',
    });
    assert(lookupData.length > 0, 'Lookup query returned key/label pairs from roles table', { count: lookupData.length, sample: lookupData[0] });
    assert(Boolean(lookupData[0]?.key && lookupData[0]?.label), 'Lookup items have key and human-readable label');

  } catch (err: any) {
    console.error('Fatal error in test suite:', err);
    assert(false, `Test suite runtime exception: ${err.message}`);
  } finally {
    await conn.end();
  }

  // Summary
  console.log('\n============================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log('============================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite();
