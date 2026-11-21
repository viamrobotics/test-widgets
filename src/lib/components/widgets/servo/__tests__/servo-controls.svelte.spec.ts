import { fireEvent, render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../servo-controls.svelte'

const state = vi.hoisted(
	(): {
		data: Record<string, unknown>
		calls: [string, unknown[]][]
		moveCall: { promise: Promise<unknown> } | undefined
	} => ({ data: {}, calls: [], moveCall: undefined })
)

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createResourceQuery: vi.fn((_client: unknown, method: string) => ({
			get data() {
				return state.data[method]
			},
			isLoading: false,
			isSuccess: true,
			fetchStatus: 'idle',
			error: null,
		})),
		createResourceMutation: vi.fn((_client: unknown, method: string) => ({
			mutate: (args: unknown[]) => {
				state.calls.push([method, args])
			},
			mutateAsync: (args: unknown[]) => {
				state.calls.push([method, args])
				return method === 'move' && state.moveCall ? state.moveCall.promise : Promise.resolve()
			},
			isPending: false,
			variables: undefined,
			error: null,
		})),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

const deferred = () => {
	let resolve: (value: unknown) => void = () => {}
	const promise = new Promise<unknown>((res) => {
		resolve = res
	})
	return { promise, resolve }
}

const renderSubject = (props: Partial<Parameters<typeof render<typeof Subject>>[1]> = {}) =>
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-servo', ...props } })

const moves = () => state.calls.filter(([method]) => method === 'move').map(([, args]) => args)

const slider = () => {
	const range = screen.getByRole('slider', { name: 'Move to' })
	if (!(range instanceof HTMLInputElement)) throw new Error('The slider is not an input')
	return range
}

describe('Servo controls', () => {
	beforeEach(() => {
		state.data = { isMoving: false, getPosition: 90 }
		state.calls = []
		state.moveCall = undefined
	})

	it('draws the Controls heading, the glance row with Stop, then Position and Move to', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Controls' })).toBeInTheDocument()
		const glance = within(screen.getByRole('group', { name: 'At a glance' }))
		expect(glance.getByText('Idle')).toBeVisible()
		expect(glance.getByRole('button', { name: 'Stop' })).toBeVisible()
		const position = screen.getByRole('group', { name: 'Position' })
		expect(position.compareDocumentPosition(slider()) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(
			0
		)
	})

	it('badges Moving while the servo reports it', () => {
		state.data.isMoving = true

		renderSubject()

		expect(screen.getByText('Moving')).toBeVisible()
	})

	it('sends one Move per stepper press, clamped at Max', async () => {
		state.data.getPosition = 178
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: /^\+5°,/u }))

		expect(moves()).toEqual([[180]])
	})

	it('steps from the shared Max after it is lowered', async () => {
		renderSubject()

		const max = screen.getByRole('spinbutton', { name: 'Max' })
		await userEvent.clear(max)
		await userEvent.type(max, '92')
		await userEvent.tab()
		await userEvent.click(screen.getByRole('button', { name: /^\+5°,/u }))

		expect(moves()).toEqual([[92]])
	})

	it('passes a configured range to both controls and removes the Max field', async () => {
		state.data.getPosition = 88
		renderSubject({ minDegrees: 20, maxDegrees: 90 })

		expect(screen.queryByRole('spinbutton', { name: 'Max' })).not.toBeInTheDocument()
		expect(slider().min).toBe('20')
		expect(slider().max).toBe('90')
		await userEvent.click(screen.getByRole('button', { name: /^\+5°,/u }))
		await userEvent.click(screen.getByRole('button', { name: 'Move to 20°' }))

		expect(moves()).toEqual([[90], [20]])
	})

	it('renders and sends as before with no range given', async () => {
		renderSubject()

		expect(screen.getByRole('spinbutton', { name: 'Max' })).toBeInTheDocument()
		expect(slider().min).toBe('0')
		expect(slider().max).toBe('180')
		await userEvent.click(screen.getByRole('button', { name: 'Move to 0°' }))

		expect(moves()).toEqual([[0]])
	})

	it('clamps a step at 0', async () => {
		state.data.getPosition = 3
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: /^−5°,/u }))

		expect(moves()).toEqual([[0]])
	})

	it('sends nothing for a step, a release, or Move to 0° while a step is in flight', async () => {
		state.moveCall = deferred()
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: /^\+5°,/u }))
		await userEvent.click(screen.getByRole('button', { name: /^\+5°,/u }))
		await fireEvent.input(slider(), { target: { value: '120' } })
		await fireEvent.change(slider())
		await userEvent.click(screen.getByRole('button', { name: 'Move to 0°' }))

		expect(moves()).toEqual([[95]])
	})

	it('disables the slider while a step is in flight and enables it when the step returns', async () => {
		const pending = deferred()
		state.moveCall = pending
		renderSubject()
		expect(slider()).toBeEnabled()

		await userEvent.click(screen.getByRole('button', { name: /^\+5°,/u }))

		expect(slider()).toBeDisabled()

		pending.resolve(undefined)
		await vi.waitFor(() => {
			expect(slider()).toBeEnabled()
		})
	})

	it('sends nothing after the step returns without a new press', async () => {
		const pending = deferred()
		state.moveCall = pending
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: /^\+5°,/u }))
		await userEvent.click(screen.getByRole('button', { name: /^−5°,/u }))
		pending.resolve(undefined)
		await vi.waitFor(() => {
			expect(screen.getByRole('button', { name: 'Move to 0°' })).toBeEnabled()
		})

		expect(moves()).toEqual([[95]])
	})

	it('sends nothing for a step while a slider Move is in flight', async () => {
		state.moveCall = deferred()
		renderSubject()

		await fireEvent.input(slider(), { target: { value: '120' } })
		await fireEvent.change(slider())
		await userEvent.click(screen.getByRole('button', { name: /^\+5°,/u }))

		expect(moves()).toEqual([[120]])
	})

	it('keeps the live value in its slot and names the move in flight', async () => {
		state.moveCall = deferred()
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: /^\+5°,/u }))

		const position = within(screen.getByRole('group', { name: 'Position' }))
		expect(position.getByText('90')).toBeVisible()
		expect(screen.getAllByTestId('status-line')[0]).toHaveTextContent('Moving to 95°')
	})

	it('sends Stop while a Move is in flight', async () => {
		state.moveCall = deferred()
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: /^\+5°,/u }))
		await userEvent.click(screen.getByRole('button', { name: 'Stop' }))

		expect(state.calls).toContainEqual(['stop', []])
	})
})
