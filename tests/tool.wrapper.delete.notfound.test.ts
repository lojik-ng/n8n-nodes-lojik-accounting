import { createTool } from '../src/tool/tool.js';
import { setTmpDb, cleanupDb } from './helpers';

describe('Tool wrapper: deleteJournalEntry not found', () => {
    test('returns success true deleted when entry missing', async () => {
        const p = setTmpDb('tmp-delje-nf');
        const tool = createTool({ databaseFileName: 'ignored.sqlite' });
        const res = await tool.deleteJournalEntry({ id: 999999 });
        expect(res.success).toBe(true);
        cleanupDb(p);
    });
});


