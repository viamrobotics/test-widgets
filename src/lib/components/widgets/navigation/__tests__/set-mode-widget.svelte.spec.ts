import { fireEvent, render, screen } from '@testing-library/svelte'
import { createResourceMutation } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../set-mode-widget.svelte'

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }))

vi.mock('@viamrobotics/sdk', () => ({
	NavigationClient: class {},
	navigationApi: { Mode: { UNSPECIFIED: 0, MANUAL: 1, WAYPOINT: 2, EXPLORE: 3 } },
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({ error: null, isPending: false, mutate })),
}))

const renderSubject = () =>
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-nav' } })

describe('Navigation SetMode widget', () => {
	beforeEach(() => {
		mutate.mockClear()
		vi.mocked(createResourceMutation).mockClear()
	})

	it('creates the setMode mutation and does not poll', () => {
		renderSubject()

		expect(createResourceMutation).toHaveBeenCalledWith(expect.anything(), 'setMode')
	})

	it('holds Execute back until a mode is chosen', () => {
		renderSubject()

		expect(screen.getByRole('button', { name: 'Execute' })).toBeDisabled()
	})

	it.each([
		['Manual', 1],
		['Waypoint', 2],
		['Explore', 3],
	])('sends %s on Execute', async (label, mode) => {
		renderSubject()

		await fireEvent.click(screen.getByRole('radio', { name: label }))
		await fireEvent.click(screen.getByRole('button', { name: 'Execute' }))

		expect(mutate).toHaveBeenCalledWith([mode])
	})
})
