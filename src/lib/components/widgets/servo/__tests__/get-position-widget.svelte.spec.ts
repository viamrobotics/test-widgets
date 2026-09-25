import { render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../get-position-widget.svelte'

vi.mock('@viamrobotics/sdk', () => ({
	ServoClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		data: undefined,
		isLoading: true,
		isError: false,
		error: null,
	})),
}))

const mockPosition = (position: number) => {
	vi.mocked(createResourceQuery).mockReturnValue({
		data: position,
		isLoading: false,
		isSuccess: true,
		isError: false,
		error: null,
	} as never)
}

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-servo' },
	})

describe('Servo GetPosition widget', () => {
	it('renders a GetPosition heading', () => {
		mockPosition(42.5)

		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetPosition' })).toBeInTheDocument()
	})

	it('renders the position formatted with the degrees unit', () => {
		mockPosition(42.5)

		renderSubject()

		expect(screen.getByText('42.50')).toBeInTheDocument()
		expect(screen.getByText('º')).toBeInTheDocument()
	})

	it('polls getPosition every 500ms', () => {
		mockPosition(42.5)

		renderSubject()

		const call = vi
			.mocked(createResourceQuery)
			.mock.calls.find(([, method]) => String(method) === 'getPosition')

		expect(call?.[2]).toEqual({ refetchInterval: 500 })
	})
})
