import { fireEvent, render, screen } from '@testing-library/svelte'
import { createResourceMutation } from '@viamrobotics/svelte-sdk'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../set-velocity-widget.svelte'

const { setVelocityMutate } = vi.hoisted(() => ({
	setVelocityMutate: vi.fn(),
}))

vi.mock('@viamrobotics/sdk', () => ({
	BaseClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({
		mutate: setVelocityMutate,
		isPending: false,
		error: null,
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-base' },
	})

describe('Base SetVelocity widget', () => {
	it('renders the SetVelocity section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'SetVelocity' })).toBeInTheDocument()
	})

	it('sends setVelocity with the default vectors when Execute is clicked', async () => {
		renderSubject()

		const executeButton = screen.getByRole('button', { name: /execute/iu })
		await fireEvent.click(executeButton)

		expect(setVelocityMutate).toHaveBeenCalledTimes(1)
		expect(setVelocityMutate).toHaveBeenCalledWith(
			[
				{ x: 0, y: 50, z: 0 },
				{ x: 0, y: 0, z: 15 },
			],
			{}
		)
	})

	it('shows the setVelocity error in the section’s error indicator', async () => {
		vi.mocked(createResourceMutation).mockReturnValue({
			mutate: setVelocityMutate,
			isPending: false,
			error: new Error('base refused setVelocity'),
		} as never)

		renderSubject()
		await fireEvent.focus(screen.getByRole('button', { name: '1 error, copy to clipboard' }))

		expect(screen.getByText(/base refused setVelocity/iu)).toBeInTheDocument()
	})
})
