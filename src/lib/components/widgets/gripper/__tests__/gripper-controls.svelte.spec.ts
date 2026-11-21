import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../gripper-controls.svelte'

const state = vi.hoisted(
	(): {
		data: Record<string, unknown>
		calls: [string, unknown[]][]
		openCall: { promise: Promise<unknown> } | undefined
	} => ({ data: {}, calls: [], openCall: undefined })
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
				return method === 'open' && state.openCall ? state.openCall.promise : Promise.resolve(true)
			},
			isPending: false,
			variables: undefined,
			error: null,
		})),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

const renderSubject = () =>
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-gripper' } })

describe('Gripper controls', () => {
	beforeEach(() => {
		state.data = { isMoving: false, isHoldingSomething: false }
		state.calls = []
		state.openCall = undefined
	})

	it('draws the Controls heading, the status pill, Stop, then Open and Grab', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Controls' })).toBeInTheDocument()
		const glance = within(screen.getByRole('group', { name: 'At a glance' }))
		expect(glance.getByRole('group', { name: 'Gripper status' })).toBeVisible()
		expect(glance.getByRole('button', { name: 'Stop' })).toBeVisible()
		expect(screen.getByRole('button', { name: 'Open' })).toBeVisible()
		expect(screen.getByRole('button', { name: 'Grab' })).toBeVisible()
		expect(screen.queryAllByRole('heading', { name: 'Open / Grab' })).toEqual([])
	})

	it('reads Idle and Empty when nothing moves or is held', () => {
		renderSubject()

		const pill = within(screen.getByRole('group', { name: 'Gripper status' }))
		expect(pill.getByText('Idle')).toBeVisible()
		expect(pill.getByText('Empty')).toBeVisible()
	})

	it('reads Moving and Holding when both are true', () => {
		state.data = { isMoving: true, isHoldingSomething: true }
		renderSubject()

		const pill = within(screen.getByRole('group', { name: 'Gripper status' }))
		expect(pill.getByText('Moving')).toBeVisible()
		expect(pill.getByText('Holding')).toBeVisible()
	})

	it('reads dashes before the first poll lands', () => {
		state.data = {}
		renderSubject()

		const pill = within(screen.getByRole('group', { name: 'Gripper status' }))
		expect(pill.getAllByText('-')).toHaveLength(2)
	})

	it('is one focus stop', () => {
		renderSubject()

		expect(screen.getByRole('group', { name: 'Gripper status' })).toHaveAttribute('tabindex', '0')
	})

	it('sends Stop while Open is in flight', async () => {
		state.openCall = { promise: new Promise(() => {}) }
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Open' }))
		await userEvent.click(screen.getByRole('button', { name: 'Stop' }))

		expect(state.calls).toEqual([
			['open', []],
			['stop', []],
		])
	})
})
