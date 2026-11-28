import { describe, expect, it } from 'vitest'

import {
	executeCommand,
	joinTrajectories,
	parsePlanResult,
	planCommand,
	PlanCommandError,
} from '../builtin-plan-command'
import { poseGoalMoveArgs } from '../motion-jog-request'

const moveArgs = poseGoalMoveArgs({
	armName: 'arm-1',
	goal: { x: 1, y: 2, z: 3, oX: 0, oY: 0, oZ: 1, theta: 90 },
	isStraightLine: true,
})

const requestOf = (command: ReturnType<typeof planCommand>): Record<string, unknown> => {
	const { plan } = command
	if (typeof plan !== 'string') throw new Error('plan verb is not a string')
	return JSON.parse(plan)
}

describe('planCommand', () => {
	it('serializes the move into the plan verb with protojson names', () => {
		const request = requestOf(planCommand(moveArgs, undefined))
		expect(request).toMatchObject({
			componentName: 'arm-1',
			destination: { referenceFrame: 'world', pose: { x: 1, oZ: 1, theta: 90 } },
			constraints: { linearConstraint: [{}] },
			extra: { timeout: 5 },
		})
	})

	it('carries start_state only when given', () => {
		expect(requestOf(planCommand(moveArgs, undefined)).extra).not.toHaveProperty('start_state')
		const request = requestOf(planCommand(moveArgs, { 'arm-1': [0.1, 0.2] }))
		expect(request.extra).toMatchObject({
			start_state: { configuration: { 'arm-1': [0.1, 0.2] } },
			timeout: 5,
		})
	})

	it('refuses a non-finite pose', () => {
		const args = poseGoalMoveArgs({
			armName: 'arm-1',
			goal: { x: Number.NaN, y: 0, z: 0, oX: 0, oY: 0, oZ: 1, theta: 0 },
			isStraightLine: false,
		})
		expect(() => planCommand(args, undefined)).toThrow(PlanCommandError)
	})
})

describe('executeCommand', () => {
	it('runs the trajectory with the default start check', () => {
		expect(executeCommand([{ 'arm-1': [0, 1] }])).toEqual({
			execute: [{ 'arm-1': [0, 1] }],
			executeCheckStart: 0,
		})
	})
})

describe('parsePlanResult', () => {
	it('reads a trajectory', () => {
		const trajectory = [{ 'arm-1': [0, 1] }, { 'arm-1': [0.5, 1] }]
		expect(parsePlanResult({ plan: trajectory })).toEqual({ trajectory })
	})

	it.each([
		['a non-object reply', 'nope'],
		['a missing plan', {}],
		['a null plan', { plan: null }],
		['a plan that is not a list', { plan: 'x' }],
		['an empty plan', { plan: [] }],
		['a step naming no component', { plan: [{}] }],
		['a null joint value', { plan: [{ 'arm-1': [null] }] }],
		['the older joint-value format', { plan: [{ 'arm-1': [{ Value: 1 }] }] }],
	])('throws PlanCommandError for %s', (_label, reply) => {
		expect(() => parsePlanResult(reply)).toThrow(PlanCommandError)
	})

	it.each([
		[{ plan: [{}] }, 'Motion service returned a trajectory step naming no components.'],
		[{ plan: [[1, 2]] }, 'Motion service returned a trajectory step with unnamed joint values.'],
		[{ plan: [null] }, 'Motion service returned a null trajectory step.'],
		[
			{ plan: [{ 'arm-1': 1 }] },
			'Motion service returned a non-list joint value for component "arm-1".',
		],
		[
			{ plan: [{ 'arm-1': [null] }] },
			'Motion service returned a null joint value for component "arm-1".',
		],
		[
			{ plan: [{ 'arm-1': ['1'] }] },
			'Motion service returned a non-numeric joint value for component "arm-1".',
		],
	])('says how %j is malformed', (reply, message) => {
		expect(() => parsePlanResult(reply)).toThrow(message)
	})
})

describe('joinTrajectories', () => {
	it('returns one trajectory unchanged', () => {
		const trajectory = [{ 'arm-1': [0, 1] }, { 'arm-1': [2, 3] }]
		const joined = joinTrajectories([trajectory])
		expect(joined).toEqual([{ 'arm-1': [0, 1] }, { 'arm-1': [2, 3] }])
		expect(joined).not.toBe(trajectory)
	})

	it('drops the first step of the second trajectory', () => {
		expect(
			joinTrajectories([
				[{ 'arm-1': [0] }, { 'arm-1': [1] }],
				[{ 'arm-1': [1] }, { 'arm-1': [2] }],
			])
		).toEqual([{ 'arm-1': [0] }, { 'arm-1': [1] }, { 'arm-1': [2] }])
	})

	it('joins three trajectories', () => {
		expect(
			joinTrajectories([
				[{ 'arm-1': [0] }, { 'arm-1': [1] }],
				[{ 'arm-1': [1] }, { 'arm-1': [2] }],
				[{ 'arm-1': [2] }, { 'arm-1': [3] }],
			])
		).toEqual([{ 'arm-1': [0] }, { 'arm-1': [1] }, { 'arm-1': [2] }, { 'arm-1': [3] }])
	})

	it('throws PlanCommandError for an empty list', () => {
		expect(() => joinTrajectories([])).toThrow(PlanCommandError)
	})
})
