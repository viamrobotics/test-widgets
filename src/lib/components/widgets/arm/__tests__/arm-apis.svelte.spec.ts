import { render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../arm-apis.svelte'

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

const loaded = (data: unknown) =>
	({ data, isLoading: false, isSuccess: true, isError: false, error: null }) as never
const loading = () =>
	({ data: undefined, isLoading: true, isSuccess: false, isError: false, error: null }) as never

const mockGetProperties = (properties: { supportManualMode: boolean } | undefined) => {
	vi.mocked(createResourceQuery).mockImplementation(((_client: unknown, method: string) =>
		method === 'getProperties' ? loaded(properties) : loading()) as never)
}

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-arm' },
	})

const manualModeHeading = () => screen.queryByRole('heading', { name: 'GetManualMode' })
const manualModeDescription = () => screen.queryByText(/gravity compensation/iu)

describe('Arm widget', () => {
	it('renders the manual mode band when the arm supports manual mode', () => {
		mockGetProperties({ supportManualMode: true })

		renderSubject()

		expect(manualModeHeading()).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: 'SetManualMode' })).toBeInTheDocument()
		expect(manualModeDescription()).toBeInTheDocument()
	})

	it('hides the manual mode band when the arm does not support manual mode', () => {
		mockGetProperties({ supportManualMode: false })

		renderSubject()

		expect(manualModeHeading()).not.toBeInTheDocument()
		expect(manualModeDescription()).not.toBeInTheDocument()
		expect(screen.getByRole('heading', { name: 'GetJointPositions' })).toBeInTheDocument()
	})

	it('hides the manual mode band until getProperties has answered', () => {
		mockGetProperties(undefined)

		renderSubject()

		expect(manualModeHeading()).not.toBeInTheDocument()
		expect(manualModeDescription()).not.toBeInTheDocument()
	})
})
