import { Constraints, type Pose, WorldState } from '@viamrobotics/sdk'
import { describe, expect, it } from 'vitest'

import { type MoveInput, parseMoveArgs } from '../parse-move-args'

const pose: Pose = { x: 1, y: 2, z: 3, oX: 0, oY: 0, oZ: 1, theta: 90 }

const baseInput: MoveInput = {
	referenceFrame: 'world',
	pose,
	worldStateJson: '',
	constraintsJson: '',
}

describe('parseMoveArgs', () => {
	it('passes the destination pose and reference frame through unchanged', () => {
		const [destination, componentName] = parseMoveArgs('my-arm', baseInput)

		expect(componentName).toBe('my-arm')
		expect(destination).toEqual({ referenceFrame: 'world', pose })
	})

	it('omits world state and constraints when their JSON is empty or whitespace', () => {
		const args = parseMoveArgs('my-arm', {
			...baseInput,
			worldStateJson: '   ',
			constraintsJson: '\n',
		})

		expect(args[2]).toBeUndefined()
		expect(args[3]).toBeUndefined()
	})

	it('parses valid world state JSON into a WorldState message', () => {
		const args = parseMoveArgs('my-arm', {
			...baseInput,
			worldStateJson: '{}',
		})

		expect(args[2]).toBeInstanceOf(WorldState)
	})

	it('parses valid constraints JSON into a Constraints message', () => {
		const args = parseMoveArgs('my-arm', {
			...baseInput,
			constraintsJson: '{"orientationConstraint": [{"orientationToleranceDegs": 5}]}',
		})

		const constraints = args[3]
		expect(constraints).toBeInstanceOf(Constraints)
		expect(constraints?.orientationConstraint[0]?.orientationToleranceDegs).toBe(5)
	})

	it('throws when the JSON is invalid', () => {
		expect(() => parseMoveArgs('my-arm', { ...baseInput, worldStateJson: 'not json' })).toThrow()
	})
})
