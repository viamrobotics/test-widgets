import { fireEvent, render, screen } from '@testing-library/svelte'
import { createResourceMutation } from '@viamrobotics/svelte-sdk'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../set-power-widget.svelte'

const { setPowerMutate } = vi.hoisted(() => ({
	setPowerMutate: vi.fn(),
}))

vi.mock('@viamrobotics/sdk', () => ({
	BaseClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({
		mutate: setPowerMutate,
		isPending: false,
		error: null,
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-base' },
	})

describe('Base SetPower widget', () => {
	it('renders the SetPower section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'SetPower' })).toBeInTheDocument()
	})

	it('sends setPower with the default vectors when Execute is clicked', async () => {
		renderSubject()

		const executeButton = screen.getByRole('button', { name: /execute/iu })
		await fireEvent.click(executeButton)

		expect(setPowerMutate).toHaveBeenCalledTimes(1)
		expect(setPowerMutate).toHaveBeenCalledWith(
			[
				{ x: 0.5, y: 0, z: 0 },
				{ x: 0, y: 0, z: 0.75 },
			],
			{}
		)
	})

	it('shows the setPower error below the section', () => {
		vi.mocked(createResourceMutation).mockReturnValue({
			mutate: setPowerMutate,
			isPending: false,
			error: new Error('base refused setPower'),
		} as never)

		renderSubject()

		expect(screen.getByText(/base refused setPower/iu)).toBeInTheDocument()
	})
})
