import { render } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../waypoints.svelte'
import { waypoints } from './__fixtures__/waypoints.ts'

const markerColorsByLatitude = vi.hoisted(() => new Map<number, string>())

vi.mock('$lib/components/maplibre', () => ({
	MapLibreMarker: (_anchor: unknown, props: { lat: number; color: string }) => {
		markerColorsByLatitude.set(props.lat, props.color)
	},
	useMapLibreEvent: () => {},
}))

describe('NavigationService waypoint markers', () => {
	beforeEach(() => {
		markerColorsByLatitude.clear()
		document.documentElement.style.setProperty('--color-solar-power-bright', 'rgb(1, 2, 3)')
		render(Subject, { waypoints, addWayPoint: vi.fn(), hovered: '66c60ce541f43f5eaabc0548' })
	})

	afterEach(() => {
		document.documentElement.style.removeProperty('--color-solar-power-bright')
	})

	it("colors the hovered waypoint's marker with the solar-power-bright token's value", () => {
		expect(markerColorsByLatitude.get(1)).toBe('rgb(1, 2, 3)')
	})

	it('leaves an unhovered marker on the MapLibre default color', () => {
		expect(markerColorsByLatitude.get(3)).toBe('')
	})
})
