import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import InWidgetsProvider from '$lib/__tests__/__fixtures__/in-widgets-provider.svelte'

import Home from '../home.svelte'
import HomingStatus from '../homing-status-widget.svelte'
import MoveToPosition from '../move-to-position-widget.svelte'
import QuickMove from '../quick-move-widget.svelte'
import Stop from '../stop-widget.svelte'

const state = vi.hoisted(
	(): {
		release: (() => void) | undefined
		calls: [string, unknown[]][]
	} => ({ release: undefined, calls: [] })
)

vi.mock('@viamrobotics/sdk', () => ({
	GantryClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn((_client: unknown, method: string) => ({
		data: method === 'getLengths' ? [1000, 600] : [11, 22],
		isLoading: false,
		isSuccess: true,
		isError: false,
		error: null,
	})),
	createResourceMutation: vi.fn((_client: unknown, method: string) => ({
		mutate: (args: unknown[]) => {
			state.calls.push([method, args])
		},
		mutateAsync: (args: unknown[]) => {
			state.calls.push([method, args])
			return new Promise<void>((resolve) => {
				state.release = resolve
			})
		},
		isPending: false,
		error: null,
	})),
}))

const PROPS = { partID: 'test-part', resourceName: 'test-gantry' }
const HOMING_STATUS = 'Homing. Steps resume when it finishes'

const executeButton = () => screen.getByRole('button', { name: /execute/iu })
const homeButton = () => screen.getByRole('button', { name: 'Home' })
const stopButton = () => screen.getByRole('button', { name: /^stop$/iu })

describe('Gantry widgets sharing one WidgetsProvider', () => {
	beforeEach(() => {
		state.release = undefined
		state.calls = []
	})

	it('disables the other motion widgets while Home is in flight, and keeps Stop live', async () => {
		render(InWidgetsProvider, {
			props: { component: [Home, QuickMove, MoveToPosition, Stop], props: PROPS },
		})

		await fireEvent.click(homeButton())

		await waitFor(() => {
			expect(executeButton()).toBeDisabled()
		})
		expect(screen.getByRole('button', { name: '+10 mm, Axis 0' })).toBeDisabled()
		expect(stopButton()).toBeEnabled()
		expect(state.calls).toEqual([['home', []]])

		await fireEvent.click(stopButton())

		expect(state.calls).toEqual([
			['home', []],
			['stop', []],
		])
	})

	it('drops a Home press made while MoveToPosition is in flight, and enables again once it settles', async () => {
		render(InWidgetsProvider, { props: { component: [Home, MoveToPosition], props: PROPS } })

		await fireEvent.click(executeButton())
		await waitFor(() => {
			expect(executeButton()).toBeDisabled()
		})
		await fireEvent.click(homeButton())

		expect(state.calls.map(([method]) => method)).toEqual(['moveToPosition'])

		state.release?.()

		await waitFor(() => {
			expect(executeButton()).toBeEnabled()
		})
	})

	it('ends a QuickMove hold in progress when Stop is pressed, so no further step goes out', async () => {
		const user = userEvent.setup()
		render(InWidgetsProvider, { props: { component: [QuickMove, Stop], props: PROPS } })
		const stepper = screen.getByRole('button', { name: '+10 mm, Axis 0' })

		await user.pointer({ target: stepper, keys: '[MouseLeft>]' })
		await waitFor(() => {
			expect(state.calls.map(([method]) => method)).toEqual(['moveToPosition'])
		})
		await fireEvent.click(stopButton())
		state.release?.()

		await waitFor(() => {
			expect(stepper).not.toHaveAttribute('aria-disabled')
		})
		expect(state.calls.map(([method]) => method)).toEqual(['moveToPosition', 'stop'])
		await user.pointer({ keys: '[/MouseLeft]' })
	})

	it("shows Home's status in HomingStatus and QuickMove while Home is in flight, then clears it", async () => {
		render(InWidgetsProvider, {
			props: { component: [Home, QuickMove, HomingStatus], props: PROPS },
		})

		await fireEvent.click(homeButton())

		await waitFor(() => {
			expect(screen.getAllByText(HOMING_STATUS)).toHaveLength(2)
		})

		state.release?.()

		await waitFor(() => {
			expect(screen.queryByText(HOMING_STATUS)).not.toBeInTheDocument()
		})
	})

	it('shares no group across two gantries', async () => {
		render(InWidgetsProvider, { props: { component: MoveToPosition, props: PROPS } })
		render(InWidgetsProvider, {
			props: { component: MoveToPosition, props: { ...PROPS, resourceName: 'other-gantry' } },
		})

		await fireEvent.click(screen.getAllByRole('button', { name: /execute/iu })[0] as HTMLElement)

		await waitFor(() => {
			expect(screen.getAllByRole('button', { name: /execute/iu })[0]).toBeDisabled()
		})
		expect(screen.getAllByRole('button', { name: /execute/iu })[1]).toBeEnabled()
	})
})
