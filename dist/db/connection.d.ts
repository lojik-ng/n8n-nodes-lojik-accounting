import sqlite3 from 'sqlite3';
type Database = sqlite3.Database;
export interface DatabaseConfig {
    databaseFileName: string;
}
export declare function getDb(config: DatabaseConfig): Promise<Database>;
export declare function withTransaction<T>(db: Database, executor: () => Promise<T>): Promise<T>;
export declare function execAsync(db: Database, sql: string, params?: unknown[]): Promise<void>;
export declare function getAsync<T = unknown>(db: Database, sql: string, params?: unknown[]): Promise<T | undefined>;
export declare function allAsync<T = unknown>(db: Database, sql: string, params?: unknown[]): Promise<T[]>;
export declare function nowIsoUtc(): string;
export {};
