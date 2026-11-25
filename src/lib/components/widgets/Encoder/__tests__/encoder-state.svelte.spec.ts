import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import InWidgetsProvider from '$lib/__tests__/__fixtures__/in-widgets-provider.svelte'

import ResetPosition from '../reset-position-widget.svelte'

const state = vi.hoisted(
	(): {
		release: (() => void) | undefined
		calls: [string, unknown[]][]
	} => ({ release: undefined, calls: [] })
)

vi.mock('@viamrobotics/sdk', () => ({
	EncoderClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn((_client: unknown, method: string) => ({
		mutateAsync: (args: unknown[]) => {
			state.calls.push([method, args])
			return new Promise<void>((resolve) => {
				state.release = resolve
			})
		},
		error: null,
	})),
}))

const PROPS = { partID: 'test-part', resourceName: 'test-encoder' }

const resetButtons = () => screen.getAllByRole('button', { name: 'Reset to zero' })

describe('Encoder widgets sharing one WidgetsProvider', () => {
	beforeEach(() => {
		state.release = undefined
		state.calls = []
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
})
