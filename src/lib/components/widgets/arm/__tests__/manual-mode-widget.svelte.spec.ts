import { render, screen } from '@testing-library/svelte'
import { createResourceMutation, createResourceQuery } from '@viamrobotics/svelte-sdk'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../manual-mode-widget.svelte'

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
	createResourceMutation: vi.fn(() => ({ mutate: vi.fn(), error: null })),
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
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-arm' },
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

	it('renders an inline ManualMode title instead of a section title in band mode', () => {
		mockQueries()

		render(Subject, {
			props: { partID: 'test-part', resourceName: 'test-arm', band: true },
		})

		expect(screen.getByRole('heading', { name: 'ManualMode' })).toBeInTheDocument()
		expect(screen.queryByText('SetManualMode')).not.toBeInTheDocument()
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

	it('shows the enabled pill from the polled manual mode state', () => {
		mockQueries({ manualMode: true })

		renderSubject()

		expect(screen.getByText('Enabled')).toBeInTheDocument()
	})
})
