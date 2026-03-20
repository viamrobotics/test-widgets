import { appRobotApi } from '@viamrobotics/sdk'
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

		expect(result).toEqual({
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

		expect(result).toEqual({
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

		expect(result).toEqual({
			api: 'my:qualified:api',
			model: 'my-model',
			namespace: 'my-namespace',
			type: 'my-type',
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

		expect(result).toEqual({
			api: 'my:qualified:api',
			model: 'my:qualified:model',
		})
	})
})

describe('parseComponentConfig', () => {
	it('should return a config', () => {
		const result = Subject.parseComponentConfig({
			api: 'not-qualified',
			model: 'my-model',
			namespace: 'my-namespace',
			type: 'my-type',
		})

		expect(result.toJson()).toEqual({
			api: 'not-qualified',
			model: 'my-model',
			namespace: 'my-namespace',
			type: 'my-type',
		})
	})
})
