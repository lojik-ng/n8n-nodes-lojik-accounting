import { createTool } from '../src/tool/tool.js';
import path from 'node:path';
import { unlinkSync } from 'node:fs';

describe('Validation errors', () => {
    test('rejects unbalanced journal entry', async () => {
        const tool = createTool({ databaseFileName: 'ignored.sqlite' });
        const bad = await tool.createJournalEntry({
            date: '2024-01-10',
            lines: [
                { accountId: 1, debit: 100 },
                { accountId: 2, credit: 99 },
            ],
        } as any);
        expect(bad.success).toBe(false);
    });

    test('rejects invalid date format', async () => {
        const tmp = path.join(process.cwd(), `tmp-invalid-${Date.now()}-${Math.random()}.sqlite`);
        process.env.DATABASE_FILE = tmp;
        const tool = createTool({ databaseFileName: 'ignored.sqlite' });
        const res = await tool.createAccount({ code: 'A', name: 'A', type: 'Asset' });
        expect(res.success).toBe(true);
        const je = await tool.createJournalEntry({
            date: '10-01-2024', // wrong format
            lines: [
                { accountId: (res as any).data.id, debit: 1 },
                { accountId: (res as any).data.id, credit: 1 },
            ],
        } as any);
        expect(je.success).toBe(false);
        try { unlinkSync(tmp); } catch { }
    });
});


