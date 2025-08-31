import { describe, it, expect } from '@jest/globals';
import {
    createAccountInputSchema,
    createJournalEntryInputSchema,
    lojikAccountingCredentialsSchema,
} from '../schemas.js';

describe('Validation Schemas', () => {
    describe('createAccountInputSchema', () => {
        it('should validate a valid account input', () => {
            const validInput = {
                code: 'CASH001',
                name: 'Cash Account',
                type: 'Asset' as const,
            };

            const result = createAccountInputSchema.safeParse(validInput);
            expect(result.success).toBe(true);
        });

        it('should reject invalid account type', () => {
            const invalidInput = {
                code: 'CASH001',
                name: 'Cash Account',
                type: 'InvalidType',
            };

            const result = createAccountInputSchema.safeParse(invalidInput);
            expect(result.success).toBe(false);
        });

        it('should reject empty required fields', () => {
            const invalidInput = {
                code: '',
                name: '',
                type: 'Asset' as const,
            };

            const result = createAccountInputSchema.safeParse(invalidInput);
            expect(result.success).toBe(false);
        });

        it('should accept optional parentId', () => {
            const validInput = {
                code: 'CASH001',
                name: 'Cash Account',
                type: 'Asset' as const,
                parentId: 5,
            };

            const result = createAccountInputSchema.safeParse(validInput);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.parentId).toBe(5);
            }
        });
    });

    describe('createJournalEntryInputSchema', () => {
        it('should validate a balanced journal entry', () => {
            const validInput = {
                date: '2024-01-15',
                description: 'Test entry',
                reference: 'REF001',
                lines: [
                    { accountId: 1, debit: 100 },
                    { accountId: 2, credit: 100 },
                ],
            };

            const result = createJournalEntryInputSchema.safeParse(validInput);
            expect(result.success).toBe(true);
        });

        it('should reject unbalanced journal entry', () => {
            const invalidInput = {
                date: '2024-01-15',
                lines: [
                    { accountId: 1, debit: 100 },
                    { accountId: 2, credit: 50 }, // Unbalanced
                ],
            };

            const result = createJournalEntryInputSchema.safeParse(invalidInput);
            expect(result.success).toBe(false);
        });

        it('should reject entry with less than 2 lines', () => {
            const invalidInput = {
                date: '2024-01-15',
                lines: [
                    { accountId: 1, debit: 100 },
                ],
            };

            const result = createJournalEntryInputSchema.safeParse(invalidInput);
            expect(result.success).toBe(false);
        });

        it('should reject line with both debit and credit', () => {
            const invalidInput = {
                date: '2024-01-15',
                lines: [
                    { accountId: 1, debit: 100, credit: 50 }, // Both debit and credit
                    { accountId: 2, credit: 150 },
                ],
            };

            const result = createJournalEntryInputSchema.safeParse(invalidInput);
            expect(result.success).toBe(false);
        });

        it('should reject line with neither debit nor credit', () => {
            const invalidInput = {
                date: '2024-01-15',
                lines: [
                    { accountId: 1 }, // Neither debit nor credit
                    { accountId: 2, credit: 100 },
                ],
            };

            const result = createJournalEntryInputSchema.safeParse(invalidInput);
            expect(result.success).toBe(false);
        });

        it('should reject invalid date format', () => {
            const invalidInput = {
                date: '15/01/2024', // Wrong format
                lines: [
                    { accountId: 1, debit: 100 },
                    { accountId: 2, credit: 100 },
                ],
            };

            const result = createJournalEntryInputSchema.safeParse(invalidInput);
            expect(result.success).toBe(false);
        });

        it('should reject negative amounts', () => {
            const invalidInput = {
                date: '2024-01-15',
                lines: [
                    { accountId: 1, debit: -100 }, // Negative amount
                    { accountId: 2, credit: 100 },
                ],
            };

            const result = createJournalEntryInputSchema.safeParse(invalidInput);
            expect(result.success).toBe(false);
        });
    });

    describe('lojikAccountingCredentialsSchema', () => {
        it('should validate credentials with required field only', () => {
            const validInput = {
                databaseFileName: 'accounting.db',
            };

            const result = lojikAccountingCredentialsSchema.safeParse(validInput);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.displayDateFormat).toBe('yyyy-LL-dd');
                expect(result.data.currencySymbol).toBe('₦');
                expect(result.data.timezone).toBe('UTC+1');
            }
        });

        it('should validate credentials with all fields', () => {
            const validInput = {
                databaseFileName: 'custom.db',
                displayDateFormat: 'dd/MM/yyyy',
                currencySymbol: '$',
                timezone: 'America/New_York',
            };

            const result = lojikAccountingCredentialsSchema.safeParse(validInput);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.displayDateFormat).toBe('dd/MM/yyyy');
                expect(result.data.currencySymbol).toBe('$');
                expect(result.data.timezone).toBe('America/New_York');
            }
        });

        it('should reject missing required field', () => {
            const invalidInput = {
                displayDateFormat: 'yyyy-LL-dd',
            };

            const result = lojikAccountingCredentialsSchema.safeParse(invalidInput);
            expect(result.success).toBe(false);
        });

        it('should reject empty database filename', () => {
            const invalidInput = {
                databaseFileName: '',
            };

            const result = lojikAccountingCredentialsSchema.safeParse(invalidInput);
            expect(result.success).toBe(false);
        });
    });
});
