import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import InWidgetsProvider from '#lib/__tests__/__fixtures__/InWidgetsProvider.svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../Home.svelte'
import HomingStatus from '../HomingStatusWidget.svelte'
import PaneSubject from './__fixtures__/In320Pane.svelte'

const mutationState = vi.hoisted(
	(): {
		data: boolean | undefined
		error: Error | null
		isCallHeld: boolean
		rejectCall: (() => void) | undefined
		calls: unknown[][]
	} => ({
		data: undefined,
		error: null,
		isCallHeld: false,
		rejectCall: undefined,
		calls: [],
	})
)

vi.mock('@viamrobotics/sdk', () => ({
	GantryClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({
		get data() {
			return mutationState.data
		},
		get error() {
			return mutationState.error
		},
		isPending: false,
		mutateAsync: (args: unknown[]) => {
			mutationState.calls.push(args)
			if (!mutationState.isCallHeld) return Promise.resolve(true)
			return new Promise((_resolve, reject) => {
				mutationState.rejectCall = () => {
					reject(new Error('homing failed'))
				}
			})
		},
	})),
}))

const HOMING_STATUS = 'Homing. Steps resume when it finishes'

const renderSubject = () =>
	render(InWidgetsProvider, {
		props: { component: Subject, props: { partID: 'test-part', resourceName: 'test-gantry' } },
	})

describe('Gantry Home widget', () => {
	beforeEach(() => {
		mutationState.data = undefined
		mutationState.error = null
		mutationState.isCallHeld = false
		mutationState.rejectCall = undefined
		mutationState.calls = []
	})

	it('renders the Home section heading and the Home button', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument()
	})

	it('runs Home with no arguments when Home is pressed', async () => {
		renderSubject()

		await fireEvent.click(screen.getByRole('button', { name: 'Home' }))

		expect(mutationState.calls).toEqual([[]])
	})

	it('sends nothing from a second press while its Home is in flight', async () => {
		mutationState.isCallHeld = true
		renderSubject()
		await fireEvent.click(screen.getByRole('button', { name: 'Home' }))

		await fireEvent.click(screen.getByRole('button', { name: 'Home' }))

		expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-busy', 'true')
		expect(mutationState.calls).toEqual([[]])
	})

	it('clears the homing status line and frees Home after the call rejects', async () => {
		mutationState.isCallHeld = true
		render(InWidgetsProvider, {
			props: {
				component: [Subject, HomingStatus],
				props: { partID: 'test-part', resourceName: 'test-gantry' },
			},
		})
		await fireEvent.click(screen.getByRole('button', { name: 'Home' }))
		await waitFor(() => {
			expect(screen.getByText(HOMING_STATUS)).toBeInTheDocument()
		})

		mutationState.rejectCall?.()

		await waitFor(() => {
			expect(screen.queryByText(HOMING_STATUS)).not.toBeInTheDocument()
		})
		expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-busy', 'false')
		expect(screen.getByRole('button', { name: 'Home' })).not.toHaveAttribute('aria-disabled')
	})

	it('reads Homed as a dash with no status dot before a run', () => {
		renderSubject()

		expect(screen.getByText('Homed')).toBeInTheDocument()
		expect(screen.getByText('-')).toBeInTheDocument()
		expect(screen.queryByRole('img', { name: 'Homed' })).not.toBeInTheDocument()
	})

	it('reads Homed as a status dot with Yes after a run that homed', () => {
		mutationState.data = true

		renderSubject()

		expect(screen.getByRole('img', { name: 'Homed' })).toBeInTheDocument()
		expect(screen.getByText('Yes')).toBeInTheDocument()
	})

	it('reads Homed as No after a run that did not home', () => {
		mutationState.data = false

		renderSubject()

		expect(screen.getByRole('img', { name: 'Homed' })).toBeInTheDocument()
		expect(screen.getByText('No')).toBeInTheDocument()
	})

	it('names the Homed readout by its label, so assistive tech reads the pair together', () => {
		mutationState.data = true

		renderSubject()

		expect(screen.getByRole('group', { name: 'Homed' })).toHaveTextContent('Yes')
	})

	it("shows the mutation error in the section's error indicator", async () => {
		mutationState.error = new Error('homing failed')

		renderSubject()
		await fireEvent.focusIn(
			screen.getByRole('button', { name: 'Home: 1 error, copy to clipboard' })
		)

		expect(screen.getByText(/homing failed/iu)).toBeInTheDocument()
	})
})

describe('Gantry Home widget in a 320 px pane', () => {
	beforeEach(() => {
		mutationState.data = true
		mutationState.error = null
	})

	it('loads the app stylesheet, so the pane takes its utility width', () => {
		render(PaneSubject, { props: { widget: Subject } })

		expect(getComputedStyle(screen.getByTestId('pane')).width).toBe('320px')
	})

	it('does not scroll horizontally', () => {
		render(PaneSubject, { props: { widget: Subject } })
		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')

		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})

	it('puts the Home button and its Homed result on one row', () => {
		render(PaneSubject, { props: { widget: Subject } })

		const button = screen.getByRole('button', { name: 'Home' }).getBoundingClientRect()
		const result = screen.getByRole('group', { name: 'Homed' }).getBoundingClientRect()
		expect(result.top, 'the result starts above the button bottom').toBeLessThan(button.bottom)
		expect(button.top, 'the button starts above the result bottom').toBeLessThan(result.bottom)
		expect(result.left).toBeGreaterThan(button.right)
	})
})
