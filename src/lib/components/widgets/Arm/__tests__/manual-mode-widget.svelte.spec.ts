import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { createResourceMutation, createResourceQuery } from '@viamrobotics/svelte-sdk'
import { describe, expect, it, vi } from 'vitest'

import InWidgetsProvider from '$lib/__tests__/__fixtures__/in-widgets-provider.svelte'

import Subject from '../manual-mode-widget.svelte'
import SetManualModeWidget from '../set-manual-mode-widget.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

vi.mock('@viamrobotics/sdk', () => ({
	ArmClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		data: undefined,
		isLoading: false,
		isError: false,
		error: null,
	})),
	createResourceMutation: vi.fn(() => ({
		mutateAsync: vi.fn(() => new Promise(() => {})),
		isPending: false,
		error: null,
	})),
}))

const queryResult = (data: unknown) =>
	({ data, isLoading: false, isError: false, error: null }) as never

const mockQueries = ({ supportManualMode = true, manualMode = false } = {}) => {
	vi.mocked(createResourceQuery).mockImplementation(((_client: unknown, method: string) =>
		method === 'getProperties'
			? queryResult({ supportManualMode, supportCartesianCommands: false })
			: queryResult(manualMode)) as never)
}

const renderSubject = () =>
	render(InWidgetsProvider, {
		props: { component: Subject, props: { partID: 'test-part', resourceName: 'test-arm' } },
	})

const getManualModeOptions = () => {
	const call = vi
		.mocked(createResourceQuery)
		.mock.calls.find(([, method]) => (method as string) === 'getManualMode')
	return (call?.[2] as () => { refetchInterval: number; enabled: boolean })()
}

describe('Arm SetManualMode widget', () => {
	it('renders nothing when the arm does not support manual mode', () => {
		mockQueries({ supportManualMode: false })

		renderSubject()

		expect(screen.queryByText('SetManualMode')).not.toBeInTheDocument()
	})

	it('renders the manual mode controls when the arm supports it', () => {
		mockQueries()

		renderSubject()

		expect(screen.getByText('SetManualMode')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Enter' })).toBeInTheDocument()
	})

	it('disables Enter and Exit while a SetManualMode call for the same arm is in flight', async () => {
		mockQueries({ manualMode: true })
		render(InWidgetsProvider, {
			props: {
				component: [Subject, SetManualModeWidget],
				props: { partID: 'test-part', resourceName: 'test-arm' },
			},
		})

		await userEvent.click(screen.getByRole('button', { name: 'Execute' }))

		expect(screen.getByRole('button', { name: 'Exit' })).toBeDisabled()
		expect(screen.getByRole('button', { name: 'Enter' })).toBeDisabled()
	})

	it('polls getManualMode every second while manual mode is supported', () => {
		mockQueries()

		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getProperties')
		expect(getManualModeOptions()).toEqual({ refetchInterval: 1000, enabled: true })
	})

	it('disables the getManualMode query when manual mode is unsupported', () => {
		mockQueries({ supportManualMode: false })

		renderSubject()

		expect(getManualModeOptions()).toEqual({ refetchInterval: 1000, enabled: false })
	})

	it('creates a setManualMode mutation', () => {
		mockQueries()

		renderSubject()

		expect(createResourceMutation).toHaveBeenCalledWith(expect.anything(), 'setManualMode')
	})

	it('shows manual mode on from the polled state', () => {
		mockQueries({ manualMode: true })

		renderSubject()

		expect(screen.getByText('Manual mode')).toBeInTheDocument()
	})
})

describe('Arm SetManualMode widget in a 320 px pane', () => {
	it('does not scroll horizontally', () => {
		mockQueries()
		render(PaneSubject, { props: { widget: Subject } })
		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')

		expect(screen.getByRole('button', { name: 'Enter' })).toBeInTheDocument()
		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
