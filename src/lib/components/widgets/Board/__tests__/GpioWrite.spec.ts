import type { ComponentProps } from 'svelte'

import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../GpioWrite.svelte'

const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
	render(Subject, {
		setState: vi.fn(async () => true),
		setDutyCycle: vi.fn(async () => true),
		setFrequency: vi.fn(async () => true),
		...props,
	})

const STATE_SET = 0
const DUTY_CYCLE_SET = 1
const FREQUENCY_SET = 2

const setButton = (position: number) => {
	const button = screen.getAllByRole('button', { name: 'Set' }).at(position)
	if (!button) throw new Error(`No Set button at ${position}`)
	return button
}

describe('Board GPIO Write', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
	})

	it('draws State as Low then High, with High picked', () => {
		renderSubject({})

		const state = within(screen.getByRole('radiogroup', { name: 'State' }))
		const [first, second] = state.getAllByRole('radio')
		expect(first).toHaveAccessibleName('Low')
		expect(second).toHaveAccessibleName('High')
		expect(second).toHaveAttribute('aria-checked', 'true')
		expect(first).toHaveAttribute('aria-checked', 'false')
	})

	it('calls setState with true for the default High', async () => {
		const setState = vi.fn(async () => true)
		renderSubject({ setState })

		await user.click(setButton(STATE_SET))

		expect(setState).toHaveBeenCalledWith(true)
	})

	it('calls setState with false once Low is picked', async () => {
		const setState = vi.fn(async () => true)
		renderSubject({ setState })
		await user.click(screen.getByRole('radio', { name: 'Low' }))

		await user.click(setButton(STATE_SET))

		expect(setState).toHaveBeenCalledWith(false)
	})

	it('calls setDutyCycle with the typed percent divided by 100', async () => {
		const setDutyCycle = vi.fn(async () => true)
		renderSubject({ setDutyCycle })

		const dutyCycle = screen.getByRole('spinbutton', { name: 'Duty cycle' })
		await user.clear(dutyCycle)
		await user.type(dutyCycle, '73')
		await user.click(setButton(DUTY_CYCLE_SET))

		expect(setDutyCycle).toHaveBeenCalledWith(0.73)
	})

	it('calls setFrequency with the typed hertz', async () => {
		const setFrequency = vi.fn(async () => true)
		renderSubject({ setFrequency })

		const frequency = screen.getByRole('spinbutton', { name: 'Frequency' })
		await user.clear(frequency)
		await user.type(frequency, '1000')
		await user.click(setButton(FREQUENCY_SET))

		expect(setFrequency).toHaveBeenCalledWith(1000)
	})

	it('bounds Duty cycle to 0 to 100 and Frequency from 0, each in whole steps', () => {
		renderSubject({})

		const dutyCycle = screen.getByRole('spinbutton', { name: 'Duty cycle' })
		const frequency = screen.getByRole('spinbutton', { name: 'Frequency' })
		expect(dutyCycle).toHaveValue(0)
		expect(dutyCycle).toHaveAttribute('min', '0')
		expect(dutyCycle).toHaveAttribute('max', '100')
		expect(dutyCycle).toHaveAttribute('step', '1')
		expect(frequency).toHaveValue(0)
		expect(frequency).toHaveAttribute('min', '0')
		expect(frequency).toHaveAttribute('step', '1')
	})

	it('suffixes Duty cycle with % and Frequency with Hz', () => {
		renderSubject({})

		expect(screen.getByRole('spinbutton', { name: 'Duty cycle' })).toHaveAccessibleDescription('%')
		expect(screen.getByRole('spinbutton', { name: 'Frequency' })).toHaveAccessibleDescription('Hz')
	})
})
