import '../../../../../app.css'

import { render } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Subject from '../map.svelte'

vi.mock('$lib/components/maplibre', () => ({
	DirectionalMarker: () => {},
	FollowControls: () => {},
	MapLibre: () => {},
	MapLibreMarker: () => {},
	MapProviders: { googleMaps: 'google-maps' },
	SatelliteControls: () => {},
}))

const renderAtWidth = (width: number) => {
	const target = document.createElement('div')
	target.style.width = `${width}px`
	document.body.append(target)
	render(Subject, { props: { coordinate: undefined, rotation: undefined }, target })
	const box = target.firstElementChild
	if (!(box instanceof HTMLElement)) throw new Error('The map rendered no box')
	return box.getBoundingClientRect()
}

afterEach(() => {
	document.body.replaceChildren()
})

describe('MovementSensor map', () => {
	it.each([320, 672, 896])('takes the full container width at 4:3 at %i px', (width) => {
		const rect = renderAtWidth(width)

		expect(rect.width).toBe(width)
		expect(rect.height).toBeCloseTo((width * 3) / 4, 0)
	})
})
