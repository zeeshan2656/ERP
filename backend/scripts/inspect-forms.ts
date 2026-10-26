import { getDbPool } from '../src/config/database.js';

async function main() {
  const [rows] = await getDbPool().query(
    'SELECT id, name, form_type, display_mode, status, JSON_LENGTH(controls) as ctrl_count, controls, canvas_layout FROM saved_forms'
  );
  console.log(JSON.stringify(rows, null, 2));
  await getDbPool().end();
}

main().catch(console.error);
