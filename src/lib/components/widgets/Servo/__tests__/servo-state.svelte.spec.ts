import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import InWidgetsProvider from '#lib/__tests__/__fixtures__/InWidgetsProvider.svelte'
import { tick } from 'svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import MoveToControl from '../MoveToControl.svelte'
import MoveWidget from '../MoveWidget.svelte'
import QuickMoveWidget from '../QuickMoveWidget.svelte'
import StopWidget from '../StopWidget.svelte'

const state = vi.hoisted(
	(): {
		release: (() => void) | undefined
		fail: (() => void) | undefined
		readPosition: () => number
		calls: [string, unknown[]][]
	} => ({ release: undefined, fail: undefined, readPosition: () => 45, calls: [] })
)

vi.mock('@viamrobotics/sdk', () => ({
	ServoClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		get data() {
			return state.readPosition()
		},
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
			return new Promise<void>((resolve, reject) => {
				state.release = resolve
				state.fail = () => {
					reject(new Error('servo refused to move'))
				}
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

const position = $state({ degrees: 45 })

const stepAndSettle = async (settle: 'release' | 'fail' = 'release') => {
	await userEvent.click(stepper())
	state[settle]?.()
	await waitFor(() => {
		expect(stepper()).not.toHaveAttribute('aria-disabled')
	})
}

const moveCalls = () => state.calls.filter(([method]) => method === 'move').map(([, args]) => args)

describe('Servo widgets sharing one WidgetsProvider', () => {
	beforeEach(() => {
		state.release = undefined
		state.fail = undefined
		state.calls = []
		position.degrees = 45
		state.readPosition = () => position.degrees
	})

	describe('stepping before the position is read again', () => {
		it('starts the second step from the angle the first one commanded', async () => {
			render(InWidgetsProvider, { props: { component: QuickMoveWidget, props: PROPS } })
			await stepAndSettle()

			await userEvent.click(stepper())

			expect(moveCalls()).toEqual([[50], [55]])
		})

		it('starts from the read position after a move that failed', async () => {
			render(InWidgetsProvider, { props: { component: QuickMoveWidget, props: PROPS } })
			await stepAndSettle('fail')

			await userEvent.click(stepper())

			expect(moveCalls()).toEqual([[50], [50]])
		})

		it('starts from the read position after Stop', async () => {
			render(InWidgetsProvider, {
				props: { component: [QuickMoveWidget, StopWidget], props: PROPS },
			})
			await stepAndSettle()
			await fireEvent.click(stop())

			await userEvent.click(stepper())

			expect(moveCalls()).toEqual([[50], [50]])
		})

		it("starts from the angle Move's Execute commanded", async () => {
			render(InWidgetsProvider, {
				props: { component: [MoveWidget, QuickMoveWidget], props: PROPS },
			})
			const field = screen.getByRole('spinbutton', { name: /desired angle/iu })
			await userEvent.clear(field)
			await userEvent.type(field, '90{Tab}')
			await userEvent.click(execute())
			state.release?.()
			await waitFor(() => {
				expect(stepper()).not.toHaveAttribute('aria-disabled')
			})

			await userEvent.click(stepper())

			expect(moveCalls()).toEqual([[90], [95]])
		})
	})

	it('steps from the read position once the servo was read at its commanded angle and then moved', async () => {
		render(InWidgetsProvider, { props: { component: QuickMoveWidget, props: PROPS } })
		await stepAndSettle()
		position.degrees = 50
		await tick()
		position.degrees = 20
		await tick()

		await userEvent.click(stepper())

		expect(moveCalls()).toEqual([[50], [25]])
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
	describe('with the Move to control', () => {
		it("holds Move's Execute back while a Move to move is in flight", async () => {
			render(InWidgetsProvider, {
				props: { component: [MoveWidget, MoveToControl], props: PROPS },
			})
			expect(execute()).not.toHaveAttribute('aria-disabled')

			await fireEvent.change(screen.getByRole('slider', { name: 'Move to' }), {
				target: { value: '100' },
			})

			await waitFor(() => {
				expect(execute()).toHaveAttribute('aria-disabled', 'true')
			})
			expect(state.calls).toEqual([['move', [100]]])

			state.release?.()

			await waitFor(() => {
				expect(execute()).not.toHaveAttribute('aria-disabled')
			})
		})

		it("raises Move's highest angle when Move to's Max passes 180", async () => {
			render(InWidgetsProvider, {
				props: { component: [MoveWidget, MoveToControl], props: PROPS },
			})
			const field = screen.getByRole('spinbutton', { name: /desired angle/iu })
			await userEvent.clear(field)
			await userEvent.type(field, '200{Tab}')
			expect(execute()).toHaveAttribute('aria-disabled', 'true')

			const max = screen.getByRole('spinbutton', { name: 'Max' })
			await userEvent.clear(max)
			await userEvent.type(max, '250{Tab}')

			await waitFor(() => {
				expect(execute()).not.toHaveAttribute('aria-disabled')
			})
		})
	})
})
