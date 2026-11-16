import { render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../base.svelte'

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

describe('Base widget', () => {
	it.each(['Quick move', 'Stop', 'IsMoving', 'MoveStraight', 'Spin', 'SetPower', 'SetVelocity'])(
		'renders the %s section',
		(name) => {
			render(Subject, {
				props: { partID: 'test-part', resourceName: 'test-base' },
			})

			expect(screen.getByRole('heading', { name })).toBeInTheDocument()
		}
	)
})
