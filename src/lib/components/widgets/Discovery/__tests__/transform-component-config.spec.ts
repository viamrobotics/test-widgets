import { appRobotApi, Struct } from '@viamrobotics/sdk'
import { describe, expect, it } from 'vitest'

import * as Subject from '../transform-component-config.ts'

describe('transformComponentConfig', () => {
	it('should return a non-transformed config when no qualified api or model', () => {
		const result = Subject.transformComponentConfig(
			new appRobotApi.ComponentConfig({
				api: 'not-qualified',
				model: 'my-model',
				namespace: 'my-namespace',
				type: 'my-type',
			})
		)

		expect(result.toJson()).toEqual({
			api: 'not-qualified',
			model: 'my-model',
			namespace: 'my-namespace',
			type: 'my-type',
		})
	})

	it('should return a non-transformed config when no qualified api', () => {
		const result = Subject.transformComponentConfig(
			new appRobotApi.ComponentConfig({
				api: 'not-qualified',
				model: 'my:qualified:model',
				namespace: 'my-namespace',
				type: 'my-type',
			})
		)

		expect(result.toJson()).toEqual({
			api: 'not-qualified',
			model: 'my:qualified:model',
			namespace: 'my-namespace',
			type: 'my-type',
		})
	})

	it('should return a non-transformed config when no qualified model', () => {
		const result = Subject.transformComponentConfig(
			new appRobotApi.ComponentConfig({
				api: 'my:qualified:api',
				model: 'my-model',
				namespace: 'my-namespace',
				type: 'my-type',
			})
		)

		expect(result.toJson()).toEqual({
			api: 'my:qualified:api',
			model: 'my-model',
			namespace: 'my-namespace',
			type: 'my-type',
		})
	})

	it('should return a non-transformed config when a triplet part is empty', () => {
		const result = Subject.transformComponentConfig(
			new appRobotApi.ComponentConfig({
				api: 'my::api',
				model: 'my:qualified:model',
				namespace: 'my-namespace',
			})
		)

		expect(result.toJson()).toEqual({
			api: 'my::api',
			model: 'my:qualified:model',
			namespace: 'my-namespace',
		})
	})

	it('should return a transformed config', () => {
		const result = Subject.transformComponentConfig(
			new appRobotApi.ComponentConfig({
				api: 'my:qualified:api',
				model: 'my:qualified:model',
				namespace: 'my-namespace',
				type: 'my-type',
			})
		)

		expect(result.toJson()).toEqual({
			api: 'my:qualified:api',
			model: 'my:qualified:model',
		})
	})

	it('keeps the name and attributes and leaves the input unchanged', () => {
		const input = new appRobotApi.ComponentConfig({
			name: 'cam-0',
			api: 'my:qualified:api',
			model: 'my:qualified:model',
			namespace: 'my-namespace',
			attributes: Struct.fromJson({ width_px: 640 }),
		})

		const result = Subject.transformComponentConfig(input)

		expect(result.toJson()).toEqual({
			name: 'cam-0',
			api: 'my:qualified:api',
			model: 'my:qualified:model',
			attributes: { width_px: 640 },
		})
		expect(input.namespace).toBe('my-namespace')
	})
})
