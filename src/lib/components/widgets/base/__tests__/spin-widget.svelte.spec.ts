import { fireEvent, render, screen } from '@testing-library/svelte'
import { createResourceMutation } from '@viamrobotics/svelte-sdk'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../spin-widget.svelte'

const { spinMutate } = vi.hoisted(() => ({
	spinMutate: vi.fn(),
}))

vi.mock('@viamrobotics/sdk', () => ({
	BaseClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({
		mutate: spinMutate,
		isPending: false,
		error: null,
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-base' },
	})

describe('Base Spin widget', () => {
	it('renders the Spin section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Spin' })).toBeInTheDocument()
	})

	it('sends spin with the default angleDeg and degsPerSec when Execute is clicked', async () => {
		renderSubject()

		const executeButton = screen.getByRole('button', { name: /execute/iu })
		await fireEvent.click(executeButton)

		expect(spinMutate).toHaveBeenCalledTimes(1)
		expect(spinMutate).toHaveBeenCalledWith([90, 45], {})
	})

	it('shows the spin error in the section’s error indicator', async () => {
		vi.mocked(createResourceMutation).mockReturnValue({
			mutate: spinMutate,
			isPending: false,
			error: new Error('base refused spin'),
		} as never)

		renderSubject()
		await fireEvent.focus(screen.getByRole('button', { name: '1 error, copy to clipboard' }))

		expect(screen.getByText(/base refused spin/iu)).toBeInTheDocument()
	})
})
