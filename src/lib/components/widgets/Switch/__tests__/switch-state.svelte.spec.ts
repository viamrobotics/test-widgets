import '../../../../../app.css'

import { render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import InWidgetsProvider from '$lib/__tests__/__fixtures__/in-widgets-provider.svelte'

import SetPosition from '../position-view.svelte'

const state = vi.hoisted((): { mutateAsync: Mock; release: (() => void) | undefined } => ({
	mutateAsync: vi.fn(),
	release: undefined,
}))

vi.mock('@viamrobotics/sdk', async (importOriginal) => ({
	...(await importOriginal<typeof import('@viamrobotics/sdk')>()),
	SwitchClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn((_client: unknown, method: string) => ({
		data: method === 'getPosition' ? 1 : [3, ['Off', 'On', 'Auto']],
		isLoading: false,
		isSuccess: true,
		isError: false,
		fetchStatus: 'idle',
		error: null,
		refetch: vi.fn(),
		queryKey: [],
	})),
	createResourceMutation: vi.fn(() => ({
		mutateAsync: (...args: unknown[]) => state.mutateAsync(...args),
		isPending: false,
		error: null,
	})),
}))

const nextFrame = () =>
	new Promise<void>((resolve) => {
		requestAnimationFrame(() => {
			resolve()
		})
	})

const settleLayout = async () => {
	await document.fonts.ready
	await nextFrame()
	await nextFrame()
}

const PROPS = { partID: 'test-part', resourceName: 'test-switch' }

describe('Switch widgets sharing one WidgetsProvider', () => {
	beforeEach(() => {
		state.release = undefined
		state.mutateAsync = vi.fn(
			() =>
				new Promise<void>((resolve) => {
					state.release = resolve
				})
		)
	})

	it('shares the position group between two SetPosition widgets', async () => {
		render(InWidgetsProvider, { props: { component: [SetPosition, SetPosition], props: PROPS } })
		await settleLayout()
		const autos = await screen.findAllByRole('radio', { name: 'Auto' })
		for (const radio of screen.getAllByRole('radio')) expect(radio).toBeEnabled()

		await userEvent.click(autos[0] as HTMLElement)

		await waitFor(() => {
			for (const radio of screen.getAllByRole('radio')) expect(radio).toBeDisabled()
		})
		expect(state.mutateAsync).toHaveBeenCalledTimes(1)

		state.release?.()

		await waitFor(() => {
			for (const radio of screen.getAllByRole('radio')) expect(radio).toBeEnabled()
		})
	})

	it('shares no group across two switches', async () => {
		render(InWidgetsProvider, { props: { component: SetPosition, props: PROPS } })
		render(InWidgetsProvider, {
			props: { component: SetPosition, props: { ...PROPS, resourceName: 'other-switch' } },
		})
		await settleLayout()
		const autos = await screen.findAllByRole('radio', { name: 'Auto' })

		await userEvent.click(autos[0] as HTMLElement)

		await waitFor(() => {
			expect(screen.getAllByRole('radio', { name: 'Off' })[0]).toBeDisabled()
		})
		expect(screen.getAllByRole('radio', { name: 'Off' })[1]).toBeEnabled()
	})
})
