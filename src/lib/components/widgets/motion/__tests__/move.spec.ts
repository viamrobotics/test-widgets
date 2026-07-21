import type { ComponentProps } from 'svelte'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../move.svelte'

describe('Motion move', () => {
	let user: ReturnType<typeof userEvent.setup>
	let keySeq = 0

	beforeEach(() => {
		user = userEvent.setup()
		localStorage.clear()
	})

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>> = {}) =>
		render(Subject, {
			frameName: 'my-arm',
			destination: 'world',
			isPending: false,
			lastError: null,
			storageKey: `test-move-${keySeq++}`,
			onExecute: vi.fn(),
			...props,
		})

	it('disables Execute when no frame is set', () => {
		renderSubject({ frameName: '' })

		expect(screen.getByRole('button', { name: /execute/iu })).toHaveAttribute(
			'aria-disabled',
			'true'
		)
	})

	it('disables Execute while a move is pending', () => {
		renderSubject({ isPending: true })

		expect(screen.getByRole('button', { name: /execute/iu })).toHaveAttribute(
			'aria-disabled',
			'true'
		)
	})

	it('calls onExecute with the default pose when no current pose is provided', async () => {
		const onExecute = vi.fn()
		renderSubject({ onExecute })

		await user.click(screen.getByRole('button', { name: /execute/iu }))

		expect(onExecute).toHaveBeenCalledWith({
			referenceFrame: 'world',
			pose: { x: 0, y: 0, z: 0, oX: 0, oY: 0, oZ: 1, theta: 0 },
			worldStateJson: '',
			constraintsJson: '',
		})
	})

	it('uses the destination frame as the reference frame on execute', async () => {
		const onExecute = vi.fn()
		renderSubject({ destination: 'base', onExecute })

		await user.click(screen.getByRole('button', { name: /execute/iu }))

		expect(onExecute).toHaveBeenCalledWith(expect.objectContaining({ referenceFrame: 'base' }))
	})

	it('pre-fills the pose editor from the current pose', () => {
		renderSubject({ currentPose: { x: 1, y: 2, z: 3, oX: 0, oY: 0, oZ: 1, theta: 45 } })

		const inputs = screen.getAllByRole('spinbutton')
		expect(inputs[0]).toHaveValue(1)
		expect(inputs[1]).toHaveValue(2)
		expect(inputs[2]).toHaveValue(3)
		expect(inputs[6]).toHaveValue(45)
	})

	it('executes with the pre-filled current pose when unedited', async () => {
		const onExecute = vi.fn()
		const currentPose = { x: 1, y: 2, z: 3, oX: 0, oY: 0, oZ: 1, theta: 45 }
		renderSubject({ currentPose, onExecute })

		await user.click(screen.getByRole('button', { name: /execute/iu }))

		expect(onExecute).toHaveBeenCalledWith(expect.objectContaining({ pose: currentPose }))
	})

	it('displays the provided error', () => {
		renderSubject({ lastError: new Error('move failed') })

		expect(screen.getByText(/move failed/iu)).toBeInTheDocument()
	})
})
