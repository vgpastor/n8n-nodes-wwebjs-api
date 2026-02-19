import type { INodeProperties } from 'n8n-workflow';

export const channelOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['channel'] } },
		options: [
			{ name: 'Create', value: 'create', description: 'Create a new channel', action: 'Create a channel' },
			{ name: 'Delete', value: 'delete', description: 'Delete a channel you own', action: 'Delete a channel' },
			{ name: 'Fetch Messages', value: 'fetchMessages', description: 'Load messages from a channel', action: 'Fetch channel messages' },
			{ name: 'Get All', value: 'getAll', description: 'Get all subscribed channels', action: 'Get all channels' },
			{ name: 'Get Info', value: 'getInfo', description: 'Get channel details', action: 'Get channel info' },
			{ name: 'Search', value: 'search', description: 'Search for public channels', action: 'Search channels' },
			{ name: 'Send Message', value: 'sendMessage', description: 'Send a message to a channel', action: 'Send channel message' },
			{ name: 'Subscribe', value: 'subscribe', description: 'Subscribe to a channel', action: 'Subscribe to channel' },
			{ name: 'Unsubscribe', value: 'unsubscribe', description: 'Unsubscribe from a channel', action: 'Unsubscribe from channel' },
		],
		default: 'getAll',
	},
];

export const channelFields: INodeProperties[] = [
	// ── Session ID ──
	{
		displayName: 'Session ID',
		name: 'sessionId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getSessions' },
		required: true,
		default: '',
		description: 'Session identifier. Select from the list or use an expression. Falls back to credentials default if empty.',
		displayOptions: { show: { resource: ['channel'] } },
	},

	// ── Channel ID (most operations) ──
	{
		displayName: 'Channel ID',
		name: 'chatId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '120363XXXXXXXXX@newsletter',
		description: 'Unique WhatsApp identifier for the channel',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['getInfo', 'sendMessage', 'fetchMessages', 'subscribe', 'unsubscribe', 'delete'],
			},
		},
	},

	// ── Send Message ──
	{
		displayName: 'Content Type',
		name: 'contentType',
		type: 'options',
		options: [
			{ name: 'Text', value: 'string' },
			{ name: 'Media (Base64)', value: 'MessageMedia' },
			{ name: 'Media (URL)', value: 'MessageMediaFromURL' },
		],
		default: 'string',
		description: 'The type of message content to send to the channel',
		displayOptions: { show: { resource: ['channel'], operation: ['sendMessage'] } },
	},
	{
		displayName: 'Message Text',
		name: 'content',
		type: 'string',
		typeOptions: { rows: 3 },
		required: true,
		default: '',
		description: 'The text content of the channel message',
		displayOptions: { show: { resource: ['channel'], operation: ['sendMessage'], contentType: ['string'] } },
	},
	{
		displayName: 'Content (JSON)',
		name: 'contentJson',
		type: 'json',
		required: true,
		default: '{}',
		description: 'The media content object. See API docs for the expected JSON structure.',
		displayOptions: {
			show: {
				resource: ['channel'],
				operation: ['sendMessage'],
				contentType: ['MessageMedia', 'MessageMediaFromURL'],
			},
		},
	},

	// ── Create Channel ──
	{
		displayName: 'Channel Name',
		name: 'channelName',
		type: 'string',
		required: true,
		default: '',
		description: 'The name for the new channel',
		displayOptions: { show: { resource: ['channel'], operation: ['create'] } },
	},
	{
		displayName: 'Channel Description',
		name: 'channelDescription',
		type: 'string',
		typeOptions: { rows: 3 },
		default: '',
		description: 'Optional description for the new channel',
		displayOptions: { show: { resource: ['channel'], operation: ['create'] } },
	},

	// ── Search ──
	{
		displayName: 'Search Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		description: 'Text to search for in public channel names and descriptions',
		displayOptions: { show: { resource: ['channel'], operation: ['search'] } },
	},
];
