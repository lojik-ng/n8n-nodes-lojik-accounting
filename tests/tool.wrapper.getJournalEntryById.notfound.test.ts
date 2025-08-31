import { createTool } from '../src/tool/tool.js';
import { setTmpDb, cleanupDb } from './helpers';

describe('Tool wrapper: getJournalEntryById not found', () => {
    test('returns null as data with success true', async () => {
        const p = setTmpDb('tmp-je-nf');
        const tool = createTool({ databaseFileName: 'ignored.sqlite' });
        const res = await tool.getJournalEntryById({ id: 123456 });
        expect(res.success).toBe(true);
        if (res.success) expect(res.data).toBeNull();
        cleanupDb(p);
    });
});


