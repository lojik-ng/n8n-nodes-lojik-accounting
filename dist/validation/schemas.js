"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lojikAccountingCredentialsSchema = exports.errorResultSchema = exports.successResultSchema = exports.journalLineOutputSchema = exports.journalEntryOutputSchema = exports.accountOutputSchema = exports.closePeriodInputSchema = exports.getProfitLossInputSchema = exports.getBalanceSheetInputSchema = exports.getLedgerInputSchema = exports.getTrialBalanceInputSchema = exports.searchJournalEntriesInputSchema = exports.getJournalEntryByIdInputSchema = exports.deleteJournalEntryInputSchema = exports.createJournalEntryInputSchema = exports.deleteAccountInputSchema = exports.listAccountsInputSchema = exports.getAccountByIdInputSchema = exports.updateAccountInputSchema = exports.createAccountInputSchema = void 0;
const zod_1 = require("zod");
const luxon_1 = require("luxon");
/**
 * Common validation helpers
 */
const accountTypeSchema = zod_1.z.enum(['Asset', 'Liability', 'Equity', 'Income', 'Expense']);
const positiveNumberSchema = zod_1.z.number().min(0, 'Amount must be non-negative');
const dateStringSchema = zod_1.z.string().refine((date) => {
    const dt = luxon_1.DateTime.fromISO(date, { zone: 'utc' });
    return dt.isValid && /^\d{4}-\d{2}-\d{2}$/.test(date);
}, 'Date must be a valid ISO date in YYYY-MM-DD format');
const optionalDateStringSchema = zod_1.z.string().optional().refine((date) => {
    if (!date)
        return true;
    const dt = luxon_1.DateTime.fromISO(date, { zone: 'utc' });
    return dt.isValid && /^\d{4}-\d{2}-\d{2}$/.test(date);
}, 'Date must be a valid ISO date in YYYY-MM-DD format');
/**
 * Account validation schemas
 */
exports.createAccountInputSchema = zod_1.z.object({
    code: zod_1.z.string().min(1, 'Account code is required').max(50, 'Account code too long'),
    name: zod_1.z.string().min(1, 'Account name is required').max(255, 'Account name too long'),
    type: accountTypeSchema,
    parentId: zod_1.z.number().int().positive().optional(),
});
exports.updateAccountInputSchema = zod_1.z.object({
    id: zod_1.z.number().int().positive(),
    code: zod_1.z.string().min(1, 'Account code is required').max(50, 'Account code too long').optional(),
    name: zod_1.z.string().min(1, 'Account name is required').max(255, 'Account name too long').optional(),
    type: accountTypeSchema.optional(),
    parentId: zod_1.z.number().int().positive().nullable().optional(),
});
exports.getAccountByIdInputSchema = zod_1.z.object({
    id: zod_1.z.number().int().positive(),
});
exports.listAccountsInputSchema = zod_1.z.object({
    code: zod_1.z.string().optional(),
    name: zod_1.z.string().optional(),
    type: accountTypeSchema.optional(),
});
exports.deleteAccountInputSchema = zod_1.z.object({
    id: zod_1.z.number().int().positive(),
});
/**
 * Journal Entry validation schemas
 */
const journalLineSchema = zod_1.z.object({
    accountId: zod_1.z.number().int().positive(),
    debit: positiveNumberSchema.optional().default(0),
    credit: positiveNumberSchema.optional().default(0),
}).refine((line) => {
    // Each line must have either debit or credit, not both, not neither
    const hasDebit = (line.debit || 0) > 0;
    const hasCredit = (line.credit || 0) > 0;
    return (hasDebit && !hasCredit) || (!hasDebit && hasCredit);
}, 'Each line must have either debit or credit, not both');
exports.createJournalEntryInputSchema = zod_1.z.object({
    date: dateStringSchema,
    description: zod_1.z.string().max(500, 'Description too long').optional(),
    reference: zod_1.z.string().max(100, 'Reference too long').optional(),
    lines: zod_1.z.array(journalLineSchema).min(2, 'Journal entry must have at least 2 lines'),
}).refine((entry) => {
    // Validate that sum of debits equals sum of credits and is greater than 0
    const totalDebits = entry.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredits = entry.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
    return Math.abs(totalDebits - totalCredits) < 0.01 && totalDebits > 0;
}, 'Sum of debits must equal sum of credits and be greater than 0');
exports.deleteJournalEntryInputSchema = zod_1.z.object({
    id: zod_1.z.number().int().positive(),
});
exports.getJournalEntryByIdInputSchema = zod_1.z.object({
    id: zod_1.z.number().int().positive(),
});
exports.searchJournalEntriesInputSchema = zod_1.z.object({
    startDate: optionalDateStringSchema,
    endDate: optionalDateStringSchema,
    reference: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
});
/**
 * Reporting validation schemas
 */
exports.getTrialBalanceInputSchema = zod_1.z.object({
    asOfDate: optionalDateStringSchema,
});
exports.getLedgerInputSchema = zod_1.z.object({
    accountId: zod_1.z.number().int().positive(),
    startDate: optionalDateStringSchema,
    endDate: optionalDateStringSchema,
    includeRunningBalance: zod_1.z.boolean().optional().default(false),
});
exports.getBalanceSheetInputSchema = zod_1.z.object({
    asOfDate: optionalDateStringSchema,
});
exports.getProfitLossInputSchema = zod_1.z.object({
    startDate: dateStringSchema,
    endDate: dateStringSchema,
});
/**
 * Utility validation schemas
 */
exports.closePeriodInputSchema = zod_1.z.object({
    throughDate: dateStringSchema,
});
/**
 * Output validation schemas
 */
exports.accountOutputSchema = zod_1.z.object({
    id: zod_1.z.number(),
    code: zod_1.z.string(),
    name: zod_1.z.string(),
    type: accountTypeSchema,
    parentId: zod_1.z.number().nullable(),
    createdAt: zod_1.z.string(),
});
exports.journalEntryOutputSchema = zod_1.z.object({
    id: zod_1.z.number(),
    date: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    reference: zod_1.z.string().nullable(),
    createdAt: zod_1.z.string(),
});
exports.journalLineOutputSchema = zod_1.z.object({
    id: zod_1.z.number(),
    journalEntryId: zod_1.z.number(),
    accountId: zod_1.z.number(),
    debit: zod_1.z.number(),
    credit: zod_1.z.number(),
});
const successResultSchema = (dataSchema) => zod_1.z.object({
    success: zod_1.z.literal(true),
    data: dataSchema,
});
exports.successResultSchema = successResultSchema;
exports.errorResultSchema = zod_1.z.object({
    success: zod_1.z.literal(false),
    message: zod_1.z.string(),
    details: zod_1.z.unknown().optional(),
});
/**
 * n8n Credentials validation schema
 */
exports.lojikAccountingCredentialsSchema = zod_1.z.object({
    databaseFileName: zod_1.z.string().min(1, 'Database file name is required'),
    displayDateFormat: zod_1.z.string().optional().default('yyyy-LL-dd'),
    currencySymbol: zod_1.z.string().optional().default('₦'),
    timezone: zod_1.z.string().optional().default('UTC+1'),
});
//# sourceMappingURL=schemas.js.map