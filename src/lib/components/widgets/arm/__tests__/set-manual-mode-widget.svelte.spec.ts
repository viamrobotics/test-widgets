import { fireEvent, render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../set-manual-mode-widget.svelte'

const { setManualModeMutate } = vi.hoisted(() => ({
	setManualModeMutate: vi.fn(),
}))

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
		mutate: setManualModeMutate,
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
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('renders nothing when the arm does not support manual mode', () => {
		mockQueries({ supportManualMode: false })

		renderSubject()

		expect(screen.queryByRole('heading', { name: 'SetManualMode' })).not.toBeInTheDocument()
		expect(screen.queryByRole('button', { name: /^enter$/iu })).not.toBeInTheDocument()
	})

	it('renders the manual mode controls in a SetManualMode section when the arm supports it', () => {
		mockQueries()

		renderSubject()

		expect(screen.getByRole('heading', { name: 'SetManualMode' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /^enter$/iu })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /^exit$/iu })).toBeInTheDocument()
	})

	it('polls getManualMode every second while manual mode is supported', () => {
		mockQueries()

		renderSubject()

		expect(getManualModeOptions()).toEqual({ refetchInterval: 1000, enabled: true })
	})

	it('disables the getManualMode query when manual mode is unsupported', () => {
		mockQueries({ supportManualMode: false })

		renderSubject()

		expect(getManualModeOptions()).toEqual({ refetchInterval: 1000, enabled: false })
	})

	it('sends setManualMode(true, enabledFor) once the enter countdown elapses', async () => {
		mockQueries()

		renderSubject()

		await fireEvent.click(screen.getByRole('button', { name: /^enter$/iu }))
		expect(setManualModeMutate).not.toHaveBeenCalled()

		await vi.advanceTimersByTimeAsync(5000)

		expect(setManualModeMutate).toHaveBeenCalledTimes(1)
		expect(setManualModeMutate).toHaveBeenCalledWith([true, 90], {})
	})

	it('sends setManualMode(false, 0) on exit while the polled state is enabled', async () => {
		mockQueries({ manualMode: true })

		renderSubject()

		await fireEvent.click(screen.getByRole('button', { name: /^exit$/iu }))

		expect(setManualModeMutate).toHaveBeenCalledWith([false, 0], {})
	})
})
