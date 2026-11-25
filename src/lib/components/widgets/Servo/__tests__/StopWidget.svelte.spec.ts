import { fireEvent, render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../StopWidget.svelte'

const { stopMutate, mutationState } = vi.hoisted(() => {
	const state: { error: Error | null } = { error: null }
	return { stopMutate: vi.fn(), mutationState: state }
})

vi.mock('@viamrobotics/sdk', () => ({
	ServoClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({
		mutate: stopMutate,
		isPending: false,
		error: mutationState.error,
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-servo' },
	})

describe('Servo Stop widget', () => {
	beforeEach(() => {
		stopMutate.mockClear()
		mutationState.error = null
	})

	it('renders the Stop section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Stop' })).toBeInTheDocument()
	})

	it('sends stop when the button is clicked', async () => {
		renderSubject()

		await fireEvent.click(screen.getByRole('button', { name: /^stop$/iu }))

		expect(stopMutate).toHaveBeenCalledTimes(1)
		expect(stopMutate).toHaveBeenCalledWith([])
	})

	it("shows the stop error in the section's error indicator", async () => {
		mutationState.error = new Error('servo refused to stop')

		renderSubject()
		await fireEvent.focusIn(
			screen.getByRole('button', { name: 'Stop: 1 error, copy to clipboard' })
		)

		expect(screen.getByText(/servo refused to stop/iu)).toBeInTheDocument()
	})
})
