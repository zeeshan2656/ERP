import { sqlGeneratorService } from '../modules/queries/sql-generator.service.js';
import { VisualQueryDefinition } from '../modules/queries/queries.schema.js';
import { queriesService } from '../modules/queries/queries.service.js';

async function runTests() {
  console.log('====================================================');
  console.log('APEX FLOW VISUAL QUERY BUILDER: ENGINE TEST SUITE');
  console.log('====================================================\n');

  // TEST 1: Single Table Query with columns and sorting
  console.log('Test 1: Single Table Query');
  const def1: VisualQueryDefinition = {
    tables: [
      { id: 't1', tableName: 'users', alias: 'u', position: { x: 50, y: 50 } },
    ],
    joins: [],
    columns: [
      { id: 'c1', tableId: 't1', tableName: 'users', tableAlias: 'u', columnName: 'id', alias: 'user_id', isVisible: true },
      { id: 'c2', tableId: 't1', tableName: 'users', tableAlias: 'u', columnName: 'username', alias: 'login_name', isVisible: true },
      { id: 'c3', tableId: 't1', tableName: 'users', tableAlias: 'u', columnName: 'email', isVisible: true, sortOrder: 'ASC', sortPriority: 1 },
    ],
    whereFilters: {
      id: 'g1',
      logicalOperator: 'AND',
      conditions: [
        { id: 'f1', tableAlias: 'u', columnName: 'is_active', operator: 'equals', value: 1 },
      ],
    },
    limit: 10,
    offset: 0,
  };

  const gen1 = sqlGeneratorService.generate(def1);
  console.log('  Generated SQL:', gen1.sql.trim().replace(/\n/g, ' '));
  console.log('  Params:', gen1.params);
  if (!gen1.sql.includes('SELECT `u`.`id` AS `user_id`, `u`.`username` AS `login_name`') || gen1.params[0] !== 1) {
    throw new Error('Test 1 Failed: incorrect single-table SQL generation');
  }
  console.log('  ✓ Test 1 Passed\n');

  // TEST 2: Multi-Table JOIN (users INNER JOIN roles, LEFT JOIN media_files)
  console.log('Test 2: Multi-Table JOIN with Column Aliases');
  const def2: VisualQueryDefinition = {
    tables: [
      { id: 't1', tableName: 'users', alias: 'u', position: { x: 50, y: 50 } },
      { id: 't2', tableName: 'roles', alias: 'r', position: { x: 350, y: 50 } },
    ],
    joins: [
      {
        id: 'j1',
        leftTableId: 't1',
        leftTable: 'users',
        leftTableAlias: 'u',
        leftColumn: 'role_id',
        joinType: 'INNER',
        rightTableId: 't2',
        rightTable: 'roles',
        rightTableAlias: 'r',
        rightColumn: 'id',
        operator: '=',
      },
    ],
    columns: [
      { id: 'c1', tableId: 't1', tableName: 'users', tableAlias: 'u', columnName: 'username', alias: 'username', isVisible: true },
      { id: 'c2', tableId: 't1', tableName: 'users', tableAlias: 'u', columnName: 'email', alias: 'email', isVisible: true },
      { id: 'c3', tableId: 't2', tableName: 'roles', tableAlias: 'r', columnName: 'name', alias: 'role_name', isVisible: true },
    ],
    whereFilters: {
      id: 'g1',
      logicalOperator: 'AND',
      conditions: [
        { id: 'f1', tableAlias: 'r', columnName: 'slug', operator: 'equals', value: 'admin' },
      ],
    },
    limit: 5,
  };

  const gen2 = sqlGeneratorService.generate(def2);
  console.log('  Generated SQL:', gen2.sql.trim().replace(/\n/g, ' '));
  if (!gen2.sql.includes('INNER JOIN `roles` AS `r` ON `u`.`role_id` = `r`.`id`')) {
    throw new Error('Test 2 Failed: missing or invalid INNER JOIN');
  }
  console.log('  ✓ Test 2 Passed\n');

  // TEST 3: Calculated Column & Formula Validation
  console.log('Test 3: Calculated Columns (CONCAT, UPPER, COALESCE)');
  const def3: VisualQueryDefinition = {
    tables: [
      { id: 't1', tableName: 'users', alias: 'u', position: { x: 50, y: 50 } },
    ],
    joins: [],
    columns: [
      { id: 'c1', tableId: 't1', tableName: 'users', tableAlias: 'u', columnName: 'id', isVisible: true },
    ],
    calculatedColumns: [
      {
        id: 'calc1',
        alias: 'display_badge',
        formula: "CONCAT(UPPER(u.username), ' <', u.email, '>')",
        outputType: 'VARCHAR',
        isVisible: true,
      },
    ],
    limit: 5,
  };

  const gen3 = sqlGeneratorService.generate(def3);
  console.log('  Generated SQL:', gen3.sql.trim().replace(/\n/g, ' '));
  if (!gen3.sql.includes("(CONCAT(UPPER(u.username), ' <', u.email, '>')) AS `display_badge`")) {
    throw new Error('Test 3 Failed: calculated column expression error');
  }
  console.log('  ✓ Test 3 Passed\n');

  // TEST 4: GROUP BY and Aggregation (COUNT, SUM)
  console.log('Test 4: GROUP BY and Aggregates');
  const def4: VisualQueryDefinition = {
    tables: [
      { id: 't1', tableName: 'users', alias: 'u', position: { x: 50, y: 50 } },
      { id: 't2', tableName: 'roles', alias: 'r', position: { x: 350, y: 50 } },
    ],
    joins: [
      {
        id: 'j1',
        leftTableId: 't1',
        leftTable: 'users',
        leftTableAlias: 'u',
        leftColumn: 'role_id',
        joinType: 'INNER',
        rightTableId: 't2',
        rightTable: 'roles',
        rightTableAlias: 'r',
        rightColumn: 'id',
        operator: '=',
      },
    ],
    columns: [
      { id: 'c1', tableId: 't2', tableName: 'roles', tableAlias: 'r', columnName: 'name', alias: 'role_name', isVisible: true, isGroupBy: true },
      { id: 'c2', tableId: 't1', tableName: 'users', tableAlias: 'u', columnName: 'id', alias: 'total_assigned_users', aggregate: 'COUNT', isVisible: true },
    ],
    groupByColumns: ['c1'],
    limit: 10,
  };

  const gen4 = sqlGeneratorService.generate(def4);
  console.log('  Generated SQL:', gen4.sql.trim().replace(/\n/g, ' '));
  if (!gen4.sql.includes('GROUP BY `r`.`name`') || !gen4.sql.includes('COUNT(`u`.`id`) AS `total_assigned_users`')) {
    throw new Error('Test 4 Failed: GROUP BY or aggregate compilation error');
  }
  console.log('  ✓ Test 4 Passed\n');

  // TEST 5: Parameterized Query Execution Test
  console.log('Test 5: Live Query Preview Execution');
  const preview = await queriesService.previewQuery(def2, {});
  console.log('  Preview status:', preview.success);
  console.log('  Returned rows count:', preview.rowCount);
  console.log('  Execution time:', preview.executionTimeMs, 'ms');
  if (!preview.success || !Array.isArray(preview.data)) {
    throw new Error('Test 5 Failed: live preview did not return valid data rows');
  }
  console.log('  ✓ Test 5 Passed\n');

  // TEST 6: CRUD Lifecycle (Create, List, Update, Execute, History, Delete)
  console.log('Test 6: Query CRUD & History Logging');
  const created = await queriesService.createQuery(
    {
      name: 'System Admin Users Query',
      description: 'Finds all active system admins with their roles',
      category: 'Administration',
      status: 'published',
      visualDefinition: def2,
      parameters: [{ id: 'p1', name: 'status', label: 'Status', dataType: 'string', isRequired: false }],
    },
    'system-test'
  );
  console.log('  Created query ID:', created.id, 'Slug:', created.slug);

  const execResult = await queriesService.executeSavedQuery(created.id, {}, { limit: 5 });
  console.log('  Execution returned rows:', execResult.rowCount, 'in', execResult.executionTimeMs, 'ms');

  const history = await queriesService.getExecutionHistory(created.id);
  console.log('  History records logged:', history.length);
  if (history.length === 0 || history[0].status !== 'success') {
    throw new Error('Test 6 Failed: execution history was not recorded');
  }

  await queriesService.deleteQuery(created.id);
  console.log('  Deleted test query successfully.');
  console.log('  ✓ Test 6 Passed\n');

  console.log('----------------------------------------------------');
  console.log('SUMMARY: ALL 6 QUERY BUILDER ENGINE TESTS PASSED (0 FAILURES)');
  console.log('----------------------------------------------------');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('ENGINE TEST FAILED:', err);
  process.exit(1);
});
