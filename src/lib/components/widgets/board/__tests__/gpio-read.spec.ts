import type { ComponentProps } from 'svelte'

import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../gpio-read.svelte'

const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
	render(Subject, {
		gpioState: undefined,
		pwmDutyCycle: undefined,
		pwmFreq: undefined,
		getState: vi.fn(),
		getDutyCycle: vi.fn(),
		getFrequency: vi.fn(),
		...props,
	})

describe('Board GPIO Read', () => {
	let user: ReturnType<typeof userEvent.setup>
	let getState: () => void
	let getDutyCycle: () => void
	let getFrequency: () => void

	beforeEach(() => {
		user = userEvent.setup()
		getState = vi.fn()
		getDutyCycle = vi.fn()
		getFrequency = vi.fn()
	})

	it('calls getState', async () => {
		renderSubject({
			getState,
		})

		const stateSection = screen.getByRole('region', { name: 'State' })
		const getStateButton = within(stateSection).getByRole('button', {
			name: /get/iu,
		})
		await user.click(getStateButton)

		expect(getState).toHaveBeenCalled()
	})

	it('calls getDutyCycle', async () => {
		renderSubject({
			getDutyCycle,
		})

		const dutyCycleSection = screen.getByRole('region', {
			name: /PWM duty cycle/iu,
		})
		const getDutyCycleButton = within(dutyCycleSection).getByRole('button', {
			name: /get/iu,
		})
		await user.click(getDutyCycleButton)

		expect(getDutyCycle).toHaveBeenCalled()
	})

	it('calls getFrequency', async () => {
		renderSubject({
			getFrequency,
		})

		const frequencySection = screen.getByRole('region', {
			name: /PWM frequency/iu,
		})
		const getFrequencyButton = within(frequencySection).getByRole('button', {
			name: /get/iu,
		})
		await user.click(getFrequencyButton)

		expect(getFrequency).toHaveBeenCalled()
	})

	it('displays empty values for all sections', () => {
		renderSubject({})

		const stateSection = screen.getByRole('region', { name: /State/iu })
		const stateOutput = within(stateSection).getByRole('status')
		const dutyCycleSection = screen.getByRole('region', {
			name: /PWM duty cycle/iu,
		})
		const dutyCycleOutput = within(dutyCycleSection).getByRole('status')
		const frequencySection = screen.getByRole('region', {
			name: /PWM frequency/iu,
		})
		const frequencyOutput = within(frequencySection).getByRole('status')
		expect(stateOutput).toBeInTheDocument()
		expect(stateOutput).toHaveTextContent(/––/iu)
		expect(dutyCycleOutput).toBeInTheDocument()
		expect(dutyCycleOutput).toHaveTextContent(/––/iu)
		expect(frequencyOutput).toBeInTheDocument()
		expect(frequencyOutput).toHaveTextContent(/––/iu)
	})

	it('displays state==high', () => {
		renderSubject({
			gpioState: true,
		})

		const stateSection = screen.getByRole('region', { name: /State/iu })
		const stateOutput = within(stateSection).getByRole('status')
		expect(stateOutput).toBeInTheDocument()
		expect(stateOutput).toHaveTextContent(/High/iu)
	})

	it('displays state==low', () => {
		renderSubject({
			gpioState: false,
		})

		const stateSection = screen.getByRole('region', { name: /State/iu })
		const stateOutput = within(stateSection).getByRole('status')
		expect(stateOutput).toBeInTheDocument()
		expect(stateOutput).toHaveTextContent(/Low/iu)
	})

	it('displays PWM duty cycle', () => {
		renderSubject({
			pwmDutyCycle: 50,
		})

		const dutyCycleSection = screen.getByRole('region', {
			name: /PWM duty cycle/iu,
		})
		const dutyCycleOutput = within(dutyCycleSection).getByRole('status')
		expect(dutyCycleOutput).toBeInTheDocument()
		expect(dutyCycleOutput).toHaveTextContent(/50.0000/iu)
	})

	it('displays PWM frequency', () => {
		renderSubject({
			pwmFreq: 1000,
		})

		const frequencySection = screen.getByRole('region', {
			name: /PWM frequency/iu,
		})
		const frequencyOutput = within(frequencySection).getByRole('status')
		expect(frequencyOutput).toBeInTheDocument()
		expect(frequencyOutput).toHaveTextContent(/1000.00/iu)
	})
})
