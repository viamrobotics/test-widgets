import { fireEvent, render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import InWidgetsProvider from '$lib/__tests__/__fixtures__/in-widgets-provider.svelte'

import Subject from '../move-to-control.svelte'

const state = vi.hoisted(
	(): {
		position: number
		calls: number[][]
		pending: { promise: Promise<unknown> } | undefined
	} => ({ position: 45, calls: [], pending: undefined })
)

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		get data() {
			return state.position
		},
		isLoading: false,
		isSuccess: true,
		error: null,
	})),
	createResourceMutation: vi.fn(() => ({
		mutateAsync: (args: number[]) => {
			state.calls.push(args)
			return state.pending ? state.pending.promise : Promise.resolve()
		},
		isPending: false,
		variables: undefined,
		error: null,
	})),
}))

const renderSubject = (props: Partial<Parameters<typeof render<typeof Subject>>[1]> = {}) =>
	render(InWidgetsProvider, {
		props: {
			component: Subject,
			props: { partID: 'test-part', resourceName: 'test-servo', ...props },
		},
	})

const slider = () => {
	const range = screen.getByRole('slider', { name: 'Move to' })
	if (!(range instanceof HTMLInputElement)) throw new Error('The slider is not an input')
	return range
}

const drag = async (value: number) => {
	await fireEvent.input(slider(), { target: { value: String(value) } })
}

const release = async () => {
	await fireEvent.change(slider())
}

const deferred = () => {
	let resolve: (value: unknown) => void = () => {}
	const promise = new Promise<unknown>((res) => {
		resolve = res
	})
	return { promise, resolve }
}

describe('Servo Move to control', () => {
	beforeEach(() => {
		state.position = 45
		state.calls = []
		state.pending = undefined
	})

	it('renders the Move to heading and a slider at the live position', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Move to' })).toBeInTheDocument()
		expect(slider().valueAsNumber).toBe(45)
		expect(slider().max).toBe('180')
	})

	it('sends nothing while the thumb is dragged, and one Move on release', async () => {
		renderSubject()

		await drag(100)
		await drag(140)

		expect(state.calls).toEqual([])
		expect(slider().valueAsNumber).toBe(140)

		await release()

		expect(state.calls).toEqual([[140]])
	})

	it('shows the move in flight and holds the thumb on its target until it returns', async () => {
		const pending = deferred()
		state.pending = pending
		renderSubject()

		await drag(140)
		await release()

		expect(screen.getByTestId('status-line')).toHaveTextContent('Moving to 140°')
		expect(slider().valueAsNumber).toBe(140)

		pending.resolve(undefined)
		await vi.waitFor(() => {
			expect(screen.getByTestId('status-line').textContent.trim()).toBe('')
		})
		expect(slider().valueAsNumber).toBe(45)
	})

	it('clamps a release at Max and at 0', async () => {
		renderSubject()

		await fireEvent.change(slider(), { target: { value: '500' } })
		await fireEvent.change(slider(), { target: { value: '-20' } })

		expect(state.calls).toEqual([[180], [0]])
	})

	it('caps the Max field at 360 and moves the slider range with it', async () => {
		renderSubject()

		const max = screen.getByRole('spinbutton', { name: 'Max' })
		await userEvent.clear(max)
		await userEvent.type(max, '500')
		await userEvent.tab()

		expect(slider().max).toBe('360')

		await userEvent.clear(max)
		await userEvent.type(max, '90')
		await userEvent.tab()

		expect(slider().max).toBe('90')
	})

	it('removes the Max field and clamps to a configured range', async () => {
		renderSubject({ minDegrees: 30, maxDegrees: 90 })

		expect(screen.queryByRole('spinbutton', { name: 'Max' })).not.toBeInTheDocument()
		expect(slider().min).toBe('30')
		expect(slider().max).toBe('90')

		await fireEvent.change(slider(), { target: { value: '500' } })
		await fireEvent.change(slider(), { target: { value: '5' } })

		expect(state.calls).toEqual([[90], [30]])
	})

	it('reads "Move to {min}°" and moves to the configured minimum', async () => {
		renderSubject({ minDegrees: 30 })

		expect(screen.queryByRole('button', { name: 'Move to 0°' })).not.toBeInTheDocument()
		await userEvent.click(screen.getByRole('button', { name: 'Move to 30°' }))

		expect(state.calls).toEqual([[30]])
		expect(screen.getByRole('spinbutton', { name: 'Max' })).toBeInTheDocument()
	})

	it('ignores an invalid pair and keeps the Max field', () => {
		renderSubject({ minDegrees: 100, maxDegrees: 50 })

		expect(screen.getByRole('spinbutton', { name: 'Max' })).toBeInTheDocument()
		expect(slider().min).toBe('0')
		expect(slider().max).toBe('180')
	})

	it('sends Move(0) from "Move to 0°"', async () => {
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Move to 0°' }))

		expect(state.calls).toEqual([[0]])
	})
})
