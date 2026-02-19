import { describe, it, expect } from 'vitest';
import {
	validateChatId,
	validateContactId,
	validateGroupChatId,
	validatePhoneNumber,
	validateChannelId,
	validateSessionId,
	parseContent,
	parseParticipantIds,
	parseMentions,
	buildEndpoint,
} from '../nodes/WWebJsApi/transport';

describe('Validation Functions', () => {
	describe('validateChatId', () => {
		it('should accept valid individual chat ID', () => {
			const result = validateChatId('34612345678@c.us');
			expect(result.valid).toBe(true);
			expect(result.error).toBeUndefined();
		});

		it('should accept valid group chat ID', () => {
			const result = validateChatId('34612345678@g.us');
			expect(result.valid).toBe(true);
		});

		it('should accept valid group chat ID with timestamp', () => {
			const result = validateChatId('34612345678-1234567890@g.us');
			expect(result.valid).toBe(true);
		});

		it('should reject empty chat ID', () => {
			const result = validateChatId('');
			expect(result.valid).toBe(false);
			expect(result.error).toBe('Chat ID is required');
		});

		it('should reject invalid format', () => {
			const result = validateChatId('invalid-chat-id');
			expect(result.valid).toBe(false);
			expect(result.error).toContain('Invalid chat ID format');
		});

		it('should reject chat ID without proper suffix', () => {
			const result = validateChatId('34612345678');
			expect(result.valid).toBe(false);
		});
	});

	describe('validateContactId', () => {
		it('should accept valid contact ID', () => {
			const result = validateContactId('34612345678@c.us');
			expect(result.valid).toBe(true);
		});

		it('should reject group ID as contact ID', () => {
			const result = validateContactId('34612345678@g.us');
			expect(result.valid).toBe(false);
			expect(result.error).toContain('Invalid contact ID format');
		});

		it('should reject empty contact ID', () => {
			const result = validateContactId('');
			expect(result.valid).toBe(false);
		});
	});

	describe('validateGroupChatId', () => {
		it('should accept valid group chat ID', () => {
			const result = validateGroupChatId('34612345678@g.us');
			expect(result.valid).toBe(true);
		});

		it('should accept group chat ID with timestamp', () => {
			const result = validateGroupChatId('123456789-1640000000@g.us');
			expect(result.valid).toBe(true);
		});

		it('should reject individual chat ID', () => {
			const result = validateGroupChatId('34612345678@c.us');
			expect(result.valid).toBe(false);
			expect(result.error).toContain('Invalid group chat ID format');
		});

		it('should reject empty group chat ID', () => {
			const result = validateGroupChatId('');
			expect(result.valid).toBe(false);
		});
	});

	describe('validatePhoneNumber', () => {
		it('should accept valid phone number', () => {
			const result = validatePhoneNumber('34612345678');
			expect(result.valid).toBe(true);
		});

		it('should accept phone number with spaces and clean it', () => {
			const result = validatePhoneNumber('34 612 345 678');
			expect(result.valid).toBe(true);
		});

		it('should reject too short phone number', () => {
			const result = validatePhoneNumber('123456');
			expect(result.valid).toBe(false);
		});

		it('should reject too long phone number', () => {
			const result = validatePhoneNumber('1234567890123456');
			expect(result.valid).toBe(false);
		});

		it('should reject empty phone number', () => {
			const result = validatePhoneNumber('');
			expect(result.valid).toBe(false);
		});
	});

	describe('validateChannelId', () => {
		it('should accept valid channel ID', () => {
			const result = validateChannelId('123456789@newsletter');
			expect(result.valid).toBe(true);
		});

		it('should reject invalid channel ID', () => {
			const result = validateChannelId('123456789@c.us');
			expect(result.valid).toBe(false);
		});

		it('should reject empty channel ID', () => {
			const result = validateChannelId('');
			expect(result.valid).toBe(false);
		});
	});

	describe('validateSessionId', () => {
		it('should accept valid session ID', () => {
			const result = validateSessionId('my-session');
			expect(result.valid).toBe(true);
		});

		it('should accept session ID with underscores', () => {
			const result = validateSessionId('my_session_123');
			expect(result.valid).toBe(true);
		});

		it('should reject session ID with special characters', () => {
			const result = validateSessionId('my session!');
			expect(result.valid).toBe(false);
		});

		it('should reject empty session ID', () => {
			const result = validateSessionId('');
			expect(result.valid).toBe(false);
		});
	});
});

describe('Parsing Functions', () => {
	describe('parseContent', () => {
		it('should parse text content correctly', () => {
			const result = parseContent('string', 'Hello World', '{}');
			expect(result.contentType).toBe('string');
			expect(result.content).toBe('Hello World');
		});

		it('should parse JSON content for media types', () => {
			const jsonContent = '{"mimetype": "image/png", "data": "base64data"}';
			const result = parseContent('MessageMedia', '', jsonContent);
			expect(result.contentType).toBe('MessageMedia');
			expect(result.content).toEqual({ mimetype: 'image/png', data: 'base64data' });
		});

		it('should parse location content', () => {
			const jsonContent = '{"latitude": 40.4168, "longitude": -3.7038}';
			const result = parseContent('Location', '', jsonContent);
			expect(result.contentType).toBe('Location');
			expect(result.content).toEqual({ latitude: 40.4168, longitude: -3.7038 });
		});

		it('should throw error for invalid JSON', () => {
			expect(() => {
				parseContent('MessageMedia', '', 'invalid json');
			}).toThrow('Invalid JSON content');
		});
	});

	describe('parseParticipantIds', () => {
		it('should parse comma-separated participant IDs', () => {
			const result = parseParticipantIds('34612345678@c.us, 34698765432@c.us');
			expect(result).toEqual(['34612345678@c.us', '34698765432@c.us']);
		});

		it('should trim whitespace from IDs', () => {
			const result = parseParticipantIds('  34612345678@c.us  ,  34698765432@c.us  ');
			expect(result).toEqual(['34612345678@c.us', '34698765432@c.us']);
		});

		it('should return empty array for empty string', () => {
			const result = parseParticipantIds('');
			expect(result).toEqual([]);
		});

		it('should throw error for invalid participant ID format', () => {
			expect(() => {
				parseParticipantIds('invalid-id');
			}).toThrow('Invalid participant ID');
		});

		it('should filter out empty entries', () => {
			const result = parseParticipantIds('34612345678@c.us,,34698765432@c.us,');
			expect(result).toEqual(['34612345678@c.us', '34698765432@c.us']);
		});
	});

	describe('parseMentions', () => {
		it('should parse comma-separated mentions', () => {
			const result = parseMentions('user1, user2, user3');
			expect(result).toEqual(['user1', 'user2', 'user3']);
		});

		it('should return empty array for empty string', () => {
			const result = parseMentions('');
			expect(result).toEqual([]);
		});

		it('should trim whitespace from mentions', () => {
			const result = parseMentions('  user1  ,  user2  ');
			expect(result).toEqual(['user1', 'user2']);
		});
	});
});

describe('Utility Functions', () => {
	describe('buildEndpoint', () => {
		it('should replace sessionId placeholder', () => {
			const result = buildEndpoint('/client/sendMessage/{sessionId}', 'my-session');
			expect(result).toBe('/client/sendMessage/my-session');
		});

		it('should handle paths without placeholder', () => {
			const result = buildEndpoint('/session/getSessions', 'my-session');
			expect(result).toBe('/session/getSessions');
		});

		it('should handle multiple occurrences of placeholder', () => {
			const result = buildEndpoint('/{sessionId}/test/{sessionId}', 'test-session');
			expect(result).toBe('/test-session/test/test-session');
		});
	});
});
