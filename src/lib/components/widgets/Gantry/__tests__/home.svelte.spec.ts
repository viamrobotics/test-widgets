import { fireEvent, render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import InWidgetsProvider from '$lib/__tests__/__fixtures__/in-widgets-provider.svelte'

import Subject from '../home.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const mutationState = vi.hoisted(
	(): {
		data: boolean | undefined
		error: Error | null
		isCallHeld: boolean
		calls: unknown[][]
	} => ({
		data: undefined,
		error: null,
		isCallHeld: false,
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
			return mutationState.isCallHeld ? new Promise(() => {}) : Promise.resolve(true)
		},
	})),
}))

const renderSubject = () =>
	render(InWidgetsProvider, {
		props: { component: Subject, props: { partID: 'test-part', resourceName: 'test-gantry' } },
	})

describe('Gantry Home widget', () => {
	beforeEach(() => {
		mutationState.data = undefined
		mutationState.error = null
		mutationState.isCallHeld = false
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
