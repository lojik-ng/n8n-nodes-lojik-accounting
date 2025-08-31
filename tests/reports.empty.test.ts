import { getDb } from '../src/db/connection.js';
import { getTrialBalance, getBalanceSheet, getProfitLoss } from '../src/services/reports.js';
import { setTmpDb, cleanupDb } from './helpers';

describe('Reports on empty DB', () => {
    test('trial balance and balance sheet/PL on empty db', async () => {
        const p = setTmpDb('tmp-empty');
        const db = await getDb({ databaseFileName: 'ignore.sqlite' });
        const tb = await getTrialBalance(db);
        expect(Array.isArray(tb.rows)).toBe(true);
        const bs = await getBalanceSheet(db);
        expect(bs.assets.accounts.length).toBeGreaterThanOrEqual(0);
        const pl = await getProfitLoss(db, {});
        expect(typeof pl.netIncome).toBe('number');
        cleanupDb(p);
    });
});


