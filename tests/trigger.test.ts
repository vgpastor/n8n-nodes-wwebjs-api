import { describe, it, expect } from 'vitest';
import {
	safeString,
	safeBoolean,
	extractChatId,
	validateSignature,
} from '../nodes/WWebJsApi/triggerFilters';
import type { IDataObject } from 'n8n-workflow';

describe('Trigger Filter Logic', () => {
	describe('safeString', () => {
		it('should return string value', () => {
			expect(safeString('hello')).toBe('hello');
		});

		it('should return fallback for undefined', () => {
			expect(safeString(undefined)).toBe('');
		});

		it('should return fallback for null', () => {
			expect(safeString(null)).toBe('');
		});

		it('should return fallback for number', () => {
			expect(safeString(123)).toBe('');
		});

		it('should return custom fallback', () => {
			expect(safeString(undefined, 'default')).toBe('default');
		});
	});

	describe('safeBoolean', () => {
		it('should return boolean value', () => {
			expect(safeBoolean(true)).toBe(true);
			expect(safeBoolean(false)).toBe(false);
		});

		it('should return fallback for undefined', () => {
			expect(safeBoolean(undefined)).toBe(false);
		});

		it('should return fallback for string', () => {
			expect(safeBoolean('true')).toBe(false);
		});

		it('should return custom fallback', () => {
			expect(safeBoolean(undefined, true)).toBe(true);
		});
	});

	describe('extractChatId', () => {
		it('should extract from "from" field', () => {
			const data: IDataObject = { from: '34612345678@c.us' };
			expect(extractChatId(data)).toBe('34612345678@c.us');
		});

		it('should fallback to "chatId" field', () => {
			const data: IDataObject = { chatId: '34612345678@g.us' };
			expect(extractChatId(data)).toBe('34612345678@g.us');
		});

		it('should prefer "from" over "chatId"', () => {
			const data: IDataObject = { from: '111@c.us', chatId: '222@c.us' };
			expect(extractChatId(data)).toBe('111@c.us');
		});

		it('should return empty string if no chat ID found', () => {
			const data: IDataObject = {};
			expect(extractChatId(data)).toBe('');
		});

		it('should extract from nested chat.id', () => {
			const data: IDataObject = { chat: { id: '123@c.us' } };
			expect(extractChatId(data)).toBe('123@c.us');
		});

		it('should extract from nested chat.id._serialized', () => {
			const data: IDataObject = { chat: { id: { _serialized: '123@c.us' } } };
			expect(extractChatId(data)).toBe('123@c.us');
		});
	});

	describe('validateSignature', () => {
		it('should validate correct HMAC signature with sha256= prefix', () => {
			const crypto = require('crypto');
			const secret = 'test-secret';
			const payload = '{"test": true}';
			const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex');
			expect(validateSignature(payload, `sha256=${hash}`, secret)).toBe(true);
		});

		it('should validate correct HMAC signature without prefix', () => {
			const crypto = require('crypto');
			const secret = 'test-secret';
			const payload = '{"test": true}';
			const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex');
			expect(validateSignature(payload, hash, secret)).toBe(true);
		});

		it('should reject invalid signature', () => {
			expect(validateSignature('payload', 'invalid-sig', 'secret')).toBe(false);
		});

		it('should reject empty secret', () => {
			expect(validateSignature('payload', 'sig', '')).toBe(false);
		});

		it('should reject empty signature', () => {
			expect(validateSignature('payload', '', 'secret')).toBe(false);
		});
	});

	describe('Event Type Filter', () => {
		function filterByEventType(eventType: string, allowedEvents: string[]): boolean {
			if (allowedEvents.length === 0) {
				return true; // Empty array means allow all
			}
			return allowedEvents.includes(eventType);
		}

		it('should allow event if in allowed list', () => {
			expect(filterByEventType('message', ['message', 'message_create'])).toBe(true);
		});

		it('should reject event if not in allowed list', () => {
			expect(filterByEventType('qr', ['message', 'message_create'])).toBe(false);
		});

		it('should allow any event if list is empty', () => {
			expect(filterByEventType('any_event', [])).toBe(true);
		});
	});

	describe('Session Filter', () => {
		function filterBySession(
			sessionId: string,
			filterSessionId: string | undefined,
		): boolean {
			if (!filterSessionId) {
				return true; // No filter, allow all
			}
			return sessionId === filterSessionId;
		}

		it('should allow if session matches', () => {
			expect(filterBySession('my-session', 'my-session')).toBe(true);
		});

		it('should reject if session does not match', () => {
			expect(filterBySession('my-session', 'other-session')).toBe(false);
		});

		it('should allow any session if filter is empty', () => {
			expect(filterBySession('any-session', undefined)).toBe(true);
		});
	});

	describe('Chat ID Contains Filter', () => {
		function filterByChatIdContains(
			chatId: string,
			filterContains: string | undefined,
		): boolean {
			if (!filterContains) {
				return true;
			}
			return chatId.includes(filterContains);
		}

		it('should match if chat ID contains filter string', () => {
			expect(filterByChatIdContains('34612345678@c.us', '612345')).toBe(true);
		});

		it('should match if chat ID contains @g.us for groups', () => {
			expect(filterByChatIdContains('34612345678@g.us', '@g.us')).toBe(true);
		});

		it('should reject if chat ID does not contain filter string', () => {
			expect(filterByChatIdContains('34612345678@c.us', '999999')).toBe(false);
		});

		it('should allow any chat ID if filter is empty', () => {
			expect(filterByChatIdContains('any-chat', undefined)).toBe(true);
		});
	});

	describe('Body Contains Filter', () => {
		function filterByBodyContains(
			body: string,
			filterContains: string | undefined,
		): boolean {
			if (!filterContains) {
				return true;
			}
			return body.toLowerCase().includes(filterContains.toLowerCase());
		}

		it('should match case-insensitively', () => {
			expect(filterByBodyContains('Hello World', 'hello')).toBe(true);
			expect(filterByBodyContains('HELLO WORLD', 'hello')).toBe(true);
		});

		it('should reject if body does not contain filter string', () => {
			expect(filterByBodyContains('Hello World', 'goodbye')).toBe(false);
		});

		it('should allow any body if filter is empty', () => {
			expect(filterByBodyContains('any message', undefined)).toBe(true);
		});
	});

	describe('From Me Filters', () => {
		function filterByFromMe(fromMe: boolean, filterFromMe?: boolean, filterExcludeFromMe?: boolean): boolean {
			if (filterFromMe === true && !fromMe) {
				return false;
			}
			if (filterExcludeFromMe === true && fromMe) {
				return false;
			}
			return true;
		}

		it('should allow own messages when fromMe filter is true', () => {
			expect(filterByFromMe(true, true, false)).toBe(true);
		});

		it('should reject other messages when fromMe filter is true', () => {
			expect(filterByFromMe(false, true, false)).toBe(false);
		});

		it('should allow other messages when excludeFromMe filter is true', () => {
			expect(filterByFromMe(false, false, true)).toBe(true);
		});

		it('should reject own messages when excludeFromMe filter is true', () => {
			expect(filterByFromMe(true, false, true)).toBe(false);
		});

		it('should allow all messages when no filter is set', () => {
			expect(filterByFromMe(true, false, false)).toBe(true);
			expect(filterByFromMe(false, false, false)).toBe(true);
		});
	});

	describe('Group/Individual Filters', () => {
		function filterByGroupsOnly(chatId: string, groupsOnly?: boolean): boolean {
			if (groupsOnly === true && !chatId.includes('@g.us')) {
				return false;
			}
			return true;
		}

		function filterByIndividualsOnly(chatId: string, individualsOnly?: boolean): boolean {
			if (individualsOnly === true && !chatId.includes('@c.us')) {
				return false;
			}
			return true;
		}

		it('should allow group chats when groupsOnly is true', () => {
			expect(filterByGroupsOnly('123@g.us', true)).toBe(true);
		});

		it('should reject individual chats when groupsOnly is true', () => {
			expect(filterByGroupsOnly('123@c.us', true)).toBe(false);
		});

		it('should allow individual chats when individualsOnly is true', () => {
			expect(filterByIndividualsOnly('123@c.us', true)).toBe(true);
		});

		it('should reject group chats when individualsOnly is true', () => {
			expect(filterByIndividualsOnly('123@g.us', true)).toBe(false);
		});

		it('should allow all when no filter is set', () => {
			expect(filterByGroupsOnly('123@c.us', false)).toBe(true);
			expect(filterByIndividualsOnly('123@g.us', false)).toBe(true);
		});
	});

	describe('Filter Conflict Detection', () => {
		function hasFilterConflict(filters: {
			fromMe?: boolean;
			excludeFromMe?: boolean;
			groupsOnly?: boolean;
			individualsOnly?: boolean;
		}): boolean {
			// Both fromMe and excludeFromMe cannot be true
			if (filters.fromMe === true && filters.excludeFromMe === true) {
				return true;
			}
			// Both groupsOnly and individualsOnly cannot be true
			if (filters.groupsOnly === true && filters.individualsOnly === true) {
				return true;
			}
			return false;
		}

		it('should detect fromMe + excludeFromMe conflict', () => {
			expect(hasFilterConflict({ fromMe: true, excludeFromMe: true })).toBe(true);
		});

		it('should detect groupsOnly + individualsOnly conflict', () => {
			expect(hasFilterConflict({ groupsOnly: true, individualsOnly: true })).toBe(true);
		});

		it('should not detect conflict when filters are not mutually exclusive', () => {
			expect(hasFilterConflict({ fromMe: true, groupsOnly: true })).toBe(false);
		});

		it('should not detect conflict with empty filters', () => {
			expect(hasFilterConflict({})).toBe(false);
		});
	});
});
