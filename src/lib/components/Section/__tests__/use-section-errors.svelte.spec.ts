import { describe, expect, it } from 'vitest'

import { dedupeErrors } from '../use-section-errors.svelte'

const namedError = (name: string, message: string) => {
	const error = new Error(message)
	error.name = name
	return error
}

describe('dedupeErrors', () => {
	it('returns one error when several have the same name and message', () => {
		const errors = dedupeErrors([
			namedError('ConnectionError', 'Resource not found'),
			namedError('ConnectionError', 'Resource not found'),
		])

		expect(errors.map((error) => error.message)).toEqual(['Resource not found'])
	})

	it('keeps every distinct error in order', () => {
		const errors = dedupeErrors([
			namedError('ConnectionError', 'Resource unhealthy'),
			namedError('ConnectionError', 'Resource not found'),
		])

		expect(errors.map((error) => error.message)).toEqual([
			'Resource unhealthy',
			'Resource not found',
		])
	})

	it('ignores null entries', () => {
		expect(dedupeErrors([null, null])).toEqual([])
	})

	it('treats a different name with the same message as a distinct error', () => {
		const errors = dedupeErrors([
			namedError('ConnectionError', 'timed out'),
			namedError('TimeoutError', 'timed out'),
		])

		expect(errors.map((error) => error.name)).toEqual(['ConnectionError', 'TimeoutError'])
	})
})
