"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("../db/connection");
const fs_1 = require("fs");
const path_1 = require("path");
// Use a temporary file-based database for tests
const testDbFile = (0, path_1.join)(process.cwd(), 'test_accounting.db');
process.env.DATABASE_FILE = testDbFile;
// Clean up before each test to ensure fresh state
beforeEach(async () => {
    await (0, connection_1.closeDatabaseConnection)();
    // Remove test database file if it exists
    if ((0, fs_1.existsSync)(testDbFile)) {
        (0, fs_1.unlinkSync)(testDbFile);
    }
});
afterEach(async () => {
    await (0, connection_1.closeDatabaseConnection)();
    // Clean up test database file
    if ((0, fs_1.existsSync)(testDbFile)) {
        (0, fs_1.unlinkSync)(testDbFile);
    }
});
// Final cleanup
afterAll(async () => {
    await (0, connection_1.closeDatabaseConnection)();
    if ((0, fs_1.existsSync)(testDbFile)) {
        (0, fs_1.unlinkSync)(testDbFile);
    }
});
//# sourceMappingURL=setup.js.map