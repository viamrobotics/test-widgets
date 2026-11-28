import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import InWidgetsProvider from '#lib/__tests__/__fixtures__/InWidgetsProvider.svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../MoveOnMapControl.svelte'

const state = vi.hoisted(
	(): {
		cloudSlam: boolean
		moveOnMap: ReturnType<typeof vi.fn>
		stopPlan: ReturnType<typeof vi.fn>
	} => ({
		cloudSlam: false,
		moveOnMap: vi.fn(),
		stopPlan: vi.fn(),
	})
)

const QUERY_DATA: Record<string, () => unknown> = {
	getProperties: () => ({ cloudSlam: state.cloudSlam }),
	getPosition: () => ({
		pose: { x: 1000, y: 2000, z: 0, oX: 0, oY: 0, oZ: 1, theta: 90 },
	}),
}

const mutationFor = (method: string) => {
	if (method === 'moveOnMap') return { mutateAsync: state.moveOnMap, mutate: vi.fn(), error: null }
	return { mutateAsync: vi.fn(), mutate: state.stopPlan, error: null }
}

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: undefined })),
	createResourceQuery: vi.fn((_client: unknown, method: string) => ({
		get data() {
			return QUERY_DATA[method]?.()
		},
		isLoading: false,
		isError: false,
		error: null,
		fetchStatus: 'idle',
		refetch: () => Promise.resolve({ error: null, data: undefined }),
	})),
	createResourceMutation: vi.fn((_client: unknown, method: string) => mutationFor(method)),
}))

const PROPS = { partID: 'test-part', resourceName: 'test-slam' }

const renderSubject = () =>
	render(InWidgetsProvider, { props: { component: Subject, props: PROPS } })

const endPositionField = (axis: 'X' | 'Y') =>
	within(screen.getByRole('group', { name: 'End position' })).getByRole('spinbutton', {
		name: axis,
	})

const typeDestination = async (user: ReturnType<typeof userEvent.setup>) => {
	await user.type(endPositionField('X'), '1')
	await user.type(endPositionField('Y'), '2')
}

describe('Slam MoveOnMap control', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
		state.cloudSlam = false
		state.moveOnMap = vi.fn(() => Promise.resolve())
		state.stopPlan = vi.fn()
	})

	it('heads the section Move on map', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Move on map' })).toBeInTheDocument()
	})

	it('moves to a typed destination in millimeters, keeping the base facing its current way', async () => {
		renderSubject()
		await typeDestination(user)

		await user.click(screen.getByRole('button', { name: 'Execute' }))

		expect(state.moveOnMap).toHaveBeenCalledExactlyOnceWith([
			{ x: 1000, y: 2000, z: 0, oX: 0, oY: 0, oZ: 1, theta: 90 },
			'',
			'',
		])
	})

	it('moves under Cloud SLAM too', async () => {
		state.cloudSlam = true
		renderSubject()
		await typeDestination(user)

		await user.click(screen.getByRole('button', { name: 'Execute' }))

		expect(state.moveOnMap).toHaveBeenCalledExactlyOnceWith([
			expect.objectContaining({ x: 1000, y: 2000, z: 0 }),
			'',
			'',
		])
	})

	it('passes the typed base name to the move call', async () => {
		renderSubject()
		await user.type(screen.getByRole('textbox', { name: 'Base name' }), 'my-base')
		await typeDestination(user)

		await user.click(screen.getByRole('button', { name: 'Execute' }))

		expect(state.moveOnMap).toHaveBeenCalledExactlyOnceWith([
			expect.objectContaining({ x: 1000, y: 2000 }),
			'my-base',
			'',
		])
	})

	it('drops a second Execute press while MoveOnMap is pending', async () => {
		state.moveOnMap.mockReturnValue(new Promise(() => {}))
		renderSubject()
		await typeDestination(user)

		await user.click(screen.getByRole('button', { name: 'Execute' }))
		await user.click(screen.getByRole('button', { name: 'Execute' }))

		expect(state.moveOnMap).toHaveBeenCalledOnce()
		expect(screen.getByRole('button', { name: 'Execute' })).toHaveAttribute('aria-disabled', 'true')
	})

	it('lets Execute run again once MoveOnMap settles', async () => {
		renderSubject()
		await typeDestination(user)

		await user.click(screen.getByRole('button', { name: 'Execute' }))
		await user.click(await screen.findByRole('button', { name: 'Execute' }))

		expect(state.moveOnMap).toHaveBeenCalledTimes(2)
	})

	it('sends Stop while MoveOnMap is pending', async () => {
		state.moveOnMap.mockReturnValue(new Promise(() => {}))
		renderSubject()
		await typeDestination(user)
		await user.click(screen.getByRole('button', { name: 'Execute' }))

		await user.click(screen.getByRole('button', { name: 'Stop' }))

		expect(state.stopPlan).toHaveBeenCalledExactlyOnceWith([''], {
			onError: expect.any(Function),
		})
	})

	it('says the move failed when MoveOnMap rejects', async () => {
		state.moveOnMap.mockRejectedValue(new Error('no plan'))
		renderSubject()
		await typeDestination(user)

		await user.click(screen.getByRole('button', { name: 'Execute' }))

		await expect
			.poll(() => screen.getByTestId('status-line').textContent.trim())
			.toBe('Move on map failed')
	})

	it('says Stop failed when StopPlan rejects', async () => {
		state.stopPlan.mockImplementation((_args: unknown, options: { onError: () => void }) => {
			options.onError()
		})
		renderSubject()

		await user.click(screen.getByRole('button', { name: 'Stop' }))

		await expect
			.poll(() => screen.getByTestId('status-line').textContent.trim())
			.toBe('Stop failed')
	})
})
