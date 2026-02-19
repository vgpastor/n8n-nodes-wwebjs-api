/**
 * Shared helper functions for the WWebJS API Trigger node.
 * Extracted for testability — imported by both the trigger and the tests.
 */

import type { IDataObject } from 'n8n-workflow';
import * as crypto from 'crypto';

/**
 * Safely extracts a string value from an unknown with fallback
 */
export function safeString(value: unknown, fallback = ''): string {
	if (typeof value === 'string') {
		return value;
	}
	return fallback;
}

/**
 * Safely extracts a boolean value from an unknown with fallback
 */
export function safeBoolean(value: unknown, fallback = false): boolean {
	if (typeof value === 'boolean') {
		return value;
	}
	return fallback;
}

/**
 * Extracts chat identifier from webhook data (handles different event structures)
 */
export function extractChatId(data: IDataObject): string {
	// Try common fields where chat ID might be
	const from = safeString(data.from);
	if (from) return from;

	const chatId = safeString(data.chatId);
	if (chatId) return chatId;

	// For nested structures
	const chat = data.chat as IDataObject | undefined;
	if (chat) {
		const chatIdNested = safeString(chat.id);
		if (chatIdNested) return chatIdNested;

		const chatIdSerialized = (chat.id as IDataObject)?._serialized;
		if (typeof chatIdSerialized === 'string') return chatIdSerialized;
	}

	return '';
}

/**
 * Validates HMAC signature for webhook authentication
 */
export function validateSignature(
	payload: string,
	signature: string,
	secret: string,
): boolean {
	if (!secret || !signature) {
		return false;
	}

	const expectedSignature = crypto
		.createHmac('sha256', secret)
		.update(payload)
		.digest('hex');

	// Constant-time comparison to prevent timing attacks
	const sigBuffer = Buffer.from(signature);
	const expectedBuffer = Buffer.from(`sha256=${expectedSignature}`);

	if (sigBuffer.length !== expectedBuffer.length) {
		// Also try without prefix
		const expectedBufferNoPrefix = Buffer.from(expectedSignature);
		if (sigBuffer.length !== expectedBufferNoPrefix.length) {
			return false;
		}
		return crypto.timingSafeEqual(sigBuffer, expectedBufferNoPrefix);
	}

	return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}
