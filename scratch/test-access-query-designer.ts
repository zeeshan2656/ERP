import http from 'http';

interface ApiResponse<T = any> {
  statusCode: number;
  data: T;
  raw?: any;
}

function request<T = any>(
  method: string,
  path: string,
  body?: any,
  token?: string
): Promise<ApiResponse<T>> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/v1${path}`,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            const parsed = raw ? JSON.parse(raw) : null;
            resolve({
              statusCode: res.statusCode || 500,
              data: parsed?.data !== undefined ? parsed.data : parsed,
              raw: parsed,
            });
          } catch {
            resolve({
              statusCode: res.statusCode || 500,
              data: raw as any,
              raw,
            });
          }
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function verifyAccessQueryDesigner() {
  console.log('===============================================================');
  console.log('MICROSOFT ACCESS QUERY DESIGNER WORKFLOW: END-TO-END VALIDATION');
  console.log('===============================================================\n');

  // Step 1: Login
  console.log('1. Authenticating as Administrator...');
  const loginRes = await request('POST', '/auth/login', {
    emailOrUsername: 'admin',
    password: 'Admin@123',
  });
  const token = loginRes.data?.accessToken;
  if (!token) {
    throw new Error(`Login failed with status ${loginRes.statusCode}: ${JSON.stringify(loginRes.data)}`);
  }
  console.log('   ✓ Logged in successfully\n');

  // Step 2: Database Table Listing (Add Tables Modal Data)
  console.log('2. Testing Table Discovery for Add Tables Modal...');
  const tablesRes = await request('GET', '/database/tables', null, token);
  const tables = tablesRes.data || [];
  console.log(`   ✓ Found ${tables.length} database tables: [${tables.slice(0, 5).map((t: any) => t.tableName).join(', ')}...]`);

  const userStruct = await request('GET', '/database/tables/users/structure', null, token);
  console.log(`   ✓ Reflected users table structure (${userStruct.data?.columns?.length} columns, PK: ${userStruct.data?.primaryKey?.join(', ')})\n`);

  // Step 3: Test Access Query Definition Execution (Canvas + Grid + Calculated + Criteria)
  console.log('3. Testing Access Query Execution (users INNER JOIN roles)...');
  const accessVisualDef = {
    tables: [
      { id: 't1', tableName: 'users', alias: 'u', position: { x: 50, y: 50 } },
      { id: 't2', tableName: 'roles', alias: 'r', position: { x: 350, y: 50 } },
    ],
    joins: [
      {
        id: 'j1',
        sourceTableAlias: 'u',
        sourceColumn: 'role_id',
        targetTableAlias: 'r',
        targetColumn: 'id',
        joinType: 'INNER',
      },
    ],
    // The Microsoft Access Design Grid Columns
    gridColumns: [
      {
        id: 'col_1',
        field: 'username',
        tableName: 'users',
        tableAlias: 'u',
        columnName: 'username',
        alias: 'UserName',
        sortOrder: 'ASC',
        isVisible: true,
        criteria: '<> "nobody"',
      },
      {
        id: 'col_2',
        field: 'email',
        tableName: 'users',
        tableAlias: 'u',
        columnName: 'email',
        alias: 'UserEmail',
        sortOrder: '',
        isVisible: true,
      },
      {
        id: 'col_3',
        field: 'name',
        tableName: 'roles',
        tableAlias: 'r',
        columnName: 'name',
        alias: 'RoleName',
        sortOrder: '',
        isVisible: true,
      },
      {
        id: 'col_4',
        field: 'UserBadge',
        tableName: '',
        tableAlias: '',
        columnName: '',
        alias: 'UserBadge',
        isCalculated: true,
        // Access bracket notation [table].[column]
        calculatedFormula: "CONCAT([u].[username], ' (', UPPER([r].[name]), ')')",
        sortOrder: '',
        isVisible: true,
      },
    ],
    limit: 50,
  };

  const previewRes = await request('POST', '/queries/preview', { visualDefinition: accessVisualDef }, token);
  const previewData = previewRes.raw || previewRes.data;
  if (previewRes.statusCode !== 200 || !previewData?.success) {
    throw new Error(`Preview failed: ${JSON.stringify(previewData)}`);
  }

  console.log('   ✓ Live Query Executed Successfully!');
  console.log(`   ✓ Rows returned: ${previewData.rowCount}`);
  console.log(`   ✓ Execution time: ${previewData.executionTimeMs} ms`);
  console.log('   ✓ Generated SQL:\n', previewData.generatedSql);
  console.log('   ✓ First Record Result:\n', previewData.data?.[0]);
  console.log('\n');

  // Step 4: Save Access Query Design
  console.log('4. Testing Save & Reopen Query Design...');
  const saveRes = await request(
    'POST',
    '/queries',
    {
      name: `Access Design Test Query ${Date.now()}`,
      description: 'E2E test of Microsoft Access Query Design persistence',
      category: 'General',
      status: 'draft',
      visualDefinition: accessVisualDef,
    },
    token
  );

  if (saveRes.statusCode !== 201 && saveRes.statusCode !== 200) {
    throw new Error(`Save failed: ${JSON.stringify(saveRes.data)}`);
  }
  const savedId = saveRes.data.id;
  console.log(`   ✓ Query saved successfully with ID: ${savedId}`);

  // Step 5: Reopen and Verify Design Preservation
  const reopenRes = await request('GET', `/queries/${savedId}`, null, token);
  const reloadedDef = reopenRes.data?.visualDefinition;
  if (!reloadedDef || !reloadedDef.gridColumns || reloadedDef.gridColumns.length !== 4) {
    throw new Error(`Reopen failed: Grid columns not preserved. Got: ${JSON.stringify(reloadedDef)}`);
  }
  console.log(`   ✓ Query reopened successfully! ${reloadedDef.gridColumns.length} grid columns and ${reloadedDef.joins.length} joins preserved.`);

  // Step 6: Clean up test query
  await request('DELETE', `/queries/${savedId}`, null, token);
  console.log('   ✓ Test query cleaned up.\n');

  console.log('===============================================================');
  console.log('SUCCESS: ALL MICROSOFT ACCESS QUERY DESIGNER CAPABILITIES PASS!');
  console.log('===============================================================');
}

verifyAccessQueryDesigner().catch((err) => {
  console.error('\n❌ VALIDATION ERROR:', err);
  process.exit(1);
});
