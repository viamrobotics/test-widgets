import type { MotionClient, Pose } from '@viamrobotics/sdk'
import { describe, expect, it, vi } from 'vitest'

import {
	buildPlanMoveRequestJson,
	MOTION_DO_PLAN_COMMAND,
	validateMoveToPositionPlan,
} from '../validate-move-to-position-plan'

describe('validateMoveToPositionPlan', () => {
	const pose: Pose = {
		x: 10,
		y: 20,
		z: 30,
		oX: 0,
		oY: 0,
		oZ: 1,
		theta: 45,
	}

	it('builds a world-frame MoveRequest JSON payload', () => {
		const json = buildPlanMoveRequestJson('builtin', 'my-arm', pose)
		const parsed = JSON.parse(json) as {
			name: string
			componentName: string
			destination: { referenceFrame: string; pose: Pose }
		}

		expect(parsed.name).toBe('builtin')
		expect(parsed.componentName).toBe('my-arm')
		expect(parsed.destination.referenceFrame).toBe('world')
		expect(parsed.destination.pose).toMatchObject({
			x: 10,
			y: 20,
			z: 30,
			oZ: 1,
			theta: 45,
		})
	})

	it('calls motion doCommand with the plan key', async () => {
		const motionClient = {
			doCommand: vi.fn().mockResolvedValue({ plan: [] }),
		} as unknown as MotionClient

		await validateMoveToPositionPlan(motionClient, 'builtin', 'my-arm', pose)

		expect(motionClient.doCommand).toHaveBeenCalledWith({
			[MOTION_DO_PLAN_COMMAND]: buildPlanMoveRequestJson('builtin', 'my-arm', pose),
		})
	})

	it('propagates planning errors', async () => {
		const motionClient = {
			doCommand: vi.fn().mockRejectedValue(new Error('no plan found')),
		} as unknown as MotionClient

		await expect(
			validateMoveToPositionPlan(motionClient, 'builtin', 'my-arm', pose)
		).rejects.toThrow('no plan found')
	})
})
