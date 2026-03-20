import '@testing-library/jest-dom/vitest';

import { beforeEach, vi } from 'vitest';
import { matchMedia } from 'mock-match-media';

/**
 * Suppress noisy `null` output from libraries in CI.
 * Some libraries write `null` to stdout/stderr, which Vitest
 * outputs as "stdout/stderr | unknown test null" messages.
 */
if (process.env.CI) {
	const isNullOutput = (chunk: string | Uint8Array) =>
		typeof chunk === 'string' && chunk.trim() === 'null';

	const originalStderrWrite = process.stderr.write.bind(process.stderr);
	process.stderr.write = ((
		chunk: string | Uint8Array,
		encodingOrCallback?: BufferEncoding | ((err?: Error) => void),
		callback?: (err?: Error | null) => void
	): boolean => {
		if (isNullOutput(chunk)) return true;
		return originalStderrWrite(chunk, encodingOrCallback as BufferEncoding, callback);
	}) as typeof process.stderr.write;

	const originalStdoutWrite = process.stdout.write.bind(process.stdout);
	process.stdout.write = ((
		chunk: string | Uint8Array,
		encodingOrCallback?: BufferEncoding | ((err?: Error) => void),
		callback?: (err?: Error | null) => void
	): boolean => {
		if (isNullOutput(chunk)) return true;
		return originalStdoutWrite(chunk, encodingOrCallback as BufferEncoding, callback);
	}) as typeof process.stdout.write;
}

/**
 * Required for Svelte component testing
 */
globalThis.matchMedia = matchMedia;

/**
 * The 'maplibre-gl' library immediately invokes 'window.URL.createObjectURL' in global scope.
 * By default, our DOM unit testing environment does not provide stubs or mocks for the following URL methods.
 * Therefore these stubs exists to allow unit / component testing when we import 'maplibre-gl'.
 */
globalThis.URL.createObjectURL = (_obj: Blob | MediaSource): string => '';
globalThis.URL.revokeObjectURL = (_url: string) => undefined;

/**
 * Proxy for files that import and instantiate workers
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
globalThis.Worker = new Proxy(class {} as new () => Worker, {
	construct() {
		return new Proxy(
			{},
			{
				get() {
					// eslint-disable-next-line @typescript-eslint/no-empty-function
					return () => {};
				},
				set() {
					return true;
				}
			}
		);
	}
});

beforeEach(() => {
	if (window.navigator.userAgent.includes('jsdom')) {
		// TODO(mc, 2024-02-09): https://github.com/jsdom/jsdom/issues/3368
		vi.stubGlobal(
			'ResizeObserver',
			vi.fn(() => ({
				observe: vi.fn(),
				unobserve: vi.fn(),
				disconnect: vi.fn()
			}))
		);

		// TODO(mc, 2024-02-09): https://github.com/jsdom/jsdom/issues/3002
		Range.prototype.getClientRects = vi.fn(() => ({
			item: vi.fn(),
			length: 0,
			[Symbol.iterator]: vi.fn()
		}));
	}
});
