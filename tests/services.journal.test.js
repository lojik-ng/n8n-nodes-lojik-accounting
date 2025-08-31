import { getDb } from '../dist/db/connection.js';
import { createAccount } from '../dist/services/accounts.js';
import { createJournalEntry, getJournalEntryById, deleteJournalEntry } from '../dist/services/journal.js';
import { unlinkSync } from 'node:fs';
import path from 'node:path';

const tmpDb = path.join(process.cwd(), 'tmp-journal.test.sqlite');

describe('Journal Services', () => {
    beforeAll(() => {
        process.env.DATABASE_FILE = tmpDb;
    });
    afterAll(() => {
        try { unlinkSync(tmpDb); } catch { }
    });

    test('create entry with lines, fetch and delete', async () => {
        const db = await getDb({ databaseFileName: 'ignore.sqlite' });
        const cash = await createAccount(db, { code: '1000', name: 'Cash', type: 'Asset' });
        const sales = await createAccount(db, { code: '4000', name: 'Sales', type: 'Income' });

        const je = await createJournalEntry(db, {
            date: '2024-01-15',
            description: 'Sale',
            reference: 'INV-1',
            lines: [
                { accountId: cash.id, debit: 100 },
                { accountId: sales.id, credit: 100 },
            ],
        });
        expect(je.entry.id).toBeGreaterThan(0);
        expect(je.lines.length).toBe(2);

        const fetched = await getJournalEntryById(db, je.entry.id);
        expect(fetched?.entry.reference).toBe('INV-1');

        const del = await deleteJournalEntry(db, je.entry.id);
        expect(del.deleted).toBe(true);
    });
});


