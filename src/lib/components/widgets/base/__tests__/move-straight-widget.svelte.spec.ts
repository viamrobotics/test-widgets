import { fireEvent, render, screen } from '@testing-library/svelte'
import { createResourceMutation } from '@viamrobotics/svelte-sdk'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../move-straight-widget.svelte'

const { moveStraightMutate } = vi.hoisted(() => ({
	moveStraightMutate: vi.fn(),
}))

vi.mock('@viamrobotics/sdk', () => ({
	BaseClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({
		mutate: moveStraightMutate,
		isPending: false,
		error: null,
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-base' },
	})

describe('Base MoveStraight widget', () => {
	it('renders the MoveStraight section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'MoveStraight' })).toBeInTheDocument()
	})

	it('sends moveStraight with the default distanceMm and mmPerSec when Execute is clicked', async () => {
		renderSubject()

		const executeButton = screen.getByRole('button', { name: /execute/iu })
		await fireEvent.click(executeButton)

		expect(moveStraightMutate).toHaveBeenCalledTimes(1)
		expect(moveStraightMutate).toHaveBeenCalledWith([200, 100])
	})

	it('shows the moveStraight error below the section', () => {
		vi.mocked(createResourceMutation).mockReturnValue({
			mutate: moveStraightMutate,
			isPending: false,
			error: new Error('base refused moveStraight'),
		} as never)

		renderSubject()

		expect(screen.getByText(/base refused moveStraight/iu)).toBeInTheDocument()
	})
})
