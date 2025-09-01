import Database = require('better-sqlite3');
import type { DatabaseConfig } from '../types/index';
/**
 * Initialize the database connection
 */
export declare function initializeDatabaseConnection(config: DatabaseConfig): Promise<void>;
/**
 * Get the database connection instance
 */
export declare function getDatabaseConnection(): Database.Database;
/**
 * Close the database connection and reset state
 */
export declare function closeDatabaseConnection(): Promise<void>;
/**
 * Run a query with parameters (prepared statement)
 */
export declare function runQuery(sql: string, params?: unknown[]): Promise<Database.RunResult>;
/**
 * Get a single row from a query
 */
export declare function getQuery<T = unknown>(sql: string, params?: unknown[]): Promise<T | undefined>;
/**
 * Get all rows from a query
 */
export declare function getAllQuery<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
/**
 * Execute multiple statements in a transaction
 */
export declare function runTransaction(operations: (() => Promise<unknown>)[]): Promise<void>;
//# sourceMappingURL=connection.d.ts.map