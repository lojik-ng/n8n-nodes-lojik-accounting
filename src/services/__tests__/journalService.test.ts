import { describe, it, expect, beforeEach } from '@jest/globals';
import { initializeDatabaseConnection } from '../../db/connection';
import { createAccount } from '../accountService';
import {
    createJournalEntry,
    deleteJournalEntry,
    getJournalEntryById,
    searchJournalEntries,
    closePeriod,
} from '../journalService';
import type { DatabaseConfig } from '../../types/index';

const testConfig: DatabaseConfig = {
    filePath: ':memory:',
    credentials: {
        databaseFileName: ':memory:',
        displayDateFormat: 'yyyy-LL-dd',
        currencySymbol: '₦',
        timezone: 'UTC+1',
    },
};

describe('JournalService', () => {
    let cashAccountId: number;
    let salesAccountId: number;

    beforeEach(async () => {
        await initializeDatabaseConnection(testConfig);

        // Create test accounts
        const cashResult = await createAccount({
            code: 'CASH001',
            name: 'Cash Account',
            type: 'Asset',
        });

        const salesResult = await createAccount({
            code: 'SALES001',
            name: 'Sales Revenue',
            type: 'Income',
        });

        cashAccountId = cashResult.success ? cashResult.data.id : 1;
        salesAccountId = salesResult.success ? salesResult.data.id : 2;
    });

    describe('createJournalEntry', () => {
        it('should create a valid journal entry with balanced lines', async () => {
            const input = {
                date: '2024-01-15',
                description: 'Cash sale',
                reference: 'INV001',
                lines: [
                    { accountId: cashAccountId, debit: 100 },
                    { accountId: salesAccountId, credit: 100 },
                ],
            };

            const result = await createJournalEntry(input);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.entry.date).toBe(input.date);
                expect(result.data.entry.description).toBe(input.description);
                expect(result.data.entry.reference).toBe(input.reference);
                expect(result.data.lines).toHaveLength(2);

                const debitLine = result.data.lines.find(line => line.debit > 0);
                const creditLine = result.data.lines.find(line => line.credit > 0);

                expect(debitLine?.accountId).toBe(cashAccountId);
                expect(debitLine?.debit).toBe(100);
                expect(creditLine?.accountId).toBe(salesAccountId);
                expect(creditLine?.credit).toBe(100);
            }
        });

        it('should reject entry with unbalanced debits and credits', async () => {
            const input = {
                date: '2024-01-15',
                description: 'Unbalanced entry',
                lines: [
                    { accountId: cashAccountId, debit: 100 },
                    { accountId: salesAccountId, credit: 50 }, // Unbalanced
                ],
            };

            const result = await createJournalEntry(input);

            expect(result.success).toBe(false);
            // Note: This should be caught by validation, but let's test the business logic too
        });

        it('should reject entry with non-existent account', async () => {
            const input = {
                date: '2024-01-15',
                description: 'Entry with invalid account',
                lines: [
                    { accountId: 999, debit: 100 }, // Non-existent account
                    { accountId: salesAccountId, credit: 100 },
                ],
            };

            const result = await createJournalEntry(input);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toContain('accounts do not exist');
            }
        });

        it('should reject entry for locked period', async () => {
            // First close the period through 2024-01-20
            await closePeriod('2024-01-20');

            const input = {
                date: '2024-01-15', // Before lock date
                description: 'Entry in locked period',
                lines: [
                    { accountId: cashAccountId, debit: 100 },
                    { accountId: salesAccountId, credit: 100 },
                ],
            };

            const result = await createJournalEntry(input);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toContain('locked period');
            }
        });
    });

    describe('deleteJournalEntry', () => {
        it('should delete an existing journal entry', async () => {
            // Create a journal entry first
            const createResult = await createJournalEntry({
                date: '2024-01-15',
                description: 'Entry to delete',
                lines: [
                    { accountId: cashAccountId, debit: 100 },
                    { accountId: salesAccountId, credit: 100 },
                ],
            });

            expect(createResult.success).toBe(true);

            const entryId = createResult.success ? createResult.data.entry.id : 1;
            const result = await deleteJournalEntry({ id: entryId });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.deleted).toBe(true);
            }

            // Verify entry is deleted
            const getResult = await getJournalEntryById({ id: entryId });
            expect(getResult.success).toBe(false);
        });

        it('should reject deletion of non-existent entry', async () => {
            const result = await deleteJournalEntry({ id: 999 });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toContain('Journal entry not found');
            }
        });

        it('should reject deletion for locked period', async () => {
            // Create entry first
            const createResult = await createJournalEntry({
                date: '2024-01-15',
                description: 'Entry in period to be locked',
                lines: [
                    { accountId: cashAccountId, debit: 100 },
                    { accountId: salesAccountId, credit: 100 },
                ],
            });

            expect(createResult.success).toBe(true);

            // Close the period
            await closePeriod('2024-01-20');

            const entryId = createResult.success ? createResult.data.entry.id : 1;
            const result = await deleteJournalEntry({ id: entryId });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toContain('locked period');
            }
        });
    });

    describe('getJournalEntryById', () => {
        it('should retrieve journal entry with lines', async () => {
            const createResult = await createJournalEntry({
                date: '2024-01-15',
                description: 'Test entry',
                reference: 'REF001',
                lines: [
                    { accountId: cashAccountId, debit: 150 },
                    { accountId: salesAccountId, credit: 150 },
                ],
            });

            expect(createResult.success).toBe(true);

            const entryId = createResult.success ? createResult.data.entry.id : 1;
            const result = await getJournalEntryById({ id: entryId });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.entry.id).toBe(entryId);
                expect(result.data.entry.description).toBe('Test entry');
                expect(result.data.entry.reference).toBe('REF001');
                expect(result.data.lines).toHaveLength(2);
            }
        });

        it('should return error for non-existent entry', async () => {
            const result = await getJournalEntryById({ id: 999 });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toContain('Journal entry not found');
            }
        });
    });

    describe('searchJournalEntries', () => {
        beforeEach(async () => {
            // Create test entries
            await createJournalEntry({
                date: '2024-01-15',
                description: 'First sale',
                reference: 'INV001',
                lines: [
                    { accountId: cashAccountId, debit: 100 },
                    { accountId: salesAccountId, credit: 100 },
                ],
            });

            await createJournalEntry({
                date: '2024-01-20',
                description: 'Second sale',
                reference: 'INV002',
                lines: [
                    { accountId: cashAccountId, debit: 200 },
                    { accountId: salesAccountId, credit: 200 },
                ],
            });

            await createJournalEntry({
                date: '2024-02-01',
                description: 'Purchase supplies',
                reference: 'PO001',
                lines: [
                    { accountId: cashAccountId, credit: 50 },
                    { accountId: salesAccountId, debit: 50 }, // Using sales account for test simplicity
                ],
            });
        });

        it('should return all entries when no filters applied', async () => {
            const result = await searchJournalEntries({});

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveLength(3);
                // Should be ordered by date DESC, id DESC
                expect(result.data[0]?.date).toBe('2024-02-01');
                expect(result.data[1]?.date).toBe('2024-01-20');
                expect(result.data[2]?.date).toBe('2024-01-15');
            }
        });

        it('should filter by date range', async () => {
            const result = await searchJournalEntries({
                startDate: '2024-01-15',
                endDate: '2024-01-25',
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveLength(2);
                expect(result.data.every(entry =>
                    entry.date >= '2024-01-15' && entry.date <= '2024-01-25'
                )).toBe(true);
            }
        });

        it('should filter by reference', async () => {
            const result = await searchJournalEntries({
                reference: 'INV',
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveLength(2);
                expect(result.data.every(entry =>
                    entry.reference?.includes('INV')
                )).toBe(true);
            }
        });

        it('should filter by description', async () => {
            const result = await searchJournalEntries({
                description: 'sale',
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveLength(2);
                expect(result.data.every(entry =>
                    entry.description?.toLowerCase().includes('sale')
                )).toBe(true);
            }
        });
    });

    describe('closePeriod', () => {
        it('should successfully close a period', async () => {
            const result = await closePeriod('2024-01-31');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.locked).toBe(true);
            }
        });

        it('should reject invalid date format', async () => {
            const result = await closePeriod('invalid-date');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toContain('Invalid date format');
            }
        });

        it('should reject closing period earlier than existing lock', async () => {
            // First close through Jan 31
            await closePeriod('2024-01-31');

            // Try to close through Jan 15 (earlier)
            const result = await closePeriod('2024-01-15');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.message).toContain('already locked');
            }
        });
    });
});
