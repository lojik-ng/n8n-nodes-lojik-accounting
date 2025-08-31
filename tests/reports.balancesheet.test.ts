import { getDb } from '../src/db/connection.js';
import { createAccount } from '../src/services/accounts.js';
import { createJournalEntry } from '../src/services/journal.js';
import { getBalanceSheet } from '../src/services/reports.js';
import { setTmpDb, cleanupDb } from './helpers';

describe('Balance sheet parent subtotals', () => {
    test('returns parentSubtotals when children exist', async () => {
        const p = setTmpDb('tmp-bs');
        const db = await getDb({ databaseFileName: 'ignore.sqlite' });
        const parent = await createAccount(db, { code: '1100', name: 'Current Assets', type: 'Asset' });
        const child1 = await createAccount(db, { code: '1101', name: 'Cash1', type: 'Asset', parentId: parent.id });
        const child2 = await createAccount(db, { code: '1102', name: 'Cash2', type: 'Asset', parentId: parent.id });
        await createJournalEntry(db, {
            date: '2024-01-05',
            lines: [
                { accountId: child1.id, debit: 10 },
                { accountId: child2.id, credit: 10 },
            ],
        });
        const bs = await getBalanceSheet(db);
        expect(bs.assets.parentSubtotals).toBeDefined();
        cleanupDb(p);
    });
});


