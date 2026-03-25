import '@testing-library/jest-dom/vitest'

/**
 * Suppress noisy `null` output from libraries in CI.
 * Some libraries write `null` to stdout/stderr, which Vitest
 * outputs as "stdout/stderr | unknown test null" messages.
 */
if (process.env.CI) {
	const isNullOutput = (chunk: string | Uint8Array) =>
		typeof chunk === 'string' && chunk.trim() === 'null'

	const originalStderrWrite = process.stderr.write.bind(process.stderr)
	process.stderr.write = ((
		chunk: string | Uint8Array,
		encodingOrCallback?: BufferEncoding | ((err?: Error) => void),
		callback?: (err?: Error | null) => void
	): boolean => {
		if (isNullOutput(chunk)) return true
		return originalStderrWrite(chunk, encodingOrCallback as BufferEncoding, callback)
	}) as typeof process.stderr.write

	const originalStdoutWrite = process.stdout.write.bind(process.stdout)
	process.stdout.write = ((
		chunk: string | Uint8Array,
		encodingOrCallback?: BufferEncoding | ((err?: Error) => void),
		callback?: (err?: Error | null) => void
	): boolean => {
		if (isNullOutput(chunk)) return true
		return originalStdoutWrite(chunk, encodingOrCallback as BufferEncoding, callback)
	}) as typeof process.stdout.write
}

/**
 * Proxy for files that import and instantiate workers
 */

globalThis.Worker = new Proxy(class {} as new () => Worker, {
	construct() {
		return new Proxy(
			{},
			{
				get() {
					return () => {}
				},
				set() {
					return true
				},
			}
		)
	},
})
