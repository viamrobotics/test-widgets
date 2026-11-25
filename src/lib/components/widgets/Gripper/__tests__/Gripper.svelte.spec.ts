import { render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../Gripper.svelte'

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	const loading = {
		data: undefined,
		isLoading: true,
		isSuccess: false,
		isError: false,
		error: null,
	}
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createResourceQuery: vi.fn(() => loading),
		createResourceMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false, error: null })),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

describe('Gripper widget', () => {
	it.each(['Open / Grab', 'Stop', 'IsMoving', 'IsHoldingSomething'])(
		'renders the %s section',
		(name) => {
			render(Subject, {
				props: { partID: 'test-part', resourceName: 'test-gripper' },
			})

			expect(screen.getByRole('heading', { name })).toBeInTheDocument()
		}
	)
})
