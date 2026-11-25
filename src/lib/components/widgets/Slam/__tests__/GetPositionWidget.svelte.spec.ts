import { fireEvent, render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../GetPositionWidget.svelte'

interface Position {
	pose: { x: number; y: number; z: number; oX: number; oY: number; oZ: number; theta: number }
}

const { queryState } = vi.hoisted(() => {
	const state: { data: Position | undefined; error: Error | null } = {
		data: undefined,
		error: null,
	}
	return { queryState: state }
})

vi.mock('@viamrobotics/sdk', () => ({
	SlamClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		data: queryState.data,
		isLoading: queryState.data === undefined && queryState.error === null,
		isError: queryState.error !== null,
		error: queryState.error,
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-slam' },
	})

describe('SLAM GetPosition widget', () => {
	beforeEach(() => {
		queryState.data = undefined
		queryState.error = null
		vi.mocked(createResourceQuery).mockClear()
	})

	it('renders the GetPosition section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetPosition' })).toBeInTheDocument()
	})

	it('renders the position in meters converted from millimeters', () => {
		queryState.data = {
			pose: { x: 1234, y: 5678, z: 9012, oX: 0, oY: 0, oZ: 0, theta: 0 },
		}

		renderSubject()

		expect(screen.getByText('1.2')).toBeInTheDocument()
		expect(screen.getByText('5.7')).toBeInTheDocument()
		expect(screen.getByText('9.0')).toBeInTheDocument()
	})

	it('renders the orientation theta', () => {
		queryState.data = {
			pose: { x: 0, y: 0, z: 0, oX: 0, oY: 0, oZ: 0, theta: 42.3 },
		}

		renderSubject()

		expect(screen.getByText('42.3')).toBeInTheDocument()
	})

	it('polls getPosition every 1000 ms', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getPosition', {
			refetchInterval: 1000,
		})
	})

	it("shows the query error in the section's error indicator", async () => {
		queryState.error = new Error('slam position unavailable')

		renderSubject()
		await fireEvent.focus(screen.getByRole('button', { name: '1 error, copy to clipboard' }))

		expect(screen.getByText(/slam position unavailable/iu)).toBeInTheDocument()
	})
})
