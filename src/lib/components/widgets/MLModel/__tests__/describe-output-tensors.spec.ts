import type { FlatTensors } from '@viamrobotics/sdk'

import { describe, expect, it } from 'vitest'

import { describeOutputTensors } from '../describe-output-tensors'

// The SDK exports `FlatTensors` as a type only, so a plain shape stands in for the message.
const isFlatTensors = (value: unknown): value is FlatTensors =>
	typeof value === 'object' && value !== null && 'tensors' in value

const floatOutput = (data: number[]): FlatTensors => {
	const output: unknown = {
		tensors: {
			out: { shape: [BigInt(data.length)], tensor: { case: 'floatTensor', value: { data } } },
		},
	}
	if (!isFlatTensors(output)) throw new Error('Output tensors are not a name-indexed map')
	return output
}

describe('describeOutputTensors', () => {
	it('writes a non-finite value into the copied summary as its text', () => {
		const [row] = describeOutputTensors(floatOutput([Number.NaN, Infinity, 1]))

		expect(row?.preview).toBe('NaN, Infinity, 1')
		expect(row?.summary.data).toEqual(['NaN', 'Infinity', 1])
		expect(JSON.stringify(row?.summary.data)).toBe('["NaN","Infinity",1]')
	})
})
