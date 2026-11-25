import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import InWidgetsProvider from '$lib/__tests__/__fixtures__/in-widgets-provider.svelte'

import SetMode from '../set-mode-widget.svelte'

const state = vi.hoisted(
	(): {
		release: (() => void) | undefined
		calls: [string, unknown[]][]
	} => ({ release: undefined, calls: [] })
)

vi.mock('@viamrobotics/sdk', () => ({
	NavigationClient: class {},
	navigationApi: { Mode: { UNSPECIFIED: 0, MANUAL: 1, WAYPOINT: 2, EXPLORE: 3 } },
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
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

const PROPS = { partID: 'test-part', resourceName: 'test-nav' }

const executeButtons = () => screen.getAllByRole('button', { name: 'Execute' })

describe('Navigation widgets sharing one WidgetsProvider', () => {
	beforeEach(() => {
		state.release = undefined
		state.calls = []
	})

	it('shares the mode group between two SetMode widgets', async () => {
		render(InWidgetsProvider, { props: { component: [SetMode, SetMode], props: PROPS } })
		for (const radio of screen.getAllByRole('radio', { name: 'Manual' })) {
			await fireEvent.click(radio)
		}
		for (const button of executeButtons()) expect(button).toBeEnabled()

		await fireEvent.click(executeButtons()[0] as HTMLElement)

		await waitFor(() => {
			for (const button of executeButtons()) expect(button).toBeDisabled()
		})
		expect(state.calls).toEqual([['setMode', [1]]])

		state.release?.()

		await waitFor(() => {
			for (const button of executeButtons()) expect(button).toBeEnabled()
		})
	})

	it('shares no group across two navigation services', async () => {
		render(InWidgetsProvider, { props: { component: SetMode, props: PROPS } })
		render(InWidgetsProvider, {
			props: { component: SetMode, props: { ...PROPS, resourceName: 'other-nav' } },
		})
		for (const radio of screen.getAllByRole('radio', { name: 'Manual' })) {
			await fireEvent.click(radio)
		}

		await fireEvent.click(executeButtons()[0] as HTMLElement)

		await waitFor(() => {
			expect(executeButtons()[0]).toBeDisabled()
		})
		expect(executeButtons()[1]).toBeEnabled()
	})
})
