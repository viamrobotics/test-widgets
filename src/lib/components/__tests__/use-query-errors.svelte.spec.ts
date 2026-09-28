import { describe, expect, it } from 'vitest'

import { dedupeQueryErrors, type SectionQuery } from '../use-query-errors.svelte'

const errorQuery = (name: string, message: string): SectionQuery => {
	const error = new Error(message)
	error.name = name
	return { error, isLoading: false, isSuccess: false }
}

const successQuery = (): SectionQuery => ({ error: null, isLoading: false, isSuccess: true })

describe('dedupeQueryErrors', () => {
	it('returns one error when several queries fail with the same name and message', () => {
		const errors = dedupeQueryErrors([
			errorQuery('ConnectionError', 'Resource not found'),
			errorQuery('ConnectionError', 'Resource not found'),
		])

		expect(errors.map((error) => error.message)).toEqual(['Resource not found'])
	})

	it('keeps every distinct error in query order', () => {
		const errors = dedupeQueryErrors([
			errorQuery('ConnectionError', 'Resource unhealthy'),
			errorQuery('ConnectionError', 'Resource not found'),
		])

		expect(errors.map((error) => error.message)).toEqual([
			'Resource unhealthy',
			'Resource not found',
		])
	})

	it('ignores queries without an error', () => {
		expect(dedupeQueryErrors([successQuery(), successQuery()])).toEqual([])
	})

	it('treats a different name with the same message as a distinct error', () => {
		const errors = dedupeQueryErrors([
			errorQuery('ConnectionError', 'timed out'),
			errorQuery('TimeoutError', 'timed out'),
		])

		expect(errors.map((error) => error.name)).toEqual(['ConnectionError', 'TimeoutError'])
	})
})
