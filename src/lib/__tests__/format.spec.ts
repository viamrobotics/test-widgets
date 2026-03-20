import { describe, expect, it } from 'vitest'

import { formatNumeric } from '../format'

describe('formatNumeric', () => {
	const testCases = [
		{
			description: 'returns a number with two decimal places',
			input: 12.3456,
			decimal: undefined,
			expected: '12.35',
		},
		{
			description: 'returns a number with four decimal places',
			input: 12.3456,
			decimal: 4,
			expected: '12.3456',
		},
		{
			description: 'returns a number with no decimal places',
			input: 12.3456,
			decimal: 0,
			expected: '12',
		},
	]

	it.each(testCases)('$description', ({ decimal, expected, input }) => {
		expect(formatNumeric(input, decimal)).toEqual(expected)
	})

	it('returns –– when the input is undefined', () => {
		const result = formatNumeric(undefined)

		expect(result).toEqual('––')
	})

	it('returns NaN when the input is NaN', () => {
		const result = formatNumeric(Number.NaN)

		expect(result).toEqual('NaN')
	})

	it('returns +∞ when the input is positive infinity', () => {
		const result = formatNumeric(Number.POSITIVE_INFINITY)

		expect(result).toEqual('+∞')
	})

	it('returns -∞ when the input is negative infinity', () => {
		const result = formatNumeric(Number.NEGATIVE_INFINITY)

		expect(result).toEqual('-∞')
	})

	it('throws an error when decimal is negative', () => {
		const result = () => {
			formatNumeric(12.3456, -2)
		}

		expect(result).toThrowError()
	})
})
