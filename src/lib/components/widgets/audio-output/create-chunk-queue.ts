export interface ChunkQueue {
	/** Chunks pushed after `close` or `abort` are dropped. */
	push: (chunk: Uint8Array) => void
	/** Ends the stream once the chunks already pushed are read. */
	close: () => void
	/** Ends the stream now and drops the chunks not yet read. */
	abort: () => void
	chunks: AsyncIterable<Uint8Array>
}

/**
 * A queue of chunks read as an async iterable, for the request stream of a client call. Each
 * stream makes its own queue, so a chunk pushed to one never reaches another.
 */
export const createChunkQueue = (onRead?: (chunk: Uint8Array) => void): ChunkQueue => {
	const buffered: Uint8Array[] = []
	let isClosed = false
	let wake: (() => void) | undefined

	const notify = () => {
		wake?.()
		wake = undefined
	}

	const push = (chunk: Uint8Array) => {
		if (isClosed) return
		buffered.push(chunk)
		notify()
	}
	const close = () => {
		isClosed = true
		notify()
	}
	const abort = () => {
		buffered.length = 0
		close()
	}

	async function* read(): AsyncGenerator<Uint8Array> {
		while (true) {
			const next = buffered.shift()
			if (next !== undefined) {
				onRead?.(next)
				yield next
			} else if (isClosed) {
				return
			} else {
				await new Promise<void>((resolve) => {
					wake = resolve
				})
			}
		}
	}

	return { push, close, abort, chunks: read() }
}
