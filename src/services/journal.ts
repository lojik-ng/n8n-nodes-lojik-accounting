import type sqlite3 from 'sqlite3';
type Database = sqlite3.Database;
import { allAsync, execAsync, getAsync, withTransaction } from '../db/connection.js';
import type { JournalEntry, JournalLine } from '../types/index.js';

export async function createJournalEntry(
    db: Database,
    input: {
        date: string;
        description?: string | undefined;
        reference?: string | undefined;
        lines: Array<{ accountId: number; debit?: number | undefined; credit?: number | undefined }>;
    },
): Promise<{ entry: JournalEntry; lines: JournalLine[] }> {
    return withTransaction(db, async () => {
        await execAsync(
            db,
            `INSERT INTO journal_entries (date, description, reference) VALUES (?, ?, ?)`,
            [input.date, input.description ?? null, input.reference ?? null],
        );
        const entry = await getAsync<JournalEntry>(
            db,
            `SELECT * FROM journal_entries ORDER BY id DESC LIMIT 1`,
        );
        if (!entry) throw new Error('Failed to create journal entry');

        const insertLine = db.prepare(
            `INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit) VALUES (?, ?, ?, ?)`,
        );
        await new Promise<void>((resolve, reject) => {
            db.serialize(() => {
                for (const line of input.lines) {
                    const debit = (line.debit ?? 0).valueOf();
                    const credit = (line.credit ?? 0).valueOf();
                    insertLine.run([entry.id, line.accountId, debit, credit]);
                }
                insertLine.finalize((err) => (err ? reject(err) : resolve()));
            });
        });
        const lines = await allAsync<JournalLine>(
            db,
            `SELECT * FROM journal_lines WHERE journal_entry_id = ? ORDER BY id ASC`,
            [entry.id],
        );
        return { entry, lines };
    });
}

export async function deleteJournalEntry(db: Database, id: number): Promise<{ deleted: boolean }> {
    await execAsync(db, `DELETE FROM journal_entries WHERE id = ?`, [id]);
    return { deleted: true };
}

export async function getJournalEntryById(
    db: Database,
    id: number,
): Promise<{ entry: JournalEntry; lines: JournalLine[] } | undefined> {
    const entry = await getAsync<JournalEntry>(db, `SELECT * FROM journal_entries WHERE id = ?`, [
        id,
    ]);
    if (!entry) return undefined;
    const lines = await allAsync<JournalLine>(
        db,
        `SELECT * FROM journal_lines WHERE journal_entry_id = ? ORDER BY id ASC`,
        [id],
    );
    return { entry, lines };
}

export async function searchJournalEntries(
    db: Database,
    input: {
        startDate?: string | undefined;
        endDate?: string | undefined;
        reference?: string | undefined;
        description?: string | undefined;
    },
): Promise<JournalEntry[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
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
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    return allAsync<JournalEntry>(db, `SELECT * FROM journal_entries ${where} ORDER BY date DESC, id DESC`, params);
}


