import '../../../../../app.css'

import { render, screen } from '@testing-library/svelte'
import { MachineConnectionEvent } from '@viamrobotics/sdk'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Subject from '../navigation-controls.svelte'

const NARROW_PX = 320
const OVERLAY_DOCKS_LEFT_PX = 672

vi.mock('@viamrobotics/svelte-sdk', () => ({
	useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	createResourceClient: vi.fn(() => ({ current: undefined })),
	createResourceQuery: vi.fn(() => ({
		data: undefined,
		isLoading: false,
		isError: false,
		error: null,
		fetchStatus: 'idle',
		refetch: () => Promise.resolve({ error: null, data: undefined }),
	})),
	createResourceMutation: vi.fn(() => ({
		mutateAsync: vi.fn(() => Promise.resolve()),
		error: null,
	})),
}))

const mountInPane = (widthPx: number) => {
	const pane = document.createElement('div')
	pane.style.width = `${widthPx.toString()}px`
	document.body.append(pane)
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-nav' }, target: pane })
	return pane
}

const compassCorner = (pane: HTMLElement, corner: string) =>
	pane.querySelector(`.maplibregl-ctrl-${corner} .maplibregl-ctrl-compass`)

describe('NavigationServiceControls compass', () => {
	afterEach(() => {
		document.body.replaceChildren()
	})

	it('sits top left in a 320 px pane, clear of the bottom overlay and the top right panel', async () => {
		const pane = mountInPane(NARROW_PX)
		await screen.findByRole('group', { name: 'Map view panel' })

		await expect.poll(() => compassCorner(pane, 'top-left')).not.toBeNull()
		expect(compassCorner(pane, 'bottom-right')).toBeNull()
	})

	it('sits bottom right in a 672 px pane, clear of the left overlay and the top right panel', async () => {
		const pane = mountInPane(OVERLAY_DOCKS_LEFT_PX)
		await screen.findByRole('group', { name: 'Map view panel' })

		await expect.poll(() => compassCorner(pane, 'bottom-right')).not.toBeNull()
		expect(compassCorner(pane, 'top-left')).toBeNull()
	})
})
