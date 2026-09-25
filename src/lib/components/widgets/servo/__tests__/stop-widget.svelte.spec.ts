import { fireEvent, render, screen } from '@testing-library/svelte'
import { createResourceMutation } from '@viamrobotics/svelte-sdk'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../stop-widget.svelte'

const { stopMutate } = vi.hoisted(() => ({
	stopMutate: vi.fn(),
}))

vi.mock('@viamrobotics/sdk', () => ({
	ServoClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({
		mutate: stopMutate,
		isPending: false,
		error: null,
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-servo' },
	})

describe('Servo Stop widget', () => {
	it('sends stop from its own Stop section when the button is clicked', async () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Stop' })).toBeInTheDocument()

		await fireEvent.click(screen.getByRole('button', { name: /^stop$/iu }))

		expect(stopMutate).toHaveBeenCalledTimes(1)
		expect(stopMutate).toHaveBeenCalledWith([])
	})

	it('shows the stop error below the button', () => {
		vi.mocked(createResourceMutation).mockReturnValue({
			mutate: stopMutate,
			isPending: false,
			error: new Error('servo refused to stop'),
		} as never)

		renderSubject()

		expect(screen.getByText(/servo refused to stop/iu)).toBeInTheDocument()
	})
})
