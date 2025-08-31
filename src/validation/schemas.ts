import { z } from 'zod';
import { DateTime } from 'luxon';

/**
 * Common validation helpers
 */
const accountTypeSchema = z.enum(['Asset', 'Liability', 'Equity', 'Income', 'Expense']);

const positiveNumberSchema = z.number().min(0, 'Amount must be non-negative');

const dateStringSchema = z.string().refine((date) => {
    const dt = DateTime.fromISO(date, { zone: 'utc' });
    return dt.isValid && /^\d{4}-\d{2}-\d{2}$/.test(date);
}, 'Date must be a valid ISO date in YYYY-MM-DD format');

const optionalDateStringSchema = z.string().optional().refine((date) => {
    if (!date) return true;
    const dt = DateTime.fromISO(date, { zone: 'utc' });
    return dt.isValid && /^\d{4}-\d{2}-\d{2}$/.test(date);
}, 'Date must be a valid ISO date in YYYY-MM-DD format');

/**
 * Account validation schemas
 */
export const createAccountInputSchema = z.object({
    code: z.string().min(1, 'Account code is required').max(50, 'Account code too long'),
    name: z.string().min(1, 'Account name is required').max(255, 'Account name too long'),
    type: accountTypeSchema,
    parentId: z.number().int().positive().optional(),
});

export const updateAccountInputSchema = z.object({
    id: z.number().int().positive(),
    code: z.string().min(1, 'Account code is required').max(50, 'Account code too long').optional(),
    name: z.string().min(1, 'Account name is required').max(255, 'Account name too long').optional(),
    type: accountTypeSchema.optional(),
    parentId: z.number().int().positive().nullable().optional(),
});

export const getAccountByIdInputSchema = z.object({
    id: z.number().int().positive(),
});

export const listAccountsInputSchema = z.object({
    code: z.string().optional(),
    name: z.string().optional(),
    type: accountTypeSchema.optional(),
});

export const deleteAccountInputSchema = z.object({
    id: z.number().int().positive(),
});

/**
 * Journal Entry validation schemas
 */
const journalLineSchema = z.object({
    accountId: z.number().int().positive(),
    debit: positiveNumberSchema.optional().default(0),
    credit: positiveNumberSchema.optional().default(0),
}).refine((line) => {
    // Each line must have either debit or credit, not both, not neither
    const hasDebit = (line.debit || 0) > 0;
    const hasCredit = (line.credit || 0) > 0;
    return (hasDebit && !hasCredit) || (!hasDebit && hasCredit);
}, 'Each line must have either debit or credit, not both');

export const createJournalEntryInputSchema = z.object({
    date: dateStringSchema,
    description: z.string().max(500, 'Description too long').optional(),
    reference: z.string().max(100, 'Reference too long').optional(),
    lines: z.array(journalLineSchema).min(2, 'Journal entry must have at least 2 lines'),
}).refine((entry) => {
    // Validate that sum of debits equals sum of credits and is greater than 0
    const totalDebits = entry.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredits = entry.lines.reduce((sum, line) => sum + (line.credit || 0), 0);

    return Math.abs(totalDebits - totalCredits) < 0.01 && totalDebits > 0;
}, 'Sum of debits must equal sum of credits and be greater than 0');

export const deleteJournalEntryInputSchema = z.object({
    id: z.number().int().positive(),
});

export const getJournalEntryByIdInputSchema = z.object({
    id: z.number().int().positive(),
});

export const searchJournalEntriesInputSchema = z.object({
    startDate: optionalDateStringSchema,
    endDate: optionalDateStringSchema,
    reference: z.string().optional(),
    description: z.string().optional(),
});

/**
 * Reporting validation schemas
 */
export const getTrialBalanceInputSchema = z.object({
    asOfDate: optionalDateStringSchema,
});

export const getLedgerInputSchema = z.object({
    accountId: z.number().int().positive(),
    startDate: optionalDateStringSchema,
    endDate: optionalDateStringSchema,
    includeRunningBalance: z.boolean().optional().default(false),
});

export const getBalanceSheetInputSchema = z.object({
    asOfDate: optionalDateStringSchema,
});

export const getProfitLossInputSchema = z.object({
    startDate: dateStringSchema,
    endDate: dateStringSchema,
});

/**
 * Utility validation schemas
 */
export const closePeriodInputSchema = z.object({
    throughDate: dateStringSchema,
});

/**
 * Output validation schemas
 */
export const accountOutputSchema = z.object({
    id: z.number(),
    code: z.string(),
    name: z.string(),
    type: accountTypeSchema,
    parentId: z.number().nullable(),
    createdAt: z.string(),
});

export const journalEntryOutputSchema = z.object({
    id: z.number(),
    date: z.string(),
    description: z.string().nullable(),
    reference: z.string().nullable(),
    createdAt: z.string(),
});

export const journalLineOutputSchema = z.object({
    id: z.number(),
    journalEntryId: z.number(),
    accountId: z.number(),
    debit: z.number(),
    credit: z.number(),
});

export const successResultSchema = <T>(dataSchema: z.ZodType<T>) => z.object({
    success: z.literal(true),
    data: dataSchema,
});

export const errorResultSchema = z.object({
    success: z.literal(false),
    message: z.string(),
    details: z.unknown().optional(),
});

/**
 * n8n Credentials validation schema
 */
export const lojikAccountingCredentialsSchema = z.object({
    databaseFileName: z.string().min(1, 'Database file name is required'),
    displayDateFormat: z.string().optional().default('yyyy-LL-dd'),
    currencySymbol: z.string().optional().default('₦'),
    timezone: z.string().optional().default('UTC+1'),
});

/**
 * Type inference helpers
 */
export type CreateAccountInput = z.infer<typeof createAccountInputSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountInputSchema>;
export type GetAccountByIdInput = z.infer<typeof getAccountByIdInputSchema>;
export type ListAccountsInput = z.infer<typeof listAccountsInputSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountInputSchema>;

export type CreateJournalEntryInput = z.infer<typeof createJournalEntryInputSchema>;
export type DeleteJournalEntryInput = z.infer<typeof deleteJournalEntryInputSchema>;
export type GetJournalEntryByIdInput = z.infer<typeof getJournalEntryByIdInputSchema>;
export type SearchJournalEntriesInput = z.infer<typeof searchJournalEntriesInputSchema>;

export type GetTrialBalanceInput = z.infer<typeof getTrialBalanceInputSchema>;
export type GetLedgerInput = z.infer<typeof getLedgerInputSchema>;
export type GetBalanceSheetInput = z.infer<typeof getBalanceSheetInputSchema>;
export type GetProfitLossInput = z.infer<typeof getProfitLossInputSchema>;

export type ClosePeriodInput = z.infer<typeof closePeriodInputSchema>;
export type LojikAccountingCredentials = z.infer<typeof lojikAccountingCredentialsSchema>;
