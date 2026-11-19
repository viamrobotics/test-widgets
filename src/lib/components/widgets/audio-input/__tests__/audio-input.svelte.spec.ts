import { render, screen } from '@testing-library/svelte'
import { MachineConnectionEvent } from '@viamrobotics/sdk'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../audio-input.svelte'
import Pane from './__fixtures__/in-320-pane.svelte'

vi.mock('@viamrobotics/svelte-sdk', () => ({
	useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		data: undefined,
		isLoading: false,
		isError: false,
		error: null,
		fetchStatus: 'idle',
	})),
}))

const renderSubject = () =>
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-audio' } })

describe('Audio input composite', () => {
	it('stacks GetAudio then GetProperties', () => {
		renderSubject()

		const names = screen.getAllByRole('heading').map((heading) => heading.textContent?.trim())
		expect(names.indexOf('GetAudio')).toBeGreaterThanOrEqual(0)
		expect(names.indexOf('GetProperties')).toBe(names.indexOf('GetAudio') + 1)
	})

	it('draws no refresh row', () => {
		renderSubject()

		expect(screen.queryByText('Manual refresh')).not.toBeInTheDocument()
	})

	it('keeps the root and the pane within 320 px', () => {
		const { container } = render(Pane, { props: { widget: Subject } })

		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild ?? container
		expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})
})
