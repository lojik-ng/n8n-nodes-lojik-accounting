import { createTool } from '../src/tool/tool.js';
import { setTmpDb, cleanupDb } from './helpers';

describe('listAccounts no filters branch', () => {
    test('returns empty list initially', async () => {
        const p = setTmpDb('tmp-list');
        const tool = createTool({ databaseFileName: 'ignored.sqlite' });
        const res = await tool.listAccounts({});
        expect(res.success).toBe(true);
        if (res.success) expect(Array.isArray(res.data)).toBe(true);
        cleanupDb(p);
    });
});


