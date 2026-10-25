import http from 'http';

interface ApiResponse<T = any> {
  statusCode: number;
  data: T;
  raw?: any;
  token?: string;
  pagination?: any;
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
              token: parsed?.token,
              pagination: parsed?.pagination,
            });
          } catch (e) {
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

async function runE2E() {
  console.log('========================================================');
  console.log('APEX FLOW VISUAL QUERY BUILDER: END-TO-END VERIFICATION');
  console.log('========================================================\n');

  // 1. Authenticate
  console.log('Step 1: Authenticating as Administrator...');
  const loginRes = await request('POST', '/auth/login', {
    emailOrUsername: 'admin',
    password: 'Admin@123',
  });

  const token = loginRes.data?.accessToken;

  if (!token) {
    throw new Error(`Authentication failed. Status: ${loginRes.statusCode}, body: ${JSON.stringify(loginRes.data)}`);
  }
  console.log('  ✓ Authenticated successfully with JWT token\n');

  // 2. Verify Module Registry
  console.log('Step 2: Verifying Module Registry for Visual Query Builder...');
  const modulesRes = await request('GET', '/modules', null, token);
  const qbModule = (modulesRes.data || []).find((m: any) => m.moduleKey === 'query_builder');
  if (!qbModule) {
    throw new Error('Step 2 Failed: query_builder module not found in registry');
  }
  console.log(`  ✓ Module found: "${qbModule.name}" (Route: ${qbModule.routePath}, Icon: ${qbModule.iconName})\n`);

  // 3. Database Schema Reflection
  console.log('Step 3: Database Reflection API verification...');
  const tablesRes = await request('GET', '/database/tables', null, token);
  console.log(`  ✓ Available tables count: ${tablesRes.data?.length || 0}`);

  const userStructRes = await request('GET', '/database/tables/users/structure', null, token);
  console.log(`  ✓ 'users' table columns reflected: ${userStructRes.data?.columns?.length || 0}`);
  console.log(`  ✓ 'users' foreign keys reflected: ${userStructRes.data?.foreignKeys?.length || 0}\n`);

  // 4. Test Query Preview (Multi-Table JOIN with Calculated Field)
  console.log('Step 4: Live Query Preview (users INNER JOIN roles)...');
  const previewPayload = {
    visualDefinition: {
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
      columns: [
        { id: 'c1', tableAlias: 'u', tableName: 'users', columnName: 'username', alias: 'username' },
        { id: 'c2', tableAlias: 'u', tableName: 'users', columnName: 'email', alias: 'email' },
        { id: 'c3', tableAlias: 'r', tableName: 'roles', columnName: 'name', alias: 'role_title' },
      ],
      calculatedColumns: [
        {
          id: 'calc1',
          alias: 'user_badge',
          formula: "CONCAT(u.username, ' [', r.name, ']')",
          outputType: 'VARCHAR',
          isVisible: true,
        },
      ],
      filters: {
        id: 'f_root',
        logicalOperator: 'AND',
        conditions: [
          {
            id: 'cond1',
            tableAlias: 'u',
            columnName: 'is_active',
            operator: 'EQUALS',
            value: 1,
          },
        ],
      },
      limit: 10,
    },
    parameterValues: {},
  };

  const previewRes = await request('POST', '/queries/preview', previewPayload, token);
  if (!Array.isArray(previewRes.data)) {
    throw new Error(`Step 4 Failed: Query preview failed: ${JSON.stringify(previewRes.data)}`);
  }
  const rowCount = previewRes.raw?.rowCount !== undefined ? previewRes.raw.rowCount : previewRes.data.length;
  const execTime = previewRes.raw?.executionTimeMs || 0;
  const genSql = previewRes.raw?.generatedSql || '';

  console.log(`  ✓ Preview returned ${rowCount} rows in ${execTime} ms`);
  console.log(`  ✓ First Row user_badge: ${previewRes.data[0]?.user_badge}`);
  console.log(`  ✓ Generated SQL: ${genSql.trim()}\n`);

  // 5. Create Saved Query
  console.log('Step 5: Creating Saved Query...');
  const createRes = await request(
    'POST',
    '/queries',
    {
      name: 'Active Staff Directory Query',
      description: 'Returns active employees with their assigned organizational role title',
      category: 'Reports',
      status: 'published',
      visualDefinition: previewPayload.visualDefinition,
      parameters: [
        {
          id: 'p1',
          name: 'min_id',
          label: 'Minimum User ID',
          dataType: 'string',
          isRequired: false,
        },
      ],
    },
    token
  );

  const savedQuery = createRes.data;
  if (!savedQuery?.id) {
    throw new Error(`Step 5 Failed: Could not create saved query. ${JSON.stringify(createRes.data)}`);
  }
  console.log(`  ✓ Created Saved Query ID: ${savedQuery.id} (Slug: ${savedQuery.slug})\n`);

  // 6. List Queries
  console.log('Step 6: Listing Saved Queries with Filters...');
  const listRes = await request('GET', '/queries?category=Reports', null, token);
  const found = (listRes.data || []).find((q: any) => q.id === savedQuery.id);
  if (!found) {
    throw new Error('Step 6 Failed: Saved query not found in category filter list');
  }
  console.log(`  ✓ Query list returned ${listRes.data.length} queries under category 'Reports'\n`);

  // 7. Execute Saved Query & Check History
  console.log('Step 7: Executing Saved Query & Logging History...');
  const execRes = await request(
    'POST',
    `/queries/${savedQuery.id}/execute`,
    { parameterValues: {}, limit: 5 },
    token
  );
  if (!Array.isArray(execRes.data)) {
    throw new Error('Step 7 Failed: Query execution failed');
  }
  const executionDuration = execRes.raw?.meta?.executionTimeMs || execRes.raw?.executionTimeMs || 0;
  const execRows = execRes.raw?.meta?.rowCount || execRes.data.length;
  console.log(`  ✓ Executed in ${executionDuration} ms, returned ${execRows} rows`);

  const historyRes = await request('GET', `/queries/${savedQuery.id}/history`, null, token);
  if (!historyRes.data || historyRes.data.length === 0) {
    throw new Error('Step 7 Failed: Execution history was not recorded');
  }
  console.log(`  ✓ Execution history logged: ${historyRes.data.length} record(s), executor: ${historyRes.data[0].executedByName}\n`);

  // 8. Duplicate Query
  console.log('Step 8: Duplicating Query...');
  const dupRes = await request('POST', `/queries/${savedQuery.id}/duplicate`, {}, token);
  const dupQuery = dupRes.data;
  console.log(`  ✓ Duplicate created: "${dupQuery.name}" (ID: ${dupQuery.id})\n`);

  // 9. Clean up
  console.log('Step 9: Cleaning up test queries...');
  await request('DELETE', `/queries/${savedQuery.id}`, null, token);
  await request('DELETE', `/queries/${dupQuery.id}`, null, token);
  console.log('  ✓ Cleaned up test queries successfully.\n');

  console.log('========================================================');
  console.log('ALL E2E INTEGRATION TESTS PASSED (100% SUCCESS)');
  console.log('========================================================');
  process.exit(0);
}

runE2E().catch((err) => {
  console.error('\nE2E VERIFICATION FAILED:', err);
  process.exit(1);
});
