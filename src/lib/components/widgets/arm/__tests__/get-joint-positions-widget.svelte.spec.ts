import { render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../get-joint-positions-widget.svelte'

vi.mock('@viamrobotics/sdk', () => ({
	ArmClient: class {},
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

describe('Arm GetJointPositions widget', () => {
	it('renders the joint positions returned by the query', () => {
		vi.mocked(createResourceQuery).mockReturnValue({
			data: { values: [10, 20, 30] },
			isLoading: false,
			isError: false,
			error: null,
		} as never)

		render(Subject, {
			props: { partID: 'test-part', resourceName: 'test-arm' },
		})

		expect(screen.getByText('GetJointPositions')).toBeInTheDocument()
		expect(screen.getByText('Current Positions')).toBeInTheDocument()
	})

	it('creates a resource query for getJointPositions with polling', () => {
		vi.mocked(createResourceQuery).mockReturnValue({
			data: { values: [] },
			isLoading: false,
			isError: false,
			error: null,
		} as never)

		render(Subject, {
			props: { partID: 'test-part', resourceName: 'test-arm' },
		})

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getJointPositions', {
			refetchInterval: 500,
		})
	})
})
