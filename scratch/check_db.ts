import { pool } from '../backend/src/db/connection.ts';

async function main() {
  const [users] = await pool.query('SELECT id, username, email FROM users');
  console.log('Users in DB:', users);

  const [setupSetting] = await pool.query("SELECT * FROM system_settings WHERE setting_key = 'system_initialized'");
  console.log('System initialized setting:', setupSetting);

  const [appearance] = await pool.query("SELECT * FROM system_settings WHERE setting_key LIKE 'soft_ui_%' OR setting_key LIKE 'radius_%'");
  console.log('Soft UI and Radius settings count:', (appearance as any[]).length);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
