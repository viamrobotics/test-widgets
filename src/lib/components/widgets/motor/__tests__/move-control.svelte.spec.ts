import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../move-control.svelte'

const state = vi.hoisted(
	(): {
		properties: { positionReporting: boolean } | undefined
		calls: [string, unknown[]][]
		pending: Record<string, unknown[] | undefined>
		errors: Record<string, Error | null>
	} => ({
		properties: undefined,
		calls: [],
		pending: {},
		errors: {},
	})
)

vi.mock('@viamrobotics/sdk', () => ({
	MotorClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		get data() {
			return state.properties
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
		get isPending() {
			return state.pending[method] !== undefined
		},
		get variables() {
			return state.pending[method]
		},
		get error() {
			return state.errors[method] ?? null
		},
	})),
}))

const renderSubject = (props: { maxRpm?: number } = {}) =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-motor', ...props },
	})

const execute = () => screen.getByRole('button', { name: /execute/iu })

describe('Motor Move control', () => {
	beforeEach(() => {
		state.properties = { positionReporting: true }
		state.calls = []
		state.pending = {}
		state.errors = {}
	})

	it('renders the Move heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Move' })).toBeInTheDocument()
	})

	it('sends GoFor with the default RPM and revolutions in Relative mode', async () => {
		renderSubject()

		await userEvent.click(execute())

		expect(state.calls).toEqual([['goFor', [10, 1]]])
	})

	it('relabels the field and sends GoTo with the typed target in Absolute mode', async () => {
		renderSubject()

		await userEvent.click(screen.getByRole('radio', { name: 'Absolute' }))
		const target = screen.getByRole('spinbutton', { name: /target position/iu })
		await userEvent.clear(target)
		await userEvent.type(target, '2.5')
		await userEvent.click(execute())

		expect(screen.queryByRole('spinbutton', { name: /revolutions/iu })).not.toBeInTheDocument()
		expect(state.calls).toEqual([['goTo', [10, 2.5]]])
	})

	it('sends ResetZeroPosition with offset 0 from Reset zero', async () => {
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Reset zero' }))

		expect(state.calls).toEqual([['resetZeroPosition', [0]]])
	})

	it('names a pending GoFor in the status line and marks Execute busy', () => {
		state.pending.goFor = [10, 1]

		renderSubject()

		expect(screen.getByTestId('status-line')).toHaveTextContent('Moving 1 rev at 10 RPM')
		expect(execute()).toHaveAttribute('aria-busy', 'true')
	})

	it('names a pending GoTo in the status line', () => {
		state.pending.goTo = [10, 2.5]

		renderSubject()

		expect(screen.getByTestId('status-line')).toHaveTextContent('Moving to 2.5 rev at 10 RPM')
	})

	it('leaves the status line empty while idle', () => {
		renderSubject()

		expect(screen.getByTestId('status-line').textContent.trim()).toBe('')
		expect(execute()).toHaveAttribute('aria-busy', 'false')
	})

	it('shows a note in place of the fields when the motor does not report its position', () => {
		state.properties = { positionReporting: false }

		renderSubject()

		expect(screen.getByText('This motor does not report its position.')).toBeVisible()
		expect(screen.queryByRole('button', { name: /execute/iu })).not.toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'Reset zero' })).not.toBeInTheDocument()
	})

	it("shows a call's error in the section's error indicator", () => {
		state.errors.goTo = new Error('motor refused to move')

		renderSubject()

		expect(screen.getByRole('button', { name: '1 error, copy to clipboard' })).toBeInTheDocument()
	})

	describe('maxRpm', () => {
		const rpmField = () => screen.getByRole('spinbutton', { name: /rpm/iu })

		it('caps the RPM field at the limit and sends a value within it', async () => {
			renderSubject({ maxRpm: 20 })

			expect(rpmField()).toHaveAttribute('max', '20')
			expect(screen.queryByRole('alert')).not.toBeInTheDocument()

			await userEvent.click(execute())

			expect(state.calls).toEqual([['goFor', [10, 1]]])
		})

		it('flags a value over the limit, names the limit, and never sends it', async () => {
			renderSubject({ maxRpm: 20 })

			await userEvent.clear(rpmField())
			await userEvent.type(rpmField(), '25')

			expect(rpmField()).toBeInvalid()
			expect(screen.getByRole('alert')).toHaveTextContent(
				"RPM cannot exceed the motor's limit of 20."
			)
			expect(rpmField()).toHaveAccessibleDescription(
				expect.stringContaining("RPM cannot exceed the motor's limit of 20.")
			)
			expect(execute()).toBeDisabled()

			await userEvent.click(execute())

			expect(state.calls).toEqual([])

			await userEvent.clear(rpmField())
			await userEvent.type(rpmField(), '20')

			expect(screen.queryByRole('alert')).not.toBeInTheDocument()

			await userEvent.click(execute())

			expect(state.calls).toEqual([['goFor', [20, 1]]])
		})

		it('does not cap or flag with maxRpm absent', async () => {
			renderSubject()

			expect(rpmField()).not.toHaveAttribute('max')

			await userEvent.clear(rpmField())
			await userEvent.type(rpmField(), '500')
			await userEvent.click(execute())

			expect(screen.queryByRole('alert')).not.toBeInTheDocument()
			expect(state.calls).toEqual([['goFor', [500, 1]]])
		})

		it.each([0, -5, Number.NaN, Number.POSITIVE_INFINITY])(
			'ignores an invalid maxRpm of %s',
			async (maxRpm) => {
				renderSubject({ maxRpm })

				expect(rpmField()).not.toHaveAttribute('max')

				await userEvent.clear(rpmField())
				await userEvent.type(rpmField(), '500')
				await userEvent.click(execute())

				expect(state.calls).toEqual([['goFor', [500, 1]]])
			}
		)
	})
})
