import { render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../base-apis.svelte'

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
		props: { partID: 'test-part', resourceName: 'test-base' },
	})

describe('Base composite', () => {
	it('renders each API section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Quick move' })).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: 'Stop' })).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: 'IsMoving' })).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: 'MoveStraight' })).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: 'Spin' })).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: 'SetPower' })).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: 'SetVelocity' })).toBeInTheDocument()
	})

	it('renders the keyboard control switch inline in Quick move', () => {
		renderSubject()

		expect(screen.getByText('Keyboard control')).toBeInTheDocument()
	})
})
