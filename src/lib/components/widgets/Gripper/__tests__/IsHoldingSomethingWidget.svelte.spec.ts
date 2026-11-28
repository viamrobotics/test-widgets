import { render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../IsHoldingSomethingWidget.svelte'

const { queryState } = vi.hoisted(() => {
	const state: { data: boolean | undefined } = { data: undefined }
	return { queryState: state }
})

vi.mock('@viamrobotics/sdk', () => ({
	GripperClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		data: queryState.data,
		isLoading: queryState.data === undefined,
		isError: false,
		error: null,
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-gripper' },
	})

describe('Gripper IsHoldingSomething', () => {
	beforeEach(() => {
		queryState.data = undefined
		vi.mocked(createResourceQuery).mockClear()
	})

	it('renders the IsHoldingSomething section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'IsHoldingSomething' })).toBeInTheDocument()
	})

	it('renders with "Empty" status when not holding', () => {
		queryState.data = false

		renderSubject()

		expect(screen.getByText('Empty')).toBeInTheDocument()
	})

	it('renders with "Holding" status when holding something', () => {
		queryState.data = true

		renderSubject()

		expect(screen.getByText('Holding')).toBeInTheDocument()
	})

	it('polls isHoldingSomething every 500 ms', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'isHoldingSomething', {
			refetchInterval: 500,
		})
	})
})
