import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import InWidgetsProvider from '$lib/__tests__/__fixtures__/in-widgets-provider.svelte'

import GrabWidget from '../grab-widget.svelte'
import OpenWidget from '../open-widget.svelte'
import StopWidget from '../stop-widget.svelte'

const state = vi.hoisted(
	(): {
		release: (() => void) | undefined
		calls: [string, unknown[]][]
	} => ({ release: undefined, calls: [] })
)

vi.mock('@viamrobotics/sdk', () => ({
	GripperClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({ data: undefined, isLoading: false, error: null })),
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
		data: undefined,
		error: null,
	})),
}))

const PROPS = { partID: 'test-part', resourceName: 'test-gripper' }

const open = () => screen.getByRole('button', { name: 'Open' })
const grab = () => screen.getByRole('button', { name: 'Grab' })
const stop = () => screen.getByRole('button', { name: /^stop$/iu })

describe('Gripper widgets sharing one WidgetsProvider', () => {
	beforeEach(() => {
		state.release = undefined
		state.calls = []
	})

	it('disables Grab while Open is in flight, and keeps Stop live', async () => {
		render(InWidgetsProvider, {
			props: { component: [OpenWidget, GrabWidget, StopWidget], props: PROPS },
		})
		expect(grab()).toBeEnabled()

		await fireEvent.click(open())

		await waitFor(() => {
			expect(grab()).toBeDisabled()
		})
		expect(open()).toBeDisabled()
		expect(stop()).toBeEnabled()
		expect(state.calls).toEqual([['open', []]])

		await fireEvent.click(stop())

		expect(state.calls).toEqual([
			['open', []],
			['stop', []],
		])
	})

	it('enables Grab again once Open settles', async () => {
		render(InWidgetsProvider, { props: { component: [OpenWidget, GrabWidget], props: PROPS } })

		await fireEvent.click(open())
		await waitFor(() => {
			expect(grab()).toBeDisabled()
		})

		state.release?.()

		await waitFor(() => {
			expect(grab()).toBeEnabled()
		})
	})
})
