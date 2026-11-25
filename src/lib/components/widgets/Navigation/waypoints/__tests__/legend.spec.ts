import type { ComponentProps } from 'svelte'

import { fireEvent, render } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import { type Locator, page } from 'vitest/browser'

import { waypoints } from '../../__tests__/__fixtures__/waypoints.ts'
import { assertExists } from '../../../../../assert.ts'
import Subject from '../legend.svelte'

const focusInPage = (locator: Locator) => {
	const element = locator.element()
	if (!(element instanceof HTMLElement)) throw new Error('Expected a focusable HTML element')
	element.focus()
}

describe('NavigationService waypoint legend', () => {
	const [waypoint] = waypoints
	assertExists(waypoint, 'Waypoint fixture does not exist')

	const renderSubject = (props?: Partial<ComponentProps<typeof Subject>>) => {
		const { baseElement } = render(Subject, {
			hasMap: true,
			waypoints,
			hovered: null,
			onEnter: vi.fn(),
			onLeave: vi.fn(),
			onRemove: vi.fn(),
			isRemoving: () => false,
			...props,
		})

		return page.elementLocator(baseElement)
	}

	it('lists each waypoint as a 1-based row of the Waypoints list', async () => {
		const screen = renderSubject()
		const list = screen.getByRole('list', { name: 'Waypoints' })

		expect(list.getByRole('listitem').all()).toHaveLength(3)
		await expect.element(list.getByText('Waypoint 1', { exact: true })).toBeVisible()
		await expect.element(list.getByText('Waypoint 3', { exact: true })).toBeVisible()
	})

	it("shows each waypoint's coordinates in its row", async () => {
		const screen = renderSubject()

		await expect.element(screen.getByText('1, 2', { exact: true })).toBeVisible()
	})

	it('explains the focus button in a tooltip', async () => {
		const screen = renderSubject()

		focusInPage(screen.getByRole('button', { name: 'Focus waypoint 1' }))

		await expect.element(page.getByText('Focus on the map', { exact: true })).toBeVisible()
	})

	it('calls onRemove with the id of the waypoint whose Remove is pressed', async () => {
		const onRemove = vi.fn()
		const screen = renderSubject({ onRemove })

		await fireEvent.click(screen.getByRole('button', { name: 'Remove waypoint 2' }).element())

		expect(onRemove).toHaveBeenCalledExactlyOnceWith('66c60ce541f43f5eaabc0549')
	})

	it('calls onEnter with the id as the pointer enters a row, and onLeave as it leaves', async () => {
		const onEnter = vi.fn()
		const onLeave = vi.fn()
		const screen = renderSubject({ onEnter, onLeave })
		const row = screen.getByRole('listitem').first().element()

		await fireEvent.pointerEnter(row)

		expect(onEnter).toHaveBeenCalledExactlyOnceWith(waypoint.id)
		expect(onLeave, 'onLeave fired on enter').not.toHaveBeenCalled()

		await fireEvent.pointerLeave(row)

		expect(onLeave).toHaveBeenCalledOnce()
	})

	it('highlights the hovered waypoint row only', async () => {
		const screen = renderSubject({ hovered: waypoint.id })
		const [hoveredRow, otherRow] = screen.getByRole('listitem').all()
		assertExists(hoveredRow, 'Hovered row does not exist')
		assertExists(otherRow, 'Other row does not exist')

		await expect.element(hoveredRow).toHaveClass('bg-light')
		await expect.element(otherRow).not.toHaveClass('bg-light')
	})

	it('disables Focus when there is no map', () => {
		const screen = renderSubject({ hasMap: false })

		expect(screen.getByRole('button', { name: 'Focus waypoint 1' }).element()).toBeDisabled()
	})

	it("disables and marks busy only the removing waypoint's Remove", () => {
		const screen = renderSubject({ isRemoving: (id) => id === waypoint.id })

		const remove = screen.getByRole('button', { name: 'Remove waypoint 1' }).element()
		expect(remove).toHaveAttribute('aria-disabled', 'true')
		expect(remove).toHaveAttribute('aria-busy', 'true')
		expect(screen.getByRole('button', { name: 'Remove waypoint 2' }).element()).toBeEnabled()
	})
})
