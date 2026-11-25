import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import InWidgetsProvider from '$lib/__tests__/__fixtures__/in-widgets-provider.svelte'

import MoveWidget from '../move-widget.svelte'
import QuickMoveWidget from '../quick-move-widget.svelte'
import StopWidget from '../stop-widget.svelte'

const state = vi.hoisted(
	(): {
		release: (() => void) | undefined
		calls: [string, unknown[]][]
	} => ({ release: undefined, calls: [] })
)

vi.mock('@viamrobotics/sdk', () => ({
	ServoClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		data: 45,
		isLoading: false,
		isSuccess: true,
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

const PROPS = { partID: 'test-part', resourceName: 'test-servo' }

const stepper = () => screen.getByRole('button', { name: /^\+5°,/u })
const execute = () => screen.getByRole('button', { name: /execute/iu })
const stop = () => screen.getByRole('button', { name: /^stop$/iu })

describe('Servo widgets sharing one WidgetsProvider', () => {
	beforeEach(() => {
		state.release = undefined
		state.calls = []
	})

	it('disables the other motion widget while one move is in flight, and keeps Stop live', async () => {
		render(InWidgetsProvider, {
			props: { component: [MoveWidget, QuickMoveWidget, StopWidget], props: PROPS },
		})
		expect(execute()).toBeEnabled()
		expect(stepper()).not.toHaveAttribute('aria-disabled')

		await fireEvent.click(execute())

		await waitFor(() => {
			expect(stepper()).toHaveAttribute('aria-disabled', 'true')
		})
		expect(execute()).toBeDisabled()
		expect(stop()).toBeEnabled()
		expect(state.calls).toEqual([['move', [45]]])

		await fireEvent.click(stop())

		expect(state.calls).toEqual([
			['move', [45]],
			['stop', []],
		])
	})

	it('enables the other widget again once the move settles', async () => {
		render(InWidgetsProvider, { props: { component: [MoveWidget, QuickMoveWidget], props: PROPS } })

		await fireEvent.click(execute())
		await waitFor(() => {
			expect(execute()).toBeDisabled()
		})

		state.release?.()

		await waitFor(() => {
			expect(execute()).toBeEnabled()
		})
		expect(stepper()).not.toHaveAttribute('aria-disabled')
	})
})
