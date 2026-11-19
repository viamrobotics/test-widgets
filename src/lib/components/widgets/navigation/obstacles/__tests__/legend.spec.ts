import type { ComponentProps } from 'svelte'

import { fireEvent, render } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import { type Locator, page } from 'vitest/browser'

import { assertExists } from '../../../../../assert.ts'
import Subject from '../legend.svelte'
import { obstacles } from './__fixtures__/obstacles.ts'

const focusInPage = (locator: Locator) => {
	const element = locator.element()
	if (!(element instanceof HTMLElement)) throw new Error('Expected a focusable HTML element')
	element.focus()
}

describe('NavigationService obstacle legend', () => {
	const [obstacle] = obstacles
	assertExists(obstacle, 'Obstacle fixture does not exist')

	const [geometry] = obstacle.geometries
	assertExists(geometry, 'Geometry fixture does not exist')

	const renderSubject = (props?: Partial<ComponentProps<typeof Subject>>) => {
		const { baseElement } = render(Subject, {
			obstacles,
			hovered: null,
			onEnter: vi.fn(),
			onLeave: vi.fn(),
			...props,
		})

		return page.elementLocator(baseElement)
	}

	it('lists every obstacle geometry as a row of the Obstacles list', () => {
		const screen = renderSubject()

		const rows = screen.getByRole('list', { name: 'Obstacles' }).getByRole('listitem').all()

		expect(rows).toHaveLength(4)
	})

	it('names each obstacle as Static or Transient in text, not by color alone', async () => {
		const screen = renderSubject()

		await expect.element(screen.getByText(geometry.label, { exact: true })).toBeVisible()
		expect(screen.getByText('Static', { exact: true }).all()).toHaveLength(3)
		expect(screen.getByText('Transient', { exact: true }).all()).toHaveLength(1)
	})

	it.each([
		{ shape: 'sphere', text: 'Sphere · radius 2 m' },
		{ shape: 'capsule', text: 'Capsule · radius 0.5 m · length 5 m · θ 0°' },
		{ shape: 'box', text: 'Box · 50 × 50 × 50 m · θ 0°' },
	])('describes a $shape in meters', async ({ text }) => {
		const screen = renderSubject()

		await expect.element(screen.getByText(text, { exact: true })).toBeVisible()
	})

	it("shows the obstacle's coordinates in the focus button's tooltip", async () => {
		const screen = renderSubject()

		focusInPage(screen.getByRole('button', { name: `Focus ${geometry.label}` }))

		await expect.element(page.getByText('1, 2', { exact: true })).toBeVisible()
	})

	it('calls onEnter with the label as the pointer enters a row, and onLeave as it leaves', async () => {
		const onEnter = vi.fn()
		const onLeave = vi.fn()
		const screen = renderSubject({ onEnter, onLeave })
		const row = screen.getByRole('listitem').first().element()

		await fireEvent.mouseEnter(row)

		expect(onEnter).toHaveBeenCalledExactlyOnceWith(geometry.label)
		expect(onLeave, 'onLeave fired on enter').not.toHaveBeenCalled()

		await fireEvent.mouseLeave(row)

		expect(onLeave).toHaveBeenCalledOnce()
	})

	it("fills a static obstacle's swatch with the cyberpunk-bright token's value", () => {
		document.documentElement.style.setProperty('--color-cyberpunk-bright', 'rgb(4, 5, 6)')
		const screen = renderSubject()
		const swatch = screen.getByRole('listitem').first().element().querySelector('[aria-hidden]')
		assertExists(swatch, 'Swatch does not exist')

		const { backgroundColor } = getComputedStyle(swatch)
		document.documentElement.style.removeProperty('--color-cyberpunk-bright')

		expect(backgroundColor).toBe('rgb(4, 5, 6)')
	})

	it('highlights the hovered obstacle row only', async () => {
		const screen = renderSubject({ hovered: geometry.label })
		const [hoveredRow, otherRow] = screen.getByRole('listitem').all()
		assertExists(hoveredRow, 'Hovered row does not exist')
		assertExists(otherRow, 'Other row does not exist')

		await expect.element(hoveredRow).toHaveClass('bg-light')
		await expect.element(otherRow).not.toHaveClass('bg-light')
	})
})
