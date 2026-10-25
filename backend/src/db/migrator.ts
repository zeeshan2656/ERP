import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDbPool, query } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { RowDataPacket } from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface MigrationRow extends RowDataPacket {
  version: string;
  name: string;
  executed_at: string;
}

export function parseSqlStatements(rawSql: string): string[] {
  // Remove block comments /* ... */
  let cleaned = rawSql.replace(/\/\*[\s\S]*?\*\//g, '');

  // Remove line comments (-- ...)
  cleaned = cleaned
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('--');
      if (idx !== -1) {
        return line.substring(0, idx);
      }
      return line;
    })
    .join('\n');

  // Split by semicolons
  return cleaned
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export async function runMigrations(): Promise<void> {
  logger.info('Starting database migration checks...');

  const pool = getDbPool();

  // 1. Ensure migrations journal table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`schema_migrations\` (
      \`version\` VARCHAR(50) NOT NULL PRIMARY KEY,
      \`name\` VARCHAR(255) NOT NULL,
      \`executed_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 2. Fetch executed migrations
  const executed = await query<MigrationRow[]>('SELECT version FROM schema_migrations ORDER BY version ASC');
  const executedSet = new Set(executed.map((m) => m.version));

  // 3. Read migration files
  const migrationsDir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    logger.warn('Migrations directory not found, skipping migrations', { migrationsDir });
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const version = file.split('_')[0];
    if (executedSet.has(version)) {
      continue;
    }

    logger.info(`Executing migration: ${file}`);
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');
    const statements = parseSqlStatements(sql);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const statement of statements) {
        await connection.query(statement);
      }

      await connection.query(
        'INSERT INTO schema_migrations (version, name, executed_at) VALUES (?, ?, NOW())',
        [version, file]
      );

      await connection.commit();
      logger.info(`Successfully completed migration: ${file} (${statements.length} statements executed)`);
    } catch (err) {
      await connection.rollback();
      logger.error(`Migration failed on file: ${file}`, { error: (err as Error).message });
      throw err;
    } finally {
      connection.release();
    }
  }

  logger.info('All database migrations are up to date.');
}

// Allow direct CLI execution
if (process.argv[1] === __filename) {
  runMigrations()
    .then(() => {
      logger.info('Migration CLI runner finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Migration CLI runner failed:', { error: err.message });
      process.exit(1);
    });
}
