import { createTool } from '../src/tool/tool.js';
import path from 'node:path';
import { unlinkSync } from 'node:fs';

const tmpDb = path.join(process.cwd(), 'tmp-tool.test.sqlite');

describe('Tool Integration', () => {
  beforeAll(() => {
    process.env.DATABASE_FILE = tmpDb;
  });
  afterAll(() => {
    try { unlinkSync(tmpDb); } catch {}
  });

  test('end-to-end account and journal actions', async () => {
    const tool = createTool({ databaseFileName: 'ignored.sqlite' });
    const a = await tool.createAccount({ code: '1000', name: 'Cash', type: 'Asset' });
    expect(a.success).toBe(true);
    const cashId = a.data.id;

    const s = await tool.createAccount({ code: '4000', name: 'Sales', type: 'Income' });
    const salesId = s.data.id;

    const je = await tool.createJournalEntry({
      date: '2024-01-10',
      description: 'Sale',
      lines: [
        { accountId: cashId, debit: 100 },
        { accountId: salesId, credit: 100 },
      ],
    });
    expect(je.success).toBe(true);

    const tb = await tool.getTrialBalance();
    expect(tb.success).toBe(true);

    const ledger = await tool.getLedger({ accountId: cashId });
    expect(ledger.success).toBe(true);

    const del = await tool.deleteJournalEntry({ id: (je as any).data.entry.id });
    expect(del.success).toBe(true);
  });
});
