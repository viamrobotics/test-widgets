import type { ComponentProps } from 'svelte'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../gpio-write.svelte'

const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
	render(Subject, {
		setState: vi.fn(),
		setDutyCycle: vi.fn(),
		setFrequency: vi.fn(),
		...props,
	})

describe('Board GPIO Write', () => {
	let user: ReturnType<typeof userEvent.setup>
	let setState: () => void
	let setDutyCycle: () => void
	let setFrequency: () => void

	beforeEach(() => {
		user = userEvent.setup()
		setState = vi.fn()
		setDutyCycle = vi.fn()
		setFrequency = vi.fn()
	})

	it('calls setState', async () => {
		renderSubject({ setState })

		const highButton = screen.getByRole('button', {
			name: /high/iu,
		})
		const lowButton = screen.getByRole('button', {
			name: /low/iu,
		})
		const setStateButton = screen.getAllByRole('button', { name: /Set/iu }).at(0)!
		await user.click(highButton)
		await user.click(setStateButton)
		expect(setState).toHaveBeenCalledWith(true)
		await user.click(lowButton)
		await user.click(setStateButton)
		expect(setState).toHaveBeenCalledWith(false)
	})

	it('calls setDutyCycle', async () => {
		renderSubject({
			setDutyCycle,
		})

		const dutyCycleInput = screen.getByRole('spinbutton', {
			name: /PWM duty cycle/iu,
		})
		await user.clear(dutyCycleInput)
		await user.type(dutyCycleInput, '73')
		const setDutyCycleButton = screen.getAllByRole('button', { name: /Set/iu }).at(1)!
		await user.click(setDutyCycleButton)

		expect(setDutyCycle).toHaveBeenCalledWith(0.73)
	})

	it('calls setFrequency', async () => {
		renderSubject({
			setFrequency,
		})

		const frequencyInput = screen.getByRole('spinbutton', {
			name: /PWM frequency/iu,
		})
		await user.clear(frequencyInput)
		await user.type(frequencyInput, '1000')
		const setFrequencyButton = screen.getAllByRole('button', { name: /Set/iu }).at(2)!
		await user.click(setFrequencyButton)

		expect(setFrequency).toHaveBeenCalledWith(1000)
	})

	it('displays empty initial values for all sections', () => {
		renderSubject({})

		const highStateButton = screen.getByRole('button', {
			name: /high/iu,
		})
		const lowStateButton = screen.getByRole('button', {
			name: /low/iu,
		})
		const frequencyInput = screen.getByRole('spinbutton', {
			name: /PWM frequency/iu,
		})
		const dutyCycleInput = screen.getByRole('spinbutton', {
			name: /PWM duty cycle/iu,
		})
		expect(highStateButton).toHaveAttribute('aria-pressed', 'true')
		expect(lowStateButton).toHaveAttribute('aria-pressed', 'false')
		expect(frequencyInput).toHaveValue(0)
		expect(dutyCycleInput).toHaveValue(0)
	})
})
