import { render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../discovery.svelte'
import { discoverState } from './__fixtures__/discover-resources-state.svelte'
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
			refetch: () => Promise.resolve({ data: state.data, error: null }),
		})),
	}
})

describe('DiscoveryWidget', () => {
	it('renders the DiscoverResources widget and not the control interface', () => {
		discoverState.data = [makeConfig('cam', 'rdk:component:camera', 'v:c:cam')]
		const onAddComponent = vi.fn()

		render(Subject, { props: { partID: 'p', resourceName: 'd', onAddComponent } })

		expect(screen.getByRole('heading', { name: 'DiscoverResources' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Copy cam JSON' })).toBeInTheDocument()
		expect(screen.queryByRole('heading', { name: 'Controls' })).not.toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'Add to config' })).not.toBeInTheDocument()
		expect(onAddComponent).not.toHaveBeenCalled()
	})
})
