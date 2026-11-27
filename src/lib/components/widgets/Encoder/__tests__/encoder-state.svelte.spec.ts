import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import InWidgetsProvider from '#lib/__tests__/__fixtures__/InWidgetsProvider.svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ResetPosition from '../ResetPositionWidget.svelte'
import ZeroPosition from '../ZeroPositionWidget.svelte'

const state = vi.hoisted(
	(): {
		release: (() => void) | undefined
		fail: ((error: Error) => void) | undefined
		calls: [string, unknown[]][]
	} => ({ release: undefined, fail: undefined, calls: [] })
)

vi.mock('@viamrobotics/sdk', () => ({
	EncoderClient: class {},
	EncoderPositionType: { UNSPECIFIED: 0, TICKS_COUNT: 1, ANGLE_DEGREES: 2 },
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn((_client: unknown, method: string) => ({
		mutateAsync: (args: unknown[]) => {
			state.calls.push([method, args])
			return new Promise<void>((resolve, reject) => {
				state.release = resolve
				state.fail = reject
			})
		},
		error: null,
	})),
	createResourceQuery: vi.fn((_client: unknown, method: string) => ({
		data:
			method === 'getProperties'
				? { angleDegreesSupported: true, ticksCountSupported: false }
				: undefined,
		isLoading: false,
		isError: false,
		error: null,
		refetch: vi.fn(),
	})),
}))

const PROPS = { partID: 'test-part', resourceName: 'test-encoder' }

const resetButtons = () => screen.getAllByRole('button', { name: 'Reset to zero' })

describe('Encoder widgets sharing one WidgetsProvider', () => {
	beforeEach(() => {
		state.release = undefined
		state.fail = undefined
		state.calls = []
		localStorage.clear()
	})

	it('shares the reset group between two ResetPosition widgets', async () => {
		render(InWidgetsProvider, {
			props: { component: [ResetPosition, ResetPosition], props: PROPS },
		})
		for (const button of resetButtons()) expect(button).toBeEnabled()

		await fireEvent.click(resetButtons()[0] as HTMLElement)

		await waitFor(() => {
			for (const button of resetButtons()) expect(button).toBeDisabled()
		})
		expect(state.calls).toEqual([['resetPosition', []]])

		state.release?.()

		await waitFor(() => {
			for (const button of resetButtons()) expect(button).toBeEnabled()
		})
	})

	it('shares no group across two encoders', async () => {
		render(InWidgetsProvider, { props: { component: ResetPosition, props: PROPS } })
		render(InWidgetsProvider, {
			props: { component: ResetPosition, props: { ...PROPS, resourceName: 'other-encoder' } },
		})

		await fireEvent.click(resetButtons()[0] as HTMLElement)

		await waitFor(() => {
			expect(resetButtons()[0]).toBeDisabled()
		})
		expect(resetButtons()[1]).toBeEnabled()
	})

	it('holds ZeroPosition back and shows it the outcome of a reset ResetPosition sent', async () => {
		render(InWidgetsProvider, {
			props: { component: [ResetPosition, ZeroPosition], props: PROPS },
		})
		const [apiButton, controlButton] = resetButtons()
		const statusLines = () =>
			screen.getAllByTestId('status-line').map((line) => line.textContent.trim())

		await fireEvent.click(apiButton as HTMLElement)

		await waitFor(() => {
			expect(controlButton).toHaveAttribute('aria-disabled', 'true')
		})
		expect(statusLines()).toEqual(['Resetting', 'Resetting to zero.'])

		state.fail?.(new Error('encoder refused to reset'))

		await waitFor(() => {
			expect(statusLines()).toEqual(['Reset failed', 'Reset failed'])
		})
		expect(controlButton).not.toHaveAttribute('aria-disabled')
	})

	it('clears the last outcome in both widgets when the next reset starts', async () => {
		render(InWidgetsProvider, {
			props: { component: [ResetPosition, ZeroPosition], props: PROPS },
		})
		const [apiButton] = resetButtons()
		const statusLines = () =>
			screen.getAllByTestId('status-line').map((line) => line.textContent.trim())
		await fireEvent.click(apiButton as HTMLElement)
		await waitFor(() => {
			expect(state.fail).toBeDefined()
		})
		state.fail?.(new Error('encoder refused to reset'))
		await waitFor(() => {
			expect(statusLines()).toEqual(['Reset failed', 'Reset failed'])
		})

		await fireEvent.click(apiButton as HTMLElement)
		await waitFor(() => {
			expect(state.calls).toHaveLength(2)
		})
		state.release?.()

		await waitFor(() => {
			expect(statusLines()).toEqual(['Position reset', ''])
		})
	})
})
