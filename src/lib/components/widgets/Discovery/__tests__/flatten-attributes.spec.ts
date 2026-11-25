import { describe, expect, it } from 'vitest'

import { flattenAttributes } from '../flatten-attributes'

describe('flattenAttributes', () => {
	it('flattens nested objects to dotted keys', () => {
		expect(flattenAttributes({ a: 1, b: { c: 'x', d: { e: true } }, f: null })).toEqual({
			a: 1,
			'b.c': 'x',
			'b.d.e': true,
			f: null,
		})
	})

	it('returns an empty record for empty input and keeps an empty nested object', () => {
		expect(flattenAttributes({})).toEqual({})
		expect(flattenAttributes({ a: {} })).toEqual({ a: {} })
	})

	it('keeps arrays whole as one value', () => {
		expect(flattenAttributes({ a: { list: [1, { b: 2 }] } })).toEqual({
			'a.list': [1, { b: 2 }],
		})
	})
})
