import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../move-to-joint-positions-widget.svelte'

const { moveToJointPositionsMutateAsync } = vi.hoisted(() => ({
	moveToJointPositionsMutateAsync: vi.fn(async () => undefined),
}))

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
		mutateAsync: moveToJointPositionsMutateAsync,
		isPending: false,
		error: null,
	})),
}))

const loaded = (data: unknown) =>
	({ data, isLoading: false, isSuccess: true, isError: false, error: null }) as never

const mockJointPositions = (values: number[]) => {
	vi.mocked(createResourceQuery).mockImplementation(((_client: unknown, method: string) =>
		method === 'getJointPositions' ? loaded({ values }) : loaded(undefined)) as never)
}

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-arm' },
	})

describe('Arm MoveToJointPositions widget', () => {
	it('renders the editor in a MoveToJointPositions section', () => {
		mockJointPositions([10, 20, 30])

		renderSubject()

		expect(screen.getByRole('heading', { name: 'MoveToJointPositions' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /jogging/iu })).toBeInTheDocument()
	})

	it('sends the desired positions to moveToJointPositions on Execute', async () => {
		const user = userEvent.setup()
		mockJointPositions([10, 20, 30])
		renderSubject()

		await user.click(screen.getByRole('button', { name: /joint positions/iu }))
		await user.click(screen.getByRole('button', { name: /execute/iu }))

		expect(moveToJointPositionsMutateAsync).toHaveBeenCalledWith([[10, 20, 30]])
	})
})
