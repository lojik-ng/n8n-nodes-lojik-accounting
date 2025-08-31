import { getDb } from '../src/db/connection.js';
import { createAccount } from '../src/services/accounts.js';
import { createJournalEntry } from '../src/services/journal.js';
import { getProfitLoss } from '../src/services/reports.js';
import { setTmpDb, cleanupDb } from './helpers';

describe('Reports filters', () => {
    test('profit/loss date filters', async () => {
        const p = setTmpDb('tmp-pl');
        const db = await getDb({ databaseFileName: 'ignore.sqlite' });
        const sales = await createAccount(db, { code: '4100', name: 'Sales', type: 'Income' });
        await createJournalEntry(db, {
            date: '2024-01-01',
            lines: [
                { accountId: sales.id, credit: 100 },
                { accountId: sales.id, debit: 100 },
            ],
        });
        const full = await getProfitLoss(db, {});
        expect(typeof full.netIncome).toBe('number');
        const filtered = await getProfitLoss(db, { startDate: '2024-01-15', endDate: '2024-01-31' });
        expect(typeof filtered.netIncome).toBe('number');
        cleanupDb(p);
    });
});


