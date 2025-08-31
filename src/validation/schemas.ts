import { z } from 'zod';
import { DateTime } from 'luxon';

const accountTypeEnum = z.enum(['Asset', 'Liability', 'Equity', 'Income', 'Expense']);

export const nonEmptyString = z.string().trim().min(1);

export const isoDateYMD = z
    .string()
    .refine((val) => DateTime.fromFormat(val, 'yyyy-LL-dd', { zone: 'utc' }).isValid, {
        message: 'Invalid date format; expected YYYY-MM-DD',
    });

export const createAccountInput = z.object({
    code: nonEmptyString,
    name: nonEmptyString,
    type: accountTypeEnum,
    parentId: z.number().int().positive().optional(),
});

export const updateAccountInput = z.object({
    id: z.number().int().positive(),
    code: nonEmptyString.optional(),
    name: nonEmptyString.optional(),
    type: accountTypeEnum.optional(),
    parentId: z.number().int().positive().nullable().optional(),
});

export const getAccountByIdInput = z.object({ id: z.number().int().positive() });

export const listAccountsInput = z.object({
    code: z.string().optional(),
    name: z.string().optional(),
    type: accountTypeEnum.optional(),
});

export const deleteAccountInput = z.object({ id: z.number().int().positive() });

const money = z.number().finite().nonnegative();

export const createJournalEntryInput = z
    .object({
        date: isoDateYMD,
        description: z.string().optional(),
        reference: z.string().optional(),
        lines: z
            .array(
                z.object({
                    accountId: z.number().int().positive(),
                    debit: money.optional(),
                    credit: money.optional(),
                }),
            )
            .min(2),
    })
    .superRefine((val, ctx) => {
        let totalDebit = 0;
        let totalCredit = 0;
        for (const line of val.lines) {
            const d = line.debit ?? 0;
            const c = line.credit ?? 0;
            if ((d > 0 && c > 0) || (d === 0 && c === 0)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['lines'],
                    message: 'Each line must have either debit or credit, not both and not neither',
                });
            }
            totalDebit += d;
            totalCredit += c;
        }
        if (!(totalDebit > 0 && totalCredit > 0 && Math.abs(totalDebit - totalCredit) < 1e-9)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['lines'],
                message: 'Debits must equal credits and be greater than 0',
            });
        }
    });

export const deleteJournalEntryInput = z.object({ id: z.number().int().positive() });
export const getJournalEntryByIdInput = z.object({ id: z.number().int().positive() });
export const searchJournalEntriesInput = z.object({
    startDate: isoDateYMD.optional(),
    endDate: isoDateYMD.optional(),
    reference: z.string().optional(),
    description: z.string().optional(),
});

export const getLedgerInput = z.object({
    accountId: z.number().int().positive(),
    startDate: isoDateYMD.optional(),
    endDate: isoDateYMD.optional(),
    includeRunningBalance: z.boolean().optional(),
});

export const closePeriodInput = z.object({ throughDate: isoDateYMD });

export type CreateAccountInput = z.infer<typeof createAccountInput>;
export type UpdateAccountInput = z.infer<typeof updateAccountInput>;
export type GetAccountByIdInput = z.infer<typeof getAccountByIdInput>;
export type ListAccountsInput = z.infer<typeof listAccountsInput>;
export type DeleteAccountInput = z.infer<typeof deleteAccountInput>;
export type CreateJournalEntryInput = z.infer<typeof createJournalEntryInput>;
export type DeleteJournalEntryInput = z.infer<typeof deleteJournalEntryInput>;
export type GetJournalEntryByIdInput = z.infer<typeof getJournalEntryByIdInput>;
export type SearchJournalEntriesInput = z.infer<typeof searchJournalEntriesInput>;
export type GetLedgerInput = z.infer<typeof getLedgerInput>;
export type ClosePeriodInput = z.infer<typeof closePeriodInput>;

// Output schemas
export const accountSchema = z.object({
    id: z.number().int().positive(),
    code: nonEmptyString,
    name: nonEmptyString,
    type: accountTypeEnum,
    parent_id: z.number().int().positive().nullable(),
    created_at: z.string(),
});

export const journalEntrySchema = z.object({
    id: z.number().int().positive(),
    date: isoDateYMD,
    description: z.string().nullable(),
    reference: z.string().nullable(),
    created_at: z.string(),
});

export const journalLineSchema = z.object({
    id: z.number().int().positive(),
    journal_entry_id: z.number().int().positive(),
    account_id: z.number().int().positive(),
    debit: z.number(),
    credit: z.number(),
});

export const trialBalanceRowSchema = z.object({
    account: accountSchema,
    totalDebit: z.number(),
    totalCredit: z.number(),
    net: z.number(),
});
export const trialBalanceReportSchema = z.object({ rows: z.array(trialBalanceRowSchema) });

export const ledgerLineSchema = z.object({
    line: journalLineSchema,
    entry: journalEntrySchema,
    runningBalance: z.number().optional(),
});
export const ledgerReportSchema = z.object({ account: accountSchema, lines: z.array(ledgerLineSchema) });

export const balanceGroupSchema = z.object({
    type: z.enum(['Asset', 'Liability', 'Equity']),
    accounts: z.array(
        z.object({ account: accountSchema, totalDebit: z.number(), totalCredit: z.number(), net: z.number() }),
    ),
    parentSubtotals: z
        .array(z.object({ parent: accountSchema, totalDebit: z.number(), totalCredit: z.number(), net: z.number() }))
        .optional(),
});
export const balanceSheetReportSchema = z.object({
    assets: balanceGroupSchema,
    liabilities: balanceGroupSchema,
    equity: balanceGroupSchema,
});

export const profitLossGroupSchema = z.object({
    type: z.enum(['Income', 'Expense']),
    accounts: z.array(
        z.object({ account: accountSchema, totalDebit: z.number(), totalCredit: z.number(), net: z.number() }),
    ),
});
export const profitLossReportSchema = z.object({
    income: profitLossGroupSchema,
    expenses: profitLossGroupSchema,
    netIncome: z.number(),
});

export const envelopeOk = <T extends z.ZodTypeAny>(inner: T) => z.object({ success: z.literal(true), data: inner });
export const envelopeErr = z.object({ success: z.literal(false), message: z.string(), details: z.any().optional() });


