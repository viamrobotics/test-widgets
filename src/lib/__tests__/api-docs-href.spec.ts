import { describe, expect, it } from 'vitest'

import { apiDocsHref } from '../api-docs-href'
import { ResourceTriplets } from '../resource-triplet'

describe('apiDocsHref', () => {
	it.each([
		{
			api: ResourceTriplets.Camera,
			method: 'getPointCloud',
			expected: 'https://docs.viam.com/reference/apis/components/camera/#getpointcloud',
		},
		{
			api: ResourceTriplets.Slam,
			method: 'getPosition',
			expected: 'https://docs.viam.com/reference/apis/services/slam/#getposition',
		},
		{
			// underscore subtype must hyphenate in the docs URL
			api: ResourceTriplets.MovementSensor,
			method: 'getReadings',
			expected: 'https://docs.viam.com/reference/apis/components/movement-sensor/#getreadings',
		},
		{
			api: ResourceTriplets.PowerSensor,
			method: 'getCurrent',
			expected: 'https://docs.viam.com/reference/apis/components/power-sensor/#getcurrent',
		},
		{
			api: ResourceTriplets.GenericComponent,
			method: 'doCommand',
			expected: 'https://docs.viam.com/reference/apis/components/generic/#docommand',
		},
	])('$api $method -> $expected', ({ api, method, expected }) => {
		expect(apiDocsHref(api, method)).toBe(expected)
	})

	it.each([
		{ api: ResourceTriplets.Camera, method: 'getStatus' },
		{ api: ResourceTriplets.Camera, method: 'getSourceNames' },
	])('returns undefined for no-link method $method', ({ api, method }) => {
		expect(apiDocsHref(api, method)).toBeUndefined()
	})
})
