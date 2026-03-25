import { describe, expect, it } from 'vitest'

import { compareAlphaNum, sortObjectKeys } from '../sort'

// Originally from ui/src/lib/__tests__/sort.spec.ts
describe('sortObjectKeys', () => {
	const testCases = [
		{
			description: 'sorts keys of a flat object ',
			input: { '2a': 2, '10b': 10, '1a': 1 },
			expected: { '1a': 1, '2a': 2, '10b': 10 },
		},
		{
			description: 'sorts keys of a nested object',
			input: { bb: { '2a': 2, '10b': 10 }, aa: { '1a': 1 } },
			expected: { aa: { '1a': 1 }, bb: { '2a': 2, '10b': 10 } },
		},
		{
			description: 'sorts keys of objects within an array',
			input: { array: [{ '2a': 2, '10b': 10 }, { '1a': 1 }] },
			expected: { array: [{ '2a': 2, '10b': 10 }, { '1a': 1 }] },
		},
		{
			description: 'noops an empty object',
			input: {},
			expected: {},
		},
		{
			description: 'noops a sorted object',
			input: { aa: 1, bb: 2 },
			expected: { aa: 1, bb: 2 },
		},
		{
			description: 'sorts keys with mixed cases',
			input: { AA: 1, bb: 2, CC: 3, aa: 4 },
			expected: { aa: 4, AA: 1, bb: 2, CC: 3 },
		},
		{
			description: 'sorts keys with special characters',
			input: { 'a#': 2, a$: 3, 'a!': 1 },
			expected: { 'a!': 1, 'a#': 2, a$: 3 },
		},
		{
			description: 'sorts keys with unicode characters',
			input: { ää: 1, aa: 2, ßß: 3, '😈': 5 },
			expected: { '😈': 5, aa: 2, ää: 1, ßß: 3 },
		},
		{
			description: 'sorts object with custom compareFn',
			input: { aa: [{ ee: 3, bb: 2, cc: 1 }], cc: 1, bb: 2 },
			expected: { cc: 1, bb: 2, aa: [{ ee: 3, cc: 1, bb: 2 }] },
			compareFn: (a: string, b: string) => compareAlphaNum(b, a),
		},
	]

	it.each(testCases)('$description', ({ expected, input, compareFn }) => {
		expect(JSON.stringify(sortObjectKeys(input, compareFn))).toEqual(JSON.stringify(expected))
	})
})
