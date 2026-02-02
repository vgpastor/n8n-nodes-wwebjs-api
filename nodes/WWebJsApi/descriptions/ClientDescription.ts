import type { INodeProperties } from 'n8n-workflow';

export const clientOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['client'] } },
		options: [
			{ name: 'Archive Chat', value: 'archiveChat', description: 'Archive a chat', action: 'Archive a chat' },
			{ name: 'Get Blocked Contacts', value: 'getBlockedContacts', description: 'Get all blocked contacts', action: 'Get blocked contacts' },
			{ name: 'Get Chat By ID', value: 'getChatById', description: 'Get a specific chat by its ID', action: 'Get chat by ID' },
			{ name: 'Get Chats', value: 'getChats', description: 'Get all current chats', action: 'Get all chats' },
			{ name: 'Get Connection State', value: 'getState', description: 'Get the current connection state', action: 'Get connection state' },
			{ name: 'Get Contact By ID', value: 'getContactById', description: 'Get a specific contact by ID', action: 'Get contact by ID' },
			{ name: 'Get Contacts', value: 'getContacts', description: 'Get all current contacts', action: 'Get all contacts' },
			{ name: 'Get Number ID', value: 'getNumberId', description: 'Get the registered WhatsApp ID for a number', action: 'Get number ID' },
			{ name: 'Get Profile Picture URL', value: 'getProfilePicUrl', description: 'Get the profile picture URL of a contact', action: 'Get profile picture URL' },
			{ name: 'Is Registered User', value: 'isRegisteredUser', description: 'Check if a number is registered on WhatsApp', action: 'Check if user is registered' },
			{ name: 'Mute Chat', value: 'muteChat', description: 'Mute a chat', action: 'Mute a chat' },
			{ name: 'Pin Chat', value: 'pinChat', description: 'Pin a chat', action: 'Pin a chat' },
			{ name: 'Search Messages', value: 'searchMessages', description: 'Search for messages across chats', action: 'Search messages' },
			{ name: 'Send Message', value: 'sendMessage', description: 'Send a message to a chat', action: 'Send a message' },
			{ name: 'Send Seen', value: 'sendSeen', description: 'Mark a chat as seen', action: 'Send seen status' },
			{ name: 'Set Status', value: 'setStatus', description: 'Set the current user status message', action: 'Set status message' },
			{ name: 'Unarchive Chat', value: 'unarchiveChat', description: 'Unarchive a chat', action: 'Unarchive a chat' },
			{ name: 'Unmute Chat', value: 'unmuteChat', description: 'Unmute a chat', action: 'Unmute a chat' },
			{ name: 'Unpin Chat', value: 'unpinChat', description: 'Unpin a chat', action: 'Unpin a chat' },
		],
		default: 'sendMessage',
	},
];

export const clientFields: INodeProperties[] = [
	// ── Session ID (all client operations) ──
	{
		displayName: 'Session ID',
		name: 'sessionId',
		type: 'string',
		required: true,
		default: '',
		description: 'Session identifier. Falls back to credentials default if empty.',
		displayOptions: { show: { resource: ['client'] } },
	},

	// ══════════════════════════════════════════════════════════════════
	// Chat ID - Consolidated field for all chat-related operations
	// ══════════════════════════════════════════════════════════════════
	{
		displayName: 'Chat ID',
		name: 'chatId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '34612345678@c.us',
		description: 'The chat ID. Use number@c.us for individuals or number@g.us for groups.',
		displayOptions: {
			show: {
				resource: ['client'],
				operation: [
					'sendMessage',
					'getChatById',
					'archiveChat',
					'unarchiveChat',
					'muteChat',
					'unmuteChat',
					'pinChat',
					'unpinChat',
					'sendSeen',
				],
			},
		},
	},

	// ══════════════════════════════════════════════════════════════════
	// Send Message Fields
	// ══════════════════════════════════════════════════════════════════
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
			{ name: 'Poll', value: 'Poll' },
		],
		default: 'string',
		description: 'The type of message content to send',
		displayOptions: { show: { resource: ['client'], operation: ['sendMessage'] } },
	},
	{
		displayName: 'Message Text',
		name: 'content',
		type: 'string',
		typeOptions: { rows: 4 },
		required: true,
		default: '',
		description: 'The text content of the message',
		displayOptions: { show: { resource: ['client'], operation: ['sendMessage'], contentType: ['string'] } },
	},
	{
		displayName: 'Content (JSON)',
		name: 'contentJson',
		type: 'json',
		required: true,
		default: '{}',
		description: 'The content object (media, location, contact, or poll). See API docs for the expected structure.',
		displayOptions: {
			show: {
				resource: ['client'],
				operation: ['sendMessage'],
				contentType: ['MessageMedia', 'MessageMediaFromURL', 'Location', 'Contact', 'Poll'],
			},
		},
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['client'], operation: ['sendMessage'] } },
		options: [
			{
				displayName: 'Quote Message ID',
				name: 'quotedMessageId',
				type: 'string',
				default: '',
				description: 'Message ID to quote/reply to',
			},
			{
				displayName: 'Mentions',
				name: 'mentions',
				type: 'string',
				default: '',
				description: 'Comma-separated list of contact IDs to mention',
			},
			{
				displayName: 'Send As Seen',
				name: 'sendSeen',
				type: 'boolean',
				default: false,
				description: 'Whether to mark the chat as seen after sending',
			},
		],
	},

	// ══════════════════════════════════════════════════════════════════
	// Mute Chat Options
	// ══════════════════════════════════════════════════════════════════
	{
		displayName: 'Unmute Date',
		name: 'unmuteDate',
		type: 'string',
		default: '',
		placeholder: '1733489397',
		description: 'Unix timestamp when the chat will be unmuted. Leave empty to mute forever.',
		displayOptions: { show: { resource: ['client'], operation: ['muteChat'] } },
	},

	// ══════════════════════════════════════════════════════════════════
	// Contact / Number Operations
	// ══════════════════════════════════════════════════════════════════
	{
		displayName: 'Phone Number',
		name: 'number',
		type: 'string',
		required: true,
		default: '',
		placeholder: '34612345678',
		description: 'Phone number in international format (without + sign). @c.us is appended automatically.',
		displayOptions: { show: { resource: ['client'], operation: ['isRegisteredUser', 'getNumberId'] } },
	},
	{
		displayName: 'Contact ID',
		name: 'contactId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '34612345678@c.us',
		displayOptions: { show: { resource: ['client'], operation: ['getContactById', 'getProfilePicUrl'] } },
	},

	// ══════════════════════════════════════════════════════════════════
	// Search Messages
	// ══════════════════════════════════════════════════════════════════
	{
		displayName: 'Search Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		description: 'The text to search for in messages',
		displayOptions: { show: { resource: ['client'], operation: ['searchMessages'] } },
	},
	{
		displayName: 'Search Options',
		name: 'searchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['client'], operation: ['searchMessages'] } },
		options: [
			{ displayName: 'Limit', name: 'limit', type: 'number', default: 10, description: 'Maximum number of results' },
			{ displayName: 'Page', name: 'page', type: 'number', default: 1, description: 'Page number for pagination' },
		],
	},

	// ══════════════════════════════════════════════════════════════════
	// Set Status
	// ══════════════════════════════════════════════════════════════════
	{
		displayName: 'Status Text',
		name: 'status',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Available',
		displayOptions: { show: { resource: ['client'], operation: ['setStatus'] } },
	},
];
