import { createTool } from '../src/tool/tool.js';
import { setTmpDb, cleanupDb } from './helpers';

describe('Tool wrapper: getLedger invalid and valid', () => {
    test('invalid accountId', async () => {
        const p = setTmpDb('tmp-ledwrap');
        const tool = createTool({ databaseFileName: 'ignored.sqlite' });
        const bad = await tool.getLedger({ accountId: 'x' } as any);
        expect(bad.success).toBe(false);
        cleanupDb(p);
    });
});


