import { DateTime } from 'luxon';
import { getQuery, getAllQuery } from '../db/connection';
import type {
    TrialBalanceReport,
    TrialBalanceItem,
    LedgerReport,
    LedgerItem,
    BalanceSheetReport,
    BalanceSheetSection,
    BalanceSheetItem,
    ProfitLossReport,
    ProfitLossSection,
    ProfitLossItem,
    ActionResult,
    AccountType,
} from '../types/index';
import type {
    GetTrialBalanceInput,
    GetLedgerInput,
    GetBalanceSheetInput,
    GetProfitLossInput,
} from '../validation/schemas';

/**
 * Get trial balance report
 */
export async function getTrialBalance(input: GetTrialBalanceInput): Promise<ActionResult<TrialBalanceReport>> {
    try {
        let sql = `
      SELECT 
        a.id as account_id,
        a.code as account_code,
        a.name as account_name,
        a.type as account_type,
        COALESCE(SUM(jl.debit), 0) as total_debit,
        COALESCE(SUM(jl.credit), 0) as total_credit
      FROM accounts a
      LEFT JOIN journal_lines jl ON a.id = jl.account_id
      LEFT JOIN journal_entries je ON jl.journal_entry_id = je.id
    `;

        const params: any[] = [];

        if (input.asOfDate) {
            sql += ' WHERE je.date <= ?';
            params.push(input.asOfDate);
        }

        sql += `
      GROUP BY a.id, a.code, a.name, a.type
      ORDER BY a.code
    `;

        const rows = await getAllQuery<any>(sql, params);

        const items: TrialBalanceItem[] = rows.map(row => ({
            accountId: row.account_id,
            accountCode: row.account_code,
            accountName: row.account_name,
            accountType: row.account_type as AccountType,
            totalDebit: Number(row.total_debit),
            totalCredit: Number(row.total_credit),
            net: Number(row.total_debit) - Number(row.total_credit),
        }));

        const totalDebits = items.reduce((sum, item) => sum + item.totalDebit, 0);
        const totalCredits = items.reduce((sum, item) => sum + item.totalCredit, 0);

        return {
            success: true,
            data: {
                items,
                totalDebits,
                totalCredits,
                difference: Math.round((totalDebits - totalCredits) * 100) / 100,
            },
        };
    } catch (error) {
        return {
            success: false,
            message: 'Failed to generate trial balance',
            details: error instanceof Error ? error.message : error,
        };
    }
}

/**
 * Get ledger report for a specific account
 */
export async function getLedger(input: GetLedgerInput): Promise<ActionResult<LedgerReport>> {
    try {
        // First, get account information
        const accountRow = await getQuery<any>(
            'SELECT * FROM accounts WHERE id = ?',
            [input.accountId]
        );

        if (!accountRow) {
            return {
                success: false,
                message: 'Account not found',
                details: { accountId: input.accountId },
            };
        }

        // Build query for ledger entries
        let sql = `
      SELECT 
        jl.id,
        je.date,
        je.description,
        je.reference,
        jl.debit,
        jl.credit,
        je.id as journal_entry_id
      FROM journal_lines jl
      JOIN journal_entries je ON jl.journal_entry_id = je.id
      WHERE jl.account_id = ?
    `;

        const params: any[] = [input.accountId];

        if (input.startDate) {
            sql += ' AND je.date >= ?';
            params.push(input.startDate);
        }

        if (input.endDate) {
            sql += ' AND je.date <= ?';
            params.push(input.endDate);
        }

        sql += ' ORDER BY je.date DESC, je.id DESC, jl.id DESC';

        const rows = await getAllQuery<any>(sql, params);

        // Calculate opening balance if start date is specified
        let openingBalance = 0;
        if (input.startDate) {
            const openingRow = await getQuery<any>(
                `
        SELECT 
          COALESCE(SUM(jl.debit), 0) - COALESCE(SUM(jl.credit), 0) as balance
        FROM journal_lines jl
        JOIN journal_entries je ON jl.journal_entry_id = je.id
        WHERE jl.account_id = ? AND je.date < ?
        `,
                [input.accountId, input.startDate]
            );
            openingBalance = Number(openingRow?.balance || 0);
        }

        const items: LedgerItem[] = [];
        let runningBalance = openingBalance;

        for (const row of rows.reverse()) { // Reverse to calculate running balance correctly
            const debit = Number(row.debit);
            const credit = Number(row.credit);
            runningBalance += debit - credit;

            const item: LedgerItem = {
                id: row.id,
                date: row.date,
                description: row.description,
                reference: row.reference,
                debit,
                credit,
                journalEntryId: row.journal_entry_id,
            };

            if (input.includeRunningBalance) {
                item.runningBalance = runningBalance;
            }

            items.push(item);
        }

        // Reverse items back to original order (newest first)
        items.reverse();

        const closingBalance = openingBalance + items.reduce((sum, item) => sum + item.debit - item.credit, 0);

        return {
            success: true,
            data: {
                accountId: input.accountId,
                accountCode: accountRow.code,
                accountName: accountRow.name,
                accountType: accountRow.type,
                startDate: input.startDate || undefined,
                endDate: input.endDate || undefined,
                items,
                openingBalance,
                closingBalance,
            },
        };
    } catch (error) {
        return {
            success: false,
            message: 'Failed to generate ledger report',
            details: error instanceof Error ? error.message : error,
        };
    }
}

/**
 * Get balance sheet report
 */
export async function getBalanceSheet(input: GetBalanceSheetInput): Promise<ActionResult<BalanceSheetReport>> {
    try {
        const asOfDate = input.asOfDate || DateTime.now().toISODate()!;

        let sql = `
      SELECT 
        a.id as account_id,
        a.code as account_code,
        a.name as account_name,
        a.type as account_type,
        a.parent_id,
        COALESCE(SUM(jl.debit), 0) - COALESCE(SUM(jl.credit), 0) as balance
      FROM accounts a
      LEFT JOIN journal_lines jl ON a.id = jl.account_id
      LEFT JOIN journal_entries je ON jl.journal_entry_id = je.id
      WHERE a.type IN ('Asset', 'Liability', 'Equity')
    `;

        const params: any[] = [];

        if (input.asOfDate) {
            sql += ' AND je.date <= ?';
            params.push(input.asOfDate);
        }

        sql += `
      GROUP BY a.id, a.code, a.name, a.type, a.parent_id
      ORDER BY a.type, a.code
    `;

        const rows = await getAllQuery<any>(sql, params);

        // Group by account type
        const assetItems: BalanceSheetItem[] = [];
        const liabilityItems: BalanceSheetItem[] = [];
        const equityItems: BalanceSheetItem[] = [];

        for (const row of rows) {
            const item: BalanceSheetItem = {
                accountId: row.account_id,
                accountCode: row.account_code,
                accountName: row.account_name,
                balance: Number(row.balance),
                parentId: row.parent_id,
            };

            switch (row.account_type) {
                case 'Asset':
                    assetItems.push(item);
                    break;
                case 'Liability':
                    liabilityItems.push(item);
                    break;
                case 'Equity':
                    equityItems.push(item);
                    break;
            }
        }

        const assetTotal = assetItems.reduce((sum, item) => sum + item.balance, 0);
        const liabilityTotal = liabilityItems.reduce((sum, item) => sum + item.balance, 0);
        const equityTotal = equityItems.reduce((sum, item) => sum + item.balance, 0);

        const totalLiabilitiesAndEquity = Math.abs(liabilityTotal) + Math.abs(equityTotal);

        return {
            success: true,
            data: {
                asOfDate,
                assets: {
                    type: 'Asset',
                    items: assetItems,
                    total: assetTotal,
                },
                liabilities: {
                    type: 'Liability',
                    items: liabilityItems,
                    total: Math.abs(liabilityTotal), // Show as positive
                },
                equity: {
                    type: 'Equity',
                    items: equityItems,
                    total: Math.abs(equityTotal), // Show as positive
                },
                totalAssets: assetTotal,
                totalLiabilitiesAndEquity,
                difference: Math.round((assetTotal - totalLiabilitiesAndEquity) * 100) / 100,
            },
        };
    } catch (error) {
        return {
            success: false,
            message: 'Failed to generate balance sheet',
            details: error instanceof Error ? error.message : error,
        };
    }
}

/**
 * Get profit and loss report
 */
export async function getProfitLoss(input: GetProfitLossInput): Promise<ActionResult<ProfitLossReport>> {
    try {
        let sql = `
      SELECT 
        a.id as account_id,
        a.code as account_code,
        a.name as account_name,
        a.type as account_type,
        a.parent_id,
        COALESCE(SUM(jl.credit), 0) - COALESCE(SUM(jl.debit), 0) as amount
      FROM accounts a
      LEFT JOIN journal_lines jl ON a.id = jl.account_id
      LEFT JOIN journal_entries je ON jl.journal_entry_id = je.id
      WHERE a.type IN ('Income', 'Expense')
        AND je.date >= ? AND je.date <= ?
      GROUP BY a.id, a.code, a.name, a.type, a.parent_id
      ORDER BY a.type, a.code
    `;

        const rows = await getAllQuery<any>(sql, [input.startDate, input.endDate]);

        // Group by account type
        const incomeItems: ProfitLossItem[] = [];
        const expenseItems: ProfitLossItem[] = [];

        for (const row of rows) {
            const amount = Number(row.amount);

            const item: ProfitLossItem = {
                accountId: row.account_id,
                accountCode: row.account_code,
                accountName: row.account_name,
                amount: Math.abs(amount), // Show as positive amounts
                parentId: row.parent_id,
            };

            switch (row.account_type) {
                case 'Income':
                    if (amount !== 0) incomeItems.push(item);
                    break;
                case 'Expense':
                    if (amount !== 0) expenseItems.push(item);
                    break;
            }
        }

        const grossIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0);
        const totalExpenses = expenseItems.reduce((sum, item) => sum + item.amount, 0);
        const netIncome = grossIncome - totalExpenses;

        return {
            success: true,
            data: {
                startDate: input.startDate,
                endDate: input.endDate,
                income: {
                    type: 'Income',
                    items: incomeItems,
                    total: grossIncome,
                },
                expenses: {
                    type: 'Expense',
                    items: expenseItems,
                    total: totalExpenses,
                },
                grossIncome,
                totalExpenses,
                netIncome,
            },
        };
    } catch (error) {
        return {
            success: false,
            message: 'Failed to generate profit and loss report',
            details: error instanceof Error ? error.message : error,
        };
    }
}
