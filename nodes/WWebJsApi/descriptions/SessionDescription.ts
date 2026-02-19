import type { INodeProperties } from 'n8n-workflow';

export const sessionOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['session'] } },
		options: [
			{ name: 'Get All Sessions', value: 'getSessions', description: 'List all active sessions', action: 'List all sessions' },
			{ name: 'Get QR Code', value: 'getQrCode', description: 'Get the QR code string for a session', action: 'Get QR code for a session' },
			{ name: 'Get QR Image', value: 'getQrImage', description: 'Get the QR code as a PNG image', action: 'Get QR image for a session' },
			{ name: 'Get Status', value: 'getStatus', description: 'Get the status of a session', action: 'Get session status' },
			{ name: 'Get Webhook', value: 'getWebhook', description: 'Get the current webhook URL and source for a session', action: 'Get session webhook' },
			{ name: 'Restart', value: 'restart', description: 'Restart a session', action: 'Restart a session' },
			{ name: 'Set Webhook', value: 'setWebhook', description: 'Set or update the webhook URL for an active session at runtime', action: 'Set session webhook' },
			{ name: 'Start', value: 'start', description: 'Start a new session', action: 'Start a session' },
			{ name: 'Stop', value: 'stop', description: 'Stop a session', action: 'Stop a session' },
			{ name: 'Terminate', value: 'terminate', description: 'Terminate a session and delete its data', action: 'Terminate a session' },
			{ name: 'Terminate All', value: 'terminateAll', description: 'Terminate all sessions', action: 'Terminate all sessions' },
			{ name: 'Terminate Inactive', value: 'terminateInactive', description: 'Terminate all inactive sessions', action: 'Terminate inactive sessions' },
		],
		default: 'getStatus',
	},
];

export const sessionFields: INodeProperties[] = [
	// Session ID — required for operations that target a specific session
	{
		displayName: 'Session ID',
		name: 'sessionId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getSessions' },
		required: true,
		default: '',
		description: 'Unique identifier for the session. Select from the list or switch to expression mode to enter a custom ID. Falls back to the default from credentials if empty.',
		displayOptions: {
			show: {
				resource: ['session'],
				operation: ['start', 'stop', 'getStatus', 'getQrCode', 'getQrImage', 'restart', 'terminate', 'setWebhook', 'getWebhook'],
			},
		},
	},
	// Webhook URL — optional for start, required for setWebhook
	{
		displayName: 'Webhook URL',
		name: 'webhookUrl',
		type: 'string',
		default: '',
		placeholder: 'https://your-n8n.com/webhook/abc123',
		description: 'The URL where wwebjs-api will send webhook events for this session. Overrides BASE_WEBHOOK_URL and per-session env vars. Requires wwebjs-api v1.35+ with dynamic webhook support.',
		displayOptions: {
			show: {
				resource: ['session'],
				operation: ['setWebhook'],
			},
		},
		required: true,
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['session'],
				operation: ['start'],
			},
		},
		options: [
			{
				displayName: 'Webhook URL',
				name: 'webhookUrl',
				type: 'string',
				default: '',
				placeholder: 'https://your-n8n.com/webhook/abc123',
				description: 'Optional webhook URL for this session. Events will be sent here instead of the global BASE_WEBHOOK_URL. Requires wwebjs-api v1.35+ with dynamic webhook support.',
			},
		],
	},
];
