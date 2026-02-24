import type {
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	IDataObject,
	NodeConnectionType,
} from 'n8n-workflow';
import type { TriggerFilters, WebhookPayload } from './types';
import { safeString, safeBoolean, extractChatId, validateSignature } from './triggerFilters';

export class WWebJsApiTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'WhatsApp Web API Trigger (WWebJS)',
		name: 'wWebJsApiTrigger',
		icon: 'file:wwebjs-api.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Starts the workflow when WhatsApp events occur (new message, QR code, status change, etc.)',
		defaults: { name: 'WhatsApp Trigger' },
		inputs: [] as NodeConnectionType[],
		outputs: ['main'] as NodeConnectionType[],
		hints: [
			// ── message / message_create ──
			{
				message: '<b>message / message_create</b> webhook payload:<br><code>dataType</code>: "message" | "message_create"<br><code>sessionId</code>: session name<br><code>data.message</code>: full Message object — includes <code>.id</code>, <code>.from</code>, <code>.to</code>, <code>.body</code>, <code>.fromMe</code>, <code>.hasMedia</code>, <code>.type</code> ("chat" | "image" | "video" | "audio" | "ptt" | "document" | "sticker" | …), <code>.timestamp</code>, <code>.notifyName</code>',
				type: 'info',
				location: 'outputPane',
				whenToDisplay: 'beforeExecution',
				displayCondition: '={{ $parameter["events"].includes("message") || $parameter["events"].includes("message_create") }}',
			},
			// ── message_ack ──
			{
				message: '<b>message_ack</b> webhook payload:<br><code>dataType</code>: "message_ack"<br><code>sessionId</code>: session name<br><code>data.message</code>: full Message object<br><code>data.ack</code>: ack level — 1 (sent) | 2 (delivered) | 3 (read) | 4 (played)',
				type: 'info',
				location: 'outputPane',
				whenToDisplay: 'beforeExecution',
				displayCondition: '={{ $parameter["events"].includes("message_ack") }}',
			},
			// ── qr ──
			{
				message: '<b>qr</b> webhook payload:<br><code>dataType</code>: "qr"<br><code>sessionId</code>: session name<br><code>data.qr</code>: QR code string to scan with WhatsApp',
				type: 'info',
				location: 'outputPane',
				whenToDisplay: 'beforeExecution',
				displayCondition: '={{ $parameter["events"].includes("qr") }}',
			},
			// ── call ──
			{
				message: '<b>call</b> webhook payload:<br><code>dataType</code>: "call"<br><code>sessionId</code>: session name<br><code>data.call</code>: Call object — includes <code>.from</code>, <code>.isVideo</code>, <code>.isGroup</code>, <code>.id</code>, …',
				type: 'info',
				location: 'outputPane',
				whenToDisplay: 'beforeExecution',
				displayCondition: '={{ $parameter["events"].includes("call") }}',
			},
			// ── group_join / group_leave ──
			{
				message: '<b>group_join / group_leave</b> webhook payload:<br><code>dataType</code>: "group_join" | "group_leave"<br><code>sessionId</code>: session name<br><code>data.notification</code>: GroupNotification object — includes <code>.chatId</code>, <code>.recipientIds</code>, <code>.id</code>, <code>.type</code>, …',
				type: 'info',
				location: 'outputPane',
				whenToDisplay: 'beforeExecution',
				displayCondition: '={{ $parameter["events"].includes("group_join") || $parameter["events"].includes("group_leave") }}',
			},
			// ── ready / authenticated / disconnected / change_state / auth_failure ──
			{
				message: '<b>Status events</b> webhook payload:<br><code>dataType</code>: "ready" | "authenticated" | "disconnected" | "change_state" | "status" (auth_failure)<br><code>sessionId</code>: session name<br><code>data</code>: varies — <code>data.reason</code> for disconnected, <code>data.state</code> for change_state, <code>data.msg</code> for auth_failure, empty for ready/authenticated',
				type: 'info',
				location: 'outputPane',
				whenToDisplay: 'beforeExecution',
				displayCondition: '={{ $parameter["events"].includes("ready") || $parameter["events"].includes("authenticated") || $parameter["events"].includes("disconnected") || $parameter["events"].includes("change_state") || $parameter["events"].includes("auth_failure") }}',
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: ['message'],
				description: 'Which events should trigger this workflow. Leave empty to receive all events.',
				options: [
					{ name: 'Authenticated', value: 'authenticated', description: 'Client has been authenticated' },
					{ name: 'Authentication Failure', value: 'auth_failure', description: 'Authentication failed' },
					{ name: 'Call Received', value: 'call', description: 'Incoming call received' },
					{ name: 'Chat Archived', value: 'chat_archived', description: 'Chat was archived/unarchived' },
					{ name: 'Chat Removed', value: 'chat_removed', description: 'Chat was removed' },
					{ name: 'Connection State Changed', value: 'change_state', description: 'Connection state changed' },
					{ name: 'Disconnected', value: 'disconnected', description: 'Client was disconnected' },
					{ name: 'Group Join', value: 'group_join', description: 'Someone joined a group' },
					{ name: 'Group Leave', value: 'group_leave', description: 'Someone left a group' },
					{ name: 'Group Update', value: 'group_update', description: 'Group info was updated' },
					{ name: 'Loading Screen', value: 'loading_screen', description: 'Loading screen progress' },
					{ name: 'Media Uploaded', value: 'media_uploaded', description: 'Media has been uploaded' },
					{ name: 'Message ACK', value: 'message_ack', description: 'Message acknowledgement received (sent, delivered, read)' },
					{ name: 'Message Created', value: 'message_create', description: 'New message created (includes sent messages)' },
					{ name: 'Message Received', value: 'message', description: 'New incoming message received' },
					{ name: 'Message Revoked (Everyone)', value: 'message_revoke_everyone', description: 'Message was deleted for everyone' },
					{ name: 'Message Revoked (Me)', value: 'message_revoke_me', description: 'Message was deleted for me' },
					{ name: 'QR Code', value: 'qr', description: 'QR code received for authentication' },
					{ name: 'Ready', value: 'ready', description: 'Client is ready to send/receive messages' },
					{ name: 'Contact Changed', value: 'contact_changed', description: 'Contact has been updated' },
				],
			},
			// ── Authentication ──
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				options: [
					{ name: 'None', value: 'none', description: 'No authentication required' },
					{ name: 'Header Auth', value: 'headerAuth', description: 'Validate using a header value' },
					{ name: 'HMAC Signature', value: 'hmacSignature', description: 'Validate HMAC-SHA256 signature' },
				],
				default: 'none',
				description: 'How to authenticate incoming webhook requests',
			},
			{
				displayName: 'Header Name',
				name: 'headerName',
				type: 'string',
				default: 'x-webhook-token',
				description: 'Name of the header containing the authentication token',
				displayOptions: { show: { authentication: ['headerAuth'] } },
			},
			{
				displayName: 'Header Value',
				name: 'headerValue',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				description: 'Expected value of the authentication header',
				displayOptions: { show: { authentication: ['headerAuth'] } },
			},
			{
				displayName: 'HMAC Secret',
				name: 'hmacSecret',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				description: 'Secret key used to validate the HMAC signature',
				displayOptions: { show: { authentication: ['hmacSignature'] } },
			},
			{
				displayName: 'Signature Header',
				name: 'signatureHeader',
				type: 'string',
				default: 'x-hub-signature-256',
				description: 'Name of the header containing the HMAC signature',
				displayOptions: { show: { authentication: ['hmacSignature'] } },
			},
			// ── Filters ──
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				description: 'Additional filters to narrow down which events trigger the workflow',
				options: [
					{
						displayName: 'Session ID',
						name: 'sessionId',
						type: 'string',
						default: '',
						description: 'Only trigger for events from this specific session. Leave empty for all sessions.',
						placeholder: 'my-session',
					},
					{
						displayName: 'Chat ID Contains',
						name: 'chatIdContains',
						type: 'string',
						default: '',
						description: 'Only trigger if the chat ID contains this string (e.g. a phone number or @g.us for groups)',
						placeholder: '34612345678',
					},
					{
						displayName: 'Body Contains',
						name: 'bodyContains',
						type: 'string',
						default: '',
						description: 'Only trigger if the message body contains this text (case-insensitive)',
						placeholder: '/command',
					},
					{
						displayName: 'From Me Only',
						name: 'fromMe',
						type: 'boolean',
						default: false,
						description: 'Whether to only trigger on messages sent by the current user',
					},
					{
						displayName: 'Exclude From Me',
						name: 'excludeFromMe',
						type: 'boolean',
						default: false,
						description: 'Whether to exclude messages sent by the current user',
					},
					{
						displayName: 'Groups Only',
						name: 'groupsOnly',
						type: 'boolean',
						default: false,
						description: 'Whether to only trigger on messages from group chats',
					},
					{
						displayName: 'Individuals Only',
						name: 'individualsOnly',
						type: 'boolean',
						default: false,
						description: 'Whether to only trigger on messages from individual chats',
					},
				],
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const body = this.getBodyData() as WebhookPayload;

		// ── Authentication ──
		const authentication = this.getNodeParameter('authentication', 'none') as string;

		if (authentication === 'headerAuth') {
			const headerName = this.getNodeParameter('headerName', 'x-webhook-token') as string;
			const expectedValue = this.getNodeParameter('headerValue', '') as string;
			const actualValue = req.headers[headerName.toLowerCase()] as string | undefined;

			if (!actualValue || actualValue !== expectedValue) {
				return {
					webhookResponse: 'Unauthorized',
					noWebhookResponse: true,
				};
			}
		}

		if (authentication === 'hmacSignature') {
			const hmacSecret = this.getNodeParameter('hmacSecret', '') as string;
			const signatureHeader = this.getNodeParameter('signatureHeader', 'x-hub-signature-256') as string;
			const signature = req.headers[signatureHeader.toLowerCase()] as string | undefined;

			// Get raw body for signature validation
			const rawBody = JSON.stringify(body);

			if (!signature || !validateSignature(rawBody, signature, hmacSecret)) {
				return {
					webhookResponse: 'Invalid signature',
					noWebhookResponse: true,
				};
			}
		}

		// ── Event Type Filter ──
		const events = this.getNodeParameter('events', []) as string[];
		const eventType = safeString(body.dataType);

		if (events.length > 0 && eventType && !events.includes(eventType)) {
			return { noWebhookResponse: true };
		}

		// ── Extract nested data for filter matching ──
		// The webhook payload is: { dataType, data: { message, ... }, sessionId }
		// For message events, the actual Message object is nested under data.message
		const rawData = (body.data ?? {}) as IDataObject;
		const messageObj = (rawData.message as IDataObject) ?? rawData;
		const chatId = extractChatId(messageObj);
		const messageBody = safeString(messageObj.body);
		const fromMe = safeBoolean(messageObj.fromMe);

		// ── Get Filters ──
		const filters = this.getNodeParameter('filters', {}) as TriggerFilters;

		// ── Validate filter conflicts ──
		if (filters.fromMe === true && filters.excludeFromMe === true) {
			// Both filters are mutually exclusive - this would never match anything
			return { noWebhookResponse: true };
		}

		if (filters.groupsOnly === true && filters.individualsOnly === true) {
			// Both filters are mutually exclusive - this would never match anything
			return { noWebhookResponse: true };
		}

		// ── Session Filter ──
		if (filters.sessionId) {
			const sessionId = safeString(body.sessionId);
			if (sessionId !== filters.sessionId) {
				return { noWebhookResponse: true };
			}
		}

		// ── Chat ID Contains Filter ──
		if (filters.chatIdContains) {
			if (!chatId || !chatId.includes(filters.chatIdContains)) {
				return { noWebhookResponse: true };
			}
		}

		// ── Body Contains Filter ──
		if (filters.bodyContains) {
			const searchTerm = filters.bodyContains.toLowerCase();
			if (!messageBody || !messageBody.toLowerCase().includes(searchTerm)) {
				return { noWebhookResponse: true };
			}
		}

		// ── From Me Filter ──
		if (filters.fromMe === true && !fromMe) {
			return { noWebhookResponse: true };
		}
		if (filters.excludeFromMe === true && fromMe) {
			return { noWebhookResponse: true };
		}

		// ── Group / Individual Filter ──
		if (filters.groupsOnly === true) {
			if (!chatId || !chatId.includes('@g.us')) {
				return { noWebhookResponse: true };
			}
		}
		if (filters.individualsOnly === true) {
			if (!chatId || !chatId.includes('@c.us')) {
				return { noWebhookResponse: true };
			}
		}

		return {
			workflowData: [this.helpers.returnJsonArray(body as IDataObject)],
		};
	}
}
