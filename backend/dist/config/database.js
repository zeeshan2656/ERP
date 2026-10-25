import mysql from 'mysql2/promise';
import { env } from './env.js';
import { logger } from '../utils/logger.js';
let pool;
export function getDbPool() {
    if (!pool) {
        pool = mysql.createPool({
            host: env.DB_HOST,
            port: env.DB_PORT,
            user: env.DB_USER,
            password: env.DB_PASSWORD,
            database: env.DB_NAME,
            waitForConnections: true,
            connectionLimit: env.DB_CONNECTION_LIMIT,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 10000,
            timezone: 'Z',
            dateStrings: true,
        });
        logger.info('MySQL connection pool initialized', {
            host: env.DB_HOST,
            port: env.DB_PORT,
            database: env.DB_NAME,
            connectionLimit: env.DB_CONNECTION_LIMIT,
        });
    }
    return pool;
}
export async function checkDbConnection() {
    try {
        const p = getDbPool();
        const [rows] = await p.query('SELECT 1 as is_connected');
        return Array.isArray(rows) && rows.length > 0;
    }
    catch (err) {
        logger.error('Database health check failed:', { error: err.message });
        return false;
    }
}
export async function query(sql, params) {
    const p = getDbPool();
    const [result] = await p.query(sql, params);
    return result;
}
export async function withTransaction(callback) {
    const p = getDbPool();
    const connection = await p.getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
//# sourceMappingURL=database.js.map