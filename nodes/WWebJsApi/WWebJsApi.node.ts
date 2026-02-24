import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	IHttpRequestOptions,
	NodeConnectionType,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import {
	wpiRequest,
	buildEndpoint,
	resolveSessionId,
	parseContent,
	parseParticipantIds,
	parseMentions,
	validateChatId,
	validateGroupChatId,
	validateContactId,
	validatePhoneNumber,
} from './transport';
import type { ContentType, SendMessageOptions } from './types';
import {
	sessionOperations, sessionFields,
	clientOperations, clientFields,
	messageOperations, messageFields,
	chatOperations, chatFields,
	groupChatOperations, groupChatFields,
	contactOperations, contactFields,
	channelOperations, channelFields,
} from './descriptions';

export class WWebJsApi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'WhatsApp Web API (WWebJS)',
		name: 'wWebJsApi',
		icon: 'file:wwebjs-api.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Interact with WhatsApp Web API via WWebJS — send messages, manage sessions, chats, groups, contacts and channels',
		defaults: { name: 'WhatsApp Web API' },
		inputs: ['main'] as NodeConnectionType[],
		outputs: ['main'] as NodeConnectionType[],
		hints: [
			// ── session/getSessions ──
			{
				message: 'Output merges input fields with API response. API adds: <code>success</code>, <code>result</code>: array of session name strings — e.g. <code>["session1", "session2"]</code>',
				type: 'info',
				location: 'outputPane',
				whenToDisplay: 'beforeExecution',
				displayCondition: '={{ $parameter["resource"] === "session" && $parameter["operation"] === "getSessions" }}',
			},
			// ── session/getStatus ──
			{
				message: 'Output merges input fields with API response. API adds: <code>success</code>, <code>state</code> ("CONNECTED" | null), <code>message</code> ("session_connected" | "session_not_found" | "session_not_connected")',
				type: 'info',
				location: 'outputPane',
				whenToDisplay: 'beforeExecution',
				displayCondition: '={{ $parameter["resource"] === "session" && $parameter["operation"] === "getStatus" }}',
			},
			// ── client/sendMessage ──
			{
				message: 'Output merges input fields with API response. API adds: <code>success</code>, <code>message</code>: the sent Message object — includes <code>message.id</code>, <code>message.from</code>, <code>message.to</code>, <code>message.body</code>, <code>message.timestamp</code>, <code>message.type</code>, …',
				type: 'info',
				location: 'outputPane',
				whenToDisplay: 'beforeExecution',
				displayCondition: '={{ $parameter["resource"] === "client" && $parameter["operation"] === "sendMessage" }}',
			},
			// ── client/getChats ──
			{
				message: 'Output merges input fields with API response. API adds: <code>success</code>, <code>chats</code>: array of Chat objects — each has <code>id</code>, <code>name</code>, <code>isGroup</code>, <code>isReadOnly</code>, <code>unreadCount</code>, <code>timestamp</code>, <code>archived</code>, <code>pinned</code>, …',
				type: 'info',
				location: 'outputPane',
				whenToDisplay: 'beforeExecution',
				displayCondition: '={{ $parameter["resource"] === "client" && $parameter["operation"] === "getChats" }}',
			},
			// ── client/getContacts ──
			{
				message: 'Output merges input fields with API response. API adds: <code>success</code>, <code>contacts</code>: array of Contact objects — each has <code>id</code>, <code>number</code>, <code>name</code>, <code>shortName</code>, <code>pushname</code>, <code>isUser</code>, <code>isGroup</code>, <code>isMyContact</code>, <code>isBlocked</code>, …',
				type: 'info',
				location: 'outputPane',
				whenToDisplay: 'beforeExecution',
				displayCondition: '={{ $parameter["resource"] === "client" && $parameter["operation"] === "getContacts" }}',
			},
			// ── message/getInfo ──
			{
				message: 'Output merges input fields with API response. API adds: <code>success</code>, <code>info</code>: MessageInfo object with delivery/read receipts — may be null if the message is not sent by you',
				type: 'info',
				location: 'outputPane',
				whenToDisplay: 'beforeExecution',
				displayCondition: '={{ $parameter["resource"] === "message" && $parameter["operation"] === "getInfo" }}',
			},
			// ── chat/fetchMessages ──
			{
				message: 'Output merges input fields with API response. API adds: <code>success</code>, <code>messages</code>: array of Message objects (sorted earliest → latest) — each has <code>id</code>, <code>body</code>, <code>type</code>, <code>timestamp</code>, <code>from</code>, <code>to</code>, <code>fromMe</code>, <code>hasMedia</code>, …',
				type: 'info',
				location: 'outputPane',
				whenToDisplay: 'beforeExecution',
				displayCondition: '={{ $parameter["resource"] === "chat" && $parameter["operation"] === "fetchMessages" }}',
			},
		],
		credentials: [
			{
				name: 'wWebJsApi',
				required: true,
			},
		],
		properties: [
			// ── Resource Selector ──
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Channel', value: 'channel' },
					{ name: 'Chat', value: 'chat' },
					{ name: 'Client', value: 'client' },
					{ name: 'Contact', value: 'contact' },
					{ name: 'Group Chat', value: 'groupChat' },
					{ name: 'Message', value: 'message' },
					{ name: 'Session', value: 'session' },
				],
				default: 'client',
			},

			// ── Operations & Fields per Resource ──
			...sessionOperations,
			...sessionFields,
			...clientOperations,
			...clientFields,
			...messageOperations,
			...messageFields,
			...chatOperations,
			...chatFields,
			...groupChatOperations,
			...groupChatFields,
			...contactOperations,
			...contactFields,
			...channelOperations,
			...channelFields,
		],
	};

	methods = {
		loadOptions: {
			async getSessions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('wWebJsApi');
				const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');

				const options: IHttpRequestOptions = {
					method: 'GET',
					url: `${baseUrl}/session/getSessions`,
					headers: { 'Content-Type': 'application/json' },
				};

				if (credentials.apiKey) {
					options.headers!['x-api-key'] = credentials.apiKey as string;
				}

				try {
					const response = await this.helpers.httpRequest(options) as IDataObject;
					const sessions = (response.result ?? response.data ?? response) as string[] | Array<{ id: string; status: string }>;

					if (!Array.isArray(sessions)) {
						return [];
					}

					return sessions.map((s) => {
						// The API returns an array of session name strings: ["patroltech", "rocstatus", ...]
						if (typeof s === 'string') {
							return { name: s, value: s };
						}
						// Fallback for future API versions that may return objects with id/status
						return { name: `${s.id} (${s.status})`, value: s.id };
					});
				} catch {
					// If the API is unreachable, return empty list so the user can still type manually
					return [];
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				let responseData: IDataObject;

				switch (resource) {
					case 'session':
						responseData = await executeSession.call(this, operation, i);
						break;
					case 'client':
						responseData = await executeClient.call(this, operation, i);
						break;
					case 'message':
						responseData = await executeMessage.call(this, operation, i);
						break;
					case 'chat':
						responseData = await executeChat.call(this, operation, i);
						break;
					case 'groupChat':
						responseData = await executeGroupChat.call(this, operation, i);
						break;
					case 'contact':
						responseData = await executeContact.call(this, operation, i);
						break;
					case 'channel':
						responseData = await executeChannel.call(this, operation, i);
						break;
					default:
						throw new Error(`Unknown resource: ${resource}`);
				}

				if (Array.isArray(responseData)) {
					returnData.push(
						...(responseData as IDataObject[]).map((d) => ({
							json: { ...items[i].json, ...d },
							pairedItem: { item: i },
						})),
					);
				} else {
					returnData.push({
						json: { ...items[i].json, ...responseData },
						pairedItem: { item: i },
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}

// ═══════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════

/**
 * Gets and validates a chat ID from node parameters
 */
function getChatId(executeFn: IExecuteFunctions, i: number): string {
	const chatId = executeFn.getNodeParameter('chatId', i) as string;
	const validation = validateChatId(chatId);
	if (!validation.valid) {
		throw new NodeOperationError(executeFn.getNode(), validation.error!, { itemIndex: i });
	}
	return chatId;
}

/**
 * Gets and validates a group chat ID from node parameters
 */
function getGroupChatId(executeFn: IExecuteFunctions, i: number): string {
	const chatId = executeFn.getNodeParameter('chatId', i) as string;
	const validation = validateGroupChatId(chatId);
	if (!validation.valid) {
		throw new NodeOperationError(executeFn.getNode(), validation.error!, { itemIndex: i });
	}
	return chatId;
}

/**
 * Gets and validates a contact ID from node parameters
 */
function getContactId(executeFn: IExecuteFunctions, i: number): string {
	const contactId = executeFn.getNodeParameter('contactId', i) as string;
	const validation = validateContactId(contactId);
	if (!validation.valid) {
		throw new NodeOperationError(executeFn.getNode(), validation.error!, { itemIndex: i });
	}
	return contactId;
}

/**
 * Gets and validates a phone number from node parameters
 */
function getPhoneNumber(executeFn: IExecuteFunctions, i: number): string {
	const number = executeFn.getNodeParameter('number', i) as string;
	const validation = validatePhoneNumber(number);
	if (!validation.valid) {
		throw new NodeOperationError(executeFn.getNode(), validation.error!, { itemIndex: i });
	}
	return number;
}

/**
 * Gets parsed content based on content type
 */
function getMessageContent(executeFn: IExecuteFunctions, i: number) {
	const contentType = executeFn.getNodeParameter('contentType', i) as ContentType;
	const textContent = contentType === 'string'
		? executeFn.getNodeParameter('content', i, '') as string
		: '';
	const jsonContent = contentType !== 'string'
		? executeFn.getNodeParameter('contentJson', i, '{}') as string
		: '{}';

	return parseContent(contentType, textContent, jsonContent);
}

// ═══════════════════════════════════════════════════════════════════
// Resource Execution Handlers
// ═══════════════════════════════════════════════════════════════════

// ── Session ──
async function executeSession(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject> {
	switch (operation) {
		case 'getSessions':
			return wpiRequest.call(this, 'GET', '/session/getSessions');
		case 'start': {
			const sid = await resolveSessionId(this, i);
			const startOptions = this.getNodeParameter('options', i, {}) as IDataObject;
			if (startOptions.webhookUrl) {
				// Use POST to pass webhookUrl in body (requires wwebjs-api v1.35+)
				return wpiRequest.call(this, 'POST', buildEndpoint('/session/start/{sessionId}', sid), {
					webhookUrl: startOptions.webhookUrl as string,
				});
			}
			return wpiRequest.call(this, 'GET', buildEndpoint('/session/start/{sessionId}', sid));
		}
		case 'stop': {
			const sid = await resolveSessionId(this, i);
			return wpiRequest.call(this, 'GET', buildEndpoint('/session/stop/{sessionId}', sid));
		}
		case 'getStatus': {
			const sid = await resolveSessionId(this, i);
			return wpiRequest.call(this, 'GET', buildEndpoint('/session/status/{sessionId}', sid));
		}
		case 'getQrCode': {
			const sid = await resolveSessionId(this, i);
			return wpiRequest.call(this, 'GET', buildEndpoint('/session/qr/{sessionId}', sid));
		}
		case 'getQrImage': {
			const sid = await resolveSessionId(this, i);
			return wpiRequest.call(this, 'GET', buildEndpoint('/session/qr/{sessionId}/image', sid));
		}
		case 'restart': {
			const sid = await resolveSessionId(this, i);
			return wpiRequest.call(this, 'GET', buildEndpoint('/session/restart/{sessionId}', sid));
		}
		case 'terminate': {
			const sid = await resolveSessionId(this, i);
			return wpiRequest.call(this, 'GET', buildEndpoint('/session/terminate/{sessionId}', sid));
		}
		case 'setWebhook': {
			const sid = await resolveSessionId(this, i);
			const webhookUrl = this.getNodeParameter('webhookUrl', i) as string;
			return wpiRequest.call(this, 'PUT', buildEndpoint('/session/setWebhook/{sessionId}', sid), {
				webhookUrl,
			});
		}
		case 'getWebhook': {
			const sid = await resolveSessionId(this, i);
			return wpiRequest.call(this, 'GET', buildEndpoint('/session/getWebhook/{sessionId}', sid));
		}
		case 'terminateInactive':
			return wpiRequest.call(this, 'GET', '/session/terminateInactive');
		case 'terminateAll':
			return wpiRequest.call(this, 'GET', '/session/terminateAll');
		default:
			throw new Error(`Unknown session operation: ${operation}`);
	}
}

// ── Client ──
async function executeClient(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject> {
	const sid = await resolveSessionId(this, i);

	switch (operation) {
		case 'sendMessage': {
			const chatId = getChatId(this, i);
			const { contentType, content } = getMessageContent(this, i);
			const optionsRaw = this.getNodeParameter('options', i, {}) as IDataObject;

			const body: IDataObject = { chatId, contentType, content };

			if (Object.keys(optionsRaw).length > 0) {
				const options: SendMessageOptions = {};
				if (optionsRaw.quotedMessageId) {
					options.quotedMessageId = optionsRaw.quotedMessageId as string;
				}
				if (optionsRaw.mentions) {
					options.mentions = parseMentions(optionsRaw.mentions as string);
				}
				if (optionsRaw.sendSeen) {
					options.sendSeen = optionsRaw.sendSeen as boolean;
				}
				body.options = options;
			}
			return wpiRequest.call(this, 'POST', buildEndpoint('/client/sendMessage/{sessionId}', sid), body);
		}
		case 'getChats':
			return wpiRequest.call(this, 'GET', buildEndpoint('/client/getChats/{sessionId}', sid));
		case 'getChatById': {
			const chatId = getChatId(this, i);
			return wpiRequest.call(this, 'POST', buildEndpoint('/client/getChatById/{sessionId}', sid), { chatId });
		}
		case 'getContacts':
			return wpiRequest.call(this, 'GET', buildEndpoint('/client/getContacts/{sessionId}', sid));
		case 'getContactById': {
			const contactId = getContactId(this, i);
			return wpiRequest.call(this, 'POST', buildEndpoint('/client/getContactById/{sessionId}', sid), { contactId });
		}
		case 'getState':
			return wpiRequest.call(this, 'GET', buildEndpoint('/client/getState/{sessionId}', sid));
		case 'isRegisteredUser': {
			const number = getPhoneNumber(this, i);
			return wpiRequest.call(this, 'POST', buildEndpoint('/client/isRegisteredUser/{sessionId}', sid), { number });
		}
		case 'getNumberId': {
			const number = getPhoneNumber(this, i);
			return wpiRequest.call(this, 'POST', buildEndpoint('/client/getNumberId/{sessionId}', sid), { number });
		}
		case 'searchMessages': {
			const query = this.getNodeParameter('query', i) as string;
			const searchOptions = this.getNodeParameter('searchOptions', i, {}) as IDataObject;
			const body: IDataObject = { query };
			if (Object.keys(searchOptions).length > 0) body.options = searchOptions;
			return wpiRequest.call(this, 'POST', buildEndpoint('/client/searchMessages/{sessionId}', sid), body);
		}
		case 'sendSeen': {
			const chatId = getChatId(this, i);
			return wpiRequest.call(this, 'POST', buildEndpoint('/client/sendSeen/{sessionId}', sid), { chatId });
		}
		case 'setStatus': {
			const status = this.getNodeParameter('status', i) as string;
			return wpiRequest.call(this, 'POST', buildEndpoint('/client/setStatus/{sessionId}', sid), { status });
		}
		case 'getProfilePicUrl': {
			const contactId = getContactId(this, i);
			return wpiRequest.call(this, 'POST', buildEndpoint('/client/getProfilePicUrl/{sessionId}', sid), { contactId });
		}
		case 'getBlockedContacts':
			return wpiRequest.call(this, 'POST', buildEndpoint('/client/getBlockedContacts/{sessionId}', sid));
		case 'archiveChat': {
			const chatId = getChatId(this, i);
			return wpiRequest.call(this, 'POST', buildEndpoint('/client/archiveChat/{sessionId}', sid), { chatId });
		}
		case 'unarchiveChat': {
			const chatId = getChatId(this, i);
			return wpiRequest.call(this, 'POST', buildEndpoint('/client/unarchiveChat/{sessionId}', sid), { chatId });
		}
		case 'muteChat': {
			const chatId = getChatId(this, i);
			const unmuteDate = this.getNodeParameter('unmuteDate', i, '') as string;
			const body: IDataObject = { chatId };
			if (unmuteDate) body.unmuteDate = unmuteDate;
			return wpiRequest.call(this, 'POST', buildEndpoint('/client/muteChat/{sessionId}', sid), body);
		}
		case 'unmuteChat': {
			const chatId = getChatId(this, i);
			return wpiRequest.call(this, 'POST', buildEndpoint('/client/unmuteChat/{sessionId}', sid), { chatId });
		}
		case 'pinChat': {
			const chatId = getChatId(this, i);
			return wpiRequest.call(this, 'POST', buildEndpoint('/client/pinChat/{sessionId}', sid), { chatId });
		}
		case 'unpinChat': {
			const chatId = getChatId(this, i);
			return wpiRequest.call(this, 'POST', buildEndpoint('/client/unpinChat/{sessionId}', sid), { chatId });
		}
		case 'createGroup': {
			const groupName = this.getNodeParameter('groupName', i) as string;
			const participantIds = parseParticipantIds(this.getNodeParameter('participantIds', i) as string);
			if (participantIds.length === 0) {
				throw new NodeOperationError(this.getNode(), 'At least one participant ID is required', { itemIndex: i });
			}
			return wpiRequest.call(this, 'POST', buildEndpoint('/client/createGroup/{sessionId}', sid), { name: groupName, participants: participantIds });
		}
		default:
			throw new Error(`Unknown client operation: ${operation}`);
	}
}

// ── Message ──
async function executeMessage(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject> {
	const sid = await resolveSessionId(this, i);
	const chatId = getChatId(this, i);
	const messageId = this.getNodeParameter('messageId', i) as string;

	switch (operation) {
		case 'getInfo':
			return wpiRequest.call(this, 'POST', buildEndpoint('/message/getClassInfo/{sessionId}', sid), { chatId, messageId });
		case 'reply': {
			const { contentType, content } = getMessageContent(this, i);
			return wpiRequest.call(this, 'POST', buildEndpoint('/message/reply/{sessionId}', sid), { chatId, messageId, contentType, content });
		}
		case 'react': {
			const reaction = this.getNodeParameter('reaction', i) as string;
			return wpiRequest.call(this, 'POST', buildEndpoint('/message/react/{sessionId}', sid), { chatId, messageId, reaction });
		}
		case 'forward': {
			const destinationChatId = this.getNodeParameter('destinationChatId', i) as string;
			const destValidation = validateChatId(destinationChatId);
			if (!destValidation.valid) {
				throw new NodeOperationError(this.getNode(), `Destination ${destValidation.error}`, { itemIndex: i });
			}
			return wpiRequest.call(this, 'POST', buildEndpoint('/message/forward/{sessionId}', sid), { chatId, messageId, destinationChatId });
		}
		case 'edit': {
			const content = this.getNodeParameter('editContent', i) as string;
			return wpiRequest.call(this, 'POST', buildEndpoint('/message/edit/{sessionId}', sid), { chatId, messageId, content });
		}
		case 'delete': {
			const everyone = this.getNodeParameter('everyone', i, false) as boolean;
			return wpiRequest.call(this, 'POST', buildEndpoint('/message/delete/{sessionId}', sid), { chatId, messageId, everyone });
		}
		case 'downloadMedia':
			return wpiRequest.call(this, 'POST', buildEndpoint('/message/downloadMedia/{sessionId}', sid), { chatId, messageId });
		case 'star':
			return wpiRequest.call(this, 'POST', buildEndpoint('/message/star/{sessionId}', sid), { chatId, messageId });
		case 'unstar':
			return wpiRequest.call(this, 'POST', buildEndpoint('/message/unstar/{sessionId}', sid), { chatId, messageId });
		default:
			throw new Error(`Unknown message operation: ${operation}`);
	}
}

// ── Chat ──
async function executeChat(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject> {
	const sid = await resolveSessionId(this, i);
	const chatId = getChatId(this, i);

	switch (operation) {
		case 'getInfo':
			return wpiRequest.call(this, 'POST', buildEndpoint('/chat/getClassInfo/{sessionId}', sid), { chatId });
		case 'fetchMessages': {
			const searchOptions = this.getNodeParameter('searchOptions', i, {}) as IDataObject;
			const body: IDataObject = { chatId };
			if (Object.keys(searchOptions).length > 0) body.searchOptions = searchOptions;
			return wpiRequest.call(this, 'POST', buildEndpoint('/chat/fetchMessages/{sessionId}', sid), body);
		}
		case 'getContact':
			return wpiRequest.call(this, 'POST', buildEndpoint('/chat/getContact/{sessionId}', sid), { chatId });
		case 'sendStateTyping':
			return wpiRequest.call(this, 'POST', buildEndpoint('/chat/sendStateTyping/{sessionId}', sid), { chatId });
		case 'sendStateRecording':
			return wpiRequest.call(this, 'POST', buildEndpoint('/chat/sendStateRecording/{sessionId}', sid), { chatId });
		case 'clearMessages':
			return wpiRequest.call(this, 'POST', buildEndpoint('/chat/clearMessages/{sessionId}', sid), { chatId });
		case 'delete':
			return wpiRequest.call(this, 'POST', buildEndpoint('/chat/delete/{sessionId}', sid), { chatId });
		case 'sendSeen':
			return wpiRequest.call(this, 'POST', buildEndpoint('/chat/sendSeen/{sessionId}', sid), { chatId });
		case 'markUnread':
			return wpiRequest.call(this, 'POST', buildEndpoint('/chat/markUnread/{sessionId}', sid), { chatId });
		case 'getLabels':
			return wpiRequest.call(this, 'POST', buildEndpoint('/chat/getLabels/{sessionId}', sid), { chatId });
		default:
			throw new Error(`Unknown chat operation: ${operation}`);
	}
}

// ── Group Chat ──
async function executeGroupChat(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject> {
	const sid = await resolveSessionId(this, i);
	const chatId = getGroupChatId(this, i);

	switch (operation) {
		case 'getInfo':
			return wpiRequest.call(this, 'POST', buildEndpoint('/groupChat/getClassInfo/{sessionId}', sid), { chatId });
		case 'addParticipants': {
			const ids = parseParticipantIds(this.getNodeParameter('participantIds', i) as string);
			if (ids.length === 0) {
				throw new Error('At least one participant ID is required');
			}
			return wpiRequest.call(this, 'POST', buildEndpoint('/groupChat/addParticipants/{sessionId}', sid), { chatId, participantIds: ids });
		}
		case 'removeParticipants': {
			const ids = parseParticipantIds(this.getNodeParameter('participantIds', i) as string);
			if (ids.length === 0) {
				throw new Error('At least one participant ID is required');
			}
			return wpiRequest.call(this, 'POST', buildEndpoint('/groupChat/removeParticipants/{sessionId}', sid), { chatId, participantIds: ids });
		}
		case 'promoteParticipants': {
			const ids = parseParticipantIds(this.getNodeParameter('participantIds', i) as string);
			if (ids.length === 0) {
				throw new Error('At least one participant ID is required');
			}
			return wpiRequest.call(this, 'POST', buildEndpoint('/groupChat/promoteParticipants/{sessionId}', sid), { chatId, participantIds: ids });
		}
		case 'demoteParticipants': {
			const ids = parseParticipantIds(this.getNodeParameter('participantIds', i) as string);
			if (ids.length === 0) {
				throw new Error('At least one participant ID is required');
			}
			return wpiRequest.call(this, 'POST', buildEndpoint('/groupChat/demoteParticipants/{sessionId}', sid), { chatId, participantIds: ids });
		}
		case 'getInviteCode':
			return wpiRequest.call(this, 'POST', buildEndpoint('/groupChat/getInviteCode/{sessionId}', sid), { chatId });
		case 'leave':
			return wpiRequest.call(this, 'POST', buildEndpoint('/groupChat/leave/{sessionId}', sid), { chatId });
		case 'revokeInvite':
			return wpiRequest.call(this, 'POST', buildEndpoint('/groupChat/revokeInvite/{sessionId}', sid), { chatId });
		case 'setSubject': {
			const subject = this.getNodeParameter('subject', i) as string;
			return wpiRequest.call(this, 'POST', buildEndpoint('/groupChat/setSubject/{sessionId}', sid), { chatId, subject });
		}
		case 'setDescription': {
			const description = this.getNodeParameter('description', i) as string;
			return wpiRequest.call(this, 'POST', buildEndpoint('/groupChat/setDescription/{sessionId}', sid), { chatId, description });
		}
		default:
			throw new Error(`Unknown groupChat operation: ${operation}`);
	}
}

// ── Contact ──
async function executeContact(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject> {
	const sid = await resolveSessionId(this, i);
	const contactId = getContactId(this, i);

	switch (operation) {
		case 'getInfo':
			return wpiRequest.call(this, 'POST', buildEndpoint('/contact/getClassInfo/{sessionId}', sid), { contactId });
		case 'block':
			return wpiRequest.call(this, 'POST', buildEndpoint('/contact/block/{sessionId}', sid), { contactId });
		case 'unblock':
			return wpiRequest.call(this, 'POST', buildEndpoint('/contact/unblock/{sessionId}', sid), { contactId });
		case 'getAbout':
			return wpiRequest.call(this, 'POST', buildEndpoint('/contact/getAbout/{sessionId}', sid), { contactId });
		case 'getChat':
			return wpiRequest.call(this, 'POST', buildEndpoint('/contact/getChat/{sessionId}', sid), { contactId });
		case 'getProfilePicUrl':
			return wpiRequest.call(this, 'POST', buildEndpoint('/contact/getProfilePicUrl/{sessionId}', sid), { contactId });
		case 'getCommonGroups':
			return wpiRequest.call(this, 'POST', buildEndpoint('/contact/getCommonGroups/{sessionId}', sid), { contactId });
		default:
			throw new Error(`Unknown contact operation: ${operation}`);
	}
}

// ── Channel ──
async function executeChannel(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject> {
	const sid = await resolveSessionId(this, i);

	switch (operation) {
		case 'getAll':
			return wpiRequest.call(this, 'GET', buildEndpoint('/client/getChannels/{sessionId}', sid));
		case 'getInfo': {
			const chatId = this.getNodeParameter('chatId', i) as string;
			return wpiRequest.call(this, 'POST', buildEndpoint('/channel/getClassInfo/{sessionId}', sid), { chatId });
		}
		case 'sendMessage': {
			const chatId = this.getNodeParameter('chatId', i) as string;
			const { contentType, content } = getMessageContent(this, i);
			return wpiRequest.call(this, 'POST', buildEndpoint('/channel/sendMessage/{sessionId}', sid), { chatId, contentType, content });
		}
		case 'fetchMessages': {
			const chatId = this.getNodeParameter('chatId', i) as string;
			return wpiRequest.call(this, 'POST', buildEndpoint('/channel/fetchMessages/{sessionId}', sid), { chatId });
		}
		case 'subscribe': {
			const chatId = this.getNodeParameter('chatId', i) as string;
			return wpiRequest.call(this, 'POST', buildEndpoint('/client/subscribeToChannel/{sessionId}', sid), { chatId });
		}
		case 'unsubscribe': {
			const chatId = this.getNodeParameter('chatId', i) as string;
			return wpiRequest.call(this, 'POST', buildEndpoint('/client/unsubscribeFromChannel/{sessionId}', sid), { chatId });
		}
		case 'create': {
			const name = this.getNodeParameter('channelName', i) as string;
			const description = this.getNodeParameter('channelDescription', i, '') as string;
			const body: IDataObject = { name };
			if (description) body.description = description;
			return wpiRequest.call(this, 'POST', buildEndpoint('/client/createChannel/{sessionId}', sid), body);
		}
		case 'search': {
			const query = this.getNodeParameter('query', i) as string;
			return wpiRequest.call(this, 'POST', buildEndpoint('/client/searchChannels/{sessionId}', sid), { query });
		}
		case 'delete': {
			const chatId = this.getNodeParameter('chatId', i) as string;
			return wpiRequest.call(this, 'POST', buildEndpoint('/channel/deleteChannel/{sessionId}', sid), { chatId });
		}
		default:
			throw new Error(`Unknown channel operation: ${operation}`);
	}
}
