import { describe, it, expect, beforeEach } from '@jest/globals';
import { initializeDatabaseConnection } from '../../db/connection.js';
import {
    createAccount,
    updateAccount,
    getAccountById,
    listAccounts,
    deleteAccount,
} from '../accountService.js';
import type { DatabaseConfig } from '../../types/index.js';

const testConfig: DatabaseConfig = {
    filePath: ':memory:',
    credentials: {
        databaseFileName: ':memory:',
        displayDateFormat: 'yyyy-LL-dd',
        currencySymbol: '₦',
        timezone: 'UTC+1',
    },
};

describe('AccountService', () => {
    beforeEach(async () => {
        // Initialize fresh in-memory database for each test
        await initializeDatabaseConnection(testConfig);
    });

    describe('createAccount', () => {
        it('should create a new account successfully', async () => {
            const input = {
                code: 'CASH001',
                name: 'Cash in Hand',
                type: 'Asset' as const,
            };

            const result = await createAccount(input);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.code).toBe(input.code);
                expect(result.data.name).toBe(input.name);
                expect(result.data.type).toBe(input.type);
                expect(result.data.id).toBeGreaterThan(0);
                expect(result.data.parentId).toBeNull();
            }
        });

        it('should reject duplicate account codes', async () => {
            const input = {
                code: 'CASH001',
                name: 'Cash in Hand',
                type: 'Asset' as const,
            };

            await createAccount(input);
            const result = await createAccount(input);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toContain('Account code already exists');
            }
        });

        it('should create account with valid parent', async () => {
            // Create parent account first
            const parentResult = await createAccount({
                code: 'ASSET',
                name: 'Assets',
                type: 'Asset',
            });

            expect(parentResult.success).toBe(true);

            const childInput = {
                code: 'CASH001',
                name: 'Cash in Hand',
                type: 'Asset' as const,
                parentId: parentResult.success ? parentResult.data.id : 1,
            };

            const result = await createAccount(childInput);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.parentId).toBe(childInput.parentId);
            }
        });

        it('should reject invalid parent account', async () => {
            const input = {
                code: 'INVALID001',
                name: 'Invalid Parent Test',
                type: 'Asset' as const,
                parentId: 999,
            };

            const result = await createAccount(input);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toContain('Parent account not found');
            }
        });
    });

    describe('updateAccount', () => {
        it('should update account successfully', async () => {
            const createResult = await createAccount({
                code: 'UPDATE001',
                name: 'Account to Update',
                type: 'Asset',
            });

            expect(createResult.success).toBe(true);

            const updateInput = {
                id: createResult.success ? createResult.data.id : 1,
                name: 'Updated Account Name',
                code: 'UPDATED001',
            };

            const result = await updateAccount(updateInput);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe(updateInput.name);
                expect(result.data.code).toBe(updateInput.code);
            }
        });

        it('should reject update with duplicate code', async () => {
            await createAccount({
                code: 'CASH001',
                name: 'Cash Account 1',
                type: 'Asset',
            });

            const secondResult = await createAccount({
                code: 'CASH002',
                name: 'Cash Account 2',
                type: 'Asset',
            });

            expect(secondResult.success).toBe(true);

            const updateInput = {
                id: secondResult.success ? secondResult.data.id : 2,
                code: 'CASH001', // Try to use existing code
            };

            const result = await updateAccount(updateInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toContain('Account code already exists');
            }
        });

        it('should reject update of non-existent account', async () => {
            const updateInput = {
                id: 999,
                name: 'Non-existent Account',
            };

            const result = await updateAccount(updateInput);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toContain('Account not found');
            }
        });
    });

    describe('getAccountById', () => {
        it('should retrieve account by ID', async () => {
            const createResult = await createAccount({
                code: 'GETBY001',
                name: 'Get By ID Test',
                type: 'Asset',
            });

            expect(createResult.success).toBe(true);

            const result = await getAccountById({
                id: createResult.success ? createResult.data.id : 1,
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.code).toBe('GETBY001');
                expect(result.data.name).toBe('Get By ID Test');
                expect(result.data.type).toBe('Asset');
            }
        });

        it('should return error for non-existent account', async () => {
            const result = await getAccountById({ id: 999 });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toContain('Account not found');
            }
        });
    });

    describe('listAccounts', () => {
        beforeEach(async () => {
            // Create test accounts for list tests
            await createAccount({
                code: 'LCASH001',
                name: 'List Cash Account',
                type: 'Asset',
            });
            await createAccount({
                code: 'LBANK001',
                name: 'List Bank Account',
                type: 'Asset',
            });
            await createAccount({
                code: 'LLOAN001',
                name: 'List Business Loan',
                type: 'Liability',
            });
        });

        it('should list all accounts when no filters applied', async () => {
            const result = await listAccounts({});

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveLength(3);
                expect(result.data[0]?.code).toBe('LBANK001'); // Should be sorted by code
            }
        });

        it('should filter accounts by type', async () => {
            const result = await listAccounts({ type: 'Asset' });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveLength(2);
                expect(result.data.every(acc => acc.type === 'Asset')).toBe(true);
            }
        });

        it('should filter accounts by code pattern', async () => {
            const result = await listAccounts({ code: 'LCASH' });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveLength(1);
                expect(result.data[0]?.code).toBe('LCASH001');
            }
        });

        it('should filter accounts by name pattern', async () => {
            const result = await listAccounts({ name: 'Bank' });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveLength(1);
                expect(result.data[0]?.name).toBe('List Bank Account');
            }
        });
    });

    describe('deleteAccount', () => {
        it('should delete account without journal lines', async () => {
            const createResult = await createAccount({
                code: 'TEMP001',
                name: 'Temporary Account',
                type: 'Asset',
            });

            expect(createResult.success).toBe(true);

            const result = await deleteAccount({
                id: createResult.success ? createResult.data.id : 1,
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.deletedAccountIds).toContain(
                    createResult.success ? createResult.data.id : 1
                );
            }

            // Verify account is deleted
            const getResult = await getAccountById({
                id: createResult.success ? createResult.data.id : 1,
            });
            expect(getResult.success).toBe(false);
        });

        it('should delete parent and child accounts together', async () => {
            const parentResult = await createAccount({
                code: 'PARENT',
                name: 'Parent Account',
                type: 'Asset',
            });

            expect(parentResult.success).toBe(true);

            const childResult = await createAccount({
                code: 'CHILD',
                name: 'Child Account',
                type: 'Asset',
                parentId: parentResult.success ? parentResult.data.id : 1,
            });

            expect(childResult.success).toBe(true);

            const result = await deleteAccount({
                id: parentResult.success ? parentResult.data.id : 1,
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.deletedAccountIds).toHaveLength(2);
                expect(result.data.deletedAccountIds).toContain(
                    parentResult.success ? parentResult.data.id : 1
                );
                expect(result.data.deletedAccountIds).toContain(
                    childResult.success ? childResult.data.id : 2
                );
            }
        });

        it('should reject deletion of non-existent account', async () => {
            const result = await deleteAccount({ id: 999 });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toContain('Account not found');
            }
        });
    });
});
