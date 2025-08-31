export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';

export interface Account {
    id: number;
    code: string;
    name: string;
    type: AccountType;
    parent_id: number | null;
    created_at: string;
}

export interface JournalEntry {
    id: number;
    date: string; // YYYY-MM-DD
    description: string | null;
    reference: string | null;
    created_at: string;
}

export interface JournalLine {
    id: number;
    journal_entry_id: number;
    account_id: number;
    debit: number; // store numeric values
    credit: number; // store numeric values
}

export interface TrialBalanceRow {
    account: Account;
    totalDebit: number;
    totalCredit: number;
    net: number; // debit - credit
}

export interface TrialBalanceReport {
    rows: TrialBalanceRow[];
}

export interface LedgerLine {
    line: JournalLine;
    entry: JournalEntry;
    runningBalance?: number;
}

export interface LedgerReport {
    account: Account;
    lines: LedgerLine[];
}

export interface BalanceGroup {
    type: 'Asset' | 'Liability' | 'Equity';
    accounts: Array<{ account: Account; totalDebit: number; totalCredit: number; net: number }>;
    parentSubtotals?: Array<{ parent: Account; totalDebit: number; totalCredit: number; net: number }>;
}

export interface BalanceSheetReport {
    assets: BalanceGroup;
    liabilities: BalanceGroup;
    equity: BalanceGroup;
}

export interface ProfitLossGroup {
    type: 'Income' | 'Expense';
    accounts: Array<{ account: Account; totalDebit: number; totalCredit: number; net: number }>;
}

export interface ProfitLossReport {
    income: ProfitLossGroup;
    expenses: ProfitLossGroup;
    netIncome: number; // income credits - expenses debits (based on net sign)
}

export interface ResultEnvelope<T> {
    success: true;
    data: T;
}

export interface ErrorEnvelope {
    success: false;
    message: string;
    details?: unknown;
}

export type ActionResult<T> = ResultEnvelope<T> | ErrorEnvelope;


