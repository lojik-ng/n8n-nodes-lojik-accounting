import { z } from 'zod';

// Account types
export const accountTypeSchema = z.enum(['Asset', 'Liability', 'Equity', 'Income', 'Expense']);

// Account schemas
export const createAccountInputSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: accountTypeSchema,
  parentId: z.number().optional(),
});

export const updateAccountInputSchema = z.object({
  id: z.number(),
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  type: accountTypeSchema.optional(),
  parentId: z.number().nullable().optional(),
});

export const getAccountByIdInputSchema = z.object({
  id: z.number(),
});

export const listAccountsInputSchema = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  type: accountTypeSchema.optional(),
});

export const deleteAccountInputSchema = z.object({
  id: z.number(),
});

// Journal entry schemas
export const journalLineSchema = z.object({
  accountId: z.number(),
  debit: z.number().nonnegative().optional(),
  credit: z.number().nonnegative().optional(),
}).refine(
  (data) => {
    const hasDebit = data.debit !== undefined && data.debit > 0;
    const hasCredit = data.credit !== undefined && data.credit > 0;
    return (hasDebit || hasCredit) && !(hasDebit && hasCredit);
  },
  {
    message: 'Each line must have either a debit or credit amount, but not both',
  }
);

export const createJournalEntryInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  description: z.string().optional(),
  reference: z.string().optional(),
  lines: z.array(journalLineSchema).min(2),
}).refine(
  (data) => {
    const totalDebit = data.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = data.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
    return totalDebit === totalCredit && totalDebit > 0;
  },
  {
    message: 'Total debits must equal total credits and be greater than zero',
  }
);

export const deleteJournalEntryInputSchema = z.object({
  id: z.number(),
});

export const getJournalEntryByIdInputSchema = z.object({
  id: z.number(),
});

export const searchJournalEntriesInputSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
  reference: z.string().optional(),
  description: z.string().optional(),
});

// Reporting schemas
export const getLedgerInputSchema = z.object({
  accountId: z.number(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
  includeRunningBalance: z.boolean().optional(),
});

export const getBalanceSheetInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
});

export const getProfitLossInputSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
});

// Utility schemas
export const closePeriodInputSchema = z.object({
  throughDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
});