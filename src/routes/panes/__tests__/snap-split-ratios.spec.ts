import type { LayoutNode, PaneNode } from '@viamrobotics/prime-panes'

import { describe, expect, it } from 'vitest'

import type { PaneSize } from '../layout-minimum'

import { snapSplitRatios } from '../snap-split-ratios'

const pane = (id: string, minWidth: number, minHeight = 100): PaneNode<PaneSize> => ({
	type: 'pane',
	id,
	data: { width: minWidth, height: minHeight },
})

const rowSplit = (
	ratio: number,
	first: LayoutNode<PaneSize>,
	second: LayoutNode<PaneSize>
): LayoutNode<PaneSize> => ({ type: 'split', id: 'row', direction: 'row', ratio, first, second })

const ownMinimum = (size: PaneSize) => size

const BOX = { width: 1000, height: 600 }

describe('snapSplitRatios', () => {
	it('leaves a split whose sides both clear their minimums untouched', () => {
		const layout = rowSplit(0.5, pane('a', 200), pane('b', 200))

		expect(snapSplitRatios(layout, BOX, ownMinimum)).toBe(layout)
	})

	it('pushes a first side dragged under its minimum back out to it', () => {
		const layout = rowSplit(0.1, pane('a', 250), pane('b', 200))

		expect(snapSplitRatios(layout, BOX, ownMinimum)).toMatchObject({ ratio: 0.25 })
	})

	it('pulls a second side dragged under its minimum back out to it', () => {
		const layout = rowSplit(0.95, pane('a', 200), pane('b', 300))

		expect(snapSplitRatios(layout, BOX, ownMinimum)).toMatchObject({ ratio: 0.7 })
	})

	it('keeps the ratio and leaves the bodies to scroll when the box fits neither minimum pair', () => {
		const layout = rowSplit(0.1, pane('a', 700), pane('b', 700))

		expect(snapSplitRatios(layout, BOX, ownMinimum)).toBe(layout)
	})

	it('sizes a stack by its widest pane', () => {
		const layout = rowSplit(
			0.1,
			{ type: 'stack', id: 'stack', activeId: 'a', panes: [pane('a', 100), pane('b', 400)] },
			pane('c', 100)
		)

		expect(snapSplitRatios(layout, BOX, ownMinimum)).toMatchObject({ ratio: 0.4 })
	})

	it('snaps a nested column split against the height its parent gives it', () => {
		const column: LayoutNode<PaneSize> = {
			type: 'split',
			id: 'column',
			direction: 'column',
			ratio: 0.9,
			first: pane('top', 100, 100),
			second: pane('bottom', 100, 120),
		}

		const snapped = snapSplitRatios(rowSplit(0.5, pane('a', 100), column), BOX, ownMinimum)

		expect(snapped).toMatchObject({ second: { ratio: 0.8 } })
	})
})
