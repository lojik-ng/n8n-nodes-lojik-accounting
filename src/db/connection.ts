import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db: Awaited<ReturnType<typeof open>> | null = null;

/**
 * Get the database file path
 * @returns Absolute path to the database file
 */
export function getDatabasePath(): string {
  // Check for environment override first
  if (process.env.DATABASE_FILE) {
    return process.env.DATABASE_FILE;
  }
  
  // Get database file name from n8n credentials (this would be set by the tool)
  const databaseFileName = process.env.DATABASE_FILENAME || 'lojik-accounting.db';
  
  // Resolve path relative to the tool package root
  return path.resolve(__dirname, '..', databaseFileName);
}

/**
 * Initialize and get the database connection
 * @returns Database connection
 */
export async function getDb() {
  if (db) {
    return db;
  }
  
  const dbPath = getDatabasePath();
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  
  // Enable foreign keys
  await db.exec('PRAGMA foreign_keys = ON;');
  
  // Set WAL mode for better concurrency
  await db.exec('PRAGMA journal_mode = WAL;');
  
  // Set busy timeout
  await db.exec('PRAGMA busy_timeout = 10000;');
  
  return db;
}