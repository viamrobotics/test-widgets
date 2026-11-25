import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import InWidgetsProvider from '#lib/__tests__/__fixtures__/InWidgetsProvider.svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import MoveStraight from '../MoveStraightWidget.svelte'
import SetPower from '../SetPowerWidget.svelte'
import Spin from '../SpinWidget.svelte'
import Stop from '../StopWidget.svelte'

const state = vi.hoisted(
	(): {
		release: (() => void) | undefined
		calls: [string, unknown[]][]
	} => ({ release: undefined, calls: [] })
)

vi.mock('@viamrobotics/sdk', () => ({
	BaseClient: class {},
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

const PROPS = { partID: 'test-part', resourceName: 'test-base' }

const executeButtons = () => screen.getAllByRole('button', { name: /execute/iu })
const stopButton = () => screen.getByRole('button', { name: /^stop$/iu })

describe('Base widgets sharing one WidgetsProvider', () => {
	beforeEach(() => {
		state.release = undefined
		state.calls = []
	})

	it('disables every other motion widget while one call is in flight, and keeps Stop live', async () => {
		render(InWidgetsProvider, {
			props: { component: [Spin, MoveStraight, SetPower, Stop], props: PROPS },
		})
		expect(executeButtons()).toHaveLength(3)
		for (const button of executeButtons()) expect(button).toBeEnabled()

		await fireEvent.click(executeButtons()[0] as HTMLElement)

		await waitFor(() => {
			for (const button of executeButtons()) expect(button).toBeDisabled()
		})
		expect(stopButton()).toBeEnabled()
		expect(state.calls).toEqual([['spin', [90, 45]]])

		await fireEvent.click(stopButton())

		expect(state.calls).toEqual([
			['spin', [90, 45]],
			['stop', []],
		])
	})

	it('enables the other widgets again once the call settles', async () => {
		render(InWidgetsProvider, { props: { component: [Spin, MoveStraight], props: PROPS } })

		await fireEvent.click(executeButtons()[0] as HTMLElement)
		await waitFor(() => {
			expect(executeButtons()[1]).toBeDisabled()
		})

		state.release?.()

		await waitFor(() => {
			for (const button of executeButtons()) expect(button).toBeEnabled()
		})
	})

	it('shares no group across two bases', async () => {
		render(InWidgetsProvider, {
			props: {
				component: [
					Spin,
					{ component: MoveStraight, props: { ...PROPS, resourceName: 'other-base' } },
				],
				props: PROPS,
			},
		})

		await fireEvent.click(executeButtons()[0] as HTMLElement)

		await waitFor(() => {
			expect(executeButtons()[0]).toBeDisabled()
		})
		expect(executeButtons()[1]).toBeEnabled()
	})
})
