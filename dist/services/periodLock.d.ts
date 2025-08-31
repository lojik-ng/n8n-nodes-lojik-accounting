import type sqlite3 from 'sqlite3';
type Database = sqlite3.Database;
export declare function setPeriodLock(db: Database, throughDate: string): Promise<void>;
export declare function getPeriodLock(db: Database): Promise<string | undefined>;
export declare function assertNotLocked(db: Database, date: string): Promise<void>;
export {};
