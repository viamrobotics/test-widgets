import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { PopOutHost, PopOutRequest } from '../pop-out-host-context'

import Fixture from './pop-out-fixture.svelte'

const createFakeHost = () => {
	const close = vi.fn()
	const requests: PopOutRequest[] = []
	const open = vi.fn((request: PopOutRequest) => {
		requests.push(request)
		return close
	})
	const host: PopOutHost = { open }
	return { host, open, close, requests }
}

describe('PopOut with a host', () => {
	it('opens one window with the title and min size', async () => {
		const { host, open } = createFakeHost()
		render(Fixture, { host })
		expect(open).not.toHaveBeenCalled()

		await userEvent.click(screen.getByRole('button', { name: 'toggle' }))

		expect(open).toHaveBeenCalledTimes(1)
		expect(open.mock.calls[0]?.[0]).toMatchObject({
			title: 'arm-1 Scene',
			minSize: { minWidth: 480, minHeight: 320 },
		})
	})

	it('closes the window once when open goes false', async () => {
		const { host, close } = createFakeHost()
		render(Fixture, { host })
		const toggle = screen.getByRole('button', { name: 'toggle' })

		await userEvent.click(toggle)
		await userEvent.click(toggle)

		expect(close).toHaveBeenCalledTimes(1)
	})

	it('closes the window when unmounted while open', async () => {
		const { host, close } = createFakeHost()
		const { unmount } = render(Fixture, { host })
		await userEvent.click(screen.getByRole('button', { name: 'toggle' }))

		unmount()

		expect(close).toHaveBeenCalledTimes(1)
	})

	it('sets open false without closing again when the host closes the window', async () => {
		const { host, close, requests, open } = createFakeHost()
		render(Fixture, { host })
		await userEvent.click(screen.getByRole('button', { name: 'toggle' }))
		expect(screen.getByTestId('open').textContent).toBe('true')

		requests[0]?.onClose()

		await vi.waitFor(() => expect(screen.getByTestId('open').textContent).toBe('false'))
		expect(close).not.toHaveBeenCalled()
		expect(open).toHaveBeenCalledTimes(1)
	})
})

describe('PopOut without a host', () => {
	it('renders a titled dialog with the content when opened', async () => {
		render(Fixture, {})
		expect(screen.queryByRole('dialog')).toBeNull()

		await userEvent.click(screen.getByRole('button', { name: 'toggle' }))

		const dialog = await screen.findByRole('dialog', { name: 'arm-1 Scene' })
		expect(dialog.textContent).toContain('scene body')
	})

	it('closes through the Close button and sets open false', async () => {
		render(Fixture, {})
		await userEvent.click(screen.getByRole('button', { name: 'toggle' }))
		await screen.findByRole('dialog')

		await userEvent.click(screen.getByRole('button', { name: 'Close' }))

		await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
		expect(screen.getByTestId('open').textContent).toBe('false')
	})
})
