/**
 * Type definitions for WWebJS API Node
 */

import type { IDataObject } from 'n8n-workflow';

// ═══════════════════════════════════════════════════════════════════
// Content Types
// ═══════════════════════════════════════════════════════════════════

export type ContentType =
	| 'string'
	| 'MessageMedia'
	| 'MessageMediaFromURL'
	| 'Location'
	| 'Contact'
	| 'Poll';

export interface ParsedContent {
	contentType: ContentType;
	content: string | IDataObject;
}

// ═══════════════════════════════════════════════════════════════════
// Validation
// ═══════════════════════════════════════════════════════════════════

export interface ValidationResult {
	valid: boolean;
	error?: string;
}

// ═══════════════════════════════════════════════════════════════════
// API Response Types
// ═══════════════════════════════════════════════════════════════════

export interface WWebJsApiResponse extends IDataObject {
	success?: boolean;
	message?: string;
	data?: IDataObject | IDataObject[];
}

export interface SessionInfo extends IDataObject {
	id: string;
	status: 'STARTING' | 'SCAN_QR_CODE' | 'WORKING' | 'FAILED';
}

export interface ChatInfo extends IDataObject {
	id: {
		server: string;
		user: string;
		_serialized: string;
	};
	name: string;
	isGroup: boolean;
	isReadOnly: boolean;
	unreadCount: number;
	timestamp: number;
	archived: boolean;
	pinned: boolean;
	isMuted: boolean;
}

export interface MessageInfo extends IDataObject {
	id: {
		fromMe: boolean;
		remote: string;
		id: string;
		_serialized: string;
	};
	body: string;
	type: string;
	timestamp: number;
	from: string;
	to: string;
	author?: string;
	isForwarded: boolean;
	forwardingScore: number;
	isStatus: boolean;
	isStarred: boolean;
	broadcast: boolean;
	fromMe: boolean;
	hasMedia: boolean;
	hasQuotedMsg: boolean;
	mentionedIds: string[];
}

export interface ContactInfo extends IDataObject {
	id: {
		server: string;
		user: string;
		_serialized: string;
	};
	number: string;
	name: string;
	shortName: string;
	pushname: string;
	isUser: boolean;
	isGroup: boolean;
	isWAContact: boolean;
	isMyContact: boolean;
	isBlocked: boolean;
}

export interface GroupChatInfo extends ChatInfo {
	groupMetadata: {
		id: {
			server: string;
			user: string;
			_serialized: string;
		};
		owner: string;
		subject: string;
		subjectTime: number;
		creation: number;
		desc?: string;
		descId?: string;
		descTime?: number;
		restrict: boolean;
		announce: boolean;
		participants: GroupParticipant[];
	};
}

export interface GroupParticipant extends IDataObject {
	id: {
		server: string;
		user: string;
		_serialized: string;
	};
	isAdmin: boolean;
	isSuperAdmin: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Webhook Event Types
// ═══════════════════════════════════════════════════════════════════

export type WebhookEventType =
	| 'authenticated'
	| 'auth_failure'
	| 'message'
	| 'message_create'
	| 'message_ack'
	| 'message_revoke_everyone'
	| 'message_revoke_me'
	| 'qr'
	| 'ready'
	| 'disconnected'
	| 'change_state'
	| 'call'
	| 'group_join'
	| 'group_leave'
	| 'group_update'
	| 'chat_archived'
	| 'chat_removed'
	| 'loading_screen'
	| 'media_uploaded'
	| 'contact_changed';

export interface WebhookPayload extends IDataObject {
	dataType: WebhookEventType;
	sessionId: string;
	data: IDataObject;
}

export interface MessageWebhookData extends IDataObject {
	from: string;
	to: string;
	body: string;
	fromMe: boolean;
	chatId?: string;
	hasMedia: boolean;
	type: string;
}

// ═══════════════════════════════════════════════════════════════════
// Filter Types
// ═══════════════════════════════════════════════════════════════════

export interface TriggerFilters extends IDataObject {
	sessionId?: string;
	chatIdContains?: string;
	bodyContains?: string;
	fromMe?: boolean;
	excludeFromMe?: boolean;
	groupsOnly?: boolean;
	individualsOnly?: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Send Message Options
// ═══════════════════════════════════════════════════════════════════

export interface SendMessageOptions extends IDataObject {
	quotedMessageId?: string;
	mentions?: string[];
	sendSeen?: boolean;
}

export interface SendMessageBody extends IDataObject {
	chatId: string;
	contentType: ContentType;
	content: string | IDataObject;
	options?: SendMessageOptions;
}
