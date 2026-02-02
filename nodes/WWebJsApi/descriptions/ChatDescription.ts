import type { INodeProperties } from 'n8n-workflow';

export const chatOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['chat'] } },
		options: [
			{ name: 'Clear Messages', value: 'clearMessages', description: 'Clear all messages from a chat', action: 'Clear chat messages' },
			{ name: 'Delete', value: 'delete', description: 'Delete a chat', action: 'Delete a chat' },
			{ name: 'Fetch Messages', value: 'fetchMessages', description: 'Load messages from a chat', action: 'Fetch chat messages' },
			{ name: 'Get Contact', value: 'getContact', description: 'Get the contact info for a chat', action: 'Get chat contact' },
			{ name: 'Get Info', value: 'getInfo', description: 'Get chat details', action: 'Get chat info' },
			{ name: 'Get Labels', value: 'getLabels', description: 'Get labels assigned to a chat', action: 'Get chat labels' },
			{ name: 'Mark Unread', value: 'markUnread', description: 'Mark a chat as unread', action: 'Mark chat unread' },
			{ name: 'Send Seen', value: 'sendSeen', description: 'Mark all messages in a chat as seen', action: 'Send seen to chat' },
			{ name: 'Send Typing State', value: 'sendStateTyping', description: 'Simulate typing indicator in a chat', action: 'Send typing state' },
			{ name: 'Send Recording State', value: 'sendStateRecording', description: 'Simulate audio recording indicator', action: 'Send recording state' },
		],
		default: 'fetchMessages',
	},
];

export const chatFields: INodeProperties[] = [
	// ── Session ID ──
	{
		displayName: 'Session ID',
		name: 'sessionId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['chat'] } },
	},

	// ── Chat ID (all operations) ──
	{
		displayName: 'Chat ID',
		name: 'chatId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '34612345678@c.us',
		description: 'Unique WhatsApp ID for the chat',
		displayOptions: { show: { resource: ['chat'] } },
	},

	// ── Fetch Messages options ──
	{
		displayName: 'Fetch Options',
		name: 'searchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['chat'], operation: ['fetchMessages'] } },
		options: [
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				description: 'Maximum number of messages to return',
			},
			{
				displayName: 'From Me Only',
				name: 'fromMe',
				type: 'boolean',
				default: false,
				description: 'Whether to return only messages sent by the current user',
			},
		],
	},
];
