import { fireEvent, render, screen, within } from '@testing-library/svelte'
import { createResourceMutation, createResourceQuery } from '@viamrobotics/svelte-sdk'
import InWidgetsProvider from '#lib/__tests__/__fixtures__/InWidgetsProvider.svelte'
import { SvelteMap } from 'svelte/reactivity'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../GoToInputsWidget.svelte'
import PaneSubject from './__fixtures__/In320Pane.svelte'

const { goToInputsMutate, queryState } = vi.hoisted(() => ({
	goToInputsMutate: vi.fn(),
	queryState: { data: undefined as number[] | undefined },
}))

const liveData = new SvelteMap<string, number[]>()

vi.mock('@viamrobotics/sdk', () => ({
	GripperClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		get data() {
			return liveData.get('data') ?? queryState.data
		},
		isLoading: queryState.data === undefined,
		isError: false,
		error: null,
	})),
	createResourceMutation: vi.fn(),
}))

const mockMutation = (error: Error | null = null) => {
	vi.mocked(createResourceMutation).mockReturnValue({
		mutateAsync: goToInputsMutate,
		isPending: false,
		error,
	} as never)
}

const renderSubject = () =>
	render(InWidgetsProvider, {
		props: { component: Subject, props: { partID: 'test-part', resourceName: 'test-gripper' } },
	})

describe('Gripper GoToInputs widget', () => {
	beforeEach(() => {
		goToInputsMutate.mockClear()
		liveData.clear()
		queryState.data = [0.62, 0.38]
		mockMutation()
	})

	it('renders the GoToInputs section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GoToInputs' })).toBeInTheDocument()
	})

	it('draws one field per input, each reading the live value', () => {
		renderSubject()

		expect(screen.getByRole('spinbutton', { name: 'Input 0' })).toHaveValue(0.62)
		expect(screen.getByRole('spinbutton', { name: 'Input 1' })).toHaveValue(0.38)
		expect(screen.queryByRole('button', { name: /Reset Input 0/u })).not.toBeInTheDocument()
		expect(screen.queryByRole('button', { name: /Reset Input 1/u })).not.toBeInTheDocument()
	})

	it('draws no fields before the first read', () => {
		queryState.data = undefined
		renderSubject()

		expect(screen.queryAllByRole('spinbutton')).toEqual([])
	})

	it('reads - when the gripper reports no inputs', () => {
		queryState.data = []
		renderSubject()

		expect(within(screen.getByRole('group', { name: 'Inputs' })).getByText('-')).toBeInTheDocument()
		expect(screen.queryAllByRole('spinbutton')).toEqual([])
	})

	it('names the drift message as the description of its field', async () => {
		renderSubject()
		const field = screen.getByRole('spinbutton', { name: 'Input 0' })
		expect(field).not.toHaveAttribute('aria-describedby')

		await fireEvent.input(field, { target: { value: '0.9' } })
		liveData.set('data', [0.3, 0.38])

		await vi.waitFor(() => {
			expect(screen.getByRole('spinbutton', { name: 'Input 0' })).toHaveAccessibleDescription(
				'Gripper moved 0.32 since you edited Input 0.'
			)
		})
		expect(screen.getByRole('spinbutton', { name: 'Input 1' })).not.toHaveAttribute(
			'aria-describedby'
		)
	})

	it('draws Execute as a compact button with a default-size icon', () => {
		renderSubject()

		const execute = screen.getByRole('button', { name: /execute/iu })
		expect(execute).toHaveClass('button', 'button-compact')
		expect(execute).not.toHaveClass('button-dark')
	})

	it('polls getCurrentInputs for the input count', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getCurrentInputs', {
			refetchInterval: 500,
		})
	})

	it('sends goToInputs with the live values when nothing is edited', async () => {
		renderSubject()

		await fireEvent.click(screen.getByRole('button', { name: /execute/iu }))

		expect(goToInputsMutate).toHaveBeenCalledTimes(1)
		expect(goToInputsMutate).toHaveBeenCalledWith([[0.62, 0.38]])
	})

	it('sends an edited value with the live value of the other input', async () => {
		renderSubject()

		await fireEvent.input(screen.getByRole('spinbutton', { name: 'Input 0' }), {
			target: { value: '0.8' },
		})
		await fireEvent.click(screen.getByRole('button', { name: /execute/iu }))

		expect(goToInputsMutate).toHaveBeenCalledWith([[0.8, 0.38]])
		expect(screen.getByRole('button', { name: /Reset Input 0/u })).toBeVisible()
	})

	it('restores the live value without sending', async () => {
		renderSubject()

		await fireEvent.input(screen.getByRole('spinbutton', { name: 'Input 0' }), {
			target: { value: '0.8' },
		})
		await fireEvent.click(screen.getByRole('button', { name: /Reset Input 0/u }))

		expect(screen.getByRole('spinbutton', { name: 'Input 0' })).toHaveValue(0.62)
		expect(goToInputsMutate).not.toHaveBeenCalled()
	})

	it('holds an empty field back from Execute', async () => {
		renderSubject()

		await fireEvent.input(screen.getByRole('spinbutton', { name: 'Input 0' }), {
			target: { value: '' },
		})
		await fireEvent.click(screen.getByRole('button', { name: /execute/iu }))

		expect(goToInputsMutate).not.toHaveBeenCalled()
	})

	it('disables Execute and names the empty field in a described hint', async () => {
		renderSubject()
		expect(screen.getByRole('button', { name: /execute/iu })).toBeEnabled()
		expect(screen.queryByText(/Enter a value for/u)).not.toBeInTheDocument()

		await fireEvent.input(screen.getByRole('spinbutton', { name: 'Input 1' }), {
			target: { value: '' },
		})

		expect(screen.getByRole('spinbutton', { name: 'Input 1' })).toHaveAccessibleDescription(
			'Enter a value for Input 1 to execute.'
		)
		const execute = screen.getByRole('button', { name: /execute/iu })
		expect(execute).toBeDisabled()
		expect(execute).toHaveAccessibleDescription('Enter a value for Input 1 to execute.')
	})

	it('shows the reason in a tooltip when a held-back Execute takes focus', async () => {
		renderSubject()
		await fireEvent.input(screen.getByRole('spinbutton', { name: 'Input 1' }), {
			target: { value: '' },
		})

		await fireEvent.focusIn(screen.getByRole('button', { name: /execute/iu }))

		expect(await screen.findByRole('tooltip')).toHaveTextContent(
			'Enter a value for Input 1 to execute.'
		)
	})

	it("shows the goToInputs error in the section's error indicator", async () => {
		mockMutation(new Error('gripper refused goToInputs'))

		renderSubject()
		await fireEvent.focusIn(
			screen.getByRole('button', { name: 'GoToInputs: 1 error, copy to clipboard' })
		)

		expect(screen.getByText(/gripper refused goToInputs/iu)).toBeInTheDocument()
	})
})

const PANE_WIDTH = '320px'

const renderInPane = () => {
	render(PaneSubject, { props: { widget: Subject } })
	const pane = screen.getByTestId('pane')
	const root = pane.firstElementChild
	if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')
	return { pane, root }
}

describe('Gripper GoToInputs widget in a 320 px pane', () => {
	beforeEach(() => {
		queryState.data = [0.62, 0.38]
		mockMutation()
	})

	it('loads the app stylesheet, so the pane takes its utility width', () => {
		const { pane } = renderInPane()

		expect(getComputedStyle(pane).width).toBe(PANE_WIDTH)
	})

	it('does not scroll horizontally', () => {
		const { pane, root } = renderInPane()

		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
