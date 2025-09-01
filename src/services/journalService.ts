import { DateTime } from 'luxon';
import { runQuery, getQuery, getAllQuery, runTransaction } from '../db/connection.js';
import type { JournalEntry, JournalLine, JournalEntryWithLines, ActionResult } from '../types/index.js';
import type {
    CreateJournalEntryInput,
    DeleteJournalEntryInput,
    GetJournalEntryByIdInput,
    SearchJournalEntriesInput,
} from '../validation/schemas.js';

/**
 * Map database row to JournalEntry interface
 */
function mapRowToJournalEntry(row: any): JournalEntry {
    return {
        id: row.id,
        date: row.date,
        description: row.description,
        reference: row.reference,
        createdAt: row.created_at,
    };
}

/**
 * Map database row to JournalLine interface
 */
function mapRowToJournalLine(row: any): JournalLine {
    return {
        id: row.id,
        journalEntryId: row.journal_entry_id,
        accountId: row.account_id,
        debit: Number(row.debit),
        credit: Number(row.credit),
    };
}

/**
 * Check if a date is locked by period closure
 */
async function isDateLocked(date: string): Promise<boolean> {
    const lock = await getQuery<{ through_date: string }>(
        'SELECT through_date FROM period_locks ORDER BY through_date DESC LIMIT 1'
    );

    if (!lock) {
        return false;
    }

    const entryDate = DateTime.fromISO(date, { zone: 'utc' });
    const lockDate = DateTime.fromISO(lock.through_date, { zone: 'utc' });

    return entryDate <= lockDate;
}

/**
 * Validate that all accounts exist
 */
async function validateAccountsExist(accountIds: number[]): Promise<{ valid: boolean; missingIds: number[] }> {
    const uniqueIds = [...new Set(accountIds)];
    const placeholders = uniqueIds.map(() => '?').join(',');

    const existingAccounts = await getAllQuery<{ id: number }>(
        `SELECT id FROM accounts WHERE id IN (${placeholders})`,
        uniqueIds
    );

    const existingIds = existingAccounts.map(acc => acc.id);
    const missingIds = uniqueIds.filter(id => !existingIds.includes(id));

    return {
        valid: missingIds.length === 0,
        missingIds,
    };
}

/**
 * Create a journal entry with its lines
 */
export async function createJournalEntry(input: CreateJournalEntryInput): Promise<ActionResult<JournalEntryWithLines>> {
    try {
        // Check if date is locked
        const locked = await isDateLocked(input.date);
        if (locked) {
            return {
                success: false,
                message: 'Cannot create journal entry for a locked period',
                details: { date: input.date },
            };
        }

        // Validate that all referenced accounts exist
        const accountIds = input.lines.map(line => line.accountId);
        const accountValidation = await validateAccountsExist(accountIds);

        if (!accountValidation.valid) {
            return {
                success: false,
                message: 'One or more accounts do not exist',
                details: { missingAccountIds: accountValidation.missingIds },
            };
        }

        let createdEntry: JournalEntry;
        let createdLines: JournalLine[] = [];

        await runTransaction([
            async () => {
                // Create the journal entry
                const entryResult = await runQuery(
                    'INSERT INTO journal_entries (date, description, reference) VALUES (?, ?, ?)',
                    [input.date, input.description || null, input.reference || null]
                );

                const entryId = entryResult.lastInsertRowid;

                // Fetch the created entry
                const entryRow = await getQuery<any>(
                    'SELECT * FROM journal_entries WHERE id = ?',
                    [entryId]
                );
                createdEntry = mapRowToJournalEntry(entryRow!);

                // Create journal lines
                for (const line of input.lines) {
                    const lineResult = await runQuery(
                        'INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit) VALUES (?, ?, ?, ?)',
                        [entryId, line.accountId, line.debit || 0, line.credit || 0]
                    );

                    const lineRow = await getQuery<any>(
                        'SELECT * FROM journal_lines WHERE id = ?',
                        [lineResult.lastInsertRowid]
                    );
                    createdLines.push(mapRowToJournalLine(lineRow!));
                }
            }
        ]);

        return {
            success: true,
            data: {
                entry: createdEntry!,
                lines: createdLines,
            },
        };
    } catch (error) {
        return {
            success: false,
            message: 'Failed to create journal entry',
            details: error instanceof Error ? error.message : error,
        };
    }
}

/**
 * Delete a journal entry and all its lines
 */
export async function deleteJournalEntry(input: DeleteJournalEntryInput): Promise<ActionResult<{ deleted: true }>> {
    try {
        // Check if journal entry exists and get its date
        const existingEntry = await getQuery<{ id: number; date: string }>(
            'SELECT id, date FROM journal_entries WHERE id = ?',
            [input.id]
        );

        if (!existingEntry) {
            return {
                success: false,
                message: 'Journal entry not found',
                details: { id: input.id },
            };
        }

        // Check if date is locked
        const locked = await isDateLocked(existingEntry.date);
        if (locked) {
            return {
                success: false,
                message: 'Cannot delete journal entry for a locked period',
                details: { date: existingEntry.date },
            };
        }

        // Delete the journal entry (lines will cascade)
        await runTransaction([
            async () => {
                await runQuery('DELETE FROM journal_entries WHERE id = ?', [input.id]);
            }
        ]);

        return {
            success: true,
            data: { deleted: true },
        };
    } catch (error) {
        return {
            success: false,
            message: 'Failed to delete journal entry',
            details: error instanceof Error ? error.message : error,
        };
    }
}

/**
 * Get journal entry by ID with its lines
 */
export async function getJournalEntryById(input: GetJournalEntryByIdInput): Promise<ActionResult<JournalEntryWithLines>> {
    try {
        // Get the journal entry
        const entryRow = await getQuery<any>(
            'SELECT * FROM journal_entries WHERE id = ?',
            [input.id]
        );

        if (!entryRow) {
            return {
                success: false,
                message: 'Journal entry not found',
                details: { id: input.id },
            };
        }

        // Get the journal lines
        const lineRows = await getAllQuery<any>(
            'SELECT * FROM journal_lines WHERE journal_entry_id = ? ORDER BY id',
            [input.id]
        );

        return {
            success: true,
            data: {
                entry: mapRowToJournalEntry(entryRow),
                lines: lineRows.map(mapRowToJournalLine),
            },
        };
    } catch (error) {
        return {
            success: false,
            message: 'Failed to retrieve journal entry',
            details: error instanceof Error ? error.message : error,
        };
    }
}

/**
 * Search journal entries by criteria
 */
export async function searchJournalEntries(input: SearchJournalEntriesInput): Promise<ActionResult<JournalEntry[]>> {
    try {
        let sql = 'SELECT * FROM journal_entries';
        const params: any[] = [];
        const conditions: string[] = [];

        if (input.startDate) {
            conditions.push('date >= ?');
            params.push(input.startDate);
        }

        if (input.endDate) {
            conditions.push('date <= ?');
            params.push(input.endDate);
        }

        if (input.reference) {
            conditions.push('reference LIKE ?');
            params.push(`%${input.reference}%`);
        }

        if (input.description) {
            conditions.push('description LIKE ?');
            params.push(`%${input.description}%`);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY date DESC, id DESC';

        const entries = await getAllQuery<any>(sql, params);

        return {
            success: true,
            data: entries.map(mapRowToJournalEntry),
        };
    } catch (error) {
        return {
            success: false,
            message: 'Failed to search journal entries',
            details: error instanceof Error ? error.message : error,
        };
    }
}

/**
 * Close period through a specific date
 */
export async function closePeriod(throughDate: string): Promise<ActionResult<{ locked: true }>> {
    try {
        // Validate date format
        const dt = DateTime.fromISO(throughDate, { zone: 'utc' });
        if (!dt.isValid) {
            return {
                success: false,
                message: 'Invalid date format',
                details: { throughDate },
            };
        }

        // Check if there's already a lock for this or later date
        const existingLock = await getQuery<{ through_date: string }>(
            'SELECT through_date FROM period_locks WHERE through_date >= ? ORDER BY through_date DESC LIMIT 1',
            [throughDate]
        );

        if (existingLock) {
            return {
                success: false,
                message: 'Period already locked through this date or later',
                details: { existingLockDate: existingLock.through_date },
            };
        }

        // Create the period lock
        await runQuery(
            'INSERT INTO period_locks (through_date) VALUES (?)',
            [throughDate]
        );

        return {
            success: true,
            data: { locked: true },
        };
    } catch (error) {
        return {
            success: false,
            message: 'Failed to close period',
            details: error instanceof Error ? error.message : error,
        };
    }
}
