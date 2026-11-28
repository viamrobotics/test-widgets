import type { ResourceWidget } from '#lib/resource-widget-types.js'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import InWidgetsProvider from '#lib/__tests__/__fixtures__/InWidgetsProvider.svelte'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import GetGpio from '../GetGpioWidget.svelte'
import Pins from '../ReadWritePinsWidget.svelte'
import SetGpio from '../SetGpioWidget.svelte'
import WriteAnalog from '../WriteAnalogWidget.svelte'

const calls = vi.hoisted(
	(): { send: Mock<(method: string, args: unknown[]) => Promise<void>> } => ({
		send: vi.fn(),
	})
)

vi.mock('@viamrobotics/sdk', () => ({
	BoardClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn((_client: unknown, method: string) => ({
		mutateAsync: (args: unknown[]) => calls.send(method, args),
		isPending: false,
		error: null,
	})),
}))

const deferred = () => {
	let resolve = () => {}
	const promise = new Promise<void>((resolvePromise) => {
		resolve = resolvePromise
	})
	return { promise, resolve }
}

const STATE_SET = 0
const DUTY_CYCLE_SET = 1

const renderUnderOneProvider = (components: ResourceWidget[]) =>
	render(InWidgetsProvider, {
		props: {
			component: components,
			props: { partID: 'test-part', resourceName: 'test-board' },
		},
	})

const pinField = (position: number) => {
	const field = screen.getAllByRole('textbox', { name: 'Pin' }).at(position)
	if (!field) throw new Error(`No Pin field at ${position}`)
	return field
}

const pinsSetButtons = () => screen.getAllByRole('button', { name: 'Set' })

const pinsSetsDisabled = () =>
	pinsSetButtons().map((button) => button.getAttribute('aria-disabled') === 'true')

const pinsSet = (position: number) => {
	const button = pinsSetButtons().at(position)
	if (!button) throw new Error(`No Set button at ${position}`)
	return button
}

const execute = () => screen.getByRole('button', { name: /execute/iu })

describe('Board widgets under one WidgetsProvider', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
		calls.send = vi.fn(() => Promise.resolve())
	})

	const enterPin = async (position: number, pin: string) => {
		await user.clear(pinField(position))
		await user.type(pinField(position), pin)
		await user.tab()
	}

	it('holds GetGPIO back on pin 7 while SetGPIO writes pin 7, and sends no read', async () => {
		const write = deferred()
		calls.send = vi.fn(() => write.promise)
		renderUnderOneProvider([SetGpio, GetGpio])
		await enterPin(0, '7')
		await enterPin(1, '7')

		await user.click(execute())
		const get = screen.getByRole('button', { name: 'Get' })
		await user.click(get)

		expect(get).toHaveAttribute('aria-disabled', 'true')
		expect(calls.send).toHaveBeenCalledTimes(1)
		write.resolve()
	})

	it("disables the Pins control's Sets on pin 7 while SetGPIO writes pin 7, and leaves pin 8 live", async () => {
		const write = deferred()
		calls.send = vi.fn(() => write.promise)
		renderUnderOneProvider([SetGpio, Pins])
		await enterPin(0, '7')
		await enterPin(1, '7')

		await user.click(execute())

		expect(calls.send).toHaveBeenCalledWith('setGPIO', ['7', true])
		expect(pinsSetsDisabled(), 'state, duty cycle, and frequency Sets on pin 7').toEqual([
			true,
			true,
			true,
		])

		await enterPin(1, '8')

		expect(pinsSetsDisabled(), 'state, duty cycle, and frequency Sets on pin 8').toEqual([
			false,
			false,
			false,
		])
		write.resolve()
	})

	it("disables SetGPIO's Execute on pin 7 while the Pins control writes pin 7, and leaves pin 8 live", async () => {
		const write = deferred()
		calls.send = vi.fn(() => write.promise)
		renderUnderOneProvider([SetGpio, Pins])
		await enterPin(0, '7')
		await enterPin(1, '7')

		await user.click(pinsSet(STATE_SET))

		expect(calls.send).toHaveBeenCalledWith('setGPIO', ['7', true])
		expect(execute()).toBeDisabled()
		expect(pinsSet(STATE_SET), 'the pending Set keeps focus').toBeEnabled()
		expect(pinsSet(DUTY_CYCLE_SET)).toBeDisabled()

		await enterPin(0, '8')

		expect(execute()).toBeEnabled()
		write.resolve()
	})

	it('enables both writers on pin 7 again once the write settles', async () => {
		const write = deferred()
		calls.send = vi.fn(() => write.promise)
		renderUnderOneProvider([SetGpio, Pins])
		await enterPin(0, '7')
		await enterPin(1, '7')
		await user.click(execute())

		write.resolve()

		await vi.waitFor(() => {
			expect(execute()).toBeEnabled()
		})
		expect(pinsSetsDisabled(), 'state, duty cycle, and frequency Sets on pin 7').toEqual([
			false,
			false,
			false,
		])
	})

	it("disables the Pins control's analog Set on a1 while WriteAnalog writes a1, and leaves a2 live", async () => {
		const write = deferred()
		calls.send = vi.fn(() => write.promise)
		renderUnderOneProvider([WriteAnalog, Pins])
		await user.click(screen.getByRole('radio', { name: 'Analog' }))
		await enterPin(0, 'a1')
		await enterPin(1, 'a1')

		await user.click(execute())

		expect(calls.send).toHaveBeenCalledWith('writeAnalog', ['a1', 0])
		expect(pinsSet(0)).toBeDisabled()

		await enterPin(1, 'a2')

		expect(pinsSet(0)).toBeEnabled()
		write.resolve()
	})
})
