import type { TrialBalanceReport, LedgerReport, BalanceSheetReport, ProfitLossReport, ActionResult } from '../types/index';
import type { GetTrialBalanceInput, GetLedgerInput, GetBalanceSheetInput, GetProfitLossInput } from '../validation/schemas';
/**
 * Get trial balance report
 */
export declare function getTrialBalance(input: GetTrialBalanceInput): Promise<ActionResult<TrialBalanceReport>>;
/**
 * Get ledger report for a specific account
 */
export declare function getLedger(input: GetLedgerInput): Promise<ActionResult<LedgerReport>>;
/**
 * Get balance sheet report
 */
export declare function getBalanceSheet(input: GetBalanceSheetInput): Promise<ActionResult<BalanceSheetReport>>;
/**
 * Get profit and loss report
 */
export declare function getProfitLoss(input: GetProfitLossInput): Promise<ActionResult<ProfitLossReport>>;
//# sourceMappingURL=reportingService.d.ts.map