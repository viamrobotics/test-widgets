import { render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { EncoderPositionType } from '@viamrobotics/sdk'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../ZeroPositionWidget.svelte'
import PaneSubject from './__fixtures__/In320Pane.svelte'

const state = vi.hoisted(
	(): {
		mutateAsync: Mock
		refetch: Mock
		properties: { angleDegreesSupported: boolean; ticksCountSupported: boolean }
		positions: Map<number, [number, number]>
	} => ({
		mutateAsync: vi.fn(),
		refetch: vi.fn(),
		properties: { angleDegreesSupported: true, ticksCountSupported: true },
		positions: new Map(),
	})
)

const mutation = $state<{ error: Error | null }>({ error: null })

vi.mock('@viamrobotics/sdk', async (importOriginal) => ({
	...(await importOriginal<typeof import('@viamrobotics/sdk')>()),
	EncoderClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createResourceQuery: vi.fn((_client: unknown, method: string, args: unknown) => ({
			get data() {
				if (method === 'getProperties') return state.properties
				return Array.isArray(args) ? state.positions.get(args[0]) : undefined
			},
			isLoading: false,
			isSuccess: true,
			isError: false,
			fetchStatus: 'idle',
			error: null,
			refetch: state.refetch,
			queryKey: [],
		})),
		createResourceMutation: vi.fn(() => ({
			mutate: vi.fn(),
			mutateAsync: (...args: unknown[]) => state.mutateAsync(...args),
			isPending: false,
			get error() {
				return mutation.error
			},
		})),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

const PANE_WIDTH = '320px'

const renderSubject = () => render(PaneSubject, { props: { widget: Subject } })

const readoutText = (label: string) =>
	screen.getByRole('group', { name: label }).textContent.replaceAll(/\s+/gu, ' ').trim()

const resetButton = () => screen.getByRole('button', { name: 'Reset to zero' })

describe('Encoder ZeroPosition widget', () => {
	beforeEach(() => {
		state.mutateAsync = vi.fn(() => Promise.resolve())
		state.refetch = vi.fn()
		state.properties = { angleDegreesSupported: true, ticksCountSupported: true }
		state.positions = new Map([
			[EncoderPositionType.ANGLE_DEGREES, [128.43, EncoderPositionType.ANGLE_DEGREES]],
			[EncoderPositionType.TICKS_COUNT, [2568, EncoderPositionType.TICKS_COUNT]],
		])
		mutation.error = null
		vi.mocked(createResourceQuery).mockClear()
		localStorage.clear()
	})

	it('draws an Angle and a Ticks readout when both types are supported', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Zero position' })).toBeInTheDocument()
		expect(readoutText('Angle')).toBe('128.4 °')
		expect(readoutText('Ticks')).toBe('2568.00 ticks')
		expect(screen.queryByRole('group', { name: 'Position' })).toBeNull()
	})

	it('draws one Position readout when only ticks are supported', () => {
		state.properties = { angleDegreesSupported: false, ticksCountSupported: true }

		renderSubject()

		expect(readoutText('Position')).toBe('2568.00 ticks')
		expect(screen.queryByRole('group', { name: 'Angle' })).toBeNull()
		expect(screen.queryByRole('group', { name: 'Ticks' })).toBeNull()
	})

	it('draws one Position readout in degrees when only angles are supported', () => {
		state.properties = { angleDegreesSupported: true, ticksCountSupported: false }

		renderSubject()

		expect(readoutText('Position')).toBe('128.4 °')
	})

	it('sends one ResetPosition only after Reset to zero and Confirm reset, then refetches', async () => {
		renderSubject()

		await userEvent.click(resetButton())
		expect(state.mutateAsync, 'the first press only arms').not.toHaveBeenCalled()
		expect(screen.getByTestId('status-line')).toHaveTextContent('Confirm to zero the position.')

		await userEvent.click(screen.getByRole('button', { name: 'Confirm reset' }))

		expect(state.mutateAsync).toHaveBeenCalledTimes(1)
		expect(state.mutateAsync).toHaveBeenCalledWith([])
		await waitFor(() => {
			expect(state.refetch).toHaveBeenCalledTimes(2)
		})
	})

	it('names the reset in the status line while it is in flight', async () => {
		let finish = () => {}
		state.mutateAsync = vi.fn(
			() =>
				new Promise<void>((resolve) => {
					finish = resolve
				})
		)
		renderSubject()

		await userEvent.click(resetButton())
		await userEvent.click(screen.getByRole('button', { name: 'Confirm reset' }))

		await waitFor(() => {
			expect(screen.getByTestId('status-line')).toHaveTextContent('Resetting to zero.')
		})
		finish()
		await waitFor(() => {
			expect(screen.getByTestId('status-line').textContent.trim()).toBe('')
		})
	})

	it('reports a failed reset in the header indicator and idles the button', async () => {
		state.mutateAsync = vi.fn(() => {
			const error = new Error('encoder is not running')
			mutation.error = error
			return Promise.reject(error)
		})
		renderSubject()

		await userEvent.click(resetButton())
		await userEvent.click(screen.getByRole('button', { name: 'Confirm reset' }))

		expect(
			await screen.findByRole('button', { name: '1 error, copy to clipboard' })
		).toBeInTheDocument()
		await waitFor(() => {
			expect(resetButton()).toHaveAttribute('aria-busy', 'false')
		})
		expect(resetButton()).toBeEnabled()
		expect(screen.queryByText('encoder is not running')).toBeNull()
		expect(screen.getByTestId('status-line')).toHaveTextContent('Reset failed')
	})

	it('polls each position type every second until Pause is pressed', async () => {
		renderSubject()
		const intervals = () =>
			vi
				.mocked(createResourceQuery)
				.mock.calls.filter(([, method]) => String(method) === 'getPosition')
				.map((call) => {
					const options = call[3]
					if (typeof options !== 'function')
						throw new TypeError('getPosition takes its options as a function')
					return options().refetchInterval
				})

		expect(intervals()).toEqual([1000, 1000])

		await userEvent.click(screen.getByRole('button', { name: 'Pause' }))

		expect(intervals()).toEqual([false, false])
		expect(screen.getByText('Paused')).toBeInTheDocument()
	})

	it('refreshes only the supported type while paused', async () => {
		state.properties = { angleDegreesSupported: false, ticksCountSupported: true }
		renderSubject()
		await userEvent.click(screen.getByRole('button', { name: 'Pause' }))

		await userEvent.click(screen.getByRole('button', { name: 'Refresh' }))

		expect(state.refetch).toHaveBeenCalledTimes(1)
	})

	it('does not scroll horizontally in a 320 px pane with the reset armed', async () => {
		renderSubject()
		await userEvent.click(resetButton())
		expect(screen.getByRole('button', { name: 'Confirm reset' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
		expect(readoutText('Angle')).toBe('128.4 °')
		expect(readoutText('Ticks')).toBe('2568.00 ticks')
		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')

		expect(getComputedStyle(pane).width).toBe(PANE_WIDTH)
		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
