import path from 'node:path';
import { unlinkSync } from 'node:fs';

export function tmpDbPath(prefix: string) {
    return path.join(process.cwd(), `${prefix}-${Date.now()}-${Math.random()}.sqlite`);
}

export function setTmpDb(prefix: string) {
    const p = tmpDbPath(prefix);
    process.env.DATABASE_FILE = p;
    return p;
}

export function cleanupDb(p?: string) {
    if (!p) return;
    try {
        unlinkSync(p);
    } catch { }
}


