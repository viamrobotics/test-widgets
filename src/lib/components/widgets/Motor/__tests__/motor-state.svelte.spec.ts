import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import InWidgetsProvider from '$lib/__tests__/__fixtures__/in-widgets-provider.svelte'

import GoFor from '../go-for-view.svelte'
import ResetZeroPosition from '../reset-zero-position-widget.svelte'
import SetPower from '../set-power-widget.svelte'
import Stop from '../stop-widget.svelte'

const state = vi.hoisted(
	(): {
		release: (() => void) | undefined
		calls: [string, unknown[]][]
	} => ({ release: undefined, calls: [] })
)

vi.mock('@viamrobotics/sdk', () => ({
	MotorClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		data: { positionReporting: true },
		isLoading: false,
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

const PROPS = { partID: 'test-part', resourceName: 'test-motor' }

const executeButtons = () => screen.getAllByRole('button', { name: /execute/iu })

describe('Motor widgets sharing one WidgetsProvider', () => {
	beforeEach(() => {
		state.release = undefined
		state.calls = []
	})

	it('disables every other motion widget while one call is in flight, and keeps Stop live', async () => {
		render(InWidgetsProvider, {
			props: { component: [SetPower, GoFor, ResetZeroPosition, Stop], props: PROPS },
		})
		expect(executeButtons()).toHaveLength(3)
		for (const button of executeButtons()) expect(button).toBeEnabled()

		await fireEvent.click(executeButtons()[0] as HTMLElement)

		await waitFor(() => {
			for (const button of executeButtons()) expect(button).toBeDisabled()
		})
		expect(screen.getByRole('button', { name: /^stop$/iu })).toBeEnabled()
		expect(state.calls).toEqual([['setPower', [0.5]]])

		await fireEvent.click(screen.getByRole('button', { name: /^stop$/iu }))

		expect(state.calls).toEqual([
			['setPower', [0.5]],
			['stop', []],
		])
	})

	it('enables the other widgets again once the call settles', async () => {
		render(InWidgetsProvider, { props: { component: [SetPower, GoFor], props: PROPS } })

		await fireEvent.click(executeButtons()[0] as HTMLElement)
		await waitFor(() => {
			expect(executeButtons()[1]).toBeDisabled()
		})

		state.release?.()

		await waitFor(() => {
			for (const button of executeButtons()) expect(button).toBeEnabled()
		})
	})

	it('shares no group across two motors', async () => {
		render(InWidgetsProvider, { props: { component: SetPower, props: PROPS } })
		render(InWidgetsProvider, {
			props: { component: GoFor, props: { ...PROPS, resourceName: 'other-motor' } },
		})

		await fireEvent.click(executeButtons()[0] as HTMLElement)

		await waitFor(() => {
			expect(executeButtons()[0]).toBeDisabled()
		})
		expect(executeButtons()[1]).toBeEnabled()
	})
})
