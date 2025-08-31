/**
 * Account types and related interfaces
 */
export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';

export interface Account {
    id: number;
    code: string;
    name: string;
    type: AccountType;
    parentId: number | null;
    createdAt: string;
}

/**
 * Journal entry and line interfaces
 */
export interface JournalEntry {
    id: number;
    date: string; // ISO date format YYYY-MM-DD
    description: string | null;
    reference: string | null;
    createdAt: string;
}

export interface JournalLine {
    id: number;
    journalEntryId: number;
    accountId: number;
    debit: number;
    credit: number;
}

export interface JournalEntryWithLines {
    entry: JournalEntry;
    lines: JournalLine[];
}

/**
 * Report interfaces
 */
export interface TrialBalanceItem {
    accountId: number;
    accountCode: string;
    accountName: string;
    accountType: AccountType;
    totalDebit: number;
    totalCredit: number;
    net: number; // debit minus credit
}

export interface TrialBalanceReport {
    items: TrialBalanceItem[];
    totalDebits: number;
    totalCredits: number;
    difference: number; // should be 0 if balanced
}

export interface LedgerItem {
    id: number;
    date: string;
    description: string | null;
    reference: string | null;
    debit: number;
    credit: number;
    runningBalance?: number;
    journalEntryId: number;
}

export interface LedgerReport {
    accountId: number;
    accountCode: string;
    accountName: string;
    accountType: AccountType;
    startDate: string | undefined;
    endDate: string | undefined;
    items: LedgerItem[];
    openingBalance: number;
    closingBalance: number;
}

export interface BalanceSheetItem {
    accountId: number;
    accountCode: string;
    accountName: string;
    balance: number;
    parentId: number | null;
}

export interface BalanceSheetSection {
    type: 'Asset' | 'Liability' | 'Equity';
    items: BalanceSheetItem[];
    total: number;
}

export interface BalanceSheetReport {
    asOfDate: string;
    assets: BalanceSheetSection;
    liabilities: BalanceSheetSection;
    equity: BalanceSheetSection;
    totalAssets: number;
    totalLiabilitiesAndEquity: number;
    difference: number; // should be 0 if balanced
}

export interface ProfitLossItem {
    accountId: number;
    accountCode: string;
    accountName: string;
    amount: number;
    parentId: number | null;
}

export interface ProfitLossSection {
    type: 'Income' | 'Expense';
    items: ProfitLossItem[];
    total: number;
}

export interface ProfitLossReport {
    startDate: string;
    endDate: string;
    income: ProfitLossSection;
    expenses: ProfitLossSection;
    grossIncome: number;
    totalExpenses: number;
    netIncome: number; // income minus expenses
}

/**
 * Standard result envelope for all actions
 */
export interface SuccessResult<T> {
    success: true;
    data: T;
}

export interface ErrorResult {
    success: false;
    message: string;
    details?: unknown;
}

export type ActionResult<T> = SuccessResult<T> | ErrorResult;

/**
 * n8n credentials interface
 */
export interface LojikAccountingCredentials {
    databaseFileName: string;
    displayDateFormat?: string;
    currencySymbol?: string;
    timezone?: string;
}

/**
 * Database connection configuration
 */
export interface DatabaseConfig {
    filePath: string;
    credentials: LojikAccountingCredentials;
}

/**
 * Period lock for closePeriod functionality
 */
export interface PeriodLock {
    id: number;
    throughDate: string; // YYYY-MM-DD
    createdAt: string;
}
