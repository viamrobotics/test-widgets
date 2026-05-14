import { render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../is-holding-something.svelte'

vi.mock('@viamrobotics/sdk', () => ({
	GripperClient: class {},
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

describe('Gripper IsHoldingSomething', () => {
	it('renders with "Empty" status when not holding', () => {
		vi.mocked(createResourceQuery).mockReturnValue({
			data: false,
			isLoading: false,
			isError: false,
			error: null,
		} as ReturnType<typeof createResourceQuery>)

		render(Subject, {
			props: { partID: 'test-part', resourceName: 'test-gripper' },
		})

		expect(screen.getByText('Empty')).toBeInTheDocument()
	})

	it('renders with "Holding" status when holding something', () => {
		vi.mocked(createResourceQuery).mockReturnValue({
			data: true,
			isLoading: false,
			isError: false,
			error: null,
		} as ReturnType<typeof createResourceQuery>)

		render(Subject, {
			props: { partID: 'test-part', resourceName: 'test-gripper' },
		})

		expect(screen.getByText('Holding')).toBeInTheDocument()
	})

	it('creates a resource query for isHoldingSomething with polling', () => {
		vi.mocked(createResourceQuery).mockReturnValue({
			data: false,
			isLoading: false,
			isError: false,
			error: null,
		} as never)

		render(Subject, {
			props: { partID: 'test-part', resourceName: 'test-gripper' },
		})

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'isHoldingSomething', {
			refetchInterval: 500,
		})
	})
})
