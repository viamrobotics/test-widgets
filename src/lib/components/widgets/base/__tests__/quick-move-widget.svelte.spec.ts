import { fireEvent, render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Subject from '../quick-move-widget.svelte'
import InPane from './__fixtures__/in-320-pane.svelte'

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
			const mutate = vi.fn()
			mutateByMethod.set(method, mutate)
			return { mutate, isPending: false, error: errorByMethod.get(method) ?? null }
		}),
		useConnectionStatus: vi.fn(() => ({
			current: connection.isConnected
				? MachineConnectionEvent.CONNECTED
				: MachineConnectionEvent.DISCONNECTED,
		})),
	}
})

const mutateFor = (method: string) => {
	const mutate = mutateByMethod.get(method)
	if (!mutate) throw new Error(`No ${method} mutation was created`)
	return mutate
}

afterEach(() => {
	errorByMethod.clear()
	connection.isConnected = true
})

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-base' },
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

		expect(mutateFor('setPower')).toHaveBeenCalledWith(
			[
				{ x: 0, y: 0.5, z: 0 },
				{ x: 0, y: 0, z: 0 },
			],
			{}
		)
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
		await fireEvent.focus(screen.getByRole('button', { name: '1 error, copy to clipboard' }))

		expect(screen.getByText(/base refused quick setPower/iu)).toBeInTheDocument()
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
