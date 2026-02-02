import type { INodeProperties } from 'n8n-workflow';

export const groupChatOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['groupChat'] } },
		options: [
			{ name: 'Add Participants', value: 'addParticipants', description: 'Add participants to a group', action: 'Add group participants' },
			{ name: 'Demote Participants', value: 'demoteParticipants', description: 'Demote admins to regular participants', action: 'Demote group participants' },
			{ name: 'Get Info', value: 'getInfo', description: 'Get group chat details', action: 'Get group info' },
			{ name: 'Get Invite Code', value: 'getInviteCode', description: 'Get the group invite code', action: 'Get group invite code' },
			{ name: 'Leave', value: 'leave', description: 'Leave a group', action: 'Leave group' },
			{ name: 'Promote Participants', value: 'promoteParticipants', description: 'Promote participants to admin', action: 'Promote group participants' },
			{ name: 'Remove Participants', value: 'removeParticipants', description: 'Remove participants from a group', action: 'Remove group participants' },
			{ name: 'Revoke Invite', value: 'revokeInvite', description: 'Invalidate the current invite code', action: 'Revoke group invite' },
			{ name: 'Set Description', value: 'setDescription', description: 'Update the group description', action: 'Set group description' },
			{ name: 'Set Subject', value: 'setSubject', description: 'Update the group name/subject', action: 'Set group subject' },
		],
		default: 'getInfo',
	},
];

export const groupChatFields: INodeProperties[] = [
	// ── Session ID ──
	{
		displayName: 'Session ID',
		name: 'sessionId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['groupChat'] } },
	},

	// ── Chat ID (all group operations) ──
	{
		displayName: 'Group Chat ID',
		name: 'chatId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '120363XXXXXXXXX@g.us',
		description: 'Unique WhatsApp identifier for the group chat',
		displayOptions: { show: { resource: ['groupChat'] } },
	},

	// ── Participants (add/remove/promote/demote) ──
	{
		displayName: 'Participant IDs',
		name: 'participantIds',
		type: 'string',
		required: true,
		default: '',
		placeholder: '34612345678@c.us, 34698765432@c.us',
		description: 'Comma-separated list of participant WhatsApp IDs',
		displayOptions: {
			show: {
				resource: ['groupChat'],
				operation: ['addParticipants', 'removeParticipants', 'promoteParticipants', 'demoteParticipants'],
			},
		},
	},

	// ── Set Subject ──
	{
		displayName: 'Subject',
		name: 'subject',
		type: 'string',
		required: true,
		default: '',
		description: 'New group name/subject',
		displayOptions: { show: { resource: ['groupChat'], operation: ['setSubject'] } },
	},

	// ── Set Description ──
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		typeOptions: { rows: 3 },
		required: true,
		default: '',
		displayOptions: { show: { resource: ['groupChat'], operation: ['setDescription'] } },
	},
];
