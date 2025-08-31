export class LojikAccountingApi {
    name = 'lojikAccountingApi';
    displayName = 'Lojik Accounting';
    documentationUrl = 'https://github.com/lojik-ai/n8n-nodes-lojik-accounting';
    properties = [
        {
            displayName: 'Database File Name',
            name: 'databaseFileName',
            type: 'string',
            default: 'accounting.db',
            required: true,
            description: 'SQLite database file name (stored in the package root)',
        },
        {
            displayName: 'Display Date Format',
            name: 'displayDateFormat',
            type: 'string',
            default: 'yyyy-LL-dd',
            required: false,
            description: 'Luxon format string for displaying dates',
        },
        {
            displayName: 'Currency Symbol',
            name: 'currencySymbol',
            type: 'string',
            default: '₦',
            required: false,
            description: 'Symbol to use for currency display',
        },
        {
            displayName: 'Timezone',
            name: 'timezone',
            type: 'string',
            default: 'UTC+1',
            required: false,
            description: 'IANA timezone string',
        },
    ];
}
//# sourceMappingURL=LojikAccounting.credentials.js.map