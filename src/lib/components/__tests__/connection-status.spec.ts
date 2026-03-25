import { render, screen } from '@testing-library/svelte'
import { MachineConnectionEvent } from '@viamrobotics/sdk'
import { describe, expect, it } from 'vitest'

import ErrorSubject from './connection-status-error.spec.svelte'
import Subject from './connection-status.spec.svelte'

// Currently no way to test things because we need a working svelte sdk.
describe('<ConnectionStatus>', () => {
	it('Shows the offline section when a machine is offline', () => {
		render(Subject, {
			props: {
				partID: 'abc',
				status: MachineConnectionEvent.DISCONNECTED,
			},
		})

		expect(screen.getByText(/this machine is offline/iu)).toBeInTheDocument()
	})

	it('Shows the connecting section when a machine is connecting', () => {
		render(Subject, {
			props: {
				partID: 'abc',
				status: MachineConnectionEvent.CONNECTING,
			},
		})

		expect(screen.getByText(/connecting/iu)).toBeInTheDocument()
	})

	it('Shows the connected section when a machine is connected', () => {
		render(Subject, {
			props: {
				partID: 'abc',
				status: MachineConnectionEvent.CONNECTED,
			},
		})

		expect(screen.getByText(/connected/iu)).toBeInTheDocument()
	})

	it('Catches errors with the error boundary', () => {
		render(ErrorSubject)

		expect(screen.getByText(/something went wrong/iu)).toBeInTheDocument()
	})
})
