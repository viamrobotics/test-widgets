import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../remove-waypoint-widget.svelte'

const { mutate, refetch } = vi.hoisted(() => ({
	mutate: vi.fn(),
	refetch: vi.fn(),
}))

vi.mock('@viamrobotics/sdk', () => ({ NavigationClient: class {} }))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		data: [
			{ id: 'a1', location: { latitude: 1, longitude: 2 } },
			{ id: 'b2', location: { latitude: 3, longitude: 4 } },
		],
		isLoading: false,
		isError: false,
		error: null,
		refetch,
	})),
	createResourceMutation: vi.fn(() => ({ mutate, isPending: false, error: null })),
}))

const renderSubject = () =>
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-navigation' } })

const execute = () => screen.getByRole('button', { name: /execute/iu })

describe('Navigation RemoveWaypoint widget', () => {
	beforeEach(() => {
		mutate.mockReset()
		mutate.mockImplementation((_args: unknown, options?: { onSuccess?: () => void }) => {
			options?.onSuccess?.()
		})
		refetch.mockReset()
		refetch.mockResolvedValue({})
		vi.mocked(createResourceQuery).mockClear()
	})

	it('reads getWayPoints every 1000 ms', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getWayPoints', {
			refetchInterval: 1000,
		})
	})

	it('offers one Waypoint option per waypoint, labeled by position', async () => {
		const user = userEvent.setup()
		renderSubject()

		await user.click(screen.getByRole('combobox', { name: 'Waypoint' }))

		const options = await screen.findAllByRole('option')
		expect(options.map((option) => option.textContent?.trim())).toEqual([
			'Waypoint 1',
			'Waypoint 2',
		])
	})

	it('holds back Execute until a waypoint is chosen', () => {
		renderSubject()

		expect(execute()).toBeDisabled()
	})

	it('sends the chosen id and refetches', async () => {
		const user = userEvent.setup()
		renderSubject()

		await user.click(screen.getByRole('combobox', { name: 'Waypoint' }))
		await user.click(await screen.findByRole('option', { name: 'Waypoint 2' }))
		await user.click(execute())

		expect(mutate).toHaveBeenCalledWith(['b2'], expect.anything())
		expect(refetch).toHaveBeenCalledTimes(1)
	})

	it('keeps the choice and does not refetch when the remove is rejected', async () => {
		mutate.mockImplementation(() => undefined)
		const user = userEvent.setup()
		renderSubject()

		await user.click(screen.getByRole('combobox', { name: 'Waypoint' }))
		await user.click(await screen.findByRole('option', { name: 'Waypoint 2' }))
		await user.click(execute())

		expect(mutate).toHaveBeenCalledTimes(1)
		expect(refetch).not.toHaveBeenCalled()
		expect(screen.getByRole('combobox', { name: 'Waypoint' })).toHaveTextContent('Waypoint 2')
		expect(execute()).toBeEnabled()
	})
})
