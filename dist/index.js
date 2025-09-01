"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LojikAccountingTool_1 = require("./tool/LojikAccountingTool");
const LojikAccountingApi_credentials_1 = require("./tool/LojikAccountingApi.credentials");
// Export main classes
module.exports = {
    LojikAccountingTool: LojikAccountingTool_1.LojikAccountingTool,
    LojikAccountingApi: LojikAccountingApi_credentials_1.LojikAccountingApi,
};
// Also support named exports
module.exports.LojikAccountingTool = LojikAccountingTool_1.LojikAccountingTool;
module.exports.LojikAccountingApi = LojikAccountingApi_credentials_1.LojikAccountingApi;
//# sourceMappingURL=index.js.map