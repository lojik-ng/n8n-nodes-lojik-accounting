import { getDb } from '../db/connection.js';

/**
 * Close accounting period up to a specific date
 */
export async function closePeriod(throughDate: string): Promise<void> {
  const db = await getDb();
  
  // Create period_locks table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS period_locks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      locked_through_date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Insert or update the period lock
  await db.run(`
    INSERT OR REPLACE INTO period_locks (id, locked_through_date) 
    VALUES (1, ?)
  `, [throughDate]);
}

/**
 * Check if a date is locked
 */
export async function isDateLocked(date: string): Promise<boolean> {
  const db = await getDb();
  
  // Check if period_locks table exists
  const tableExists = await db.get(`
    SELECT name FROM sqlite_master WHERE type='table' AND name='period_locks'
  `);
  
  if (!tableExists) {
    return false;
  }
  
  // Get the lock date
  const lockRecord = await db.get(`
    SELECT locked_through_date FROM period_locks WHERE id = 1
  `);
  
  if (!lockRecord) {
    return false;
  }
  
  // Compare dates
  return date <= (lockRecord as any).locked_through_date;
}

/**
 * Get journal entry details (alias for getJournalEntryById)
 */
export async function getJournalEntryDetails() {
  // This is just an alias - we'll implement it in the tool layer
  throw new Error('Not implemented - use getJournalEntryById instead');
}