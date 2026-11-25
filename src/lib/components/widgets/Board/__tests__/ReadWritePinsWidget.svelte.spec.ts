import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { createResourceClient } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../ReadWritePinsWidget.svelte'

const boardCalls = vi.hoisted(() => ({ mutate: vi.fn() }))

vi.mock('@viamrobotics/sdk', () => ({
	BoardClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn((_client: unknown, method: string) => ({
		mutateAsync: (args: unknown[]) => boardCalls.mutate(method, args),
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-board' },
	})

describe('Board ReadWritePins widget', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
	})

	const enterPin = async (pin: string) => {
		await user.type(screen.getByRole('textbox', { name: 'Pin' }), pin)
		await user.tab()
	}

	it('shows the GPIO write pin section by default', () => {
		renderSubject()

		const writeSection = screen.getByRole('region', { name: 'Write pin' })
		expect(
			within(writeSection).getByRole('spinbutton', { name: /PWM duty cycle/iu })
		).toBeInTheDocument()
	})

	it('creates the board client for the given part', () => {
		renderSubject()

		const getPartID = vi.mocked(createResourceClient).mock.lastCall?.[1]
		expect(getPartID?.()).toBe('test-part')
	})

	it('creates the board client for the given resource name', () => {
		renderSubject()

		const getResourceName = vi.mocked(createResourceClient).mock.lastCall?.[2]
		expect(getResourceName?.()).toBe('test-board')
	})

	it('sends setGPIO high for the entered pin', async () => {
		renderSubject()
		await enterPin('7')

		await user.click(screen.getAllByRole('button', { name: 'Set' })[0])

		expect(boardCalls.mutate).toHaveBeenCalledWith('setGPIO', ['7', true])
	})

	it('sends getGPIO for the entered pin in read mode', async () => {
		renderSubject()
		await user.click(screen.getByRole('button', { name: 'Read' }))
		await enterPin('7')

		const stateSection = screen.getByRole('region', { name: 'State' })
		await user.click(within(stateSection).getByRole('button', { name: 'Get' }))

		expect(boardCalls.mutate).toHaveBeenCalledWith('getGPIO', ['7'])
	})

	it('sends readAnalogReader for the entered pin in analog read mode', async () => {
		renderSubject()
		await user.click(screen.getByRole('button', { name: 'Analog' }))
		await user.click(screen.getByRole('button', { name: 'Read' }))
		await enterPin('A1')

		const valueSection = screen.getByRole('region', { name: 'Value' })
		await user.click(within(valueSection).getByRole('button', { name: 'Get' }))

		expect(boardCalls.mutate).toHaveBeenCalledWith('readAnalogReader', ['A1'])
	})

	it('sends writeAnalog with the entered pin and value in analog write mode', async () => {
		renderSubject()
		await user.click(screen.getByRole('button', { name: 'Analog' }))
		await enterPin('A1')
		const valueInput = screen.getByRole('spinbutton', { name: 'Value' })
		await user.clear(valueInput)
		await user.type(valueInput, '2.5')

		await user.click(screen.getByRole('button', { name: 'Set' }))

		expect(boardCalls.mutate).toHaveBeenCalledWith('writeAnalog', ['A1', 2.5])
	})

	it('shows the error a failed board call rejects with', async () => {
		boardCalls.mutate.mockRejectedValue(new Error('board unreachable'))
		renderSubject()
		await enterPin('7')

		await user.click(screen.getAllByRole('button', { name: 'Set' })[0])

		expect(await screen.findByText('Error: board unreachable')).toBeInTheDocument()
	})
})
