export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';

export interface Account {
  id: number;
  code: string;
  name: string;
  type: AccountType;
  parentId: number | null;
  createdAt: string; // ISO string
}

export interface JournalEntry {
  id: number;
  date: string; // YYYY-MM-DD
  description: string | null;
  reference: string | null;
  createdAt: string; // ISO string
}

export interface JournalLine {
  id: number;
  journalEntryId: number;
  accountId: number;
  debit: number;
  credit: number;
}

export interface TrialBalanceReport {
  accountId: number;
  accountCode: string;
  accountName: string;
  totalDebit: number;
  totalCredit: number;
  netBalance: number;
}

export interface LedgerReport {
  accountId: number;
  accountCode: string;
  accountName: string;
  lines: Array<{
    journalEntryId: number;
    journalEntryDate: string;
    journalEntryDescription: string | null;
    journalEntryReference: string | null;
    debit: number;
    credit: number;
    balance: number;
  }>;
}

export interface BalanceSheetReport {
  assets: Array<{
    accountId: number;
    accountCode: string;
    accountName: string;
    balance: number;
  }>;
  liabilities: Array<{
    accountId: number;
    accountCode: string;
    accountName: string;
    balance: number;
  }>;
  equity: Array<{
    accountId: number;
    accountCode: string;
    accountName: string;
    balance: number;
  }>;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

export interface ProfitLossReport {
  income: Array<{
    accountId: number;
    accountCode: string;
    accountName: string;
    balance: number;
  }>;
  expenses: Array<{
    accountId: number;
    accountCode: string;
    accountName: string;
    balance: number;
  }>;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
}