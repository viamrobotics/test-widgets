import { render } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../paths-layer.svelte'

const fake = vi.hoisted(() => ({
	sources: new Map<string, { type: string; setData: ReturnType<typeof vi.fn>; data: unknown }>(),
	layers: [] as unknown[],
	handlers: new Map<string, () => void>(),
}))

vi.mock('@viamrobotics/prime-map', () => {
	const map = {
		isStyleLoaded: () => true,
		getSource: (id: string) => fake.sources.get(id),
		addSource: (id: string, spec: { data: unknown }) => {
			fake.sources.set(id, { type: 'geojson', setData: vi.fn(), data: spec.data })
		},
		addLayer: (layer: unknown) => fake.layers.push(layer),
		getLayer: () => undefined,
		removeLayer: () => {},
		removeSource: (id: string) => fake.sources.delete(id),
		on: (event: string, handler: () => void) => fake.handlers.set(event, handler),
		off: (event: string) => fake.handlers.delete(event),
	}
	return { useMapLibre: () => ({ map }) }
})

const paths = [
	{
		destinationWaypointId: 'a',
		geopoints: [
			{ latitude: 1, longitude: 2 },
			{ latitude: 3, longitude: 4 },
		],
	},
]

describe('NavigationService paths layer', () => {
	beforeEach(() => {
		fake.sources.clear()
		fake.layers.length = 0
		fake.handlers.clear()
	})

	it('adds a geojson source and a line layer drawing the paths', () => {
		render(Subject, { paths })

		expect(fake.sources.get('navigation-paths')?.data).toMatchObject({
			features: [
				{
					geometry: {
						coordinates: [
							[2, 1],
							[4, 3],
						],
					},
				},
			],
		})
		expect(fake.layers).toMatchObject([{ type: 'line', source: 'navigation-paths' }])
	})

	it('draws again when the style reloads', () => {
		render(Subject, { paths })

		expect(fake.handlers.has('styledata')).toBe(true)
	})
})
