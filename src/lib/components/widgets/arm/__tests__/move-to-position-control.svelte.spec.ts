import type { Pose } from '@viamrobotics/sdk'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { MotionClient } from '@viamrobotics/sdk'
import { createResourceClient, useResourceNames } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../move-to-position-control.svelte'

const { moveMutate, moveToPositionMutate } = vi.hoisted(() => ({
	moveMutate: vi.fn(),
	moveToPositionMutate: vi.fn(),
}))

const defaultPose: Pose = {
	x: 1,
	y: 2,
	z: 3,
	oX: 4,
	oY: 5,
	oZ: 6,
	theta: 7,
}

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
		data: defaultPose,
		error: null,
		isLoading: false,
		isSuccess: true,
	})),
	createRobotQuery: vi.fn(() => ({
		data: { pose: defaultPose, referenceFrame: 'world' },
		error: null,
		isLoading: false,
		isSuccess: true,
	})),
	useRobotClient: vi.fn(() => ({ current: {} })),
	useResourceNames: vi.fn(() => ({ current: [], query: undefined })),
}))

const mockMotionServiceNames = (names: string[]) => {
	vi.mocked(useResourceNames).mockReturnValue({
		current: names.map((name) => ({ name, namespace: 'rdk', type: 'service', subtype: 'motion' })),
		query: undefined,
	})
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

describe('MoveToPositionControl', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
		moveMutate.mockClear()
		moveToPositionMutate.mockClear()
		mockMotionServiceNames([])
	})

	it('defaults to motion mode when a motion service exists', () => {
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
			[{ referenceFrame: 'world', pose: defaultPose }, 'arm-1'],
			{}
		)
		expect(moveToPositionMutate).not.toHaveBeenCalled()
	})

	it('routes Execute through the arm directly in direct mode', async () => {
		mockMotionServiceNames(['builtin'])
		render(Subject, { props: { partID: 'part-1', resourceName: 'arm-1' } })

		await user.click(screen.getByRole('button', { name: 'Arm' }))
		await user.click(screen.getByRole('button', { name: /execute/iu }))

		expect(moveToPositionMutate).toHaveBeenCalledWith([defaultPose], {})
		expect(moveMutate).not.toHaveBeenCalled()
	})

	it('routes Execute through the arm directly when no motion service exists', async () => {
		render(Subject, { props: { partID: 'part-1', resourceName: 'arm-1' } })

		await user.click(screen.getByRole('button', { name: /execute/iu }))

		expect(moveToPositionMutate).toHaveBeenCalledWith([defaultPose], {})
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
