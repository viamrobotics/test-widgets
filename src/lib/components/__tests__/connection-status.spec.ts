import { render, screen } from '@testing-library/svelte'
import { MachineConnectionEvent } from '@viamrobotics/sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ErrorSubject from './connection-status-error.spec.svelte'
import Subject from './connection-status.spec.svelte'

const connection = vi.hoisted(() => {
	const state: { current: MachineConnectionEvent | undefined } = { current: undefined }
	return state
})

vi.mock('@viamrobotics/svelte-sdk', () => ({
	useConnectionStatus: vi.fn(() => connection),
}))

describe('<ConnectionStatus>', () => {
	beforeEach(() => {
		connection.current = undefined
	})

	it('Shows the offline section when a machine is offline', () => {
		connection.current = MachineConnectionEvent.DISCONNECTED
		render(Subject, { props: { partID: 'abc' } })

		expect(screen.getByText(/this machine is offline/iu)).toBeInTheDocument()
	})

	it('Shows the connecting section when a machine is connecting', () => {
		connection.current = MachineConnectionEvent.CONNECTING
		render(Subject, { props: { partID: 'abc' } })

		expect(screen.getByText(/connecting/iu)).toBeInTheDocument()
	})

	it('Shows the connected section when a machine is connected', () => {
		connection.current = MachineConnectionEvent.CONNECTED
		render(Subject, { props: { partID: 'abc' } })

		expect(screen.getByText(/connected/iu)).toBeInTheDocument()
	})

	it('Shows the failure section when reconnection fails', () => {
		connection.current = MachineConnectionEvent.RECONNECTION_FAILED
		render(Subject, { props: { partID: 'abc' } })

		expect(screen.getByText(/could not connect to the machine/iu)).toBeInTheDocument()
	})

	it('Shows the offline section before the first status arrives', () => {
		render(Subject, { props: { partID: 'abc' } })

		expect(screen.getByText(/this machine is offline/iu)).toBeInTheDocument()
	})

	it('catches an error thrown outside any section as a last resort', () => {
		connection.current = MachineConnectionEvent.CONNECTED
		render(ErrorSubject)

		expect(screen.getByText(/something went wrong/iu)).toBeInTheDocument()
	})
})
