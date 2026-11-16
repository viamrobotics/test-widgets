import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../quick-move-widget.svelte'

const state = vi.hoisted((): { moveMutate: Mock; error: Error | null } => ({
	moveMutate: vi.fn(),
	error: null,
}))

vi.mock('@viamrobotics/sdk', () => ({
	ServoClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		data: 45,
		isLoading: false,
		isSuccess: true,
		isError: false,
		error: null,
	})),
	createResourceMutation: vi.fn(() => ({
		mutate: state.moveMutate,
		isPending: false,
		get error() {
			return state.error
		},
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-servo' },
	})

describe('Servo Quick move widget', () => {
	beforeEach(() => {
		state.moveMutate = vi.fn()
		state.error = null
	})

	it('renders the Quick move section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Quick move' })).toBeInTheDocument()
	})

	it('calls the move mutation when a quick-move button is pressed', async () => {
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: /plus-five-degrees/iu }))

		expect(state.moveMutate).toHaveBeenCalledWith([50], {})
	})

	it("shows the move error in the section's error indicator", () => {
		state.error = new Error('servo refused to move')

		renderSubject()

		expect(screen.getByRole('button', { name: '1 error, copy to clipboard' })).toBeInTheDocument()
	})
})
