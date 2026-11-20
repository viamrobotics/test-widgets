import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../quick-move-widget.svelte'

const state = vi.hoisted((): { mutate: Mock; error: Error | null } => ({
	mutate: vi.fn(),
	error: null,
}))

vi.mock('@viamrobotics/sdk', () => ({
	MotorClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({
		mutate: state.mutate,
		isPending: false,
		get error() {
			return state.error
		},
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-motor' },
	})

describe('Motor QuickMove widget', () => {
	beforeEach(() => {
		state.mutate = vi.fn()
		state.error = null
	})

	it('renders the SetPower section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'SetPower' })).toBeInTheDocument()
	})

	it('calls the setPower mutation with forward power when the forward button is pressed', async () => {
		renderSubject()

		await userEvent.pointer({
			target: screen.getByRole('button', { name: /forward/iu }),
			keys: '[MouseLeft>]',
		})

		expect(state.mutate).toHaveBeenCalledWith([0.5], {})
	})

	it('calls the setPower mutation with backward power when the backward button is pressed', async () => {
		renderSubject()

		await userEvent.pointer({
			target: screen.getByRole('button', { name: /backward/iu }),
			keys: '[MouseLeft>]',
		})

		expect(state.mutate).toHaveBeenCalledWith([-0.5], {})
	})

	it('calls the setPower mutation with zero when the button is released', async () => {
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: /forward/iu }))

		expect(state.mutate).toHaveBeenLastCalledWith([0], {})
	})

	it("shows the mutation error in the section's error indicator", () => {
		state.error = new Error('motor refused to move')

		renderSubject()

		expect(
			screen.getByRole('button', { name: 'SetPower: 1 error, copy to clipboard' })
		).toBeInTheDocument()
	})
})
