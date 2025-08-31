import type sqlite3 from 'sqlite3';
type Database = sqlite3.Database;
import { allAsync } from '../db/connection';
import type {
    Account,
    BalanceSheetReport,
    LedgerLine,
    LedgerReport,
    ProfitLossReport,
    TrialBalanceReport,
} from '../types/index';

export async function getTrialBalance(db: Database): Promise<TrialBalanceReport> {
    const rows = await allAsync<
        {
            id: number;
            code: string;
            name: string;
            type: Account['type'];
            parent_id: number | null;
            created_at: string;
            totalDebit: number;
            totalCredit: number;
        }
    >(
        db,
        `SELECT a.id, a.code, a.name, a.type, a.parent_id, a.created_at,
            IFNULL(SUM(l.debit), 0) AS totalDebit,
            IFNULL(SUM(l.credit), 0) AS totalCredit
     FROM accounts a
     LEFT JOIN journal_lines l ON l.account_id = a.id
     GROUP BY a.id
     ORDER BY a.code ASC`,
    );
    return {
        rows: rows.map((r) => ({
            account: {
                id: r.id,
                code: r.code,
                name: r.name,
                type: r.type,
                parent_id: r.parent_id,
                created_at: r.created_at,
            },
            totalDebit: r.totalDebit ?? 0,
            totalCredit: r.totalCredit ?? 0,
            net: (r.totalDebit ?? 0) - (r.totalCredit ?? 0),
        })),
    };
}

export async function getLedger(
    db: Database,
    input: { accountId: number; startDate?: string | undefined; endDate?: string | undefined; includeRunningBalance?: boolean | undefined },
): Promise<LedgerReport> {
    const account = (await allAsync<Account>(db, `SELECT * FROM accounts WHERE id = ?`, [
        input.accountId,
    ]))[0];
    if (!account) throw new Error('Account not found');

    const conditions: string[] = ['l.account_id = ?'];
    const params: unknown[] = [input.accountId];
    if (input.startDate) {
        conditions.push('e.date >= ?');
        params.push(input.startDate);
    }
    if (input.endDate) {
        conditions.push('e.date <= ?');
        params.push(input.endDate);
    }
    const where = `WHERE ${conditions.join(' AND ')}`;
    const rows = await allAsync<
        { line_id: number; journal_entry_id: number; debit: number; credit: number; date: string; description: string | null; reference: string | null; created_at: string }
    >(
        db,
        `SELECT l.id as line_id, l.journal_entry_id, l.debit, l.credit,
            e.date, e.description, e.reference, e.created_at
     FROM journal_lines l
     JOIN journal_entries e ON e.id = l.journal_entry_id
     ${where}
     ORDER BY e.date DESC, e.id DESC, l.id DESC`,
        params,
    );

    let running = 0;
    const lines: LedgerLine[] = rows.map((r) => {
        running += (r.debit ?? 0) - (r.credit ?? 0);
        return {
            line: {
                id: r.line_id,
                journal_entry_id: r.journal_entry_id,
                account_id: input.accountId,
                debit: r.debit ?? 0,
                credit: r.credit ?? 0,
            },
            entry: {
                id: r.journal_entry_id,
                date: r.date,
                description: r.description,
                reference: r.reference,
                created_at: r.created_at,
            },
            ...(input.includeRunningBalance ? { runningBalance: running } : {}),
        };
    });

    return { account, lines };
}

export async function getBalanceSheet(db: Database): Promise<BalanceSheetReport> {
    const tb = await getTrialBalance(db);
    const pickWithSubtotals = (type: Account['type']) => {
        const accounts = tb.rows
            .filter((r) => r.account.type === type)
            .map((r) => ({ account: r.account, totalDebit: r.totalDebit, totalCredit: r.totalCredit, net: r.net }));
        const parentIdToSubtotal = new Map<number, { parent: Account; totalDebit: number; totalCredit: number; net: number }>();
        for (const row of accounts) {
            const parentId = row.account.parent_id ?? undefined;
            if (parentId === undefined) continue;
            const existing = parentIdToSubtotal.get(parentId);
            if (!existing) {
                const parentAccount = tb.rows.find((r) => r.account.id === parentId)?.account ?? {
                    id: parentId,
                    code: '',
                    name: 'Subtotal',
                    type: row.account.type,
                    parent_id: null,
                    created_at: '',
                } as Account;
                parentIdToSubtotal.set(parentId, {
                    parent: parentAccount,
                    totalDebit: row.totalDebit,
                    totalCredit: row.totalCredit,
                    net: row.net,
                });
            } else {
                existing.totalDebit += row.totalDebit;
                existing.totalCredit += row.totalCredit;
                existing.net += row.net;
            }
        }
        const parentSubtotals = Array.from(parentIdToSubtotal.values());
        return { type: type as 'Asset' | 'Liability' | 'Equity', accounts, parentSubtotals };
    };
    return {
        assets: pickWithSubtotals('Asset'),
        liabilities: pickWithSubtotals('Liability'),
        equity: pickWithSubtotals('Equity'),
    };
}

export async function getProfitLoss(
    db: Database,
    input?: { startDate?: string | undefined; endDate?: string | undefined },
): Promise<ProfitLossReport> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (input?.startDate) {
        conditions.push('e.date >= ?');
        params.push(input.startDate);
    }
    if (input?.endDate) {
        conditions.push('e.date <= ?');
        params.push(input.endDate);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = await allAsync<{
        id: number;
        code: string;
        name: string;
        type: Account['type'];
        totalDebit: number;
        totalCredit: number;
    }>(
        db,
        `SELECT a.id, a.code, a.name, a.type,
            IFNULL(SUM(l.debit),0) as totalDebit,
            IFNULL(SUM(l.credit),0) as totalCredit
     FROM accounts a
     LEFT JOIN journal_lines l ON l.account_id = a.id
     LEFT JOIN journal_entries e ON e.id = l.journal_entry_id
     WHERE a.type IN ('Income','Expense')
     ${where ? 'AND ' + where.replace(/^WHERE\s+/, '') : ''}
     GROUP BY a.id
     ORDER BY a.code ASC`,
    );

    const income = rows.filter((r) => r.type === 'Income');
    const expenses = rows.filter((r) => r.type === 'Expense');

    const incomeNet = income.reduce((acc, r) => acc + (r.totalCredit - r.totalDebit), 0);
    const expenseNet = expenses.reduce((acc, r) => acc + (r.totalDebit - r.totalCredit), 0);

    return {
        income: {
            type: 'Income',
            accounts: income.map((r) => ({
                account: { id: r.id, code: r.code, name: r.name, type: r.type, parent_id: null, created_at: '' },
                totalDebit: r.totalDebit,
                totalCredit: r.totalCredit,
                net: r.totalDebit - r.totalCredit,
            })),
        },
        expenses: {
            type: 'Expense',
            accounts: expenses.map((r) => ({
                account: { id: r.id, code: r.code, name: r.name, type: r.type, parent_id: null, created_at: '' },
                totalDebit: r.totalDebit,
                totalCredit: r.totalCredit,
                net: r.totalDebit - r.totalCredit,
            })),
        },
        netIncome: incomeNet - expenseNet,
    };
}


