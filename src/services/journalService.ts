import { JournalEntry, JournalLine } from '../types/index.js';
import { getDb } from '../db/connection.js';

/**
 * Create a journal entry with its lines
 */
export async function createJournalEntry(
  date: string,
  lines: Array<{ accountId: number; debit?: number; credit?: number }>,
  description: string | null = null,
  reference: string | null = null
): Promise<{ entry: JournalEntry; lines: JournalLine[] }> {
  const db = await getDb();
  
  // Validate that we have at least 2 lines
  if (lines.length < 2) {
    throw new Error('Journal entry must have at least 2 lines');
  }
  
  // Validate that total debits equal total credits and are greater than zero
  const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);
  
  if (totalDebit !== totalCredit) {
    throw new Error('Total debits must equal total credits');
  }
  
  if (totalDebit === 0) {
    throw new Error('Total debits and credits must be greater than zero');
  }
  
  // Validate that each line has either debit or credit but not both
  for (const line of lines) {
    const hasDebit = line.debit !== undefined && line.debit > 0;
    const hasCredit = line.credit !== undefined && line.credit > 0;
    
    if (!(hasDebit || hasCredit) || (hasDebit && hasCredit)) {
      throw new Error('Each line must have either a debit or credit amount, but not both');
    }
  }
  
  // Check if all account IDs exist
  for (const line of lines) {
    const accountExists = await db.get('SELECT id FROM accounts WHERE id = ?', line.accountId);
    if (!accountExists) {
      throw new Error(`Account with id ${line.accountId} does not exist`);
    }
  }
  
  // Create journal entry
  // Insert journal entry
  const entryResult = await db.run(
    'INSERT INTO journal_entries (date, description, reference) VALUES (?, ?, ?)',
    [date, description, reference]
  );
  
  const entryId = entryResult.lastID;
  if (!entryId) {
    throw new Error('Failed to create journal entry');
  }
  
  // Insert journal lines
  const insertedLines: JournalLine[] = [];
  for (const line of lines) {
    const lineResult = await db.run(
      'INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit) VALUES (?, ?, ?, ?)',
      [entryId, line.accountId, line.debit || 0, line.credit || 0]
    );
    
    const lineId = lineResult.lastID;
    if (!lineId) {
      throw new Error('Failed to create journal line');
    }
    
    insertedLines.push({
      id: lineId,
      journalEntryId: entryId,
      accountId: line.accountId,
      debit: line.debit || 0,
      credit: line.credit || 0
    });
  }
  
  // Return the created entry and lines
  const entry: JournalEntry = {
    id: entryId,
    date,
    description,
    reference,
    createdAt: new Date().toISOString()
  };
  
  return { entry, lines: insertedLines };
}

/**
 * Delete a journal entry
 */
export async function deleteJournalEntry(id: number): Promise<boolean> {
  const db = await getDb();
  
  // Check if journal entry exists
  const existingEntry = await db.get('SELECT id FROM journal_entries WHERE id = ?', id);
  if (!existingEntry) {
    throw new Error(`Journal entry with id ${id} does not exist`);
  }
  
  // Delete the journal entry (lines will be deleted automatically due to foreign key cascade)
  await db.run('DELETE FROM journal_entries WHERE id = ?', id);
  
  return true;
}

/**
 * Get journal entry by ID with its lines
 */
export async function getJournalEntryById(id: number): Promise<{ entry: JournalEntry; lines: JournalLine[] } | null> {
  const db = await getDb();
  
  // Get the journal entry
  const entry = await db.get('SELECT * FROM journal_entries WHERE id = ?', id);
  if (!entry) {
    return null;
  }
  
  // Get the journal lines
  const lines = await db.all('SELECT * FROM journal_lines WHERE journal_entry_id = ? ORDER BY id', id);
  
  return {
    entry: entry as JournalEntry,
    lines: lines as JournalLine[]
  };
}

/**
 * Search journal entries
 */
export async function searchJournalEntries(
  filter: {
    startDate?: string;
    endDate?: string;
    reference?: string;
    description?: string;
  } = {}
): Promise<JournalEntry[]> {
  const db = await getDb();
  
  let query = 'SELECT * FROM journal_entries WHERE 1=1';
  const params: any[] = [];
  
  if (filter.startDate) {
    query += ' AND date >= ?';
    params.push(filter.startDate);
  }
  
  if (filter.endDate) {
    query += ' AND date <= ?';
    params.push(filter.endDate);
  }
  
  if (filter.reference) {
    query += ' AND reference LIKE ?';
    params.push(`%${filter.reference}%`);
  }
  
  if (filter.description) {
    query += ' AND description LIKE ?';
    params.push(`%${filter.description}%`);
  }
  
  query += ' ORDER BY date DESC, id DESC';
  
  const entries = await db.all(query, params);
  return entries as JournalEntry[];
}