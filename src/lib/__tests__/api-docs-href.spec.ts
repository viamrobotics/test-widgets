import { describe, expect, it } from 'vitest'

import { apiDocsHref } from '../api-docs-href'

describe('apiDocsHref', () => {
	it.each([
		{
			api: 'rdk:component:camera',
			method: 'getPointCloud',
			expected: 'https://docs.viam.com/reference/apis/components/camera/#getpointcloud',
		},
		{
			api: 'rdk:service:slam',
			method: 'getPosition',
			expected: 'https://docs.viam.com/reference/apis/services/slam/#getposition',
		},
		{
			// underscore subtype must hyphenate in the docs URL
			api: 'rdk:component:movement_sensor',
			method: 'getReadings',
			expected: 'https://docs.viam.com/reference/apis/components/movement-sensor/#getreadings',
		},
		{
			api: 'rdk:component:power_sensor',
			method: 'getCurrent',
			expected: 'https://docs.viam.com/reference/apis/components/power-sensor/#getcurrent',
		},
		{
			api: 'rdk:component:generic',
			method: 'doCommand',
			expected: 'https://docs.viam.com/reference/apis/components/generic/#docommand',
		},
	])('$api $method -> $expected', ({ api, method, expected }) => {
		expect(apiDocsHref(api, method)).toBe(expected)
	})

	it.each([
		{ api: 'rdk:component:camera', method: 'getStatus' },
		{ api: 'rdk:component:camera', method: 'getSourceNames' },
	])('returns undefined for no-link method $method', ({ api, method }) => {
		expect(apiDocsHref(api, method)).toBeUndefined()
	})
})
