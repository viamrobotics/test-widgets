import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../motor-controls.svelte'

const state = vi.hoisted(
	(): {
		data: Record<string, unknown>
		calls: [string, unknown[]][]
		errors: Record<string, Error | null>
		loading: string[]
	} => ({
		data: {},
		calls: [],
		errors: {},
		loading: [],
	})
)

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createResourceQuery: vi.fn((_client: unknown, method: string) => ({
			get data() {
				return state.data[method]
			},
			get isLoading() {
				return state.loading.includes(method)
			},
			isSuccess: true,
			fetchStatus: 'idle',
			error: null,
		})),
		createResourceMutation: vi.fn((_client: unknown, method: string) => ({
			mutate: (args: unknown[]) => {
				state.calls.push([method, args])
			},
			isPending: false,
			variables: undefined,
			get error() {
				return state.errors[method] ?? null
			},
		})),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

const renderSubject = (
	props: { maxRpm?: number; minPowerPct?: number; maxPowerPct?: number } = {}
) =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-motor', ...props },
	})

const holdAndRelease = async (name: RegExp) => {
	const user = userEvent.setup()
	await user.pointer({
		target: screen.getByRole('button', { name }),
		keys: '[MouseLeft>]',
	})
	await user.pointer({ keys: '[/MouseLeft]' })
}

describe('MotorControls', () => {
	beforeEach(() => {
		state.data = {
			getProperties: { positionReporting: true },
			isMoving: false,
			isPowered: [false, 0],
			getPosition: 12.3456,
		}
		state.calls = []
		state.errors = {}
		state.loading = []
	})

	describe('the glance row', () => {
		it('shows Idle while the motor is not moving', () => {
			renderSubject()

			expect(screen.getByText('Idle')).toBeVisible()
		})

		it('shows Moving while the motor moves', () => {
			state.data.isMoving = true

			renderSubject()

			expect(screen.getByText('Moving')).toBeVisible()
		})

		it('sends stop from Stop', async () => {
			renderSubject()

			await userEvent.click(screen.getByRole('button', { name: 'Stop' }))

			expect(state.calls).toEqual([['stop', []]])
		})

		it('shows the missing value when the motor is not powered', () => {
			renderSubject()

			expect(screen.getByRole('group', { name: 'Power' })).toHaveTextContent('-')
			expect(screen.getByRole('group', { name: 'Power' })).not.toHaveTextContent('%')
		})

		it('shows the percent when the motor is powered', () => {
			state.data.isPowered = [true, 0.5]

			renderSubject()

			expect(screen.getByRole('group', { name: 'Power' })).toHaveTextContent('50.0%')
		})

		it('shows the position in revolutions', () => {
			renderSubject()

			expect(screen.getByRole('group', { name: 'Position' })).toHaveTextContent('12.3456 rev')
		})
	})

	describe('while GetProperties loads', () => {
		beforeEach(() => {
			state.data.getProperties = undefined
			state.loading = ['getProperties']
		})

		it('does not render the Move folder', () => {
			renderSubject()

			expect(screen.queryByRole('button', { name: 'Move' })).not.toBeInTheDocument()
			expect(screen.queryByRole('group', { name: 'Position' })).not.toBeInTheDocument()
		})

		it('shows the loading bar in place of the glance row and the folders', () => {
			renderSubject()

			expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument()
			expect(screen.queryByRole('button', { name: 'Quick move' })).not.toBeInTheDocument()
			expect(screen.queryByRole('group', { name: 'At a glance' })).not.toBeInTheDocument()
		})
	})

	describe('on a motor that does not report its position', () => {
		beforeEach(() => {
			state.data.getProperties = { positionReporting: false }
		})

		it('shows no Position and no Move folder', () => {
			renderSubject()

			expect(screen.queryByRole('group', { name: 'Position' })).not.toBeInTheDocument()
			expect(screen.queryByRole('button', { name: 'Move' })).not.toBeInTheDocument()
			expect(screen.queryByRole('button', { name: /execute/iu })).not.toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Quick move' })).toBeInTheDocument()
		})

		it('sends the quick move control power on a held Forward and stop on release', async () => {
			renderSubject()

			await holdAndRelease(/forward/iu)

			expect(state.calls).toEqual([
				['setPower', [0.5]],
				['stop', []],
			])
		})
	})

	describe('on a motor that reports its position', () => {
		it('composes the quick move control, which holds at an RPM', async () => {
			renderSubject()

			await holdAndRelease(/backward/iu)

			expect(state.calls).toEqual([
				['setRPM', [-10]],
				['stop', []],
			])
		})

		it('composes the Move control, whose Execute sends GoFor', async () => {
			renderSubject()

			await userEvent.click(screen.getByRole('button', { name: /execute/iu }))

			expect(state.calls).toEqual([['goFor', [10, 1]]])
		})

		it('titles each folder once, with no heading from the composed controls', () => {
			renderSubject()

			expect(screen.getByRole('button', { name: 'Quick move' })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: 'Move' })).toBeInTheDocument()
			expect(screen.queryByRole('heading', { name: 'Quick move' })).not.toBeInTheDocument()
			expect(screen.queryByRole('heading', { name: 'Move' })).not.toBeInTheDocument()
		})
	})

	it("puts a composed control's error in the one indicator", () => {
		state.errors.goFor = new Error('motor refused to move')

		renderSubject()

		expect(screen.getAllByRole('button', { name: /error/iu })).toHaveLength(1)
		expect(screen.getByRole('button', { name: '1 error, copy to clipboard' })).toBeInTheDocument()
	})

	describe('host config props', () => {
		it('passes maxRpm to the Move and RPM hold fields and sends nothing over it', async () => {
			renderSubject({ maxRpm: 5 })

			const fields = screen.getAllByRole('spinbutton', { name: /rpm/iu })

			expect(fields).toHaveLength(2)
			for (const field of fields) {
				expect(field).toHaveAttribute('max', '5')
			}

			await holdAndRelease(/forward/iu)
			await userEvent.click(screen.getByRole('button', { name: /execute/iu }))

			expect(state.calls.filter(([method]) => method === 'setRPM' || method === 'goFor')).toEqual(
				[]
			)
		})

		it('leaves the RPM fields uncapped and sends as before with the props absent', async () => {
			renderSubject()

			for (const field of screen.getAllByRole('spinbutton', { name: /rpm/iu })) {
				expect(field).not.toHaveAttribute('max')
			}

			await holdAndRelease(/forward/iu)

			expect(state.calls).toContainEqual(['setRPM', [10]])
		})

		it('passes the power range to the power hold of a motor without position', async () => {
			state.data.getProperties = { positionReporting: false }

			renderSubject({ minPowerPct: 0.6, maxPowerPct: 0.9 })

			const slider = screen.getByRole('slider', { name: /power/iu })
			expect(slider).toHaveAttribute('min', '0.6')
			expect(slider).toHaveAttribute('max', '0.9')

			await holdAndRelease(/forward/iu)

			expect(state.calls).toContainEqual(['setPower', [0.6]])
		})

		it('ignores an invalid power pair', async () => {
			state.data.getProperties = { positionReporting: false }

			renderSubject({ minPowerPct: 0.9, maxPowerPct: 0.2 })

			const slider = screen.getByRole('slider', { name: /power/iu })
			expect(slider).toHaveAttribute('min', '0')
			expect(slider).toHaveAttribute('max', '1')

			await holdAndRelease(/forward/iu)

			expect(state.calls).toContainEqual(['setPower', [0.5]])
		})
	})
})
