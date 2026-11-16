import { fireEvent, render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../open-widget.svelte'

const state = vi.hoisted((): { openMutate: Mock; error: Error | null } => ({
	openMutate: vi.fn(),
	error: null,
}))

vi.mock('@viamrobotics/sdk', () => ({
	GripperClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({
		mutate: state.openMutate,
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

describe('Gripper Open widget', () => {
	beforeEach(() => {
		state.openMutate.mockClear()
		state.error = null
	})

	it('renders the Open section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Open' })).toBeInTheDocument()
	})

	it('sends open when the button is clicked', async () => {
		renderSubject()

		await fireEvent.click(screen.getByRole('button', { name: /^open$/iu }))

		expect(state.openMutate).toHaveBeenCalledTimes(1)
		expect(state.openMutate).toHaveBeenCalledWith([], {})
	})

	it("shows the open error in the section's error indicator", async () => {
		state.error = new Error('gripper refused to open')

		renderSubject()
		await fireEvent.focus(screen.getByRole('button', { name: '1 error, copy to clipboard' }))

		expect(screen.getByText(/gripper refused to open/iu)).toBeInTheDocument()
	})
})
