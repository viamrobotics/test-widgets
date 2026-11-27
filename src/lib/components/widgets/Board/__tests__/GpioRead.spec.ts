import type { ComponentProps } from 'svelte'

import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../GpioRead.svelte'

const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
	render(Subject, {
		gpioState: undefined,
		pwmDutyCycle: undefined,
		pwmFrequency: undefined,
		getState: vi.fn(async () => true),
		getDutyCycle: vi.fn(async () => true),
		getFrequency: vi.fn(async () => true),
		...props,
	})

const row = (name: string) => within(screen.getByRole('group', { name }))

describe('Board GPIO Read', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
	})

	it('calls getState from the State row', async () => {
		const getState = vi.fn(async () => true)
		renderSubject({ getState })

		await user.click(row('State').getByRole('button', { name: 'Get' }))

		expect(getState).toHaveBeenCalledOnce()
	})

	it('calls getDutyCycle from the Duty cycle row', async () => {
		const getDutyCycle = vi.fn(async () => true)
		renderSubject({ getDutyCycle })

		await user.click(row('Duty cycle').getByRole('button', { name: 'Get' }))

		expect(getDutyCycle).toHaveBeenCalledOnce()
	})

	it('calls getFrequency from the Frequency row', async () => {
		const getFrequency = vi.fn(async () => true)
		renderSubject({ getFrequency })

		await user.click(row('Frequency').getByRole('button', { name: 'Get' }))

		expect(getFrequency).toHaveBeenCalledOnce()
	})

	it('reads - in every row before a read', () => {
		renderSubject({})

		expect(row('State').getByRole('status')).toHaveTextContent('-')
		expect(row('Duty cycle').getByRole('status')).toHaveTextContent('- %')
		expect(row('Frequency').getByRole('status')).toHaveTextContent('- Hz')
	})

	it('reads a high state as High beside a dot named High', () => {
		renderSubject({ gpioState: true })

		const state = row('State').getByRole('status')
		expect(state).toHaveTextContent('High')
		expect(within(state).getByRole('img', { name: 'High' })).toBeInTheDocument()
	})

	it('reads a low state as Low beside a dot named Low', () => {
		renderSubject({ gpioState: false })

		const state = row('State').getByRole('status')
		expect(state).toHaveTextContent('Low')
		expect(within(state).getByRole('img', { name: 'Low' })).toBeInTheDocument()
	})

	it('shows the duty cycle from 0 to 100 with its % unit inside the announced value', () => {
		renderSubject({ pwmDutyCycle: 0.5 })

		expect(row('Duty cycle').getByRole('status')).toHaveTextContent('50.00 %')
	})

	it('shows the frequency in whole hertz with its Hz unit inside the announced value', () => {
		renderSubject({ pwmFrequency: 1000 })

		expect(row('Frequency').getByRole('status')).toHaveTextContent('1000 Hz')
	})
})
