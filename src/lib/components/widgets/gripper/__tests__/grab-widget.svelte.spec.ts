import { fireEvent, render, screen } from '@testing-library/svelte'
import { createResourceMutation } from '@viamrobotics/svelte-sdk'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../grab-widget.svelte'

const { grabMutate } = vi.hoisted(() => ({
	grabMutate: vi.fn(),
}))

vi.mock('@viamrobotics/sdk', () => ({
	GripperClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({
		mutate: grabMutate,
		isPending: false,
		error: null,
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-gripper' },
	})

describe('Gripper Grab widget', () => {
	it('renders its own Grab section', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Grab' })).toBeInTheDocument()
	})

	it('sends grab when the button is clicked', async () => {
		renderSubject()

		await fireEvent.click(screen.getByRole('button', { name: /^grab$/iu }))

		expect(grabMutate).toHaveBeenCalledTimes(1)
		expect(grabMutate).toHaveBeenCalledWith([], {})
	})

	it('shows the grab error in the section error indicator', async () => {
		vi.mocked(createResourceMutation).mockReturnValue({
			mutate: grabMutate,
			isPending: false,
			error: new Error('gripper refused to grab'),
		} as never)

		renderSubject()

		await fireEvent.focus(screen.getByRole('button', { name: '1 error, copy to clipboard' }))

		expect(screen.getByText(/gripper refused to grab/iu)).toBeInTheDocument()
	})
})
