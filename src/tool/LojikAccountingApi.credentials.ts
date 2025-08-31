import type { IAuthenticateGeneric, ICredentialType, INodeProperties } from 'n8n-workflow';

export class LojikAccountingApi implements ICredentialType {
    name = 'lojikAccountingApi';
    displayName = 'Lojik Accounting';
    documentationUrl = 'https://github.com/lojik/n8n-nodes-lojik-accounting';
    properties: INodeProperties[] = [
        {
            displayName: 'Database File Name',
            name: 'databaseFileName',
            type: 'string',
            default: 'accounting.db',
            required: true,
            description: 'Name of the SQLite database file (will be created in the tool package directory)',
        },
        {
            displayName: 'Display Date Format',
            name: 'displayDateFormat',
            type: 'string',
            default: 'yyyy-LL-dd',
            description: 'Luxon date format string for displaying dates (e.g., yyyy-LL-dd, dd/MM/yyyy)',
        },
        {
            displayName: 'Currency Symbol',
            name: 'currencySymbol',
            type: 'string',
            default: '₦',
            description: 'Currency symbol to use in reports and displays',
        },
        {
            displayName: 'Timezone',
            name: 'timezone',
            type: 'string',
            default: 'UTC+1',
            description: 'IANA timezone identifier (e.g., UTC+1, America/New_York, Europe/London)',
        },
    ];
}
