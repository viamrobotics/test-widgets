import { fireEvent, render, screen } from '@testing-library/svelte'
import { createResourceMutation } from '@viamrobotics/svelte-sdk'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../open-widget.svelte'

const { openMutate } = vi.hoisted(() => ({
	openMutate: vi.fn(),
}))

vi.mock('@viamrobotics/sdk', () => ({
	GripperClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({
		mutate: openMutate,
		isPending: false,
		error: null,
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-gripper' },
	})

describe('Gripper Open widget', () => {
	it('renders its own Open section', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Open' })).toBeInTheDocument()
	})

	it('sends open when the button is clicked', async () => {
		renderSubject()

		await fireEvent.click(screen.getByRole('button', { name: /^open$/iu }))

		expect(openMutate).toHaveBeenCalledTimes(1)
		expect(openMutate).toHaveBeenCalledWith([], {})
	})

	it('shows the open error in the section error indicator', async () => {
		vi.mocked(createResourceMutation).mockReturnValue({
			mutate: openMutate,
			isPending: false,
			error: new Error('gripper refused to open'),
		} as never)

		renderSubject()

		await fireEvent.focus(screen.getByRole('button', { name: '1 error, copy to clipboard' }))

		expect(screen.getByText(/gripper refused to open/iu)).toBeInTheDocument()
	})
})
