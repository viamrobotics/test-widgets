import { fireEvent, render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import InWidgetsProvider from '#lib/__tests__/__fixtures__/InWidgetsProvider.svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Subject from '../QuickMoveWidget.svelte'
import Spin from '../SpinWidget.svelte'
import InPane from './__fixtures__/In320Pane.svelte'

const { mutateByMethod, errorByMethod, connection } = vi.hoisted(() => ({
	mutateByMethod: new Map<string, ReturnType<typeof vi.fn>>(),
	errorByMethod: new Map<string, Error>(),
	connection: { isConnected: true },
}))

vi.mock('@viamrobotics/sdk', async (importOriginal) => {
	const { MachineConnectionEvent } = await importOriginal<typeof import('@viamrobotics/sdk')>()
	return {
		BaseClient: class {},
		MachineConnectionEvent,
	}
})

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createResourceMutation: vi.fn((_client: unknown, method: string) => {
			const mutate = vi.fn(() => Promise.resolve())
			mutateByMethod.set(method, mutate)
			return {
				mutate,
				mutateAsync: mutate,
				isPending: false,
				error: errorByMethod.get(method) ?? null,
			}
		}),
		useConnectionStatus: vi.fn(() => ({
			current: connection.isConnected
				? MachineConnectionEvent.CONNECTED
				: MachineConnectionEvent.DISCONNECTED,
		})),
	}
})

const SETTLE_WAIT_MS = 100

const mutateFor = (method: string) => {
	const mutate = mutateByMethod.get(method)
	if (!mutate) throw new Error(`No ${method} mutation was created`)
	return mutate
}

afterEach(() => {
	errorByMethod.clear()
	connection.isConnected = true
})

const FORWARD = { x: 0, y: 0.5, z: 0 }
const LEFT = { x: 0, y: 0, z: 0.5 }
const ZERO = { x: 0, y: 0, z: 0 }

const holdNextCall = (method: string) => {
	let settle = () => {}
	mutateFor(method).mockImplementationOnce(
		() =>
			new Promise<void>((resolve) => {
				settle = resolve
			})
	)
	return () => {
		settle()
	}
}

const engageKeyboard = async (user: ReturnType<typeof userEvent.setup>) => {
	await user.click(screen.getByRole('button', { name: 'Keyboard control' }))
}

const renderSubject = () =>
	render(InWidgetsProvider, {
		props: { component: Subject, props: { partID: 'test-part', resourceName: 'test-base' } },
	})

describe('Base QuickMove widget', () => {
	it('renders the Quick move section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Quick move' })).toBeInTheDocument()
	})

	it('drops the keyboard switch for the Keyboard control toggle', () => {
		renderSubject()

		expect(screen.queryByRole('switch')).toBeNull()
		expect(screen.getByRole('button', { name: 'Keyboard control' })).toHaveAttribute(
			'aria-pressed',
			'false'
		)
	})

	it('sends setPower with positive linear y when Forward is pressed', async () => {
		const user = userEvent.setup()
		renderSubject()

		await user.pointer({
			target: screen.getByRole('button', { name: 'Forward (W)' }),
			keys: '[MouseLeft>]',
		})

		expect(mutateFor('setPower')).toHaveBeenCalledWith([
			{ x: 0, y: 0.5, z: 0 },
			{ x: 0, y: 0, z: 0 },
		])
	})

	it('sends the base Stop when capture ends with a drive key held', async () => {
		const user = userEvent.setup()
		renderSubject()
		await user.click(screen.getByRole('button', { name: 'Keyboard control' }))
		await user.keyboard('{w>}')

		await user.keyboard('{Escape}')

		expect(mutateFor('stop')).toHaveBeenCalledOnce()
	})

	it('holds no keyboard capture while the part is disconnected', async () => {
		const user = userEvent.setup()
		connection.isConnected = false
		renderSubject()

		await user.click(screen.getByRole('button', { name: 'Keyboard control' }))

		expect(screen.getByRole('button', { name: 'Keyboard control' })).toHaveAttribute(
			'aria-pressed',
			'false'
		)
	})

	it("shows the setPower error in the section's error indicator", async () => {
		errorByMethod.set('setPower', new Error('base refused quick setPower'))

		renderSubject()
		await fireEvent.focusIn(screen.getByRole('button', { name: '1 error, copy to clipboard' }))

		expect(screen.getByText(/base refused quick setPower/iu)).toBeInTheDocument()
	})
})

describe('Base QuickMove widget while its own drive is in flight', () => {
	it('holds a changed drive back until the call settles', async () => {
		const user = userEvent.setup()
		renderSubject()
		await engageKeyboard(user)
		holdNextCall('setPower')
		await user.keyboard('{w>}')

		await user.keyboard('{a>}')

		expect(mutateFor('setPower').mock.calls).toEqual([[[FORWARD, ZERO]]])
	})

	it('sends the power held now once the call settles', async () => {
		const user = userEvent.setup()
		renderSubject()
		await engageKeyboard(user)
		const settle = holdNextCall('setPower')
		await user.keyboard('{w>}')
		await user.keyboard('{a>}')

		settle()

		await vi.waitFor(() => {
			expect(mutateFor('setPower').mock.calls).toEqual([[[FORWARD, ZERO]], [[FORWARD, LEFT]]])
		})
	})

	it('sends the remaining key alone when the other came up during the call', async () => {
		const user = userEvent.setup()
		renderSubject()
		await engageKeyboard(user)
		await user.keyboard('{w>}{a>}')
		await vi.waitFor(() => {
			expect(mutateFor('setPower')).toHaveBeenLastCalledWith([FORWARD, LEFT])
		})
		const settle = holdNextCall('setPower')
		await user.keyboard('{s>}')
		await user.keyboard('{/s}{/a}')

		settle()

		await vi.waitFor(() => {
			expect(mutateFor('setPower')).toHaveBeenLastCalledWith([FORWARD, ZERO])
		})
	})

	it('sends no drive after everything came up during the call', async () => {
		const user = userEvent.setup()
		renderSubject()
		await engageKeyboard(user)
		const settle = holdNextCall('setPower')
		await user.keyboard('{w>}')
		await user.keyboard('{a>}')
		await user.keyboard('{/a}{/w}')

		settle()
		await new Promise((resolve) => {
			setTimeout(resolve, SETTLE_WAIT_MS)
		})

		expect(mutateFor('setPower').mock.calls.slice(1)).toEqual([[[ZERO, ZERO]], [[ZERO, ZERO]]])
	})

	it('sends no drive after Stop once the call settles', async () => {
		const user = userEvent.setup()
		renderSubject()
		await engageKeyboard(user)
		const settle = holdNextCall('setPower')
		await user.keyboard('{w>}')
		await user.keyboard('{a>}')
		await user.keyboard('{Escape}')

		settle()
		await new Promise((resolve) => {
			setTimeout(resolve, SETTLE_WAIT_MS)
		})

		expect(mutateFor('setPower').mock.calls).toEqual([[[FORWARD, ZERO]]])
	})

	it('sends nothing more when the held power did not change', async () => {
		const user = userEvent.setup()
		renderSubject()
		await engageKeyboard(user)
		const settle = holdNextCall('setPower')
		await user.keyboard('{w>}')

		settle()
		await new Promise((resolve) => {
			setTimeout(resolve, SETTLE_WAIT_MS)
		})

		expect(mutateFor('setPower')).toHaveBeenCalledOnce()
	})
})

describe('Base QuickMove widget while another base widget moves the base', () => {
	const renderWithSpin = () =>
		render(InWidgetsProvider, {
			props: {
				component: [Spin, Subject],
				props: { partID: 'test-part', resourceName: 'test-base' },
			},
		})

	it('reads its pads as disabled and sends no drive', async () => {
		const user = userEvent.setup()
		renderWithSpin()
		holdNextCall('spin')
		await user.click(screen.getByRole('button', { name: /execute/iu }))
		const forward = screen.getByRole('button', { name: 'Forward (W)' })

		await user.pointer({ target: forward, keys: '[MouseLeft>]' })

		expect(forward).toHaveAttribute('aria-disabled', 'true')
		expect(mutateFor('setPower')).not.toHaveBeenCalled()
	})

	it('enables its pads again once that call settles', async () => {
		const user = userEvent.setup()
		renderWithSpin()
		const settle = holdNextCall('spin')
		await user.click(screen.getByRole('button', { name: /execute/iu }))

		settle()

		await vi.waitFor(() => {
			expect(screen.getByRole('button', { name: 'Forward (W)' })).not.toHaveAttribute(
				'aria-disabled'
			)
		})
	})

	it('keeps its pads enabled while its own drive is in flight', async () => {
		const user = userEvent.setup()
		renderSubject()
		holdNextCall('setPower')
		const forward = screen.getByRole('button', { name: 'Forward (W)' })

		await user.pointer({ target: forward, keys: '[MouseLeft>]' })

		expect(forward).not.toHaveAttribute('aria-disabled')
	})
})

describe('Base QuickMove widget in a 320 px pane', () => {
	it('does not scroll horizontally', () => {
		render(InPane, { props: { widget: Subject } })
		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')

		expect(getComputedStyle(pane).width).toBe('320px')
		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
