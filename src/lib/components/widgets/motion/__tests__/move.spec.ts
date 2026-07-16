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
			componentName: 'my-arm',
			isPending: false,
			lastError: null,
			storageKey: `test-move-${keySeq++}`,
			onExecute: vi.fn(),
			...props,
		})

	it('disables Execute when no component name is set', () => {
		renderSubject({ componentName: '' })

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

	it('calls onExecute with the current pose inputs', async () => {
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

	it('displays the provided error', () => {
		renderSubject({ lastError: new Error('move failed') })

		expect(screen.getByText(/move failed/iu)).toBeInTheDocument()
	})
})
