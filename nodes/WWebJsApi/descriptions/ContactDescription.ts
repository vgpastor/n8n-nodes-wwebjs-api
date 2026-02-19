import type { INodeProperties } from 'n8n-workflow';

export const contactOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['contact'] } },
		options: [
			{ name: 'Block', value: 'block', description: 'Block a contact', action: 'Block a contact' },
			{ name: 'Get About', value: 'getAbout', description: 'Get the contact status/about text', action: 'Get contact about' },
			{ name: 'Get Chat', value: 'getChat', description: 'Get the chat associated with a contact', action: 'Get contact chat' },
			{ name: 'Get Common Groups', value: 'getCommonGroups', description: 'Get groups in common with a contact', action: 'Get common groups' },
			{ name: 'Get Info', value: 'getInfo', description: 'Get contact details', action: 'Get contact info' },
			{ name: 'Get Profile Picture', value: 'getProfilePicUrl', description: 'Get the contact profile picture URL', action: 'Get profile picture' },
			{ name: 'Unblock', value: 'unblock', description: 'Unblock a contact', action: 'Unblock a contact' },
		],
		default: 'getInfo',
	},
];

export const contactFields: INodeProperties[] = [
	// ── Session ID ──
	{
		displayName: 'Session ID',
		name: 'sessionId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getSessions' },
		required: true,
		default: '',
		description: 'Session identifier. Select from the list or use an expression. Falls back to credentials default if empty.',
		displayOptions: { show: { resource: ['contact'] } },
	},

	// ── Contact ID (all operations) ──
	{
		displayName: 'Contact ID',
		name: 'contactId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '34612345678@c.us',
		description: 'Unique WhatsApp identifier for the contact',
		displayOptions: { show: { resource: ['contact'] } },
	},
];
