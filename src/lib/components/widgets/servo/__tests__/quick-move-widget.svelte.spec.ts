import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../quick-move-widget.svelte'

const { quickMoveMutate } = vi.hoisted(() => ({
	quickMoveMutate: vi.fn(),
}))

vi.mock('@viamrobotics/sdk', () => ({
	ServoClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		data: undefined,
		isLoading: true,
		isError: false,
		error: null,
	})),
	createResourceMutation: vi.fn(() => ({
		mutate: quickMoveMutate,
		isPending: false,
		error: null,
	})),
}))

const mockPosition = (position: number) => {
	vi.mocked(createResourceQuery).mockReturnValue({
		data: position,
		isLoading: false,
		isSuccess: true,
		isError: false,
		error: null,
	} as never)
}

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-servo' },
	})

describe('Servo Quick move widget', () => {
	it('renders a Quick move heading', () => {
		mockPosition(10)

		renderSubject()

		expect(screen.getByRole('heading', { name: 'Quick move' })).toBeInTheDocument()
	})

	it('calls mutate with the current position plus 5 when the plus button is clicked', async () => {
		mockPosition(10)
		const user = userEvent.setup()

		renderSubject()

		const plusButton = screen.getByRole('button', { name: /plus-five-degrees/iu })
		await user.click(plusButton)

		expect(quickMoveMutate).toHaveBeenCalledOnce()
		expect(quickMoveMutate).toHaveBeenCalledWith([15], {})
	})
})
