import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WWebJsApi } from '../nodes/WWebJsApi/WWebJsApi.node';
import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';

// ─── Helpers to build mock IExecuteFunctions ──────────────────────────

function createMockExecuteFunctions(opts: {
	items: INodeExecutionData[];
	params: Record<string, unknown>;
	credentials?: IDataObject;
	requestResponse?: IDataObject | IDataObject[];
	requestResponses?: Array<IDataObject | IDataObject[]>;
	continueOnFail?: boolean;
	requestError?: Error;
}): IExecuteFunctions {
	let requestCallIndex = 0;

	const mock = {
		getInputData: vi.fn(() => opts.items),
		getNodeParameter: vi.fn((name: string, index: number, fallback?: unknown) => {
			// Support per-item params via "paramName_<index>" keys
			const perItemKey = `${name}_${index}`;
			if (perItemKey in opts.params) {
				return opts.params[perItemKey];
			}
			if (name in opts.params) {
				return opts.params[name];
			}
			return fallback;
		}),
		getCredentials: vi.fn(async () => opts.credentials ?? {
			baseUrl: 'http://localhost:3000',
			apiKey: 'test-key',
			defaultSessionId: 'default-session',
		}),
		getNode: vi.fn(() => ({ name: 'WWebJS API', type: 'wWebJsApi' })),
		helpers: {
			request: vi.fn(async () => {
				if (opts.requestError) {
					throw opts.requestError;
				}
				if (opts.requestResponses) {
					return opts.requestResponses[requestCallIndex++];
				}
				return opts.requestResponse ?? { success: true };
			}),
		},
		continueOnFail: vi.fn(() => opts.continueOnFail ?? false),
	} as unknown as IExecuteFunctions;

	return mock;
}

// ─── Tests ────────────────────────────────────────────────────────────

describe('WWebJsApi Node — execute()', () => {
	let node: WWebJsApi;

	beforeEach(() => {
		node = new WWebJsApi();
	});

	// ── pairedItem tracking ──

	describe('pairedItem tracking', () => {
		it('should include pairedItem on single-item response', async () => {
			const mockFn = createMockExecuteFunctions({
				items: [{ json: { inputField: 'value1' } }],
				params: {
					resource: 'session',
					operation: 'getStatus',
					sessionId: 'test-session',
				},
				requestResponse: { success: true, state: 'CONNECTED' },
			});

			const result = await node.execute.call(mockFn);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].pairedItem).toEqual({ item: 0 });
		});

		it('should include pairedItem on array response', async () => {
			const mockFn = createMockExecuteFunctions({
				items: [{ json: { inputField: 'value1' } }],
				params: {
					resource: 'session',
					operation: 'getSessions',
				},
				requestResponse: [
					{ id: 'session1', status: 'CONNECTED' },
					{ id: 'session2', status: 'DISCONNECTED' },
				] as unknown as IDataObject,
			});

			const result = await node.execute.call(mockFn);

			expect(result[0]).toHaveLength(2);
			expect(result[0][0].pairedItem).toEqual({ item: 0 });
			expect(result[0][1].pairedItem).toEqual({ item: 0 });
		});

		it('should include pairedItem on error with continueOnFail', async () => {
			const mockFn = createMockExecuteFunctions({
				items: [{ json: { inputField: 'value1' } }],
				params: {
					resource: 'session',
					operation: 'getStatus',
					sessionId: 'test-session',
				},
				requestError: new Error('API down'),
				continueOnFail: true,
			});

			const result = await node.execute.call(mockFn);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].pairedItem).toEqual({ item: 0 });
			expect(result[0][0].json.error).toContain('API down');
		});

		it('should assign correct pairedItem index for each input item', async () => {
			const mockFn = createMockExecuteFunctions({
				items: [
					{ json: { chatId: '111@c.us' } },
					{ json: { chatId: '222@c.us' } },
					{ json: { chatId: '333@c.us' } },
				],
				params: {
					resource: 'client',
					operation: 'sendMessage',
					chatId_0: '111@c.us',
					chatId_1: '222@c.us',
					chatId_2: '333@c.us',
					contentType: 'string',
					content: 'Hello',
					contentJson: '{}',
					options: {},
					sessionId: 'test-session',
				},
				requestResponses: [
					{ success: true, messageId: 'msg1' },
					{ success: true, messageId: 'msg2' },
					{ success: true, messageId: 'msg3' },
				],
			});

			const result = await node.execute.call(mockFn);

			expect(result[0]).toHaveLength(3);
			expect(result[0][0].pairedItem).toEqual({ item: 0 });
			expect(result[0][1].pairedItem).toEqual({ item: 1 });
			expect(result[0][2].pairedItem).toEqual({ item: 2 });
		});
	});

	// ── Input data forwarding (merge) ──

	describe('input data forwarding', () => {
		it('should merge input data with API response', async () => {
			const mockFn = createMockExecuteFunctions({
				items: [{ json: { myCustomField: 'preserve-me', extraData: 42 } }],
				params: {
					resource: 'session',
					operation: 'getStatus',
					sessionId: 'test-session',
				},
				requestResponse: { success: true, state: 'CONNECTED' },
			});

			const result = await node.execute.call(mockFn);

			expect(result[0][0].json).toEqual({
				myCustomField: 'preserve-me',
				extraData: 42,
				success: true,
				state: 'CONNECTED',
			});
		});

		it('should let API response override input fields on collision', async () => {
			const mockFn = createMockExecuteFunctions({
				items: [{ json: { success: false, inputOnly: 'kept' } }],
				params: {
					resource: 'session',
					operation: 'getStatus',
					sessionId: 'test-session',
				},
				requestResponse: { success: true, state: 'CONNECTED' },
			});

			const result = await node.execute.call(mockFn);

			// API response 'success: true' overrides input 'success: false'
			expect(result[0][0].json.success).toBe(true);
			// Input-only field preserved
			expect(result[0][0].json.inputOnly).toBe('kept');
			// API field present
			expect(result[0][0].json.state).toBe('CONNECTED');
		});

		it('should merge input data with each element of array response', async () => {
			const mockFn = createMockExecuteFunctions({
				items: [{ json: { requestedBy: 'admin' } }],
				params: {
					resource: 'session',
					operation: 'getSessions',
				},
				requestResponse: [
					{ id: 'session1', status: 'CONNECTED' },
					{ id: 'session2', status: 'DISCONNECTED' },
				] as unknown as IDataObject,
			});

			const result = await node.execute.call(mockFn);

			expect(result[0]).toHaveLength(2);
			expect(result[0][0].json).toEqual({
				requestedBy: 'admin',
				id: 'session1',
				status: 'CONNECTED',
			});
			expect(result[0][1].json).toEqual({
				requestedBy: 'admin',
				id: 'session2',
				status: 'DISCONNECTED',
			});
		});

		it('should forward different input data per item', async () => {
			const mockFn = createMockExecuteFunctions({
				items: [
					{ json: { name: 'Alice', chatId: '111@c.us' } },
					{ json: { name: 'Bob', chatId: '222@c.us' } },
				],
				params: {
					resource: 'client',
					operation: 'sendMessage',
					chatId_0: '111@c.us',
					chatId_1: '222@c.us',
					contentType: 'string',
					content: 'Hello',
					contentJson: '{}',
					options: {},
					sessionId: 'test-session',
				},
				requestResponses: [
					{ success: true, messageId: 'msg1' },
					{ success: true, messageId: 'msg2' },
				],
			});

			const result = await node.execute.call(mockFn);

			expect(result[0]).toHaveLength(2);
			expect(result[0][0].json).toMatchObject({ name: 'Alice', messageId: 'msg1' });
			expect(result[0][1].json).toMatchObject({ name: 'Bob', messageId: 'msg2' });
		});
	});

	// ── Multiple items processing ──

	describe('multiple items processing', () => {
		it('should process all input items', async () => {
			const mockFn = createMockExecuteFunctions({
				items: [
					{ json: { idx: 0 } },
					{ json: { idx: 1 } },
					{ json: { idx: 2 } },
					{ json: { idx: 3 } },
					{ json: { idx: 4 } },
				],
				params: {
					resource: 'session',
					operation: 'getStatus',
					sessionId: 'test-session',
				},
				requestResponse: { success: true },
			});

			const result = await node.execute.call(mockFn);

			expect(result[0]).toHaveLength(5);
			for (let i = 0; i < 5; i++) {
				expect(result[0][i].json.idx).toBe(i);
				expect(result[0][i].pairedItem).toEqual({ item: i });
			}
		});

		it('should handle mixed success and failure with continueOnFail', async () => {
			let callCount = 0;
			const mockFn = createMockExecuteFunctions({
				items: [
					{ json: { idx: 0 } },
					{ json: { idx: 1 } },
					{ json: { idx: 2 } },
				],
				params: {
					resource: 'session',
					operation: 'getStatus',
					sessionId: 'test-session',
				},
				continueOnFail: true,
				requestResponse: { success: true },
			});

			// Override request mock: fail on second call
			(mockFn.helpers.request as ReturnType<typeof vi.fn>).mockImplementation(async () => {
				callCount++;
				if (callCount === 2) {
					throw new Error('Timeout on item 1');
				}
				return { success: true };
			});

			const result = await node.execute.call(mockFn);

			expect(result[0]).toHaveLength(3);
			// Item 0: success
			expect(result[0][0].json.success).toBe(true);
			expect(result[0][0].json.idx).toBe(0);
			expect(result[0][0].pairedItem).toEqual({ item: 0 });
			// Item 1: error
			expect(result[0][1].json.error).toContain('Timeout on item 1');
			expect(result[0][1].pairedItem).toEqual({ item: 1 });
			// Item 2: success
			expect(result[0][2].json.success).toBe(true);
			expect(result[0][2].json.idx).toBe(2);
			expect(result[0][2].pairedItem).toEqual({ item: 2 });
		});

		it('should throw on first error without continueOnFail', async () => {
			const mockFn = createMockExecuteFunctions({
				items: [
					{ json: { idx: 0 } },
					{ json: { idx: 1 } },
				],
				params: {
					resource: 'session',
					operation: 'getStatus',
					sessionId: 'test-session',
				},
				continueOnFail: false,
				requestError: new Error('Fatal error'),
			});

			await expect(node.execute.call(mockFn)).rejects.toThrow();
		});
	});

	// ── Empty input ──

	describe('edge cases', () => {
		it('should return empty array for zero input items', async () => {
			const mockFn = createMockExecuteFunctions({
				items: [],
				params: {
					resource: 'session',
					operation: 'getStatus',
				},
			});

			const result = await node.execute.call(mockFn);

			expect(result[0]).toHaveLength(0);
		});

		it('should handle input item with empty json', async () => {
			const mockFn = createMockExecuteFunctions({
				items: [{ json: {} }],
				params: {
					resource: 'session',
					operation: 'getStatus',
					sessionId: 'test-session',
				},
				requestResponse: { success: true, state: 'CONNECTED' },
			});

			const result = await node.execute.call(mockFn);

			expect(result[0][0].json).toEqual({ success: true, state: 'CONNECTED' });
			expect(result[0][0].pairedItem).toEqual({ item: 0 });
		});

		it('should handle API returning empty object', async () => {
			const mockFn = createMockExecuteFunctions({
				items: [{ json: { preserved: true } }],
				params: {
					resource: 'session',
					operation: 'getStatus',
					sessionId: 'test-session',
				},
				requestResponse: {},
			});

			const result = await node.execute.call(mockFn);

			expect(result[0][0].json).toEqual({ preserved: true });
			expect(result[0][0].pairedItem).toEqual({ item: 0 });
		});

		it('should handle API returning empty array', async () => {
			const mockFn = createMockExecuteFunctions({
				items: [{ json: { preserved: true } }],
				params: {
					resource: 'session',
					operation: 'getSessions',
				},
				requestResponse: [] as unknown as IDataObject,
			});

			const result = await node.execute.call(mockFn);

			expect(result[0]).toHaveLength(0);
		});
	});

	// ── Output structure conforms to n8n spec ──

	describe('n8n output format compliance', () => {
		it('should return INodeExecutionData[][] (2D array)', async () => {
			const mockFn = createMockExecuteFunctions({
				items: [{ json: {} }],
				params: {
					resource: 'session',
					operation: 'getStatus',
					sessionId: 'test-session',
				},
				requestResponse: { ok: true },
			});

			const result = await node.execute.call(mockFn);

			// Outer array (outputs)
			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(1);
			// Inner array (items)
			expect(Array.isArray(result[0])).toBe(true);
		});

		it('every output item should have json and pairedItem', async () => {
			const mockFn = createMockExecuteFunctions({
				items: [
					{ json: { a: 1 } },
					{ json: { b: 2 } },
				],
				params: {
					resource: 'session',
					operation: 'getStatus',
					sessionId: 'test-session',
				},
				requestResponse: { ok: true },
			});

			const result = await node.execute.call(mockFn);

			for (const item of result[0]) {
				expect(item).toHaveProperty('json');
				expect(item).toHaveProperty('pairedItem');
				expect(typeof item.json).toBe('object');
				expect(item.pairedItem).toHaveProperty('item');
			}
		});
	});
});
