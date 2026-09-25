import { render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../is-moving-widget.svelte'

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

const mockIsMoving = (isMoving: boolean) => {
	vi.mocked(createResourceQuery).mockReturnValue({
		data: isMoving,
		isLoading: false,
		isSuccess: true,
		isError: false,
		error: null,
	} as never)
}

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-gripper' },
	})

describe('Gripper IsMoving widget', () => {
	it('shows the moving pill in an IsMoving section while the gripper reports motion', () => {
		mockIsMoving(true)

		renderSubject()

		expect(screen.getByRole('heading', { name: 'IsMoving' })).toBeInTheDocument()
		expect(screen.getByText('Moving...')).toBeInTheDocument()
	})

	it('shows the idle pill while the gripper reports no motion', () => {
		mockIsMoving(false)

		renderSubject()

		expect(screen.getByText('Idle')).toBeInTheDocument()
	})
})
