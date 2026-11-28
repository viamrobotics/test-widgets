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
		isSuccess: queryState.data !== undefined,
		isError: queryState.error !== null,
		isFetching: false,
		fetchStatus: 'idle',
		error: queryState.error,
		refetch: vi.fn(),
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

	it('renders the position in millimeters, as the method returns it', () => {
		queryState.data = {
			pose: { x: 1234, y: 5678, z: 9012, oX: 0, oY: 0, oZ: 0, theta: 0 },
		}

		renderSubject()

		const position = screen.getByRole('group', { name: 'Current position' })
		expect(position.textContent).toMatch(/1234\.00\s*mm/u)
		expect(position.textContent).toMatch(/5678\.00\s*mm/u)
		expect(position.textContent).toMatch(/9012\.00\s*mm/u)
	})

	it('renders the orientation vector to four digits', () => {
		queryState.data = {
			pose: { x: 0, y: 0, z: 0, oX: 0.7071, oY: 0, oZ: 0.7071, theta: 0 },
		}

		renderSubject()

		expect(screen.getAllByText('0.7071')).toHaveLength(2)
	})

	it('renders the orientation theta', () => {
		queryState.data = {
			pose: { x: 0, y: 0, z: 0, oX: 0, oY: 0, oZ: 0, theta: 42.3 },
		}

		renderSubject()

		expect(screen.getByText('42.30')).toBeInTheDocument()
	})

	it('polls getPosition once a second and draws the poll control', () => {
		queryState.data = {
			pose: { x: 0, y: 0, z: 0, oX: 0, oY: 0, oZ: 1, theta: 0 },
		}

		renderSubject()

		const options: unknown = vi.mocked(createResourceQuery).mock.calls.at(-1)?.[2]
		expect(typeof options === 'function' ? options() : options).toMatchObject({
			refetchInterval: 1000,
		})
		expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
		expect(screen.getByRole('combobox', { name: 'Updates' })).toBeInTheDocument()
	})

	it("shows the query error in the section's error indicator", async () => {
		queryState.error = new Error('slam position unavailable')

		renderSubject()
		await fireEvent.focusIn(
			screen.getByRole('button', { name: 'GetPosition: 1 error, copy to clipboard' })
		)

		expect(screen.getByText(/slam position unavailable/iu)).toBeInTheDocument()
	})
})
