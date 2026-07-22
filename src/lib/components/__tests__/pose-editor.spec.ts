import type { Pose } from '@viamrobotics/sdk'
import type { ComponentProps } from 'svelte'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { assertExists } from '$lib/assert'

import Subject from '../pose-editor.svelte'

const defaultPose: Pose = { x: 1, y: 2, z: 3, oX: 0, oY: 0, oZ: 1, theta: 90 }

describe('PoseEditor', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
	})

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>> = {}) =>
		render(Subject, {
			pose: defaultPose,
			onPoseChange: vi.fn(),
			title: 'Pose',
			...props,
		})

	it('renders a spinbutton per pose field', () => {
		renderSubject()

		expect(screen.getAllByRole('spinbutton')).toHaveLength(7)
	})

	it('shows the description in an info tooltip when provided', () => {
		renderSubject({ description: 'expressed in the reference frame' })

		expect(screen.getByText(/expressed in the reference frame/iu)).toBeInTheDocument()
	})

	it('emits pose changes when a value is edited', async () => {
		const onPoseChange = vi.fn()
		renderSubject({ onPoseChange })

		const xInput = screen.getAllByRole('spinbutton')[0]
		assertExists(xInput, 'Expected an X input')

		await user.clear(xInput)
		await user.type(xInput, '5')
		await user.tab()

		expect(onPoseChange).toHaveBeenCalledWith({ ...defaultPose, x: 5 })
	})

	it('emits theta in degrees even when editing in radians', async () => {
		const onPoseChange = vi.fn()
		renderSubject({ onPoseChange })

		await user.click(screen.getByRole('button', { name: /switch to radians/iu }))

		const thetaInput = screen.getAllByRole('spinbutton')[6]
		assertExists(thetaInput, 'Expected a theta input')

		await user.clear(thetaInput)
		await user.type(thetaInput, '3.14159')
		await user.tab()

		expect(onPoseChange).toHaveBeenCalled()
		const emitted = onPoseChange.mock.calls.at(-1)?.[0] as Pose
		expect(emitted.theta).toBeCloseTo(180, 1)
	})
})
