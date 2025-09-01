import {
  TrialBalanceReport,
  LedgerReport,
  BalanceSheetReport,
  ProfitLossReport
} from '../types/index.js';
import { getDb } from '../db/connection.js';

/**
 * Get trial balance report
 */
export async function getTrialBalance(): Promise<TrialBalanceReport[]> {
  const db = await getDb();
  
  const query = `
    SELECT 
      a.id as accountId,
      a.code as accountCode,
      a.name as accountName,
      COALESCE(SUM(CASE WHEN jl.debit > 0 THEN jl.debit ELSE 0 END), 0) as totalDebit,
      COALESCE(SUM(CASE WHEN jl.credit > 0 THEN jl.credit ELSE 0 END), 0) as totalCredit
    FROM accounts a
    LEFT JOIN journal_lines jl ON a.id = jl.account_id
    GROUP BY a.id, a.code, a.name
    ORDER BY a.code
  `;
  
  const rows = await db.all(query);
  
  return rows.map((row: any) => ({
    accountId: row.accountId,
    accountCode: row.accountCode,
    accountName: row.accountName,
    totalDebit: row.totalDebit,
    totalCredit: row.totalCredit,
    netBalance: row.totalDebit - row.totalCredit
  }));
}

/**
 * Get ledger report for an account
 */
export async function getLedger(
  accountId: number,
  startDate?: string,
  endDate?: string,
  includeRunningBalance: boolean = false
): Promise<LedgerReport> {
  const db = await getDb();
  
  // Get account details
  const account = await db.get('SELECT id, code, name FROM accounts WHERE id = ?', accountId);
  if (!account) {
    throw new Error(`Account with id ${accountId} does not exist`);
  }
  
  // Build query for ledger lines
  let query = `
    SELECT 
      je.id as journalEntryId,
      je.date as journalEntryDate,
      je.description as journalEntryDescription,
      je.reference as journalEntryReference,
      jl.debit,
      jl.credit
    FROM journal_lines jl
    JOIN journal_entries je ON jl.journal_entry_id = je.id
    WHERE jl.account_id = ?
  `;
  
  const params: any[] = [accountId];
  
  if (startDate) {
    query += ' AND je.date >= ?';
    params.push(startDate);
  }
  
  if (endDate) {
    query += ' AND je.date <= ?';
    params.push(endDate);
  }
  
  query += ' ORDER BY je.date DESC, je.id DESC, jl.id DESC';
  
  const rows = await db.all(query, params);
  
  // Calculate running balance if requested
  let balance = 0;
  const lines = rows.map((row: any) => {
    if (includeRunningBalance) {
      balance += row.debit - row.credit;
    }
    
    return {
      journalEntryId: row.journalEntryId,
      journalEntryDate: row.journalEntryDate,
      journalEntryDescription: row.journalEntryDescription,
      journalEntryReference: row.journalEntryReference,
      debit: row.debit,
      credit: row.credit,
      balance: includeRunningBalance ? balance : 0
    };
  });
  
  return {
    accountId: account.id,
    accountCode: account.code,
    accountName: account.name,
    lines
  };
}

/**
 * Get balance sheet report
 */
export async function getBalanceSheet(date?: string): Promise<BalanceSheetReport> {
  const db = await getDb();
  
  // Build date filter
  let dateFilter = '';
  const params: any[] = [];
  
  if (date) {
    dateFilter = ' AND je.date <= ?';
    params.push(date);
  }
  
  // Get assets
  const assetsQuery = `
    SELECT 
      a.id as accountId,
      a.code as accountCode,
      a.name as accountName,
      COALESCE(SUM(jl.debit) - SUM(jl.credit), 0) as balance
    FROM accounts a
    LEFT JOIN journal_lines jl ON a.id = jl.account_id
    LEFT JOIN journal_entries je ON jl.journal_entry_id = je.id
    WHERE a.type = 'Asset'${dateFilter}
    GROUP BY a.id, a.code, a.name
    HAVING balance != 0
    ORDER BY a.code
  `;
  
  const assets = await db.all(assetsQuery, ...params);
  
  // Get liabilities
  const liabilitiesQuery = `
    SELECT 
      a.id as accountId,
      a.code as accountCode,
      a.name as accountName,
      COALESCE(SUM(jl.credit) - SUM(jl.debit), 0) as balance
    FROM accounts a
    LEFT JOIN journal_lines jl ON a.id = jl.account_id
    LEFT JOIN journal_entries je ON jl.journal_entry_id = je.id
    WHERE a.type = 'Liability'${dateFilter}
    GROUP BY a.id, a.code, a.name
    HAVING balance != 0
    ORDER BY a.code
  `;
  
  const liabilities = await db.all(liabilitiesQuery, ...params);
  
  // Get equity
  const equityQuery = `
    SELECT 
      a.id as accountId,
      a.code as accountCode,
      a.name as accountName,
      COALESCE(SUM(jl.credit) - SUM(jl.debit), 0) as balance
    FROM accounts a
    LEFT JOIN journal_lines jl ON a.id = jl.account_id
    LEFT JOIN journal_entries je ON jl.journal_entry_id = je.id
    WHERE a.type = 'Equity'${dateFilter}
    GROUP BY a.id, a.code, a.name
    HAVING balance != 0
    ORDER BY a.code
  `;
  
  const equity = await db.all(equityQuery, ...params);
  
  // Calculate totals
  const totalAssets = assets.reduce((sum: number, item: any) => sum + item.balance, 0);
  const totalLiabilities = liabilities.reduce((sum: number, item: any) => sum + item.balance, 0);
  const totalEquity = equity.reduce((sum: number, item: any) => sum + item.balance, 0);
  
  return {
    assets: assets.map((item: any) => ({
      accountId: item.accountId,
      accountCode: item.accountCode,
      accountName: item.accountName,
      balance: item.balance
    })),
    liabilities: liabilities.map((item: any) => ({
      accountId: item.accountId,
      accountCode: item.accountCode,
      accountName: item.accountName,
      balance: item.balance
    })),
    equity: equity.map((item: any) => ({
      accountId: item.accountId,
      accountCode: item.accountCode,
      accountName: item.accountName,
      balance: item.balance
    })),
    totalAssets,
    totalLiabilities,
    totalEquity
  };
}

/**
 * Get profit and loss report
 */
export async function getProfitLoss(startDate?: string, endDate?: string): Promise<ProfitLossReport> {
  const db = await getDb();
  
  // Build date filters
  let dateFilter = '';
  const params: any[] = [];
  
  if (startDate) {
    dateFilter += ' AND je.date >= ?';
    params.push(startDate);
  }
  
  if (endDate) {
    dateFilter += ' AND je.date <= ?';
    params.push(endDate);
  }
  
  // Get income
  const incomeQuery = `
    SELECT 
      a.id as accountId,
      a.code as accountCode,
      a.name as accountName,
      COALESCE(SUM(jl.credit) - SUM(jl.debit), 0) as balance
    FROM accounts a
    LEFT JOIN journal_lines jl ON a.id = jl.account_id
    LEFT JOIN journal_entries je ON jl.journal_entry_id = je.id
    WHERE a.type = 'Income'${dateFilter}
    GROUP BY a.id, a.code, a.name
    HAVING balance != 0
    ORDER BY a.code
  `;
  
  const income = await db.all(incomeQuery, ...params);
  
  // Get expenses
  const expensesQuery = `
    SELECT 
      a.id as accountId,
      a.code as accountCode,
      a.name as accountName,
      COALESCE(SUM(jl.debit) - SUM(jl.credit), 0) as balance
    FROM accounts a
    LEFT JOIN journal_lines jl ON a.id = jl.account_id
    LEFT JOIN journal_entries je ON jl.journal_entry_id = je.id
    WHERE a.type = 'Expense'${dateFilter}
    GROUP BY a.id, a.code, a.name
    HAVING balance != 0
    ORDER BY a.code
  `;
  
  const expenses = await db.all(expensesQuery, ...params);
  
  // Calculate totals
  const totalIncome = income.reduce((sum: number, item: any) => sum + item.balance, 0);
  const totalExpenses = expenses.reduce((sum: number, item: any) => sum + item.balance, 0);
  const netProfit = totalIncome - totalExpenses;
  
  return {
    income: income.map((item: any) => ({
      accountId: item.accountId,
      accountCode: item.accountCode,
      accountName: item.accountName,
      balance: item.balance
    })),
    expenses: expenses.map((item: any) => ({
      accountId: item.accountId,
      accountCode: item.accountCode,
      accountName: item.accountName,
      balance: item.balance
    })),
    totalIncome,
    totalExpenses,
    netProfit
  };
}