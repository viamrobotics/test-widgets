import '../../../../../app.css'

import { fireEvent, render, screen } from '@testing-library/svelte'
import { EncoderPositionType } from '@viamrobotics/sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../encoder.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const SUCCESS_CUE_MS = 500
const PANE_WIDTH = '320px'

const { state } = vi.hoisted(() => {
	// vi.hoisted runs before imports, so the enum value is restated here.
	const ANGLE_DEGREES_POSITION_TYPE = 2
	const hoisted: {
		position: [number, number] | undefined
		isPending: boolean
		resetError: Error | null
		onSuccess: (() => void) | undefined
	} = {
		position: [128.4, ANGLE_DEGREES_POSITION_TYPE],
		isPending: false,
		resetError: null,
		onSuccess: undefined,
	}
	return { state: hoisted }
})

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	return {
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
		createResourceClient: vi.fn(() => ({ current: {} })),
		createResourceQuery: vi.fn((_client: unknown, method: string) => ({
			data:
				method === 'getProperties'
					? { ticksCountSupported: true, angleDegreesSupported: true }
					: state.position,
			isLoading: false,
			isSuccess: true,
			isError: false,
			error: null,
			refetch: vi.fn(),
		})),
		createResourceMutation: vi.fn(() => ({
			get isPending() {
				return state.isPending
			},
			isError: state.resetError !== null,
			error: state.resetError,
			mutate: vi.fn((_args: unknown, options?: { onSuccess?: () => void }) => {
				state.onSuccess = options?.onSuccess
			}),
		})),
	}
})

const renderSubject = () =>
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-encoder' } })

describe('Encoder composite', () => {
	beforeEach(() => {
		state.position = [128.4, EncoderPositionType.ANGLE_DEGREES]
		state.isPending = false
		state.resetError = null
		state.onSuccess = undefined
		vi.useRealTimers()
	})

	it('orders the refresh row, ResetPosition, then GetPosition', () => {
		renderSubject()

		const refresh = screen.getByRole('combobox', { name: 'Refresh rate' })
		const reset = screen.getByRole('heading', { name: 'ResetPosition' })
		const position = screen.getByRole('heading', { name: 'GetPosition' })
		expect(refresh.compareDocumentPosition(reset) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
		expect(reset.compareDocumentPosition(position) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
	})

	it('reads the position with a degrees suffix', () => {
		renderSubject()

		expect(screen.getByText('128.4')).toBeInTheDocument()
		expect(screen.getByText('°')).toBeInTheDocument()
	})

	it('does not say Updates automatically inside the composite', () => {
		renderSubject()

		expect(screen.queryByText('Updates automatically')).not.toBeInTheDocument()
	})

	it('shows a pending cue while the reset is in flight', () => {
		state.isPending = true
		renderSubject()

		expect(screen.getByRole('button', { name: 'Reset to zero' })).toHaveAttribute(
			'aria-busy',
			'true'
		)
		expect(screen.getByText('Resetting')).toBeInTheDocument()
	})

	it('shows a check for 500 ms after success, then clears', async () => {
		vi.useFakeTimers()
		renderSubject()
		await fireEvent.click(screen.getByRole('button', { name: 'Reset to zero' }))
		expect(screen.queryByText('Position reset')).not.toBeInTheDocument()

		state.onSuccess?.()
		await vi.advanceTimersByTimeAsync(0)
		expect(screen.getByText('Position reset')).toBeInTheDocument()

		await vi.advanceTimersByTimeAsync(SUCCESS_CUE_MS)
		expect(
			screen.queryByText('Position reset'),
			'the check clears at 500 ms, and stretching the clear timer to 5000 ms turned this red'
		).not.toBeInTheDocument()
	})

	it('shows a reset error in the section indicator', async () => {
		state.resetError = new Error('reset failed')
		renderSubject()
		await fireEvent.focusIn(
			screen.getByRole('button', { name: 'ResetPosition: 1 error, copy to clipboard' })
		)

		expect(screen.getByText(/reset failed/iu)).toBeInTheDocument()
	})
})

describe('Encoder composite in a 320 px pane', () => {
	it('does not scroll horizontally', () => {
		render(PaneSubject, { props: { widget: Subject } })
		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')

		expect(getComputedStyle(pane).width).toBe(PANE_WIDTH)
		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
