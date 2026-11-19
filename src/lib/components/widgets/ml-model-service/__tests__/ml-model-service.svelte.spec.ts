import { render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../ml-model-service.svelte'
import Pane from './__fixtures__/in-320-pane.svelte'

const { requestedOptions } = vi.hoisted(() => {
	const options: unknown[] = []
	return { requestedOptions: options }
})

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createResourceQuery: vi.fn((_client: unknown, _method: string, options: unknown) => {
			requestedOptions.push(typeof options === 'function' ? options() : options)
			return {
				data: undefined,
				isLoading: true,
				isSuccess: false,
				isError: false,
				error: null,
			}
		}),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

describe('ML model service widget', () => {
	it('renders the Metadata section', () => {
		render(Subject, { props: { partID: 'test-part', resourceName: 'test-ml-model' } })

		expect(screen.getByRole('heading', { name: 'Metadata' })).toBeInTheDocument()
	})

	it('has no refresh row', () => {
		render(Subject, { props: { partID: 'test-part', resourceName: 'test-ml-model' } })

		expect(screen.queryByRole('combobox', { name: 'Refresh rate' })).toBeNull()
		expect(screen.queryByRole('button', { name: 'Refresh' })).toBeNull()
	})

	it('reads Metadata once and never polls', () => {
		requestedOptions.length = 0

		render(Subject, { props: { partID: 'test-part', resourceName: 'test-ml-model' } })

		expect(requestedOptions).toEqual([{ refetchInterval: false }])
	})

	it('keeps the root and the pane within 320 px', () => {
		const { container } = render(Pane, { props: { widget: Subject } })

		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild ?? container
		expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})
})
