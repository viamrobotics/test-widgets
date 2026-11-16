import { render, screen } from '@testing-library/svelte'
import { createResourceMutation } from '@viamrobotics/svelte-sdk'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../quick-move-widget.svelte'

vi.mock('@viamrobotics/sdk', () => ({
	ArmClient: class {},
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
	createResourceMutation: vi.fn(() => ({
		mutate: vi.fn(),
		mutateAsync: vi.fn(),
		isPending: false,
		error: null,
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-arm' },
	})

describe('Arm quick-move widget', () => {
	it('renders the MoveToJointPositions section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'MoveToJointPositions' })).toBeInTheDocument()
	})

	it('creates the moveToJointPositions mutation', () => {
		renderSubject()

		expect(createResourceMutation).toHaveBeenCalledWith(expect.anything(), 'moveToJointPositions')
	})
})
