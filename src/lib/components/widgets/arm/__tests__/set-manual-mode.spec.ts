import type { ComponentProps } from 'svelte'

import { fireEvent, render, screen } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../set-manual-mode.svelte'

describe('Arm set manual mode', () => {
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
			...props,
		})

	const enterButton = () => screen.getByRole('button', { name: /^enter$/iu })
	const exitButton = () => screen.getByRole('button', { name: /^exit$/iu })

	it('counts down from the enable-after delay and enters manual mode at 0', async () => {
		const setManualMode = vi.fn()
		renderSubject({ setManualMode })

		await fireEvent.click(enterButton())

		expect(screen.getByText('Enabling in 5s')).toBeInTheDocument()
		expect(setManualMode).not.toHaveBeenCalled()

		await vi.advanceTimersByTimeAsync(5000)

		expect(setManualMode).toHaveBeenCalledTimes(1)
		expect(setManualMode).toHaveBeenCalledWith(true, 90)
	})

	it('enters immediately when enable-after is 0', async () => {
		const setManualMode = vi.fn()
		renderSubject({ setManualMode })

		const [, enableAfterInput] = screen.getAllByRole('spinbutton')
		await fireEvent.change(enableAfterInput!, { target: { value: '0' } })
		await fireEvent.click(enterButton())

		expect(setManualMode).toHaveBeenCalledWith(true, 90)
	})

	it('sends the edited enabled-for duration', async () => {
		const setManualMode = vi.fn()
		renderSubject({ setManualMode })

		const [enabledForInput, enableAfterInput] = screen.getAllByRole('spinbutton')
		await fireEvent.change(enabledForInput!, { target: { value: '30' } })
		await fireEvent.change(enableAfterInput!, { target: { value: '0' } })
		await fireEvent.click(enterButton())

		expect(setManualMode).toHaveBeenCalledWith(true, 30)
	})

	it('cancels a pending countdown without entering manual mode', async () => {
		const setManualMode = vi.fn()
		renderSubject({ setManualMode })

		await fireEvent.click(enterButton())
		await vi.advanceTimersByTimeAsync(2500)
		await fireEvent.click(exitButton())
		await vi.advanceTimersByTimeAsync(60_000)

		expect(setManualMode).not.toHaveBeenCalled()
	})

	it('exits manual mode when active', async () => {
		const setManualMode = vi.fn()
		renderSubject({ isManualMode: true, setManualMode })

		await fireEvent.click(exitButton())

		expect(setManualMode).toHaveBeenCalledWith(false, 0)
	})

	it('sends nothing on exit when inactive with no countdown pending', async () => {
		const setManualMode = vi.fn()
		renderSubject({ setManualMode })

		await fireEvent.click(exitButton())

		expect(setManualMode).not.toHaveBeenCalled()
	})

	it('disables both buttons while a set is pending', () => {
		renderSubject({ isPending: true })

		expect(enterButton()).toBeDisabled()
		expect(exitButton()).toBeDisabled()
	})
})
