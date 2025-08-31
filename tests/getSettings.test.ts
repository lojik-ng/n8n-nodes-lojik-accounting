import { createTool } from '../src/tool/tool.js';

describe('Settings', () => {
  test('returns defaults when not supplied', async () => {
    const tool = createTool({ databaseFileName: 'ignored.sqlite' });
    const res = await tool.getSettings();
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.displayDateFormat).toBe('yyyy-LL-dd');
      expect(res.data.currencySymbol).toBe('₦');
      expect(res.data.timezone).toBe('UTC+1');
    }
  });
});
