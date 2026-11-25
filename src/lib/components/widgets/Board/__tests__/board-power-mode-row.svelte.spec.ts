import { render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../board-power-mode-row.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const mocks = vi.hoisted(() => ({
	send: vi.fn(),
}))

vi.mock('@viamrobotics/sdk', () => ({
	BoardClient: class {},
	PowerMode: { UNSPECIFIED: 0, NORMAL: 1, OFFLINE_DEEP: 2 },
	Duration: class {
		seconds: bigint
		constructor({ seconds }: { seconds: bigint }) {
			this.seconds = seconds
		}
	},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({
		mutate: vi.fn(),
		mutateAsync: (args: unknown[]) => mocks.send(args),
		isPending: false,
		error: null,
	})),
}))

const NORMAL = 1
const OFFLINE_DEEP = 2

const lastStatus = () => screen.getByTestId('status-line').textContent?.trim()

const deferred = () => {
	let resolve = () => {}
	const promise = new Promise<void>((res) => {
		resolve = res
	})
	return { promise, resolve }
}

const renderSubject = () => render(PaneSubject, { props: { widget: Subject } })

const chooseOfflineDeep = async () => {
	await userEvent.click(screen.getByRole('combobox', { name: 'Mode' }))
	await userEvent.click(await screen.findByRole('option', { name: 'Offline deep' }))
}

const armOfflineDeep = async (duration: string) => {
	await chooseOfflineDeep()
	if (duration !== '') {
		await userEvent.type(screen.getByRole('spinbutton', { name: /duration/iu }), duration)
	}
	await userEvent.click(screen.getByRole('button', { name: 'Execute' }))
}

describe('Board PowerMode', () => {
	beforeEach(() => {
		mocks.send.mockReset()
		mocks.send.mockImplementation(() => Promise.resolve())
	})

	it('sends nothing for a pick of Offline deep and shows the warning and Duration', async () => {
		renderSubject()

		await chooseOfflineDeep()

		expect(mocks.send).not.toHaveBeenCalled()
		expect(screen.getByText('The board may stop answering until it wakes.')).toBeVisible()
		expect(screen.getByRole('spinbutton', { name: /duration/iu })).toBeVisible()
	})

	it('sends one SetPowerMode Normal on one press of Execute', async () => {
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Execute' }))

		await waitFor(() => {
			expect(mocks.send).toHaveBeenCalledTimes(1)
		})
		expect(mocks.send).toHaveBeenCalledWith([NORMAL])
		expect(screen.queryByRole('button', { name: 'Confirm Offline deep' })).not.toBeInTheDocument()
	})

	it('arms Offline deep on the first press, sends nothing, and locks Mode and Duration', async () => {
		renderSubject()

		await armOfflineDeep('30')

		expect(mocks.send).not.toHaveBeenCalled()
		expect(screen.getByRole('button', { name: 'Confirm Offline deep' })).toBeVisible()
		expect(screen.getByRole('combobox', { name: 'Mode' })).toBeDisabled()
		expect(screen.getByRole('spinbutton', { name: /duration/iu })).toBeDisabled()
	})

	it('reads the duration in the armed status', async () => {
		renderSubject()

		await armOfflineDeep('30')

		expect(lastStatus()).toBe('Confirm to send Offline deep for 30 s')
	})

	it('names and sends the whole seconds for a fractional duration', async () => {
		renderSubject()
		await armOfflineDeep('2.5')

		expect(lastStatus()).toBe('Confirm to send Offline deep for 2 s')

		await userEvent.click(screen.getByRole('button', { name: 'Confirm Offline deep' }))

		await waitFor(() => {
			expect(mocks.send).toHaveBeenCalledTimes(1)
		})
		const [, duration] = mocks.send.mock.calls[0]?.[0] ?? []
		expect(duration).toMatchObject({ seconds: 2n })
	})

	it('reads no duration in the armed status when the field is empty', async () => {
		renderSubject()

		await armOfflineDeep('')

		expect(lastStatus()).toBe('Confirm to send Offline deep')
	})

	it('sends one SetPowerMode Offline deep with the duration on Confirm, then clears the status', async () => {
		renderSubject()
		await armOfflineDeep('30')

		await userEvent.click(screen.getByRole('button', { name: 'Confirm Offline deep' }))

		await waitFor(() => {
			expect(mocks.send).toHaveBeenCalledTimes(1)
		})
		const [mode, duration] = mocks.send.mock.calls[0]?.[0] ?? []
		expect(mode).toBe(OFFLINE_DEEP)
		expect(duration).toMatchObject({ seconds: 30n })
		await waitFor(() => {
			expect(lastStatus()).toBe('')
		})
	})

	it('sends nothing on Cancel and unlocks Mode and Duration', async () => {
		renderSubject()
		await armOfflineDeep('30')

		await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

		expect(mocks.send).not.toHaveBeenCalled()
		expect(screen.getByRole('combobox', { name: 'Mode' })).toBeEnabled()
		expect(screen.getByRole('spinbutton', { name: /duration/iu })).toBeEnabled()
		expect(lastStatus()).toBe('')
	})

	it('reads Sending Offline deep while the send is in flight, then clears it', async () => {
		const call = deferred()
		mocks.send.mockImplementation(() => call.promise)
		renderSubject()
		await armOfflineDeep('30')

		await userEvent.click(screen.getByRole('button', { name: 'Confirm Offline deep' }))

		await waitFor(() => {
			expect(lastStatus()).toBe('Sending Offline deep.')
		})
		call.resolve()
		await waitFor(() => {
			expect(lastStatus()).toBe('')
		})
		expect(mocks.send).toHaveBeenCalledTimes(1)
	})
})
