import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import InWidgetsProvider from '$lib/__tests__/__fixtures__/in-widgets-provider.svelte'

import Home from '../home.svelte'
import Subject from '../homing-status-widget.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const state = vi.hoisted((): { release: ((isHomed: boolean) => void) | undefined } => ({
	release: undefined,
}))

vi.mock('@viamrobotics/sdk', () => ({
	GantryClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({
		data: undefined,
		error: null,
		isPending: false,
		mutateAsync: () =>
			new Promise<boolean>((resolve) => {
				state.release = resolve
			}),
	})),
}))

const PROPS = { partID: 'test-part', resourceName: 'test-gantry' }
const HOMING_STATUS = 'Homing. Steps resume when it finishes'

describe('Gantry HomingStatus widget', () => {
	beforeEach(() => {
		state.release = undefined
	})

	it('renders an empty status line while no Home is in flight', () => {
		render(InWidgetsProvider, { props: { component: Subject, props: PROPS } })

		expect(screen.getByRole('heading', { name: 'Homing status' })).toBeInTheDocument()
		expect(screen.getByTestId('status-line').textContent?.trim()).toBe('')
	})

	it('reads the homing status while a Home elsewhere on the page is in flight, then clears it', async () => {
		render(InWidgetsProvider, { props: { component: [Home, Subject], props: PROPS } })

		await fireEvent.click(screen.getByRole('button', { name: 'Home' }))

		await waitFor(() => {
			expect(screen.getByTestId('status-line')).toHaveTextContent(HOMING_STATUS)
		})

		state.release?.(true)

		await waitFor(() => {
			expect(screen.getByTestId('status-line').textContent?.trim()).toBe('')
		})
	})
})

const PANE_WIDTH = '320px'

describe('Gantry HomingStatus widget in a 320 px pane', () => {
	it('loads the app stylesheet, and the pane does not scroll horizontally', () => {
		render(PaneSubject, { props: { widget: Subject } })
		const pane = screen.getByTestId('pane')

		expect(getComputedStyle(pane).width).toBe(PANE_WIDTH)
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})
})
