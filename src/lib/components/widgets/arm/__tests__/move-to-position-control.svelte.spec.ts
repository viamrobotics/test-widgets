import type { Pose } from '@viamrobotics/sdk'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { MotionClient } from '@viamrobotics/sdk'
import { createResourceClient, useResourceStatuses } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { FrameConfigEntry } from '../../motion/frame-system-config'

import Subject from '../move-to-position-control.svelte'

interface PollOptions {
	enabled?: boolean
	refetchInterval?: number
}

const { moveMutate, moveToPositionMutate, robotQueryOptions } = vi.hoisted(() => ({
	moveMutate: vi.fn(),
	moveToPositionMutate: vi.fn(),
	robotQueryOptions: new Map<string, unknown>(),
}))

/** The pose the motion service reports in the world frame. */
const worldPose: Pose = {
	x: 1,
	y: 2,
	z: 3,
	oX: 4,
	oY: 5,
	oZ: 6,
	theta: 7,
}

/** The pose the arm reports about its own origin, deliberately distinct from `worldPose`. */
const armPose: Pose = {
	x: 11,
	y: 12,
	z: 13,
	oX: 14,
	oY: 15,
	oZ: 16,
	theta: 17,
}

let frameSystem: FrameConfigEntry[] = []

vi.mock('@viamrobotics/sdk', () => ({
	ArmClient: class {},
	MotionClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn((_client: unknown, method: string) => {
		if (method === 'move') {
			return { error: null, isPending: false, mutate: moveMutate }
		}
		return { error: null, isPending: false, mutate: moveToPositionMutate }
	}),
	createResourceQuery: vi.fn(() => ({
		data: armPose,
		error: null,
		isLoading: false,
		isSuccess: true,
	})),
	createRobotQuery: vi.fn((_client: unknown, method: string, ...rest: unknown[]) => {
		robotQueryOptions.set(method, rest.at(-1))
		if (method === 'frameSystemConfig') {
			return { data: frameSystem, error: null, isLoading: false, isSuccess: true }
		}
		return {
			data: { pose: worldPose, referenceFrame: 'world' },
			error: null,
			isLoading: false,
			isSuccess: true,
		}
	}),
	useRobotClient: vi.fn(() => ({ current: {} })),
	useResourceStatuses: vi.fn(() => ({ current: [] })),
}))

const mockMotionServiceNames = (names: string[]) => {
	vi.mocked(useResourceStatuses).mockReturnValue({
		current: names.map((name) => ({
			name: { name, namespace: 'rdk', type: 'service', subtype: 'motion' },
		})),
	} as never)
}

const mockFrameSystem = (frameNames: string[]) => {
	frameSystem = frameNames.map((referenceFrame) => ({ frame: { referenceFrame } }))
}

const currentMotionServiceName = (): string => {
	const calls = vi.mocked(createResourceClient).mock.calls
	const motionClientCall = calls.findLast(([resourceClient]) => resourceClient === MotionClient)
	if (!motionClientCall) {
		throw new Error('MotionClient was never created')
	}
	const nameGetter = motionClientCall[2]
	return nameGetter()
}

const queryOptionsFor = (method: string): PollOptions => {
	const options = robotQueryOptions.get(method)
	return typeof options === 'function' ? (options() as PollOptions) : (options as PollOptions)
}

const poseInputValues = (): (number | null)[] =>
	screen.getAllByRole('spinbutton').map((input) => (input as HTMLInputElement).valueAsNumber)

describe('MoveToPositionControl', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
		moveMutate.mockClear()
		moveToPositionMutate.mockClear()
		robotQueryOptions.clear()
		mockMotionServiceNames([])
		mockFrameSystem(['arm-1'])
	})

	it('defaults to motion mode when a motion service can plan for the arm', () => {
		mockMotionServiceNames(['builtin'])
		render(Subject, { props: { partID: 'part-1', resourceName: 'arm-1' } })

		expect(screen.getByRole('button', { name: 'Motion service' })).toHaveAttribute(
			'aria-pressed',
			'true'
		)
		expect(
			screen.getByText(/movement goes through motion planning and attempts to avoid obstacles/iu)
		).toBeInTheDocument()
	})

	it('hides the toggle and shows the danger banner when no motion service exists', () => {
		render(Subject, { props: { partID: 'part-1', resourceName: 'arm-1' } })

		expect(screen.queryByRole('button', { name: 'Motion service' })).not.toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'Arm' })).not.toBeInTheDocument()
		expect(
			screen.getByText(/the arm will not avoid obstacles when moving\. use with caution/iu)
		).toBeInTheDocument()
	})

	it('offers direct control only, and says why, when the arm has no frame', () => {
		mockMotionServiceNames(['builtin'])
		mockFrameSystem(['some-other-arm'])
		render(Subject, { props: { partID: 'part-1', resourceName: 'arm-1' } })

		expect(screen.queryByRole('button', { name: 'Motion service' })).not.toBeInTheDocument()
		expect(
			screen.getByText(/arm-1 has no frame, so the motion service cannot plan for it/iu)
		).toBeInTheDocument()
	})

	it('still renders the pose editor when the arm has no frame', () => {
		mockMotionServiceNames(['builtin'])
		mockFrameSystem([])
		render(Subject, { props: { partID: 'part-1', resourceName: 'arm-1' } })

		expect(poseInputValues()).toEqual([11, 12, 13, 14, 15, 16, 17])
	})

	it('never asks for a world-frame pose the machine cannot resolve', () => {
		mockMotionServiceNames(['builtin'])
		mockFrameSystem([])
		render(Subject, { props: { partID: 'part-1', resourceName: 'arm-1' } })

		expect(queryOptionsFor('getPose').enabled).toBe(false)
	})

	it('polls the world-frame pose so Current position does not go stale', () => {
		mockMotionServiceNames(['builtin'])
		render(Subject, { props: { partID: 'part-1', resourceName: 'arm-1' } })

		expect(queryOptionsFor('getPose')).toMatchObject({ enabled: true, refetchInterval: 500 })
	})

	it('reseeds the pose editor from the newly active frame when the mode changes', async () => {
		mockMotionServiceNames(['builtin'])
		render(Subject, { props: { partID: 'part-1', resourceName: 'arm-1' } })

		expect(poseInputValues()).toEqual([1, 2, 3, 4, 5, 6, 7])

		await user.click(screen.getByRole('button', { name: 'Arm' }))

		expect(poseInputValues()).toEqual([11, 12, 13, 14, 15, 16, 17])
	})

	it('shows the danger banner after toggling to direct mode', async () => {
		mockMotionServiceNames(['builtin'])
		render(Subject, { props: { partID: 'part-1', resourceName: 'arm-1' } })

		await user.click(screen.getByRole('button', { name: 'Arm' }))

		expect(
			screen.getByText(/the arm will not avoid obstacles when moving\. use with caution/iu)
		).toBeInTheDocument()
	})

	it('routes Execute through the motion service in motion mode', async () => {
		mockMotionServiceNames(['builtin'])
		render(Subject, { props: { partID: 'part-1', resourceName: 'arm-1' } })

		await user.click(screen.getByRole('button', { name: /execute/iu }))

		expect(moveMutate).toHaveBeenCalledWith(
			[{ referenceFrame: 'world', pose: worldPose }, 'arm-1'],
			{}
		)
		expect(moveToPositionMutate).not.toHaveBeenCalled()
	})

	it('routes Execute through the arm directly in direct mode', async () => {
		mockMotionServiceNames(['builtin'])
		render(Subject, { props: { partID: 'part-1', resourceName: 'arm-1' } })

		await user.click(screen.getByRole('button', { name: 'Arm' }))
		await user.click(screen.getByRole('button', { name: /execute/iu }))

		expect(moveToPositionMutate).toHaveBeenCalledWith([armPose], {})
		expect(moveMutate).not.toHaveBeenCalled()
	})

	it('routes Execute through the arm directly when no motion service exists', async () => {
		render(Subject, { props: { partID: 'part-1', resourceName: 'arm-1' } })

		await user.click(screen.getByRole('button', { name: /execute/iu }))

		expect(moveToPositionMutate).toHaveBeenCalledWith([armPose], {})
		expect(moveMutate).not.toHaveBeenCalled()
	})

	it('hides the motion service select when only one motion service exists', () => {
		mockMotionServiceNames(['builtin'])
		render(Subject, { props: { partID: 'part-1', resourceName: 'arm-1' } })

		expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
	})

	it('shows the motion service select defaulting to builtin when multiple motion services exist', () => {
		mockMotionServiceNames(['custom-motion', 'builtin'])
		render(Subject, { props: { partID: 'part-1', resourceName: 'arm-1' } })

		expect(screen.getByRole('combobox')).toHaveValue('builtin')
	})

	it('targets the motion client at the selected non-builtin service', async () => {
		mockMotionServiceNames(['custom-motion', 'builtin'])
		render(Subject, { props: { partID: 'part-1', resourceName: 'arm-1' } })

		await user.selectOptions(screen.getByRole('combobox'), 'custom-motion')

		expect(currentMotionServiceName()).toBe('custom-motion')
	})
})
