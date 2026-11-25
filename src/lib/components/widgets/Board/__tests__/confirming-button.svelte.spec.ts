import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../confirming-button.svelte'

const CHECK_MS = 1000
const RESET_WAIT_MS = 2000

const deferredCall = () => {
	let settle: (succeeded: boolean) => void = () => undefined
	const onclick = vi.fn(
		() =>
			new Promise<boolean>((resolve) => {
				settle = resolve
			})
	)
	return { onclick, settle: (succeeded: boolean) => settle(succeeded) }
}

describe('Board ConfirmingButton', () => {
	it('reads its verb before a press', () => {
		render(Subject, { verb: 'Get', onclick: vi.fn(async () => true) })

		expect(screen.getByRole('button', { name: 'Get' })).toHaveTextContent('Get')
	})

	it('keeps its verb as the name and marks itself busy while the call is in flight', async () => {
		const user = userEvent.setup()
		const call = deferredCall()
		render(Subject, { verb: 'Set', onclick: call.onclick })

		await user.click(screen.getByRole('button', { name: 'Set' }))

		const button = screen.getByRole('button', { name: 'Set' })
		expect(button).toHaveAttribute('aria-busy', 'true')
		expect(button).not.toHaveTextContent('Set')
	})

	it('ignores a press while the call is in flight', async () => {
		const user = userEvent.setup()
		const call = deferredCall()
		render(Subject, { verb: 'Set', onclick: call.onclick })
		await user.click(screen.getByRole('button', { name: 'Set' }))

		await user.click(screen.getByRole('button', { name: 'Set' }))

		expect(call.onclick).toHaveBeenCalledOnce()
	})

	it('shows the check, named "Get, done", once the call succeeds', async () => {
		const user = userEvent.setup()
		const call = deferredCall()
		render(Subject, { verb: 'Get', onclick: call.onclick })
		await user.click(screen.getByRole('button', { name: 'Get' }))

		call.settle(true)

		const button = await screen.findByRole('button', { name: 'Get, done' })
		expect(button).toHaveAttribute('aria-busy', 'false')
	})

	it('returns to its verb 1 s after the check shows', async () => {
		const user = userEvent.setup()
		render(Subject, { verb: 'Get', onclick: vi.fn(async () => true) })
		await user.click(screen.getByRole('button', { name: 'Get' }))
		await screen.findByRole('button', { name: 'Get, done' })
		const shownAt = performance.now()

		const button = await screen.findByRole('button', { name: 'Get' }, { timeout: RESET_WAIT_MS })

		expect(button).toHaveTextContent('Get')
		expect(performance.now() - shownAt, 'the check held for its full second').toBeGreaterThan(
			CHECK_MS - 100
		)
	})

	it('shows no check after the call fails', async () => {
		const user = userEvent.setup()
		const call = deferredCall()
		render(Subject, { verb: 'Set', onclick: call.onclick })
		await user.click(screen.getByRole('button', { name: 'Set' }))

		call.settle(false)

		await vi.waitFor(() => {
			expect(screen.getByRole('button', { name: 'Set' })).toHaveAttribute('aria-busy', 'false')
		})
		expect(screen.queryByRole('button', { name: 'Set, done' })).toBeNull()
	})
})
