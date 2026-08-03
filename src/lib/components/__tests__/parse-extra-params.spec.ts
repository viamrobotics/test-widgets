import { describe, expect, it } from 'vitest'

import * as Subject from '../parse-extra-params'

describe('parseExtraParams', () => {
	it.each(['', '   ', '\n'])('returns no params and no error for blank input %j', (input) => {
		expect(Subject.parseExtraParams(input)).toEqual({ params: undefined, error: undefined })
	})

	it('parses a JSON object', () => {
		const { params, error } = Subject.parseExtraParams('{"quality": 75, "nested": {"a": true}}')
		expect(params).toEqual({ quality: 75, nested: { a: true } })
		expect(error).toBeUndefined()
	})

	it('returns an error for invalid JSON', () => {
		const { params, error } = Subject.parseExtraParams('{"quality": ')
		expect(params).toBeUndefined()
		expect(error).toBeInstanceOf(Error)
	})

	it.each(['[1, 2]', '42', '"text"', 'null', 'true'])(
		'returns an error for non-object JSON %s',
		(input) => {
			const { params, error } = Subject.parseExtraParams(input)
			expect(params).toBeUndefined()
			expect(error?.message).toBe('Additional parameters must be a JSON object')
		}
	)
})
