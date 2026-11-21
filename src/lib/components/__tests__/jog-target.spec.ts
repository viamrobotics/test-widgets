import { describe, expect, it } from 'vitest'

import { jogTarget, type JogTargetOptions } from '../jog-target'

describe('jogTarget', () => {
	it.each<{ name: string; options: JogTargetOptions; expected: number | undefined }>([
		{
			name: 'adds the step on an increase inside the bounds',
			options: { start: 412.5, direction: 'increase', step: 10, min: 0, max: 1000 },
			expected: 422.5,
		},
		{
			name: 'subtracts the step on a decrease inside the bounds',
			options: { start: 412.5, direction: 'decrease', step: 10, min: 0, max: 1000 },
			expected: 402.5,
		},
		{
			name: 'clamps an increase that would pass max to max',
			options: { start: 995, direction: 'increase', step: 10, min: 0, max: 1000 },
			expected: 1000,
		},
		{
			name: 'clamps a decrease that would pass min to min',
			options: { start: 4, direction: 'decrease', step: 10, min: 0, max: 1000 },
			expected: 0,
		},
		{
			name: 'returns nothing to send on an increase from max',
			options: { start: 1000, direction: 'increase', step: 10, min: 0, max: 1000 },
			expected: undefined,
		},
		{
			name: 'returns nothing to send on a decrease from min',
			options: { start: 0, direction: 'decrease', step: 10, min: 0, max: 1000 },
			expected: undefined,
		},
		{
			name: 'returns nothing to send on an increase from past max',
			options: { start: 1003, direction: 'increase', step: 10, min: 0, max: 1000 },
			expected: undefined,
		},
		{
			name: 'still decreases from max',
			options: { start: 1000, direction: 'decrease', step: 10, min: 0, max: 1000 },
			expected: 990,
		},
		{
			name: 'does not clamp an increase when max is absent',
			options: { start: 1495, direction: 'increase', step: 10, min: 0 },
			expected: 1505,
		},
		{
			name: 'does not clamp a decrease when min is absent',
			options: { start: 4, direction: 'decrease', step: 10, max: 1000 },
			expected: -6,
		},
		{
			name: 'moves either way with no bounds at all',
			options: { start: -170, direction: 'decrease', step: 15 },
			expected: -185,
		},
	])('$name', ({ options, expected }) => {
		expect(jogTarget(options)).toBe(expected)
	})
})
