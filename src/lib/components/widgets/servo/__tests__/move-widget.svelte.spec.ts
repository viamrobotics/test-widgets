import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../move-widget.svelte'

const { moveMutate } = vi.hoisted(() => ({
	moveMutate: vi.fn(),
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
		mutate: moveMutate,
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

describe('Servo Move widget', () => {
	it('renders a Move heading', () => {
		mockPosition(10)

		renderSubject()

		expect(screen.getByRole('heading', { name: 'Move' })).toBeInTheDocument()
	})

	it('calls mutate with the desired angle when the Execute button is clicked', async () => {
		mockPosition(10)
		const user = userEvent.setup()

		renderSubject()

		const numericInput = screen.getByRole('spinbutton')
		await user.clear(numericInput)
		await user.type(numericInput, '90')

		const executeButton = screen.getByRole('button', { name: /execute/iu })
		await user.click(executeButton)

		expect(moveMutate).toHaveBeenCalledOnce()
		expect(moveMutate).toHaveBeenCalledWith([90], {})
	})
})
