import { fireEvent, render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../home.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const mutationState = vi.hoisted(
	(): { data: boolean | undefined; error: Error | null; mutate: ReturnType<typeof vi.fn> } => ({
		data: undefined,
		error: null,
		mutate: vi.fn(),
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
		mutate: mutationState.mutate,
	})),
}))

const renderSubject = () =>
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-gantry' } })

describe('Gantry Home widget', () => {
	beforeEach(() => {
		mutationState.data = undefined
		mutationState.error = null
		mutationState.mutate.mockClear()
	})

	it('renders the Home section heading, the one line of text, and Execute', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument()
		expect(screen.getByText('Run the homing sequence')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Execute' })).toBeInTheDocument()
	})

	it('runs Home with no arguments when Execute is pressed', async () => {
		renderSubject()

		await fireEvent.click(screen.getByRole('button', { name: 'Execute' }))

		expect(mutationState.mutate).toHaveBeenCalledWith([], {})
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
		await fireEvent.focus(screen.getByRole('button', { name: '1 error, copy to clipboard' }))

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
})
