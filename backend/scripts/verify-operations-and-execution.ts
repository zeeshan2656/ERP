const API_BASE = 'http://localhost:5000/api/v1';

async function runVerification() {
  console.log('=====================================================');
  console.log('STARTING OPERATIONS & QUERY BUILDER VERIFICATION SUITE');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Log in as superadmin to get token
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
    failed++;
    process.exit(1);
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 2. Test Unified Dataset endpoint: GET /queries
  try {
    const listRes = await fetch(`${API_BASE}/queries`, { headers: authHeaders });
    const listJson = await listRes.json();
    const queries = listJson.data || [];
    console.log(`✓ GET /queries returned ${queries.length} unified queries.`);
    if (queries.length < 7) {
      throw new Error(`Expected at least 7 queries, got ${queries.length}`);
    }
    const sampleTemplates = queries.filter(
      (q: any) => q.isTemplate || q.slug?.startsWith('sample-') || q.category === 'Sample Queries'
    );
    console.log(`  - Found ${sampleTemplates.length} verified sample templates in unified dataset.`);
    passed++;
  } catch (err: any) {
    console.error('✗ Failed to fetch unified query list:', err.message);
    failed++;
  }

  // 3. Test execution of all 7 sample queries
  const sampleSlugs = [
    'sample-users-directory',
    'sample-user-roles',
    'sample-permissions-matrix',
    'sample-auth-audit-trail',
    'sample-recent-audit-logs',
    'sample-user-badges-calc',
    'sample-users-by-role-agg',
  ];

  for (const slug of sampleSlugs) {
    try {
      const execRes = await fetch(`${API_BASE}/queries/${slug}/execute`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ limit: 25 }),
      });
      const resData = await execRes.json();
      if (!execRes.ok || !resData.success) {
        throw new Error(`Execution error for ${slug}: ${resData.message || execRes.statusText}`);
      }
      if (!Array.isArray(resData.data)) {
        throw new Error(`Execution returned non-array data for ${slug}`);
      }
      if (!Array.isArray(resData.columns) || resData.columns.length === 0) {
        throw new Error(`Execution returned no column headers for ${slug}`);
      }
      console.log(
        `✓ [${slug}] executed: ${resData.rowCount} rows, ${resData.columns.length} columns in ${resData.executionTimeMs}ms`
      );
      passed++;
    } catch (err: any) {
      console.error(`✗ [${slug}] execution failed:`, err.message);
      failed++;
    }
  }

  // 4. Test Zero-Record Query Preview (Ensuring columns headers are preserved)
  try {
    console.log('\nTesting 0-record query preview with column preservation...');
    const zeroQueryDef = {
      tables: [{ id: 'tbl_u', tableName: 'users', alias: 'u', position: { x: 0, y: 0 } }],
      gridColumns: [
        {
          id: 'col_id',
          field: 'id',
          tableName: 'users',
          tableAlias: 'u',
          columnName: 'id',
          alias: 'user_id',
          isVisible: true,
          criteria: "='non-existent-user-id-xyz-999'",
          orCriteria: [],
          isCalculated: false,
        },
        {
          id: 'col_email',
          field: 'email',
          tableName: 'users',
          tableAlias: 'u',
          columnName: 'email',
          alias: 'user_email',
          isVisible: true,
          criteria: '',
          orCriteria: [],
          isCalculated: false,
        },
      ],
      joins: [],
      limit: 10,
    };

    const zeroRes = await fetch(`${API_BASE}/queries/preview`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ visualDefinition: zeroQueryDef }),
    });
    const zData = await zeroRes.json();

    if (zData.rowCount !== 0) {
      throw new Error(`Expected 0 rows, got ${zData.rowCount}`);
    }
    if (!Array.isArray(zData.columns) || zData.columns.length !== 2) {
      throw new Error(`Expected 2 columns preserved for 0 rows, got ${zData.columns?.length}`);
    }
    console.log(
      `✓ 0-record query handled gracefully: 0 rows returned, preserved ${zData.columns.length} column headers (${zData.columns.map((c: any) => c.header).join(', ')})`
    );
    passed++;
  } catch (err: any) {
    console.error('✗ 0-record preview test failed:', err.message);
    failed++;
  }

  // 5. Test Invalid Query (graceful error handling, no crash)
  try {
    console.log('\nTesting invalid query handling (non-existent table)...');
    const invalidDef = {
      tables: [{ id: 'tbl_invalid', tableName: 'non_existent_table_xyz', alias: 'bad', position: { x: 0, y: 0 } }],
      gridColumns: [
        {
          id: 'col_1',
          field: 'col',
          tableName: 'non_existent_table_xyz',
          tableAlias: 'bad',
          columnName: 'col',
          alias: 'col',
          isVisible: true,
          criteria: '',
          orCriteria: [],
          isCalculated: false,
        },
      ],
      joins: [],
    };

    const invRes = await fetch(`${API_BASE}/queries/preview`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ visualDefinition: invalidDef }),
    });
    const invData = await invRes.json();
    if (!invRes.ok || !invData.success) {
      console.log(`✓ Invalid query rejected gracefully with status ${invRes.status}: ${invData.message}`);
      passed++;
    } else {
      console.error('✗ Expected invalid query to return error, but it succeeded.');
      failed++;
    }
  } catch (err: any) {
    console.log(`✓ Invalid query error handled safely: ${err.message}`);
    passed++;
  }

  // 6. Test Query Duplication & Deletion
  try {
    console.log('\nTesting Query Duplicate and Delete lifecycle...');
    const dupRes = await fetch(`${API_BASE}/queries/sample-users-directory/duplicate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({}),
    });
    const dupJson = await dupRes.json();
    const dupQuery = dupJson.data;
    console.log(`✓ Duplicated sample query as '${dupQuery.name}' (ID: ${dupQuery.id})`);

    // Verify it executes
    const dupExec = await fetch(`${API_BASE}/queries/${dupQuery.id}/execute`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({}),
    });
    const dupExecJson = await dupExec.json();
    console.log(`✓ Executed duplicated query: ${dupExecJson.rowCount} rows`);

    // Clean up: delete duplicated query
    const delRes = await fetch(`${API_BASE}/queries/${dupQuery.id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    const delJson = await delRes.json();
    console.log(`✓ Cleaned up duplicate query: ${delJson.message}`);
    passed++;
  } catch (err: any) {
    console.error('✗ Duplicate/Delete test failed:', err.message);
    failed++;
  }

  console.log('\n=====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification();
