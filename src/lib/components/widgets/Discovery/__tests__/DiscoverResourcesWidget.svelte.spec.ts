import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../DiscoverResourcesWidget.svelte'
import { discoverState, resetDiscoverState } from './__fixtures__/discover-resources-state.svelte'
import { makeConfig } from './__fixtures__/discoveries-config'
import Pane from './__fixtures__/DiscoverResourcesPane.svelte'

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
				if (state.refetchError !== null) {
					return Promise.resolve({ data: undefined, error: state.refetchError })
				}
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
		const options = vi.mocked(createResourceQuery).mock.calls[0]?.[2]
		expect(typeof options === 'function' ? options() : undefined).toMatchObject({
			enabled: false,
			refetchInterval: false,
		})
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

	it('holds the button back and drops a press while a discovery is in flight', async () => {
		discoverState.isFetching = true
		renderSubject()

		const button = screen.getByRole('button', { name: 'Discover resources' })
		await userEvent.click(button)

		expect(button).toHaveAttribute('aria-disabled', 'true')
		expect(button).toHaveAccessibleDescription('Wait for the discovery in flight to finish.')
		expect(discoverState.fetched).toBe(0)
	})

	it('says the discovery failed', async () => {
		discoverState.refetchError = new Error('module crashed')
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Discover resources' }))

		await expect
			.poll(() => screen.getByTestId('status-line').textContent.trim())
			.toBe('Discover resources failed')
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

	it('copies one result whole JSON from its folder copy button', async () => {
		discoverState.response = [
			makeConfig('zeta', CAMERA, 'v:c:z', { width_px: 640 }),
			makeConfig('alpha', CAMERA, 'v:c:a', { nested: { deep: 1 } }),
		]
		const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
		renderSubject()
		await userEvent.click(screen.getByRole('button', { name: 'Discover resources' }))

		await userEvent.click(screen.getByRole('button', { name: 'Copy alpha JSON' }))

		expect(screen.getByText(/"deep": 1/u).closest('pre')?.parentElement).toContainElement(
			screen.getByRole('button', { name: 'Copy alpha JSON' })
		)
		expect(JSON.parse(String(writeText.mock.lastCall?.[0]))).toEqual({
			name: 'alpha',
			api: CAMERA,
			model: 'v:c:a',
			attributes: { nested: { deep: 1 } },
		})
		expect(screen.queryByRole('button', { name: 'Add to config' })).not.toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'Copy attributes' })).not.toBeInTheDocument()
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
