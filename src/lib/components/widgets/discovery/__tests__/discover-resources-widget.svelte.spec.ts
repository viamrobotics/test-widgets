import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../discover-resources-widget.svelte'
import Pane from './__fixtures__/discover-resources-pane.svelte'
import { discoverState, resetDiscoverState } from './__fixtures__/discover-resources-state.svelte'
import { makeConfig } from './__fixtures__/discoveries-config'

vi.mock('@viamrobotics/sdk', async (importOriginal) => ({
	...(await importOriginal<typeof import('@viamrobotics/sdk')>()),
	DiscoveryClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { discoverState: state } = await import('./__fixtures__/discover-resources-state.svelte')
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createResourceQuery: vi.fn(() => ({
			get data() {
				return state.data
			},
			get isFetching() {
				return state.isFetching
			},
			isLoading: false,
			isError: false,
			error: null,
			refetch: () => {
				state.fetched += 1
				state.data = state.response
				return Promise.resolve({ data: state.response, error: null })
			},
		})),
	}
})

const CAMERA = 'rdk:component:camera'

const renderSubject = () => render(Pane, { props: { widget: Subject } })

describe('Discovery DiscoverResources widget', () => {
	beforeEach(() => {
		resetDiscoverState()
	})

	it('fetches nothing until Discover resources is pressed, and Found reads -', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'DiscoverResources' })).toBeInTheDocument()
		expect(discoverState.fetched).toBe(0)
		expect(within(screen.getByRole('group', { name: 'Found' })).getByText('-')).toBeInTheDocument()
	})

	it('fetches on the button and shows the count', async () => {
		discoverState.response = [makeConfig('b', CAMERA, 'v:c:b'), makeConfig('a', CAMERA, 'v:c:a')]
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Discover resources' }))

		expect(discoverState.fetched).toBe(1)
		expect(within(screen.getByRole('group', { name: 'Found' })).getByText('2')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Copy JSON' })).toBeInTheDocument()
	})

	it('ignores a press while busy and marks the button busy', async () => {
		discoverState.isFetching = true
		renderSubject()

		const button = screen.getByRole('button', { name: 'Discover resources' })
		expect(button).toHaveAttribute('aria-busy', 'true')
		await userEvent.click(button)

		expect(discoverState.fetched).toBe(0)
	})

	it('lists one folder per config sorted by name with its API, model and attributes', async () => {
		discoverState.response = [
			makeConfig('zeta', CAMERA, 'v:c:z', { width_px: 640 }),
			makeConfig('alpha', CAMERA, 'v:c:a', { nested: { deep: 1 } }),
		]
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Discover resources' }))

		const titles = screen
			.getAllByRole('button')
			.map((button) => button.textContent?.trim())
			.filter((text) => text === 'alpha' || text === 'zeta')
		expect(titles).toEqual(['alpha', 'zeta'])
		expect(screen.getByText('v:c:a')).toBeInTheDocument()
		expect(screen.getByText(/"deep": 1/u)).toBeInTheDocument()
	})

	it('reads No resources discovered when none are found', async () => {
		discoverState.response = []
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Discover resources' }))

		expect(screen.getByText('No resources discovered')).toBeInTheDocument()
		expect(within(screen.getByRole('group', { name: 'Found' })).getByText('0')).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'Copy JSON' })).not.toBeInTheDocument()
	})

	it('keeps the root and the pane within 320 px with a long name', async () => {
		discoverState.response = [
			makeConfig(
				'webcam-usb-1-with-a-very-long-discovered-name-that-keeps-going',
				CAMERA,
				'v:c:w',
				{
					calibration_file:
						'/home/viam/.viam/calibration/realsense-d435-front-left-2026-11-01.json',
				}
			),
		]
		const { container } = renderSubject()
		await userEvent.click(screen.getByRole('button', { name: 'Discover resources' }))

		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild ?? container
		expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})
})
