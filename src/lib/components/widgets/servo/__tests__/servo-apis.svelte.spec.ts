import { render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../servo-apis.svelte'

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
		createRobotQuery: vi.fn(() => loading),
		useRobotClient: vi.fn(() => ({ current: {} })),
		useResourceStatuses: vi.fn(() => ({ current: [] })),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-servo' },
	})

describe('Servo widget', () => {
	it('renders the GetPosition, Move, Quick move, Stop, and IsMoving sections', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetPosition' })).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: 'Move' })).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: 'Quick move' })).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: 'Stop' })).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: 'IsMoving' })).toBeInTheDocument()
	})
})
