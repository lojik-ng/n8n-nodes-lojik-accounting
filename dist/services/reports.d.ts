import type sqlite3 from 'sqlite3';
type Database = sqlite3.Database;
import type { BalanceSheetReport, LedgerReport, ProfitLossReport, TrialBalanceReport } from '../types/index.js';
export declare function getTrialBalance(db: Database): Promise<TrialBalanceReport>;
export declare function getLedger(db: Database, input: {
    accountId: number;
    startDate?: string | undefined;
    endDate?: string | undefined;
    includeRunningBalance?: boolean | undefined;
}): Promise<LedgerReport>;
export declare function getBalanceSheet(db: Database): Promise<BalanceSheetReport>;
export declare function getProfitLoss(db: Database, input?: {
    startDate?: string | undefined;
    endDate?: string | undefined;
}): Promise<ProfitLossReport>;
export {};
