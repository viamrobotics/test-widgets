import type { Map } from 'maplibre-gl'
import type { ComponentProps } from 'svelte'

import { render } from '@testing-library/svelte'
import { page } from '@vitest/browser/context'
import { describe, expect, it, vi } from 'vitest'

import { assertExists } from '../../../../../assert.ts'
import Subject from '../legend.svelte'
import { waypoints } from './__fixtures__/waypoints.ts'

describe('NavigationServiceView waypoint legend', () => {
	const [waypoint] = waypoints
	assertExists(waypoint, 'Waypoint fixture does not exist')

	const renderSubject = (props?: Partial<ComponentProps<typeof Subject>>) => {
		const { baseElement } = render(Subject, {
			map: null as unknown as Map,
			waypoints,
			hovered: null,
			onEnter: vi.fn(),
			onLeave: vi.fn(),
			onRemove: vi.fn(),
			...props,
		})

		return page.elementLocator(baseElement)
	}

	it('renders an obstacle with hoverable coordinates', async () => {
		const { location } = waypoint

		const screen = renderSubject()
		const waypoint1 = screen.getByText(/waypoint 1/iu)
		const focusWaypoint = screen.getByLabelText(/focus waypoint 1/iu)
		const locationText = screen.getByText(
			`${location.latitude.toString()}, ${location.longitude.toString()}`
		)

		await expect.element(waypoint1).toBeVisible()
		await focusWaypoint.hover()
		await expect.element(locationText).toBeVisible()
	})

	it('calls hover event callbacks', async () => {
		const onEnter = vi.fn()
		const onLeave = vi.fn()

		const screen = renderSubject({ onEnter, onLeave })
		const label = screen.getByText(/waypoint 1/iu)

		await label.hover()

		expect(onEnter).toHaveBeenCalledOnce()
		expect(onEnter).toHaveBeenCalledWith(waypoint.id)

		await label.unhover()

		expect(onLeave).toHaveBeenCalledOnce()
	})
})
