import { Pose } from '@viamrobotics/sdk'
import { describe, expect, it } from 'vitest'

import { eulerToOrientationVector } from '$lib/orientation-vector-euler'

import type { PoseFieldStatus } from '../pose-field-status'

import { eulerFieldStatus } from '../euler-field-status'

type OrientationKey = 'oX' | 'oY' | 'oZ' | 'theta'

interface Overrides {
	editedKeys?: OrientationKey[]
	baselineOrientation?: Pick<Pose, OrientationKey>
	isMoving?: boolean
}

const poseOf = (orientation: Pick<Pose, OrientationKey>): Pose =>
	new Pose({ ...orientation, x: 0, y: 0, z: 0 })

const statusesFor = (
	live: Pick<Pose, OrientationKey>,
	{ editedKeys = [], baselineOrientation, isMoving = false }: Overrides = {}
) => {
	return (key: OrientationKey): PoseFieldStatus => {
		const isEdited = editedKeys.includes(key)
		const baseline = isEdited ? baselineOrientation?.[key] : undefined
		const moved = baseline === undefined ? 0 : Math.abs(live[key] - baseline)
		return {
			current: live[key],
			isEdited,
			drift: moved > 0.01 ? moved : undefined,
			isMoving,
			baseline,
		}
	}
}

const ALL_KEYS: OrientationKey[] = ['oX', 'oY', 'oZ', 'theta']

describe('eulerFieldStatus', () => {
	it('reads the live roll in degrees', () => {
		const live = { oX: 0, oY: 0, oZ: -1, theta: 90 }
		const status = eulerFieldStatus('roll', poseOf(live), statusesFor(live))
		expect(status.current).toBeCloseTo(180, 6)
	})

	it('reads the live pitch in degrees', () => {
		const live = { oX: 0, oY: 0, oZ: -1, theta: 90 }
		const status = eulerFieldStatus('pitch', poseOf(live), statusesFor(live))
		expect(status.current).toBeCloseTo(0, 6)
	})

	it('reads the live yaw in degrees', () => {
		const live = { oX: 0, oY: 0, oZ: -1, theta: 90 }
		const status = eulerFieldStatus('yaw', poseOf(live), statusesFor(live))
		expect(status.current).toBeCloseTo(90, 6)
	})

	it('reports no angle edited when no orientation key is edited', () => {
		const live = { oX: 0, oY: 0, oZ: -1, theta: 90 }
		const target = poseOf(live)
		const statuses = statusesFor(live)
		expect(eulerFieldStatus('roll', target, statuses).isEdited).toBe(false)
		expect(eulerFieldStatus('pitch', target, statuses).isEdited).toBe(false)
		expect(eulerFieldStatus('yaw', target, statuses).isEdited).toBe(false)
	})

	describe('with a target that changes only roll', () => {
		const live = eulerToOrientationVector({ roll: 180, pitch: 0, yaw: 90 })
		const target = poseOf(eulerToOrientationVector({ roll: 170, pitch: 0, yaw: 90 }))
		const statuses = statusesFor(live, { editedKeys: ALL_KEYS })

		it('marks roll edited', () => {
			expect(eulerFieldStatus('roll', target, statuses).isEdited).toBe(true)
		})

		it('leaves pitch unedited', () => {
			expect(eulerFieldStatus('pitch', target, statuses).isEdited).toBe(false)
		})

		it('leaves yaw unedited', () => {
			expect(eulerFieldStatus('yaw', target, statuses).isEdited).toBe(false)
		})
	})

	it('treats a target across the wrap, 0.02 degrees away, as not edited', () => {
		const live = eulerToOrientationVector({ roll: 180, pitch: 0, yaw: 90 })
		const target = poseOf(eulerToOrientationVector({ roll: -179.98, pitch: 0, yaw: 90 }))
		const statuses = statusesFor(live, { editedKeys: ALL_KEYS })
		expect(eulerFieldStatus('roll', target, statuses).isEdited).toBe(false)
	})

	describe('with the live pose moved since the edit', () => {
		const baselineOrientation = eulerToOrientationVector({ roll: 180, pitch: 0, yaw: 90 })
		const live = eulerToOrientationVector({ roll: 175, pitch: 0, yaw: 90 })
		const target = poseOf(eulerToOrientationVector({ roll: 170, pitch: 0, yaw: 90 }))
		const statuses = statusesFor(live, { editedKeys: ALL_KEYS, baselineOrientation })

		it('reports the roll drift in degrees', () => {
			expect(eulerFieldStatus('roll', target, statuses).drift).toBeCloseTo(5, 6)
		})

		it('reports no yaw drift for an unedited yaw', () => {
			expect(eulerFieldStatus('yaw', target, statuses).drift).toBeUndefined()
		})
	})

	it('carries isMoving on an edited angle', () => {
		const live = eulerToOrientationVector({ roll: 180, pitch: 0, yaw: 90 })
		const target = poseOf(eulerToOrientationVector({ roll: 170, pitch: 0, yaw: 90 }))
		const statuses = statusesFor(live, { editedKeys: ALL_KEYS, isMoving: true })
		const status = eulerFieldStatus('roll', target, statuses)
		expect(status.isEdited).toBe(true)
		expect(status.isMoving).toBe(true)
	})
})
