import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { createResourceMutation } from '@viamrobotics/svelte-sdk'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../quick-move-widget.svelte'

const { quickSetPowerMutate } = vi.hoisted(() => ({
	quickSetPowerMutate: vi.fn(),
}))

vi.mock('@viamrobotics/sdk', () => ({
	BaseClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({
		mutate: quickSetPowerMutate,
		isPending: false,
		error: null,
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-base' },
	})

describe('Base QuickMove widget', () => {
	it('renders the Quick move section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Quick move' })).toBeInTheDocument()
	})

	it('sends setPower with positive linear y when the forwards button is pressed', async () => {
		const user = userEvent.setup()
		renderSubject()

		const forwardsButton = screen.getByRole('button', { name: /forwards/iu })
		await user.pointer({ target: forwardsButton, keys: '[MouseLeft>]' })

		expect(quickSetPowerMutate).toHaveBeenCalledWith(
			[
				{ x: 0, y: 0.5, z: 0 },
				{ x: 0, y: 0, z: 0 },
			],
			{}
		)
	})

	it('shows the setPower error below the section', () => {
		vi.mocked(createResourceMutation).mockReturnValue({
			mutate: quickSetPowerMutate,
			isPending: false,
			error: new Error('base refused quick setPower'),
		} as never)

		renderSubject()

		expect(screen.getByText(/base refused quick setPower/iu)).toBeInTheDocument()
	})
})
