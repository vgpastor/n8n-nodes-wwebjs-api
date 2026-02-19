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
			{ name: 'Restart', value: 'restart', description: 'Restart a session', action: 'Restart a session' },
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
				operation: ['start', 'stop', 'getStatus', 'getQrCode', 'getQrImage', 'restart', 'terminate'],
			},
		},
	},
];
