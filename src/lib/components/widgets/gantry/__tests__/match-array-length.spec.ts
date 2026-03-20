import { describe, expect, it } from 'vitest'

import { matchArrayLength } from '../match-array-length.ts'

describe('GantryView match-array-length', () => {
	it('truncates the source array if it is longer than the target array', () => {
		const source = [1, 2, 3, 4]
		const target = [5, 6]
		const result = matchArrayLength(source, target, 0)
		expect(result).toEqual([1, 2])
	})

	it('returns the source array unchanged if it is the same length as the target array', () => {
		const source = [1, 2]
		const target = [3, 4]
		const result = matchArrayLength(source, target, 0)
		expect(result).toEqual([1, 2])
	})

	it('pads with the correct padValue when source array is shorter', () => {
		const source = [1]
		const target = [5, 6, 7, 8]
		const padValue = 9
		const result = matchArrayLength(source, target, padValue)
		expect(result).toEqual([1, 9, 9, 9])
	})

	it('handles empty source array', () => {
		const source: number[] = []
		const target = [5, 6]
		const result = matchArrayLength(source, target, 0)
		expect(result).toEqual([0, 0])
	})
})
