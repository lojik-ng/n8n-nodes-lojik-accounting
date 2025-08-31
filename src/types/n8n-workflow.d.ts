// Type declarations for n8n-workflow to enable compilation
// These are minimal types needed for the tool implementation

declare module 'n8n-workflow' {
    export interface IDataObject {
        [key: string]: any;
    }

    export interface INodeExecutionData {
        json: IDataObject;
        binary?: { [key: string]: any };
    }

    export interface IExecuteFunctions {
        getInputData(): INodeExecutionData[];
        getNodeParameter(parameterName: string, itemIndex: number): any;
        getCredentials(type: string): Promise<IDataObject>;
        helpers: {
            returnJsonArray(jsonData: IDataObject[]): INodeExecutionData[];
        };
    }

    export interface INodeType {
        description: INodeTypeDescription;
        execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
    }

    export interface INodeTypeDescription {
        displayName: string;
        name: string;
        icon?: string;
        group: string[];
        version: number;
        subtitle?: string;
        description: string;
        defaults: {
            name: string;
        };
        inputs: string[];
        outputs: string[];
        credentials?: INodeCredential[];
        properties: INodeProperties[];
    }

    export interface INodeCredential {
        name: string;
        required: boolean;
    }

    export interface INodeProperties {
        displayName: string;
        name: string;
        type: string;
        required?: boolean;
        default?: any;
        description?: string;
        options?: Array<{ name: string; value: any; description?: string; action?: string }>;
        displayOptions?: {
            show?: { [key: string]: string[] };
            hide?: { [key: string]: string[] };
        };
        noDataExpression?: boolean;
    }

    export interface ICredentialType {
        name: string;
        displayName: string;
        documentationUrl?: string;
        properties: INodeProperties[];
        authenticate?: IAuthenticateGeneric;
    }

    export interface IAuthenticateGeneric {
        type: string;
        properties: IDataObject;
    }
}
