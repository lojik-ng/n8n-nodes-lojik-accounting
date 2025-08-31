import { getDb } from '../dist/db/connection.js';
import { createAccount, deleteAccount, getAccountById, listAccounts, updateAccount } from '../dist/services/accounts.js';
import { unlinkSync } from 'node:fs';
import path from 'node:path';

const tmpDb = path.join(process.cwd(), 'tmp-accounts.test.sqlite');

describe('Account Services', () => {
    beforeAll(() => {
        process.env.DATABASE_FILE = tmpDb;
    });
    afterAll(() => {
        try { unlinkSync(tmpDb); } catch { }
    });

    test('create, get, update, list, delete', async () => {
        const db = await getDb({ databaseFileName: 'ignore.sqlite' });
        const a1 = await createAccount(db, { code: '1000', name: 'Cash', type: 'Asset' });
        expect(a1.id).toBeGreaterThan(0);

        const fetched = await getAccountById(db, a1.id);
        expect(fetched?.code).toBe('1000');

        const updated = await updateAccount(db, { id: a1.id, name: 'Cash on Hand' });
        expect(updated.name).toBe('Cash on Hand');

        const listed = await listAccounts(db, { code: '100' });
        expect(listed.length).toBeGreaterThanOrEqual(1);

        const deleted = await deleteAccount(db, a1.id);
        expect(deleted).toContain(a1.id);
    });
});


