import '../../../../../app.css'

import { fireEvent, render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../base-controls.svelte'
import InPane from './__fixtures__/in-320-pane.svelte'

const state = vi.hoisted(
	(): {
		data: Record<string, unknown>
		calls: [string, unknown[]][]
		errors: Map<string, Error>
		rejectedMethods: Set<string>
	} => ({
		data: {},
		calls: [],
		errors: new Map(),
		rejectedMethods: new Set(),
	})
)

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
		createResourceQuery: vi.fn((_client: unknown, method: string) => ({
			get data() {
				return state.data[method]
			},
			isLoading: false,
			isSuccess: true,
			isError: false,
			fetchStatus: 'idle',
			error: null,
		})),
		createResourceMutation: vi.fn((_client: unknown, method: string) => ({
			mutate: (args: unknown[]) => {
				state.calls.push([method, args])
			},
			mutateAsync: async (args: unknown[]) => {
				state.calls.push([method, args])
				if (state.rejectedMethods.has(method)) {
					throw new Error(`${method} failed`)
				}
			},
			isPending: false,
			get error() {
				return state.errors.get(method) ?? null
			},
		})),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

const WAIT_PAST_SECOND_ZERO_MS = 100

const pastSecondZero = () =>
	new Promise((resolve) => {
		setTimeout(resolve, WAIT_PAST_SECOND_ZERO_MS)
	})

const renderSubject = () =>
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-base' } })

describe('Base controls', () => {
	beforeEach(() => {
		state.data = { isMoving: false }
		state.calls = []
		state.errors = new Map()
		state.rejectedMethods = new Set()
	})

	afterEach(() => {
		document.body.replaceChildren()
	})

	it('reads Idle in the glance row while the base is not moving', () => {
		renderSubject()

		const glance = within(screen.getByRole('group', { name: 'At a glance' }))
		expect(glance.getByText('Idle')).toHaveClass('badge-neutral')
		expect(glance.queryByText('Moving')).toBeNull()
	})

	it('reads Moving in the glance row while the base is moving', () => {
		state.data = { isMoving: true }

		renderSubject()

		const glance = within(screen.getByRole('group', { name: 'At a glance' }))
		expect(glance.getByText('Moving')).toHaveClass('badge-success')
		expect(glance.queryByText('Idle')).toBeNull()
	})

	it('sends stop when Stop is pressed', async () => {
		renderSubject()

		await fireEvent.click(screen.getByRole('button', { name: 'Stop' }))

		expect(state.calls).toEqual([['stop', []]])
	})

	it('draws the four drive buttons and the Keyboard control button under one Controls heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Controls' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Forward (W)' })).toBeVisible()
		expect(screen.getByRole('button', { name: 'Backward (S)' })).toBeVisible()
		expect(screen.getByRole('button', { name: 'Left (A)' })).toBeVisible()
		expect(screen.getByRole('button', { name: 'Right (D)' })).toBeVisible()
		expect(screen.getByRole('button', { name: 'Keyboard control' })).toBeVisible()
	})

	it('draws no Quick move heading', () => {
		renderSubject()

		expect(screen.queryByRole('heading', { name: 'Quick move' })).toBeNull()
	})

	it('shows an error from the composed setPower in the one section indicator', () => {
		state.errors.set('setPower', new Error('motor driver offline'))

		renderSubject()

		expect(screen.getAllByRole('button', { name: /error/iu })).toHaveLength(1)
		expect(screen.getByRole('button', { name: '1 error, copy to clipboard' })).toBeInTheDocument()
	})

	it('sends one Stop and no zero setPower when capture is lost mid-drive', async () => {
		const user = userEvent.setup()
		renderSubject()
		await user.click(screen.getByRole('button', { name: 'Keyboard control' }))
		await user.keyboard('{w>}')
		state.calls = []

		await fireEvent.blur(window)
		await pastSecondZero()

		expect(state.calls).toEqual([['stop', []]])
	})

	it('sends one Stop when the zero setPower on release is rejected', async () => {
		const user = userEvent.setup()
		state.rejectedMethods.add('setPower')
		renderSubject()

		await user.click(screen.getByRole('button', { name: 'Forward (W)' }))
		await pastSecondZero()

		expect(state.calls.filter(([method]) => method === 'stop')).toEqual([['stop', []]])
	})
})

describe('Base controls in a 320 px pane', () => {
	beforeEach(() => {
		state.data = { isMoving: false }
	})

	it('does not scroll horizontally', () => {
		render(InPane, { props: { widget: Subject } })
		const pane = screen.getByTestId('pane')

		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})
})
