import type {
	IExecuteFunctions,
	IDataObject,
	IHttpRequestMethods,
	IRequestOptions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import type { ContentType, ParsedContent, ValidationResult } from './types';

// ═══════════════════════════════════════════════════════════════════
// Validation Utilities
// ═══════════════════════════════════════════════════════════════════

/**
 * Regular expressions for validating WhatsApp IDs
 */
const CHAT_ID_REGEX = /^[0-9]+@[cg]\.us$/;
const CONTACT_ID_REGEX = /^[0-9]+@c\.us$/;
const GROUP_ID_REGEX = /^[0-9]+-[0-9]+@g\.us$/;
const PHONE_NUMBER_REGEX = /^[0-9]{7,15}$/;
const CHANNEL_ID_REGEX = /^[0-9]+@newsletter$/;

/**
 * Validates a chat ID format (individual or group)
 */
export function validateChatId(chatId: string): ValidationResult {
	if (!chatId || chatId.trim() === '') {
		return { valid: false, error: 'Chat ID is required' };
	}

	const trimmed = chatId.trim();

	// Allow both individual and group formats
	if (!CHAT_ID_REGEX.test(trimmed) && !GROUP_ID_REGEX.test(trimmed)) {
		return {
			valid: false,
			error: `Invalid chat ID format: "${trimmed}". Expected format: number@c.us (individual) or number-timestamp@g.us (group)`,
		};
	}

	return { valid: true };
}

/**
 * Validates a contact ID format
 */
export function validateContactId(contactId: string): ValidationResult {
	if (!contactId || contactId.trim() === '') {
		return { valid: false, error: 'Contact ID is required' };
	}

	const trimmed = contactId.trim();

	if (!CONTACT_ID_REGEX.test(trimmed)) {
		return {
			valid: false,
			error: `Invalid contact ID format: "${trimmed}". Expected format: number@c.us`,
		};
	}

	return { valid: true };
}

/**
 * Validates a group chat ID format
 */
export function validateGroupChatId(chatId: string): ValidationResult {
	if (!chatId || chatId.trim() === '') {
		return { valid: false, error: 'Group Chat ID is required' };
	}

	const trimmed = chatId.trim();

	// Groups can be either number@g.us or number-timestamp@g.us
	if (!trimmed.endsWith('@g.us')) {
		return {
			valid: false,
			error: `Invalid group chat ID format: "${trimmed}". Expected format: number@g.us or number-timestamp@g.us`,
		};
	}

	return { valid: true };
}

/**
 * Validates a phone number format
 */
export function validatePhoneNumber(number: string): ValidationResult {
	if (!number || number.trim() === '') {
		return { valid: false, error: 'Phone number is required' };
	}

	const trimmed = number.trim().replace(/[^0-9]/g, '');

	if (!PHONE_NUMBER_REGEX.test(trimmed)) {
		return {
			valid: false,
			error: `Invalid phone number format: "${number}". Expected 7-15 digits without + or spaces.`,
		};
	}

	return { valid: true };
}

/**
 * Validates a channel ID format
 */
export function validateChannelId(channelId: string): ValidationResult {
	if (!channelId || channelId.trim() === '') {
		return { valid: false, error: 'Channel ID is required' };
	}

	const trimmed = channelId.trim();

	if (!CHANNEL_ID_REGEX.test(trimmed)) {
		return {
			valid: false,
			error: `Invalid channel ID format: "${trimmed}". Expected format: number@newsletter`,
		};
	}

	return { valid: true };
}

/**
 * Validates a session ID format
 */
export function validateSessionId(sessionId: string): ValidationResult {
	if (!sessionId || sessionId.trim() === '') {
		return { valid: false, error: 'Session ID is required' };
	}

	// Session IDs should be alphanumeric with dashes/underscores
	const trimmed = sessionId.trim();
	if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
		return {
			valid: false,
			error: `Invalid session ID format: "${trimmed}". Use only alphanumeric characters, dashes, and underscores.`,
		};
	}

	return { valid: true };
}

// ═══════════════════════════════════════════════════════════════════
// Content Parsing Utilities
// ═══════════════════════════════════════════════════════════════════

/**
 * Parses content based on content type.
 * Returns the appropriate content value (string for text, parsed JSON for others).
 */
export function parseContent(
	contentType: ContentType,
	textContent: string,
	jsonContent: string,
): ParsedContent {
	if (contentType === 'string') {
		return {
			contentType,
			content: textContent,
		};
	}

	try {
		const parsed = JSON.parse(jsonContent) as IDataObject;
		return {
			contentType,
			content: parsed,
		};
	} catch (error) {
		throw new Error(
			`Invalid JSON content for type "${contentType}": ${(error as Error).message}`,
		);
	}
}

/**
 * Parses a comma-separated list of participant IDs into an array.
 * Validates each ID and returns cleaned array.
 */
export function parseParticipantIds(ids: string): string[] {
	if (!ids || ids.trim() === '') {
		return [];
	}

	const parsed = ids
		.split(',')
		.map((id) => id.trim())
		.filter((id) => id !== '');

	// Validate each participant ID
	for (const id of parsed) {
		if (!CONTACT_ID_REGEX.test(id)) {
			throw new Error(
				`Invalid participant ID: "${id}". Expected format: number@c.us`,
			);
		}
	}

	return parsed;
}

/**
 * Parses a comma-separated list of mentions into an array.
 */
export function parseMentions(mentions: string): string[] {
	if (!mentions || mentions.trim() === '') {
		return [];
	}

	return mentions
		.split(',')
		.map((m) => m.trim())
		.filter((m) => m !== '');
}

// ═══════════════════════════════════════════════════════════════════
// Session Resolution
// ═══════════════════════════════════════════════════════════════════

/**
 * Resolves the session ID from node parameter or credentials default.
 * Throws an error if no session ID is available.
 */
export async function resolveSessionId(
	executeFn: IExecuteFunctions,
	itemIndex: number,
): Promise<string> {
	// Try to get from node parameter
	let sessionId = '';
	try {
		sessionId = executeFn.getNodeParameter('sessionId', itemIndex, '') as string;
	} catch {
		// Parameter might not exist for some operations
	}

	// Fallback to credentials default
	if (!sessionId) {
		const credentials = await executeFn.getCredentials('wWebJsApi');
		sessionId = (credentials.defaultSessionId as string) || '';
	}

	// Validate
	if (!sessionId) {
		throw new Error(
			'Session ID is required. Set it in the node or as the default in your credentials.',
		);
	}

	const validation = validateSessionId(sessionId);
	if (!validation.valid) {
		throw new Error(validation.error);
	}

	return sessionId;
}

// ═══════════════════════════════════════════════════════════════════
// HTTP Request Helper
// ═══════════════════════════════════════════════════════════════════

/**
 * Makes an HTTP request to the WWebJS API.
 */
export async function wpiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	query: IDataObject = {},
): Promise<IDataObject> {
	const credentials = await this.getCredentials('wWebJsApi');
	const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');

	const options: IRequestOptions = {
		method,
		uri: `${baseUrl}${endpoint}`,
		headers: {
			'Content-Type': 'application/json',
		},
		json: true,
		qs: query,
	};

	if (credentials.apiKey) {
		options.headers!['x-api-key'] = credentials.apiKey as string;
	}

	if (Object.keys(body).length > 0 && method !== 'GET') {
		options.body = body;
	}

	try {
		return (await this.helpers.request(options)) as IDataObject;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject, {
			message: `WWebJS API request failed: ${(error as Error).message}`,
		});
	}
}

/**
 * Builds the endpoint path replacing {sessionId} with the actual value.
 */
export function buildEndpoint(path: string, sessionId: string): string {
	return path.replace('{sessionId}', sessionId);
}
