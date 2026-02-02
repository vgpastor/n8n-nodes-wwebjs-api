import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class WWebJsApiCredentials implements ICredentialType {
	name = 'wWebJsApi';
	displayName = 'WWebJS API';
	documentationUrl = 'https://github.com/avoylenko/wwebjs-api';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'http://localhost:3000',
			placeholder: 'http://localhost:3000',
			description: 'The base URL of your WWebJS API instance',
			required: true,
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'The API key configured in the API_KEY environment variable of your WWebJS API instance. Leave empty if not set.',
		},
		{
			displayName: 'Default Session ID',
			name: 'defaultSessionId',
			type: 'string',
			default: '',
			placeholder: 'my-session',
			description: 'Default session ID to use when not specified in the node. Alphanumeric and hyphens allowed.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-api-key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/ping',
			method: 'GET',
		},
	};
}
