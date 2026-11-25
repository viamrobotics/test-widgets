import { fireEvent, render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../GrabWidget.svelte'

const state = vi.hoisted((): { grabMutate: Mock; error: Error | null } => ({
	grabMutate: vi.fn(),
	error: null,
}))

vi.mock('@viamrobotics/sdk', () => ({
	GripperClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({
		mutate: state.grabMutate,
		isPending: false,
		get error() {
			return state.error
		},
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-gripper' },
	})

describe('Gripper Grab widget', () => {
	beforeEach(() => {
		state.grabMutate.mockClear()
		state.error = null
	})

	it('renders the Grab section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Grab' })).toBeInTheDocument()
	})

	it('sends grab when the button is clicked', async () => {
		renderSubject()

		await fireEvent.click(screen.getByRole('button', { name: /^grab$/iu }))

		expect(state.grabMutate).toHaveBeenCalledTimes(1)
		expect(state.grabMutate).toHaveBeenCalledWith([], {})
	})

	it("shows the grab error in the section's error indicator", async () => {
		state.error = new Error('gripper refused to grab')

		renderSubject()
		await fireEvent.focus(screen.getByRole('button', { name: '1 error, copy to clipboard' }))

		expect(screen.getByText(/gripper refused to grab/iu)).toBeInTheDocument()
	})
})
