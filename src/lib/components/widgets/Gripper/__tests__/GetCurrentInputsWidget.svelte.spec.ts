import { render, screen, within } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../GetCurrentInputsWidget.svelte'
import PaneSubject from './__fixtures__/In320Pane.svelte'

interface QueryState {
	data?: number[]
	isError?: boolean
	error?: Error | null
}

vi.mock('@viamrobotics/sdk', () => ({
	GripperClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(),
}))

const mockQuery = ({ data, isError = false, error = null }: QueryState) => {
	vi.mocked(createResourceQuery).mockReturnValue({
		data,
		isLoading: false,
		isError,
		error,
	} as never)
}

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-gripper' },
	})

describe('Gripper GetCurrentInputs widget', () => {
	beforeEach(() => {
		vi.mocked(createResourceQuery).mockReset()
		mockQuery({ data: [0.62, 0.38] })
	})

	it('renders the GetCurrentInputs section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetCurrentInputs' })).toBeInTheDocument()
	})

	it('draws one readout per input, with no unit', () => {
		renderSubject()

		const group = within(screen.getByRole('group', { name: 'Current inputs' }))
		expect(group.getByText('Input 0')).toBeInTheDocument()
		expect(group.getByText('0.62')).toBeInTheDocument()
		expect(group.getByText('Input 1')).toBeInTheDocument()
		expect(group.getByText('0.38')).toBeInTheDocument()
		expect(group.queryByText('mm')).toBeNull()
	})

	it('names each readout by its visible label', () => {
		renderSubject()

		expect(
			within(screen.getByRole('group', { name: 'Input 0' })).getByText('0.62')
		).toBeInTheDocument()
		expect(
			within(screen.getByRole('group', { name: 'Input 1' })).getByText('0.38')
		).toBeInTheDocument()
	})

	it('names the dash readout Inputs before the first response', () => {
		mockQuery({})
		renderSubject()

		expect(within(screen.getByRole('group', { name: 'Inputs' })).getByText('-')).toBeInTheDocument()
	})

	it('reads one - row when the gripper reports no inputs', () => {
		mockQuery({ data: [] })
		renderSubject()

		expect(within(screen.getByRole('group', { name: 'Inputs' })).getByText('-')).toBeInTheDocument()
	})

	it('reads one - row before the first response', () => {
		mockQuery({})
		renderSubject()

		const group = within(screen.getByRole('group', { name: 'Current inputs' }))
		expect(group.getByText('Inputs')).toBeInTheDocument()
		expect(group.getByText('-')).toBeInTheDocument()
	})

	it('says where the units come from and that it updates', () => {
		renderSubject()

		expect(screen.getByText("Units come from the gripper's kinematics")).toBeInTheDocument()
		expect(screen.getByText('Updates automatically')).toBeInTheDocument()
	})

	it('polls getCurrentInputs every 500 ms', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getCurrentInputs', {
			refetchInterval: 500,
		})
	})

	it("shows the query error in the section's indicator", () => {
		mockQuery({ isError: true, error: new Error('gripper unreachable') })
		renderSubject()

		expect(
			screen.getByRole('button', { name: 'GetCurrentInputs: 1 error, copy to clipboard' })
		).toBeInTheDocument()
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

describe('Gripper GetCurrentInputs widget in a 320 px pane', () => {
	beforeEach(() => {
		mockQuery({ data: [0.62, 0.38] })
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
