import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../add-waypoint-widget.svelte'

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }))

vi.mock('@viamrobotics/sdk', () => ({ NavigationClient: class {} }))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({ mutate, isPending: false, error: null })),
}))

const renderSubject = () =>
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-navigation' } })

const execute = () => screen.getByRole('button', { name: /execute/iu })

describe('Navigation AddWaypoint widget', () => {
	beforeEach(() => {
		mutate.mockClear()
	})

	it('renders the AddWaypoint heading and both fields', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'AddWaypoint' })).toBeInTheDocument()
		expect(screen.getByLabelText('Latitude')).toBeInTheDocument()
		expect(screen.getByLabelText('Longitude')).toBeInTheDocument()
	})

	it('holds back Execute while a field is empty', async () => {
		const user = userEvent.setup()
		renderSubject()

		expect(execute()).toBeDisabled()

		await user.type(screen.getByLabelText('Latitude'), '40.5')
		expect(execute()).toBeDisabled()

		await user.type(screen.getByLabelText('Longitude'), '-73.25')
		expect(execute()).toBeEnabled()
	})

	it('sends the latitude and longitude on Execute', async () => {
		const user = userEvent.setup()
		renderSubject()

		await user.type(screen.getByLabelText('Latitude'), '40.5')
		await user.type(screen.getByLabelText('Longitude'), '-73.25')
		await user.click(execute())

		expect(mutate).toHaveBeenCalledTimes(1)
		expect(mutate).toHaveBeenCalledWith([{ latitude: 40.5, longitude: -73.25 }])
	})
})
