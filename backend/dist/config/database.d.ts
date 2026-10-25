import { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
export declare function getDbPool(): Pool;
export declare function checkDbConnection(): Promise<boolean>;
export declare function query<T extends RowDataPacket[] | ResultSetHeader>(sql: string, params?: unknown[]): Promise<T>;
export declare function withTransaction<T>(callback: (connection: PoolConnection) => Promise<T>): Promise<T>;
