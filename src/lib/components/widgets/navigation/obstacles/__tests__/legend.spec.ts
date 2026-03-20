import type { Map } from 'maplibre-gl'
import type { ComponentProps } from 'svelte'

import { render } from '@testing-library/svelte'
import { page } from '@vitest/browser/context'
import { describe, expect, it, vi } from 'vitest'

import { assertExists } from '../../../../../assert.ts'
import Subject from '../legend.svelte'
import { obstacles } from './__fixtures__/obstacles.ts'

describe('NavigationServiceView obstacle legend', () => {
	const [obstacle] = obstacles
	assertExists(obstacle, 'Obstacle fixture does not exist')

	const [geometry] = obstacle.geometries
	assertExists(geometry, 'Geometry fixture does not exist')

	const renderSubject = (props?: Partial<ComponentProps<typeof Subject>>) => {
		const { baseElement } = render(Subject, {
			map: null as unknown as Map,
			obstacles,
			hovered: null,
			onEnter: vi.fn(),
			onLeave: vi.fn(),
			...props,
		})

		return page.elementLocator(baseElement)
	}

	it('renders an obstacle with hoverable coordinates', async () => {
		const { location } = obstacle

		const screen = renderSubject()
		const geometryLabel = screen.getByText(geometry.label)
		const focusGeometryLabel = screen.getByLabelText(`focus ${geometry.label}`)
		const locationText = screen.getByText(
			`${location?.latitude ?? ''}, ${location?.longitude ?? ''}`
		)

		await expect.element(geometryLabel).toBeVisible()
		await focusGeometryLabel.hover()
		await expect.element(locationText).toBeVisible()
	})

	it('calls hover event callbacks', async () => {
		const onEnter = vi.fn()
		const onLeave = vi.fn()

		const screen = renderSubject({ onEnter, onLeave })
		const geometryLabel = screen.getByText(geometry.label)

		await geometryLabel.hover()

		expect(onEnter).toHaveBeenCalledOnce()
		expect(onEnter).toHaveBeenCalledWith(geometry.label)

		await geometryLabel.unhover()

		expect(onLeave).toHaveBeenCalledOnce()
	})
})
