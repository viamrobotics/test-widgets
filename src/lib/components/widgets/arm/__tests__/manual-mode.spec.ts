import type { ComponentProps } from 'svelte'

import { fireEvent, render, screen } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../manual-mode.svelte'

describe('Arm manual mode', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>> = {}) =>
		render(Subject, {
			isManualMode: false,
			isPending: false,
			setManualMode: vi.fn(),
			lastError: null,
			...props,
		})

	it('counts down from the enable-after delay and enters manual mode at 0', async () => {
		const setManualMode = vi.fn()
		renderSubject({ setManualMode })

		await fireEvent.click(screen.getByRole('button', { name: 'Enter' }))

		expect(screen.getByText('Enabling in 20s')).toBeInTheDocument()
		expect(setManualMode).not.toHaveBeenCalled()

		await vi.advanceTimersByTimeAsync(20_000)

		expect(setManualMode).toHaveBeenCalledTimes(1)
		expect(setManualMode).toHaveBeenCalledWith(true, 90)
	})

	it('enters immediately when enable-after is 0', async () => {
		const setManualMode = vi.fn()
		renderSubject({ setManualMode })

		const [, enableAfterInput] = screen.getAllByRole('spinbutton')
		await fireEvent.change(enableAfterInput!, { target: { value: '0' } })
		await fireEvent.click(screen.getByRole('button', { name: 'Enter' }))

		expect(setManualMode).toHaveBeenCalledWith(true, 90)
	})

	it('sends the edited enabled-for duration', async () => {
		const setManualMode = vi.fn()
		renderSubject({ setManualMode })

		const [enabledForInput, enableAfterInput] = screen.getAllByRole('spinbutton')
		await fireEvent.change(enabledForInput!, { target: { value: '30' } })
		await fireEvent.change(enableAfterInput!, { target: { value: '0' } })
		await fireEvent.click(screen.getByRole('button', { name: 'Enter' }))

		expect(setManualMode).toHaveBeenCalledWith(true, 30)
	})

	it('cancels a pending countdown without entering manual mode', async () => {
		const setManualMode = vi.fn()
		renderSubject({ setManualMode })

		await fireEvent.click(screen.getByRole('button', { name: 'Enter' }))
		await vi.advanceTimersByTimeAsync(5000)
		await fireEvent.click(screen.getByRole('button', { name: 'Exit' }))
		await vi.advanceTimersByTimeAsync(60_000)

		expect(setManualMode).not.toHaveBeenCalled()
	})

	it('exits manual mode when active', async () => {
		const setManualMode = vi.fn()
		renderSubject({ isManualMode: true, setManualMode })

		await fireEvent.click(screen.getByRole('button', { name: 'Exit' }))

		expect(setManualMode).toHaveBeenCalledWith(false, 0)
	})

	it('sends nothing on exit when inactive with no countdown pending', async () => {
		const setManualMode = vi.fn()
		renderSubject({ setManualMode })

		await fireEvent.click(screen.getByRole('button', { name: 'Exit' }))

		expect(setManualMode).not.toHaveBeenCalled()
	})

	it('disables both buttons while a set is pending', () => {
		renderSubject({ isPending: true })

		expect(screen.getByRole('button', { name: 'Enter' })).toBeDisabled()
		expect(screen.getByRole('button', { name: 'Exit' })).toBeDisabled()
	})

	it('shows the enabled status pill when manual mode is active', () => {
		renderSubject({ isManualMode: true })

		expect(screen.getByText('Enabled')).toBeInTheDocument()
	})

	it('shows the disabled status pill when manual mode is inactive', () => {
		renderSubject({})

		expect(screen.getByText('Disabled')).toBeInTheDocument()
	})

	it('explains gravity compensation below the controls', () => {
		renderSubject({})

		expect(
			screen.getByText(
				'Manual mode puts the arm into gravity compensation or servo release mode so the arm can be moved by hand.'
			)
		).toBeInTheDocument()
	})
})
