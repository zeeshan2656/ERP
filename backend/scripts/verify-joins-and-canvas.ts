const API_BASE = 'http://localhost:5000/api/v1';

async function runJoinVerification() {
  console.log('=====================================================');
  console.log('STARTING QUERY BUILDER JOIN & SQL EXECUTION TEST SUITE');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Authenticate
  let token = '';
  try {
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrUsername: 'admin',
        password: 'Admin@123',
      }),
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(loginData.message || 'Login failed');
    token = loginData.data.accessToken;
    console.log('✓ Successfully authenticated as superadmin.');
    passed++;
  } catch (err: any) {
    console.error('✗ Authentication failed:', err.message);
    process.exit(1);
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 2. Test 2-Table INNER JOIN: users INNER JOIN roles
  try {
    const innerJoinDef = {
      tables: [
        { id: 't1', tableName: 'users', alias: 'u', position: { x: 50, y: 50 } },
        { id: 't2', tableName: 'roles', alias: 'r', position: { x: 380, y: 50 } },
      ],
      joins: [
        {
          id: 'j1',
          sourceTableAlias: 'u',
          sourceColumn: 'role_id',
          targetTableAlias: 'r',
          targetColumn: 'id',
          joinType: 'INNER',
          operator: '=',
        },
      ],
      gridColumns: [
        { id: 'c1', tableAlias: 'u', columnName: 'email', alias: 'UserEmail', isVisible: true },
        { id: 'c2', tableAlias: 'u', columnName: 'full_name', alias: 'FullName', isVisible: true },
        { id: 'c3', tableAlias: 'r', columnName: 'name', alias: 'RoleName', isVisible: true },
      ],
      limit: 10,
    };

    const res = await fetch(`${API_BASE}/queries/preview`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ visualDefinition: innerJoinDef }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Preview returned failure');
    }

    console.log(`✓ 2-Table INNER JOIN passed: returned ${json.rowCount} rows in ${json.executionTimeMs}ms`);
    console.log(`  Generated SQL: ${json.generatedSql.replace(/\n/g, ' ')}`);
    passed++;
  } catch (err: any) {
    console.error('✗ 2-Table INNER JOIN failed:', err.message);
    failed++;
  }

  // 3. Test 2-Table LEFT OUTER JOIN: users LEFT JOIN roles
  try {
    const leftJoinDef = {
      tables: [
        { id: 't1', tableName: 'users', alias: 'u', position: { x: 50, y: 50 } },
        { id: 't2', tableName: 'roles', alias: 'r', position: { x: 380, y: 50 } },
      ],
      joins: [
        {
          id: 'j1',
          sourceTableAlias: 'u',
          sourceColumn: 'role_id',
          targetTableAlias: 'r',
          targetColumn: 'id',
          joinType: 'LEFT',
          operator: '=',
        },
      ],
      gridColumns: [
        { id: 'c1', tableAlias: 'u', columnName: 'email', alias: 'UserEmail', isVisible: true },
        { id: 'c2', tableAlias: 'r', columnName: 'name', alias: 'RoleName', isVisible: true },
      ],
      limit: 10,
    };

    const res = await fetch(`${API_BASE}/queries/preview`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ visualDefinition: leftJoinDef }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'LEFT JOIN preview failed');
    }

    console.log(`✓ 2-Table LEFT JOIN passed: returned ${json.rowCount} rows.`);
    passed++;
  } catch (err: any) {
    console.error('✗ 2-Table LEFT JOIN failed:', err.message);
    failed++;
  }

  // 4. Test 2-Table RIGHT OUTER JOIN: users RIGHT JOIN roles
  try {
    const rightJoinDef = {
      tables: [
        { id: 't1', tableName: 'users', alias: 'u', position: { x: 50, y: 50 } },
        { id: 't2', tableName: 'roles', alias: 'r', position: { x: 380, y: 50 } },
      ],
      joins: [
        {
          id: 'j1',
          sourceTableAlias: 'u',
          sourceColumn: 'role_id',
          targetTableAlias: 'r',
          targetColumn: 'id',
          joinType: 'RIGHT',
          operator: '=',
        },
      ],
      gridColumns: [
        { id: 'c1', tableAlias: 'r', columnName: 'name', alias: 'RoleName', isVisible: true },
        { id: 'c2', tableAlias: 'u', columnName: 'email', alias: 'UserEmail', isVisible: true },
      ],
      limit: 10,
    };

    const res = await fetch(`${API_BASE}/queries/preview`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ visualDefinition: rightJoinDef }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'RIGHT JOIN preview failed');
    }

    console.log(`✓ 2-Table RIGHT JOIN passed: returned ${json.rowCount} rows.`);
    passed++;
  } catch (err: any) {
    console.error('✗ 2-Table RIGHT JOIN failed:', err.message);
    failed++;
  }

  // 5. Test 3-Table Multi-JOIN: users JOIN roles JOIN audit_logs
  try {
    const multiJoinDef = {
      tables: [
        { id: 't1', tableName: 'users', alias: 'u', position: { x: 50, y: 50 } },
        { id: 't2', tableName: 'roles', alias: 'r', position: { x: 380, y: 50 } },
        { id: 't3', tableName: 'audit_logs', alias: 'a', position: { x: 700, y: 50 } },
      ],
      joins: [
        {
          id: 'j1',
          sourceTableAlias: 'u',
          sourceColumn: 'role_id',
          targetTableAlias: 'r',
          targetColumn: 'id',
          joinType: 'INNER',
          operator: '=',
        },
        {
          id: 'j2',
          sourceTableAlias: 'u',
          sourceColumn: 'id',
          targetTableAlias: 'a',
          targetColumn: 'user_id',
          joinType: 'LEFT',
          operator: '=',
        },
      ],
      gridColumns: [
        { id: 'c1', tableAlias: 'u', columnName: 'email', alias: 'UserEmail', isVisible: true },
        { id: 'c2', tableAlias: 'r', columnName: 'name', alias: 'RoleName', isVisible: true },
        { id: 'c3', tableAlias: 'a', columnName: 'action', alias: 'AuditAction', isVisible: true },
      ],
      limit: 15,
    };

    const res = await fetch(`${API_BASE}/queries/preview`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ visualDefinition: multiJoinDef }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Multi-table join preview failed');
    }

    console.log(`✓ 3-Table Multi-JOIN passed: returned ${json.rowCount} rows.`);
    passed++;
  } catch (err: any) {
    console.error('✗ 3-Table Multi-JOIN failed:', err.message);
    failed++;
  }

  // 6. Test Join Comparison Operator (<>): users <> roles
  try {
    const operatorDef = {
      tables: [
        { id: 't1', tableName: 'users', alias: 'u', position: { x: 50, y: 50 } },
        { id: 't2', tableName: 'roles', alias: 'r', position: { x: 380, y: 50 } },
      ],
      joins: [
        {
          id: 'j1',
          sourceTableAlias: 'u',
          sourceColumn: 'role_id',
          targetTableAlias: 'r',
          targetColumn: 'id',
          joinType: 'INNER',
          operator: '<>',
        },
      ],
      gridColumns: [
        { id: 'c1', tableAlias: 'u', columnName: 'email', alias: 'UserEmail', isVisible: true },
        { id: 'c2', tableAlias: 'r', columnName: 'name', alias: 'NonMatchingRole', isVisible: true },
      ],
      limit: 5,
    };

    const res = await fetch(`${API_BASE}/queries/preview`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ visualDefinition: operatorDef }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Operator join failed');
    }

    console.log(`✓ Comparison operator (<>) JOIN passed: returned ${json.rowCount} rows.`);
    passed++;
  } catch (err: any) {
    console.error('✗ Comparison operator (<>) JOIN failed:', err.message);
    failed++;
  }

  // 7. Test FULL OUTER JOIN Engine Incompatibility Handling
  try {
    const fullOuterDef = {
      tables: [
        { id: 't1', tableName: 'users', alias: 'u', position: { x: 50, y: 50 } },
        { id: 't2', tableName: 'roles', alias: 'r', position: { x: 380, y: 50 } },
      ],
      joins: [
        {
          id: 'j1',
          sourceTableAlias: 'u',
          sourceColumn: 'role_id',
          targetTableAlias: 'r',
          targetColumn: 'id',
          joinType: 'FULL',
          operator: '=',
        },
      ],
      gridColumns: [
        { id: 'c1', tableAlias: 'u', columnName: 'email', alias: 'UserEmail', isVisible: true },
        { id: 'c2', tableAlias: 'r', columnName: 'name', alias: 'RoleName', isVisible: true },
      ],
      limit: 5,
    };

    const res = await fetch(`${API_BASE}/queries/preview`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ visualDefinition: fullOuterDef }),
    });

    const json = await res.json();
    // MySQL does not support FULL OUTER JOIN syntax, so it should return an informative error message, not crash or return a blank 500
    if (!res.ok && json.message && json.message.includes('FULL OUTER JOIN is not natively supported by the MySQL database engine')) {
      console.log('✓ FULL OUTER JOIN incompatibility caught gracefully with clear user guidance:');
      console.log(`  "${json.message}"`);
      passed++;
    } else if (res.ok) {
      console.log('✓ Engine executed FULL OUTER JOIN successfully.');
      passed++;
    } else {
      throw new Error(`Unexpected error message format: ${json.message}`);
    }
  } catch (err: any) {
    console.error('✗ FULL OUTER JOIN handling failed:', err.message);
    failed++;
  }

  // 8. Create, Execute, and Delete a Multi-Table Saved Query
  try {
    const newQueryPayload = {
      name: `Test Multi-Join Query ${Date.now()}`,
      description: 'Automated test query verifying multi-table joins persistence and execution',
      category: 'General',
      status: 'draft',
      visualDefinition: {
        tables: [
          { id: 't1', tableName: 'users', alias: 'u', position: { x: 50, y: 50 } },
          { id: 't2', tableName: 'roles', alias: 'r', position: { x: 380, y: 50 } },
        ],
        joins: [
          {
            id: 'j1',
            sourceTableAlias: 'u',
            sourceColumn: 'role_id',
            targetTableAlias: 'r',
            targetColumn: 'id',
            joinType: 'INNER',
            operator: '=',
          },
        ],
        gridColumns: [
          { id: 'c1', tableAlias: 'u', columnName: 'email', alias: 'Email', isVisible: true },
          { id: 'c2', tableAlias: 'r', columnName: 'name', alias: 'Role', isVisible: true },
        ],
      },
    };

    const createRes = await fetch(`${API_BASE}/queries`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(newQueryPayload),
    });
    const createJson = await createRes.json();
    if (!createRes.ok || !createJson.data?.id) {
      throw new Error(createJson.message || 'Failed to create query');
    }
    const queryId = createJson.data.id;
    console.log(`✓ Successfully saved multi-table query '${newQueryPayload.name}' (ID: ${queryId})`);

    // Execute saved query
    const execRes = await fetch(`${API_BASE}/queries/${queryId}/execute`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ limit: 10 }),
    });
    const execJson = await execRes.json();
    if (!execRes.ok || !execJson.data) {
      throw new Error(execJson.message || 'Failed to execute saved query');
    }
    console.log(`✓ Executed saved query: returned ${execJson.data.rowCount} records`);

    // Clean up: delete query
    const delRes = await fetch(`${API_BASE}/queries/${queryId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    if (!delRes.ok) throw new Error('Failed to clean up test query');
    console.log(`✓ Cleaned up test query.`);
    passed++;
  } catch (err: any) {
    console.error('✗ Save/Execute/Delete multi-table query failed:', err.message);
    failed++;
  }

  console.log('\n=====================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runJoinVerification();
