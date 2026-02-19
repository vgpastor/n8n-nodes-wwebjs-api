import type { INodeProperties } from 'n8n-workflow';

export const messageOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['message'] } },
		options: [
			{ name: 'Delete', value: 'delete', description: 'Delete a message', action: 'Delete a message' },
			{ name: 'Download Media', value: 'downloadMedia', description: 'Download media attached to a message', action: 'Download message media' },
			{ name: 'Edit', value: 'edit', description: 'Edit a sent message', action: 'Edit a message' },
			{ name: 'Forward', value: 'forward', description: 'Forward a message to another chat', action: 'Forward a message' },
			{ name: 'Get Info', value: 'getInfo', description: 'Get message details and delivery info', action: 'Get message info' },
			{ name: 'React', value: 'react', description: 'React to a message with an emoji', action: 'React to a message' },
			{ name: 'Reply', value: 'reply', description: 'Send a reply to a specific message', action: 'Reply to a message' },
			{ name: 'Star', value: 'star', description: 'Star a message', action: 'Star a message' },
			{ name: 'Unstar', value: 'unstar', description: 'Remove star from a message', action: 'Unstar a message' },
		],
		default: 'reply',
	},
];

export const messageFields: INodeProperties[] = [
	// ── Session ID ──
	{
		displayName: 'Session ID',
		name: 'sessionId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getSessions' },
		required: true,
		default: '',
		description: 'Session identifier. Select from the list or use an expression. Falls back to credentials default if empty.',
		displayOptions: { show: { resource: ['message'] } },
	},

	// ── Chat ID + Message ID (most operations) ──
	{
		displayName: 'Chat ID',
		name: 'chatId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '34612345678@c.us',
		description: 'The chat ID that contains the message',
		displayOptions: { show: { resource: ['message'] } },
	},
	{
		displayName: 'Message ID',
		name: 'messageId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'true_34612345678@c.us_ABCDEF999',
		description: 'Unique WhatsApp identifier for the message',
		displayOptions: { show: { resource: ['message'] } },
	},

	// ── Reply ──
	{
		displayName: 'Content Type',
		name: 'contentType',
		type: 'options',
		options: [
			{ name: 'Text', value: 'string' },
			{ name: 'Media (Base64)', value: 'MessageMedia' },
			{ name: 'Media (URL)', value: 'MessageMediaFromURL' },
			{ name: 'Location', value: 'Location' },
			{ name: 'Contact (vCard)', value: 'Contact' },
		],
		default: 'string',
		description: 'The type of reply content to send',
		displayOptions: { show: { resource: ['message'], operation: ['reply'] } },
	},
	{
		displayName: 'Reply Text',
		name: 'content',
		type: 'string',
		typeOptions: { rows: 3 },
		required: true,
		default: '',
		description: 'The text content of the reply',
		displayOptions: { show: { resource: ['message'], operation: ['reply'], contentType: ['string'] } },
	},
	{
		displayName: 'Content (JSON)',
		name: 'contentJson',
		type: 'json',
		required: true,
		default: '{}',
		description: 'The content object (media, location, or contact). See API docs for the expected JSON structure.',
		displayOptions: {
			show: {
				resource: ['message'],
				operation: ['reply'],
				contentType: ['MessageMedia', 'MessageMediaFromURL', 'Location', 'Contact'],
			},
		},
	},

	// ── React ──
	{
		displayName: 'Reaction Emoji',
		name: 'reaction',
		type: 'string',
		required: true,
		default: '👍',
		description: 'Emoji to react with. Send empty string to remove the reaction.',
		displayOptions: { show: { resource: ['message'], operation: ['react'] } },
	},

	// ── Forward ──
	{
		displayName: 'Destination Chat ID',
		name: 'destinationChatId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '34698765432@c.us',
		description: 'The chat ID to forward the message to',
		displayOptions: { show: { resource: ['message'], operation: ['forward'] } },
	},

	// ── Edit ──
	{
		displayName: 'New Content',
		name: 'editContent',
		type: 'string',
		typeOptions: { rows: 3 },
		required: true,
		default: '',
		description: 'The new text content for the message',
		displayOptions: { show: { resource: ['message'], operation: ['edit'] } },
	},

	// ── Delete ──
	{
		displayName: 'Delete For Everyone',
		name: 'everyone',
		type: 'boolean',
		default: false,
		description: 'Whether to delete the message for everyone in the chat',
		displayOptions: { show: { resource: ['message'], operation: ['delete'] } },
	},
];
