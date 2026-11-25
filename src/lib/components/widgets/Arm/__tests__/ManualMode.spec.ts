import type { ComponentProps } from 'svelte'

import { fireEvent, render, screen } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../ManualMode.svelte'

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
			...props,
		})

	it('counts down from the enable-after delay and enters manual mode at 0', async () => {
		const setManualMode = vi.fn()
		renderSubject({ setManualMode })

		await fireEvent.click(screen.getByRole('button', { name: 'Enter' }))

		const enterButton = screen.getByRole('button', { name: 'Enabling in 5s' })
		expect(enterButton).toHaveAttribute('aria-busy', 'true')
		expect(setManualMode).not.toHaveBeenCalled()

		await vi.advanceTimersByTimeAsync(5000)

		expect(setManualMode).toHaveBeenCalledTimes(1)
		expect(setManualMode).toHaveBeenCalledWith(true, 90)
		expect(screen.getByRole('button', { name: 'Enter' })).toHaveAttribute('aria-busy', 'false')
	})

	it('enters immediately when enable-after is 0', async () => {
		const setManualMode = vi.fn()
		renderSubject({ setManualMode })

		const [, enableAfterInput] = screen.getAllByRole('spinbutton')
		await fireEvent.input(enableAfterInput!, { target: { value: '0' } })
		await fireEvent.click(screen.getByRole('button', { name: 'Enter' }))

		expect(setManualMode).toHaveBeenCalledWith(true, 90)
	})

	it('sends the edited enabled-for duration', async () => {
		const setManualMode = vi.fn()
		renderSubject({ setManualMode })

		const [enabledForInput, enableAfterInput] = screen.getAllByRole('spinbutton')
		await fireEvent.input(enabledForInput!, { target: { value: '30' } })
		await fireEvent.input(enableAfterInput!, { target: { value: '0' } })
		await fireEvent.click(screen.getByRole('button', { name: 'Enter' }))

		expect(setManualMode).toHaveBeenCalledWith(true, 30)
	})

	it('cancels a pending countdown without entering manual mode', async () => {
		const setManualMode = vi.fn()
		renderSubject({ setManualMode })

		await fireEvent.click(screen.getByRole('button', { name: 'Enter' }))
		await vi.advanceTimersByTimeAsync(2500)
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

	it('marks Enter busy while an enter request is in flight', async () => {
		const { rerender } = renderSubject()

		await fireEvent.click(screen.getByRole('button', { name: 'Enter' }))
		await vi.advanceTimersByTimeAsync(5000)
		await rerender({ isPending: true })

		expect(screen.getByRole('button', { name: 'Enter' })).toHaveAttribute('aria-busy', 'true')
		expect(screen.getByRole('button', { name: 'Exit' })).toHaveAttribute('aria-busy', 'false')
	})

	it('marks Exit busy while an exit request is in flight', async () => {
		const { rerender } = renderSubject({ isManualMode: true })

		await fireEvent.click(screen.getByRole('button', { name: 'Exit' }))
		await rerender({ isPending: true })

		expect(screen.getByRole('button', { name: 'Exit' })).toHaveAttribute('aria-busy', 'true')
	})

	it('disables Enter once manual mode is on', () => {
		renderSubject({ isManualMode: true })

		expect(screen.getByRole('button', { name: 'Enter' })).toBeDisabled()
		expect(screen.getByText('Manual mode')).toBeInTheDocument()
	})

	it('shows the off status when manual mode is inactive', () => {
		renderSubject({})

		expect(screen.getByText('Disabled')).toBeInTheDocument()
	})

	it('names the timing group and both fields', () => {
		renderSubject({})

		const group = screen.getByRole('group', { name: 'Manual mode timing' })
		expect(group).toContainElement(screen.getByRole('spinbutton', { name: 'Enable for, seconds' }))
		expect(group).toContainElement(
			screen.getByRole('spinbutton', { name: 'Enable after, seconds' })
		)
		expect(screen.getByRole('button', { name: 'About manual mode timing' })).toBeInTheDocument()
	})
})
