import { LojikAccountingTool } from './tool/LojikAccountingTool';
import { LojikAccountingApi } from './tool/LojikAccountingApi.credentials';

// Export main classes
module.exports = {
    LojikAccountingTool,
    LojikAccountingApi,
};

// Also support named exports
module.exports.LojikAccountingTool = LojikAccountingTool;
module.exports.LojikAccountingApi = LojikAccountingApi;
