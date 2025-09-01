import { closeDatabaseConnection } from '../db/connection.js';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
// Use a temporary file-based database for tests
const testDbFile = join(process.cwd(), 'test_accounting.db');
process.env.DATABASE_FILE = testDbFile;
// Clean up before each test to ensure fresh state
beforeEach(async () => {
    await closeDatabaseConnection();
    // Remove test database file if it exists
    if (existsSync(testDbFile)) {
        unlinkSync(testDbFile);
    }
});
afterEach(async () => {
    await closeDatabaseConnection();
    // Clean up test database file
    if (existsSync(testDbFile)) {
        unlinkSync(testDbFile);
    }
});
// Final cleanup
afterAll(async () => {
    await closeDatabaseConnection();
    if (existsSync(testDbFile)) {
        unlinkSync(testDbFile);
    }
});
//# sourceMappingURL=setup.js.map