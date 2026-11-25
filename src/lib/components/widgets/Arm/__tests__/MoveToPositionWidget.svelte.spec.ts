import { render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../MoveToPositionWidget.svelte'

vi.mock('@viamrobotics/sdk', () => ({
	ArmClient: class {},
	MotionClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		data: undefined,
		isLoading: true,
		isSuccess: false,
		isError: false,
		error: null,
	})),
	createRobotQuery: vi.fn(() => ({
		data: undefined,
		isLoading: true,
		isSuccess: false,
		isError: false,
		error: null,
	})),
	useRobotClient: vi.fn(() => ({ current: {} })),
	useResourceStatuses: vi.fn(() => ({ current: [] })),
	createResourceMutation: vi.fn(() => ({
		mutate: vi.fn(),
		mutateAsync: vi.fn(),
		isPending: false,
		error: null,
	})),
}))

describe('Arm MoveToPosition widget', () => {
	it('renders the MoveToPosition section heading', () => {
		render(Subject, { props: { partID: 'test-part', resourceName: 'test-arm' } })

		expect(screen.getByRole('heading', { name: 'MoveToPosition' })).toBeInTheDocument()
	})
})
