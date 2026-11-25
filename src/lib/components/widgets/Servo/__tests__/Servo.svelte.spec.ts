import { render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../Servo.svelte'

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

describe('Servo widget', () => {
	it.each(['GetPosition', 'Move', 'Quick move', 'Stop', 'IsMoving'])(
		'renders the %s section',
		(name) => {
			render(Subject, {
				props: { partID: 'test-part', resourceName: 'test-servo' },
			})

			expect(screen.getByRole('heading', { name })).toBeInTheDocument()
		}
	)
})
