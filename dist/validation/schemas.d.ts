import { z } from 'zod';
/**
 * Account validation schemas
 */
export declare const createAccountInputSchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["Asset", "Liability", "Equity", "Income", "Expense"]>;
    parentId: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    type: "Asset" | "Liability" | "Equity" | "Income" | "Expense";
    parentId?: number | undefined;
}, {
    code: string;
    name: string;
    type: "Asset" | "Liability" | "Equity" | "Income" | "Expense";
    parentId?: number | undefined;
}>;
export declare const updateAccountInputSchema: z.ZodObject<{
    id: z.ZodNumber;
    code: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["Asset", "Liability", "Equity", "Income", "Expense"]>>;
    parentId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    id: number;
    code?: string | undefined;
    name?: string | undefined;
    type?: "Asset" | "Liability" | "Equity" | "Income" | "Expense" | undefined;
    parentId?: number | null | undefined;
}, {
    id: number;
    code?: string | undefined;
    name?: string | undefined;
    type?: "Asset" | "Liability" | "Equity" | "Income" | "Expense" | undefined;
    parentId?: number | null | undefined;
}>;
export declare const getAccountByIdInputSchema: z.ZodObject<{
    id: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: number;
}, {
    id: number;
}>;
export declare const listAccountsInputSchema: z.ZodObject<{
    code: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["Asset", "Liability", "Equity", "Income", "Expense"]>>;
}, "strip", z.ZodTypeAny, {
    code?: string | undefined;
    name?: string | undefined;
    type?: "Asset" | "Liability" | "Equity" | "Income" | "Expense" | undefined;
}, {
    code?: string | undefined;
    name?: string | undefined;
    type?: "Asset" | "Liability" | "Equity" | "Income" | "Expense" | undefined;
}>;
export declare const deleteAccountInputSchema: z.ZodObject<{
    id: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: number;
}, {
    id: number;
}>;
export declare const createJournalEntryInputSchema: z.ZodEffects<z.ZodObject<{
    date: z.ZodEffects<z.ZodString, string, string>;
    description: z.ZodOptional<z.ZodString>;
    reference: z.ZodOptional<z.ZodString>;
    lines: z.ZodArray<z.ZodEffects<z.ZodObject<{
        accountId: z.ZodNumber;
        debit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        credit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        accountId: number;
        debit: number;
        credit: number;
    }, {
        accountId: number;
        debit?: number | undefined;
        credit?: number | undefined;
    }>, {
        accountId: number;
        debit: number;
        credit: number;
    }, {
        accountId: number;
        debit?: number | undefined;
        credit?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    date: string;
    lines: {
        accountId: number;
        debit: number;
        credit: number;
    }[];
    description?: string | undefined;
    reference?: string | undefined;
}, {
    date: string;
    lines: {
        accountId: number;
        debit?: number | undefined;
        credit?: number | undefined;
    }[];
    description?: string | undefined;
    reference?: string | undefined;
}>, {
    date: string;
    lines: {
        accountId: number;
        debit: number;
        credit: number;
    }[];
    description?: string | undefined;
    reference?: string | undefined;
}, {
    date: string;
    lines: {
        accountId: number;
        debit?: number | undefined;
        credit?: number | undefined;
    }[];
    description?: string | undefined;
    reference?: string | undefined;
}>;
export declare const deleteJournalEntryInputSchema: z.ZodObject<{
    id: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: number;
}, {
    id: number;
}>;
export declare const getJournalEntryByIdInputSchema: z.ZodObject<{
    id: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: number;
}, {
    id: number;
}>;
export declare const searchJournalEntriesInputSchema: z.ZodObject<{
    startDate: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    endDate: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    reference: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    reference?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    description?: string | undefined;
    reference?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}>;
/**
 * Reporting validation schemas
 */
export declare const getTrialBalanceInputSchema: z.ZodObject<{
    asOfDate: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
}, "strip", z.ZodTypeAny, {
    asOfDate?: string | undefined;
}, {
    asOfDate?: string | undefined;
}>;
export declare const getLedgerInputSchema: z.ZodObject<{
    accountId: z.ZodNumber;
    startDate: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    endDate: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    includeRunningBalance: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    accountId: number;
    includeRunningBalance: boolean;
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    accountId: number;
    startDate?: string | undefined;
    endDate?: string | undefined;
    includeRunningBalance?: boolean | undefined;
}>;
export declare const getBalanceSheetInputSchema: z.ZodObject<{
    asOfDate: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
}, "strip", z.ZodTypeAny, {
    asOfDate?: string | undefined;
}, {
    asOfDate?: string | undefined;
}>;
export declare const getProfitLossInputSchema: z.ZodObject<{
    startDate: z.ZodEffects<z.ZodString, string, string>;
    endDate: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    startDate: string;
    endDate: string;
}, {
    startDate: string;
    endDate: string;
}>;
/**
 * Utility validation schemas
 */
export declare const closePeriodInputSchema: z.ZodObject<{
    throughDate: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    throughDate: string;
}, {
    throughDate: string;
}>;
/**
 * Output validation schemas
 */
export declare const accountOutputSchema: z.ZodObject<{
    id: z.ZodNumber;
    code: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["Asset", "Liability", "Equity", "Income", "Expense"]>;
    parentId: z.ZodNullable<z.ZodNumber>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    type: "Asset" | "Liability" | "Equity" | "Income" | "Expense";
    parentId: number | null;
    id: number;
    createdAt: string;
}, {
    code: string;
    name: string;
    type: "Asset" | "Liability" | "Equity" | "Income" | "Expense";
    parentId: number | null;
    id: number;
    createdAt: string;
}>;
export declare const journalEntryOutputSchema: z.ZodObject<{
    id: z.ZodNumber;
    date: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    reference: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: number;
    date: string;
    description: string | null;
    reference: string | null;
    createdAt: string;
}, {
    id: number;
    date: string;
    description: string | null;
    reference: string | null;
    createdAt: string;
}>;
export declare const journalLineOutputSchema: z.ZodObject<{
    id: z.ZodNumber;
    journalEntryId: z.ZodNumber;
    accountId: z.ZodNumber;
    debit: z.ZodNumber;
    credit: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: number;
    accountId: number;
    debit: number;
    credit: number;
    journalEntryId: number;
}, {
    id: number;
    accountId: number;
    debit: number;
    credit: number;
    journalEntryId: number;
}>;
export declare const successResultSchema: <T>(dataSchema: z.ZodType<T>) => z.ZodObject<{
    success: z.ZodLiteral<true>;
    data: z.ZodType<T, z.ZodTypeDef, T>;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    success: z.ZodLiteral<true>;
    data: z.ZodType<T, z.ZodTypeDef, T>;
}>, any> extends infer T_1 ? { [k in keyof T_1]: T_1[k]; } : never, z.baseObjectInputType<{
    success: z.ZodLiteral<true>;
    data: z.ZodType<T, z.ZodTypeDef, T>;
}> extends infer T_2 ? { [k_1 in keyof T_2]: T_2[k_1]; } : never>;
export declare const errorResultSchema: z.ZodObject<{
    success: z.ZodLiteral<false>;
    message: z.ZodString;
    details: z.ZodOptional<z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: false;
    details?: unknown;
}, {
    message: string;
    success: false;
    details?: unknown;
}>;
/**
 * n8n Credentials validation schema
 */
export declare const lojikAccountingCredentialsSchema: z.ZodObject<{
    databaseFileName: z.ZodString;
    displayDateFormat: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    currencySymbol: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    timezone: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    databaseFileName: string;
    displayDateFormat: string;
    currencySymbol: string;
    timezone: string;
}, {
    databaseFileName: string;
    displayDateFormat?: string | undefined;
    currencySymbol?: string | undefined;
    timezone?: string | undefined;
}>;
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
//# sourceMappingURL=schemas.d.ts.map