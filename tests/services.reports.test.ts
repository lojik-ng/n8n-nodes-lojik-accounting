import { getDb } from '../src/db/connection.js';
import { createAccount } from '../src/services/accounts.js';
import { createJournalEntry } from '../src/services/journal.js';
import { getTrialBalance, getLedger, getBalanceSheet, getProfitLoss } from '../src/services/reports.js';
import { unlinkSync } from 'node:fs';
import path from 'node:path';

const tmpDb = path.join(process.cwd(), 'tmp-reports.test.sqlite');

describe('Reporting Services', () => {
  beforeAll(() => {
    process.env.DATABASE_FILE = tmpDb;
  });
  afterAll(() => {
    try { unlinkSync(tmpDb); } catch {}
  });

  test('trial balance, ledger, balance sheet, profit/loss', async () => {
    const db = await getDb({ databaseFileName: 'ignore.sqlite' });
    const cash = await createAccount(db, { code: '1000', name: 'Cash', type: 'Asset' });
    const sales = await createAccount(db, { code: '4000', name: 'Sales', type: 'Income' });
    const expense = await createAccount(db, { code: '5000', name: 'Supplies', type: 'Expense' });

    await createJournalEntry(db, {
      date: '2024-01-15',
      description: 'Sale',
      lines: [
        { accountId: cash.id, debit: 200 },
        { accountId: sales.id, credit: 200 },
      ],
    });
    await createJournalEntry(db, {
      date: '2024-01-16',
      description: 'Supplies',
      lines: [
        { accountId: expense.id, debit: 50 },
        { accountId: cash.id, credit: 50 },
      ],
    });

    const tb = await getTrialBalance(db);
    expect(tb.rows.length).toBeGreaterThanOrEqual(3);

    const ledger = await getLedger(db, { accountId: cash.id, includeRunningBalance: true });
    expect(ledger.lines.length).toBeGreaterThanOrEqual(2);
    expect(ledger.account.id).toBe(cash.id);

    const bs = await getBalanceSheet(db);
    expect(bs.assets.accounts.length).toBeGreaterThan(0);

    const pl = await getProfitLoss(db, {});
    expect(typeof pl.netIncome).toBe('number');
  });
});
