import { fireEvent, render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import InWidgetsProvider from '#lib/__tests__/__fixtures__/InWidgetsProvider.svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../QuickMoveWidget.svelte'

const state = vi.hoisted(
	(): {
		properties: { positionReporting: boolean } | undefined
		calls: [string, unknown[]][]
		errors: Record<string, Error | null>
	} => ({
		properties: undefined,
		calls: [],
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
		mutateAsync: (args: unknown[]) => {
			state.calls.push([method, args])
			return Promise.resolve()
		},
		isPending: false,
		get error() {
			return state.errors[method] ?? null
		},
	})),
}))

const renderSubject = (
	props: { maxRpm?: number; minPowerPct?: number; maxPowerPct?: number } = {}
) =>
	render(InWidgetsProvider, {
		props: {
			component: Subject,
			props: { partID: 'test-part', resourceName: 'test-motor', ...props },
		},
	})

let user: ReturnType<typeof userEvent.setup>

const press = async (name: RegExp) => {
	await user.pointer({
		target: screen.getByRole('button', { name }),
		keys: '[MouseLeft>]',
	})
}

const release = async () => {
	await user.pointer({ keys: '[/MouseLeft]' })
}

describe('Motor QuickMove control', () => {
	beforeEach(() => {
		user = userEvent.setup()
		state.properties = { positionReporting: false }
		state.calls = []
		state.errors = {}
	})

	it('renders the Quick move heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Quick move' })).toBeInTheDocument()
	})

	describe('on a motor that does not report its position', () => {
		it('sends forward power while Forward is held', async () => {
			renderSubject()

			await press(/forward/iu)

			expect(state.calls).toEqual([['setPower', [0.5]]])
		})

		it('sends backward power while Backward is held', async () => {
			renderSubject()

			await press(/backward/iu)

			expect(state.calls).toEqual([['setPower', [-0.5]]])
		})

		it('sends stop on release', async () => {
			renderSubject()

			await press(/forward/iu)
			await release()

			expect(state.calls).toEqual([
				['setPower', [0.5]],
				['stop', []],
			])
		})
	})

	it('does not stop the held direction when the other button is pressed and lifted', async () => {
		renderSubject()

		const forward = screen.getByRole('button', { name: /forward/iu })
		const backward = screen.getByRole('button', { name: /backward/iu })

		await fireEvent.keyDown(forward, { key: ' ' })
		await fireEvent.keyDown(backward, { key: ' ' })
		await fireEvent.keyUp(backward, { key: ' ' })

		expect(state.calls).toEqual([['setPower', [0.5]]])
	})

	describe('on a motor that reports its position', () => {
		beforeEach(() => {
			state.properties = { positionReporting: true }
		})

		it('shows an RPM field in place of Power', () => {
			renderSubject()

			expect(screen.getByRole('spinbutton', { name: /rpm/iu })).toHaveValue(10)
			expect(screen.queryByRole('slider')).not.toBeInTheDocument()
		})

		it('sends the RPM while Forward is held', async () => {
			renderSubject()

			await press(/forward/iu)

			expect(state.calls).toEqual([['setRPM', [10]]])
		})

		it('sends the negative RPM while Backward is held', async () => {
			renderSubject()

			await press(/backward/iu)

			expect(state.calls).toEqual([['setRPM', [-10]]])
		})

		it('sends stop on release', async () => {
			renderSubject()

			await press(/backward/iu)
			await release()

			expect(state.calls).toEqual([
				['setRPM', [-10]],
				['stop', []],
			])
		})

		it('describes each hold button with the press and hold hint', () => {
			renderSubject()

			expect(screen.getByRole('button', { name: /forward/iu })).toHaveAccessibleDescription(
				'Press and hold'
			)
			expect(screen.getByRole('button', { name: /backward/iu })).toHaveAccessibleDescription(
				'Press and hold'
			)
		})
	})

	it("shows the mutation error in the section's error indicator", () => {
		state.errors.setPower = new Error('motor refused to move')

		renderSubject()

		expect(screen.getByRole('button', { name: '1 error, copy to clipboard' })).toBeInTheDocument()
	})

	describe('host config props', () => {
		it('spans the power slider over the given range and clamps the start for a motor without position', async () => {
			renderSubject({ minPowerPct: 0.6, maxPowerPct: 0.9 })

			const slider = screen.getByRole('slider', { name: /power/iu })
			expect(slider).toHaveAttribute('min', '0.6')
			expect(slider).toHaveAttribute('max', '0.9')

			await press(/forward/iu)

			expect(state.calls).toEqual([['setPower', [0.6]]])
		})

		it('keeps the full power range with the props absent or invalid', async () => {
			renderSubject({ minPowerPct: 0.9, maxPowerPct: 0.2 })

			const slider = screen.getByRole('slider', { name: /power/iu })
			expect(slider).toHaveAttribute('min', '0')
			expect(slider).toHaveAttribute('max', '1')

			await press(/forward/iu)

			expect(state.calls).toEqual([['setPower', [0.5]]])
		})

		it('caps the RPM field at maxRpm and sends nothing for a value over it', async () => {
			state.properties = { positionReporting: true }
			renderSubject({ maxRpm: 5 })

			const rpm = screen.getByRole('spinbutton', { name: /rpm/iu })
			expect(rpm).toHaveAttribute('max', '5')
			expect(screen.getByRole('alert')).toHaveTextContent(
				"RPM cannot exceed the motor's limit of 5."
			)

			await press(/forward/iu)

			expect(state.calls).toEqual([])
			await release()

			await user.clear(rpm)
			await user.type(rpm, '4')
			await press(/forward/iu)

			expect(state.calls.filter(([method]) => method === 'setRPM')).toEqual([['setRPM', [4]]])
		})

		it('sends the default RPM with maxRpm absent', async () => {
			state.properties = { positionReporting: true }
			renderSubject()

			expect(screen.getByRole('spinbutton', { name: /rpm/iu })).not.toHaveAttribute('max')

			await press(/forward/iu)

			expect(state.calls).toEqual([['setRPM', [10]]])
		})

		it.each([0, -3, Number.NaN])('ignores an invalid maxRpm of %s', async (maxRpm) => {
			state.properties = { positionReporting: true }
			renderSubject({ maxRpm })

			expect(screen.getByRole('spinbutton', { name: /rpm/iu })).not.toHaveAttribute('max')

			await press(/forward/iu)

			expect(state.calls).toEqual([['setRPM', [10]]])
		})
	})
})
