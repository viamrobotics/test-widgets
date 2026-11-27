import '../../../app.css'

import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { tick } from 'svelte'
import { afterEach, describe, expect, it, type Mock, vi } from 'vitest'

import type { InFlightOutcome } from '../in-flight-guard.svelte'

import Host from './__fixtures__/ConfirmStepHost.svelte'

const LABEL = 'Reset to zero'
const CONFIRM_LABEL = 'Confirm reset'
const DONE_MS = 500
const ONE_HOUR_MS = 3_600_000

interface Deferred {
	promise: Promise<InFlightOutcome>
	settle: (outcome: InFlightOutcome) => void
}

const deferred = (): Deferred => {
	let settle: (outcome: InFlightOutcome) => void = () => {}
	const promise = new Promise<InFlightOutcome>((resolve) => {
		settle = resolve
	})
	return { promise, settle }
}

const renderHost = (
	onconfirm: Mock<() => Promise<InFlightOutcome> | undefined>,
	isConfirmRequired = true
) =>
	render(Host, {
		props: { label: LABEL, confirmLabel: CONFIRM_LABEL, isConfirmRequired, onconfirm },
	})

const sendButton = () => screen.getByRole('button', { name: LABEL })
const confirmButton = () => screen.getByRole('button', { name: CONFIRM_LABEL })
const cancelButton = () => screen.getByRole('button', { name: 'Cancel' })
const queryConfirmButton = () => screen.queryByRole('button', { name: CONFIRM_LABEL })

const succeeding = () => vi.fn(() => Promise.resolve<InFlightOutcome>('succeeded'))

describe('ConfirmStep', () => {
	afterEach(() => {
		vi.useRealTimers()
	})

	it('arms on one press, sends nothing, and moves focus to Cancel', async () => {
		const onconfirm = succeeding()
		renderHost(onconfirm)

		await userEvent.click(sendButton())

		expect(onconfirm).not.toHaveBeenCalled()
		expect(confirmButton()).toBeInTheDocument()
		await waitFor(() => {
			expect(cancelButton()).toHaveFocus()
		})
	})

	it('disarms on Cancel and sends nothing', async () => {
		const onconfirm = succeeding()
		renderHost(onconfirm)

		await userEvent.click(sendButton())
		await userEvent.click(cancelButton())

		expect(onconfirm).not.toHaveBeenCalled()
		expect(queryConfirmButton()).toBeNull()
		expect(sendButton()).toBeInTheDocument()
	})

	it('sends once on Confirm', async () => {
		const onconfirm = succeeding()
		renderHost(onconfirm)

		await userEvent.click(sendButton())
		await userEvent.click(confirmButton())

		expect(onconfirm).toHaveBeenCalledTimes(1)
		expect(queryConfirmButton()).toBeNull()
	})

	it('disarms when focus leaves the Cancel and Confirm pair', async () => {
		const onconfirm = succeeding()
		renderHost(onconfirm)

		await userEvent.click(sendButton())
		await userEvent.click(screen.getByRole('button', { name: 'Outside' }))

		expect(queryConfirmButton()).toBeNull()
		expect(onconfirm).not.toHaveBeenCalled()
	})

	it('stays armed when a pointer press on Confirm blurs Cancel with no next target', async () => {
		const onconfirm = succeeding()
		renderHost(onconfirm)

		await userEvent.click(sendButton())
		await fireEvent.pointerDown(confirmButton())
		await fireEvent.focusOut(cancelButton(), { relatedTarget: null })
		expect(confirmButton(), 'a Safari press on Confirm must not disarm').toBeInTheDocument()
		await fireEvent.click(confirmButton())

		expect(onconfirm).toHaveBeenCalledTimes(1)
	})

	it('stays armed however long the person takes', async () => {
		vi.useFakeTimers()
		const onconfirm = succeeding()
		renderHost(onconfirm)

		await fireEvent.click(sendButton())
		vi.advanceTimersByTime(ONE_HOUR_MS)
		await tick()

		expect(confirmButton()).toBeInTheDocument()
	})

	it('announces the result after a success', async () => {
		const onconfirm = succeeding()
		const { container } = renderHost(onconfirm, false)

		await fireEvent.click(sendButton())

		await vi.waitFor(() => {
			expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent(
				'Reset to zero: done'
			)
		})
	})

	it('sends once for a double Confirm and ignores presses while busy', async () => {
		const call = deferred()
		const onconfirm = vi.fn(() => call.promise)
		renderHost(onconfirm)

		await userEvent.click(sendButton())
		const confirm = confirmButton()
		confirm.click()
		confirm.click()
		await tick()

		expect(onconfirm).toHaveBeenCalledTimes(1)
		expect(sendButton()).toHaveAttribute('aria-busy', 'true')
		await userEvent.click(sendButton())
		expect(queryConfirmButton(), 'a busy press does not arm').toBeNull()
		expect(onconfirm).toHaveBeenCalledTimes(1)

		call.settle('failed')
		await waitFor(() => {
			expect(sendButton()).toHaveAttribute('aria-busy', 'false')
		})
	})

	it('holds the check for 500 ms after a success, then idles', async () => {
		vi.useFakeTimers()
		const onconfirm = succeeding()
		const { container } = renderHost(onconfirm, false)

		await fireEvent.click(sendButton())
		await vi.advanceTimersByTimeAsync(0)
		expect(container.querySelector('svg'), 'the check shows after a success').not.toBeNull()

		await vi.advanceTimersByTimeAsync(DONE_MS)

		expect(container.querySelector('svg')).toBeNull()
		expect(sendButton()).toHaveAttribute('aria-busy', 'false')
	})

	it('idles at once when the group was busy and nothing was sent', async () => {
		const onconfirm = vi.fn(() => undefined)
		const { container } = renderHost(onconfirm, false)

		await userEvent.click(sendButton())

		expect(onconfirm).toHaveBeenCalledTimes(1)
		expect(sendButton()).toHaveAttribute('aria-busy', 'false')
		expect(container.querySelector('svg')).toBeNull()
	})

	it('sends on one press when no confirm is required', async () => {
		const onconfirm = succeeding()
		renderHost(onconfirm, false)

		await userEvent.click(sendButton())

		expect(onconfirm).toHaveBeenCalledTimes(1)
		expect(queryConfirmButton()).toBeNull()
	})
})
