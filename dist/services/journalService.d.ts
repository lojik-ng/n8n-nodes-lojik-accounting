import type { JournalEntry, JournalEntryWithLines, ActionResult } from '../types/index';
import type { CreateJournalEntryInput, DeleteJournalEntryInput, GetJournalEntryByIdInput, SearchJournalEntriesInput } from '../validation/schemas';
/**
 * Create a journal entry with its lines
 */
export declare function createJournalEntry(input: CreateJournalEntryInput): Promise<ActionResult<JournalEntryWithLines>>;
/**
 * Delete a journal entry and all its lines
 */
export declare function deleteJournalEntry(input: DeleteJournalEntryInput): Promise<ActionResult<{
    deleted: true;
}>>;
/**
 * Get journal entry by ID with its lines
 */
export declare function getJournalEntryById(input: GetJournalEntryByIdInput): Promise<ActionResult<JournalEntryWithLines>>;
/**
 * Search journal entries by criteria
 */
export declare function searchJournalEntries(input: SearchJournalEntriesInput): Promise<ActionResult<JournalEntry[]>>;
/**
 * Close period through a specific date
 */
export declare function closePeriod(throughDate: string): Promise<ActionResult<{
    locked: true;
}>>;
//# sourceMappingURL=journalService.d.ts.map