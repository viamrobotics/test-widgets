import '../../../../../app.css'

import type { Map as MapLibreMap } from 'maplibre-gl'

import { render, screen } from '@testing-library/svelte'
import { MachineConnectionEvent } from '@viamrobotics/sdk'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Subject from '../navigation-controls.svelte'

const NARROW_PX = 320
const WIDE_PX = 480
const WIDTH_TOLERANCE_PX = 1
const CAMERA_TOLERANCE = 1e-6

const created = vi.hoisted((): { maps: MapLibreMap[] } => ({ maps: [] }))

vi.mock('maplibre-gl', async (importOriginal) => {
	const actual = await importOriginal<typeof import('maplibre-gl')>()
	class RecordedMap extends actual.Map {
		constructor(...args: ConstructorParameters<typeof actual.Map>) {
			super(...args)
			created.maps.push(this)
		}
	}
	return { ...actual, Map: RecordedMap }
})

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

const mountInPane = () => {
	const pane = document.createElement('div')
	pane.style.width = `${NARROW_PX.toString()}px`
	document.body.append(pane)
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-nav' }, target: pane })
	return pane
}

const onlyMap = () => {
	const [map] = created.maps
	if (created.maps.length !== 1 || !map) {
		throw new Error(`Expected one map, found ${created.maps.length.toString()}`)
	}
	return map
}

const canvasWidth = () => onlyMap().getCanvas().getBoundingClientRect().width

const camera = () => {
	const map = onlyMap()
	const { lng, lat } = map.getCenter()
	return { lng, lat, zoom: map.getZoom() }
}

describe('NavigationServiceControls in a resizing pane', () => {
	afterEach(() => {
		created.maps = []
		document.body.replaceChildren()
	})

	it('keeps the map canvas as wide as its pane, and its center and zoom, across a resize', async () => {
		const pane = mountInPane()
		await screen.findByRole('group', { name: 'Map view panel' })
		await expect
			.poll(() => Math.abs(canvasWidth() - pane.clientWidth), {
				message: `canvas width at ${NARROW_PX.toString()} px`,
			})
			.toBeLessThanOrEqual(WIDTH_TOLERANCE_PX)
		const before = camera()

		pane.style.width = `${WIDE_PX.toString()}px`

		await expect
			.poll(() => Math.abs(canvasWidth() - pane.clientWidth), {
				message: `canvas width at ${WIDE_PX.toString()} px`,
			})
			.toBeLessThanOrEqual(WIDTH_TOLERANCE_PX)
		expect(pane.clientWidth).toBe(WIDE_PX)
		const after = camera()
		expect(Math.abs(after.lng - before.lng), 'center longitude moved').toBeLessThanOrEqual(
			CAMERA_TOLERANCE
		)
		expect(Math.abs(after.lat - before.lat), 'center latitude moved').toBeLessThanOrEqual(
			CAMERA_TOLERANCE
		)
		expect(Math.abs(after.zoom - before.zoom), 'zoom moved').toBeLessThanOrEqual(CAMERA_TOLERANCE)
	})
})
